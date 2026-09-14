-- 공급 거래 내역 관리 - Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 전체를 실행하세요.

-- =========================================
-- 1. profiles (사용자 프로필: auth.users 확장)
-- =========================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- 신규 가입 시 자동으로 profiles 행 생성. 최초 가입자는 admin, 이후는 staff.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    case when (select count(*) from public.profiles) = 0 then 'admin' else 'staff' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- =========================================
-- 1b. company_settings (공급자 정보, 단일 행)
-- =========================================
create table public.company_settings (
  id boolean primary key default true, -- 항상 단일 행(true)만 존재
  name text,
  biz_reg_no text,
  ceo_name text,
  address text,
  phone text,
  business_type text, -- 업태
  business_item text, -- 종목
  logo_url text,
  stamp_url text,
  updated_at timestamptz not null default now(),
  constraint company_settings_singleton check (id)
);

insert into public.company_settings (id) values (true);

-- =========================================
-- 2. customers (거래처 마스터)
-- =========================================
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- 'customer' = 공급거래처(매출 대상, 우리가 판매), 'supplier' = 수급거래처(매입 대상, 우리가 구매)
  partner_type text not null default 'customer' check (partner_type in ('customer', 'supplier')),
  biz_reg_no text,
  ceo_name text,
  phone text,
  address text,
  email text,
  kakao_contact text,
  manager_name text,
  payment_terms text,
  opening_balance numeric not null default 0,
  memo text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

-- =========================================
-- 3. items (품목 마스터)
-- =========================================
create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text,
  default_unit_price numeric not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

-- =========================================
-- 4. monthly_closings / customer_closings (마감)
-- =========================================
create table public.monthly_closings (
  id uuid primary key default gen_random_uuid(),
  year_month text not null unique, -- 'YYYY-MM'
  closed_at timestamptz not null default now(),
  closed_by uuid references public.profiles (id) on delete set null
);

create table public.customer_closings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id),
  period_start date not null,
  period_end date not null,
  closed_at timestamptz not null default now(),
  closed_by uuid references public.profiles (id) on delete set null
);

-- =========================================
-- 5. transactions (거래 헤더) / transaction_lines (거래 라인)
-- =========================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id),
  transaction_date date not null,
  memo text,
  monthly_closing_id uuid references public.monthly_closings (id),
  customer_closing_id uuid references public.customer_closings (id),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

-- 판매/샘플 구분은 거래(헤더)가 아니라 품목 라인 단위로 관리한다.
-- 하나의 거래 안에 판매 품목과 샘플 품목이 섞여 있을 수 있기 때문.
create table public.transaction_lines (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  item_id uuid references public.items (id),
  item_name_snapshot text not null,
  line_type text not null default 'sale' check (line_type in ('sale', 'sample')),
  unit_price numeric not null default 0,
  quantity numeric not null default 0,
  supply_amount numeric generated always as (round(unit_price * quantity)) stored,
  vat_amount numeric generated always as (round(unit_price * quantity * 0.1)) stored
);

create index on public.transactions (customer_id, transaction_date);
create index on public.transaction_lines (transaction_id);

-- =========================================
-- 6. payments (수금)
-- =========================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id),
  transaction_id uuid references public.transactions (id),
  payment_date date not null,
  amount numeric not null default 0,
  method text,
  memo text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index on public.payments (customer_id, payment_date);

-- =========================================
-- 7. customer_ledger (거래처별 원장 + 누적 잔액 뷰)
-- =========================================
create or replace view public.customer_ledger
with (security_invoker = true) as
with entries as (
  select
    t.customer_id,
    t.id as transaction_id,
    null::uuid as payment_id,
    t.transaction_date as entry_date,
    t.created_at as entry_created_at,
    'transaction'::text as entry_type,
    coalesce(sum(tl.supply_amount + tl.vat_amount), 0) as amount
  from public.transactions t
  left join public.transaction_lines tl on tl.transaction_id = t.id
  group by t.id, t.customer_id, t.transaction_date, t.created_at

  union all

  select
    p.customer_id,
    p.transaction_id,
    p.id as payment_id,
    p.payment_date as entry_date,
    p.created_at as entry_created_at,
    'payment'::text as entry_type,
    -p.amount as amount
  from public.payments p
)
select
  e.*,
  c.opening_balance + sum(e.amount) over (
    partition by e.customer_id
    order by e.entry_date, e.entry_created_at
    rows between unbounded preceding and current row
  ) as running_balance
from entries e
join public.customers c on c.id = e.customer_id;

-- 거래처별 "현재" 거래잔액. customer_ledger의 "마지막 행"을 집는 방식 대신 직접 합산한다 —
-- 거래와 수금이 같은 날짜(특히 같은 트랜잭션 내 동일 now())에 발생하면 entry_created_at으로도
-- 순서를 구분 못 해 최신 행을 잘못 고를 수 있기 때문.
create or replace view public.customer_balances
with (security_invoker = true) as
select
  c.id as customer_id,
  c.name,
  c.opening_balance
    + coalesce((
        select sum(tl.supply_amount + tl.vat_amount)
        from public.transactions t
        join public.transaction_lines tl on tl.transaction_id = t.id
        where t.customer_id = c.id
      ), 0)
    - coalesce((
        select sum(p.amount) from public.payments p where p.customer_id = c.id
      ), 0) as balance,
  c.partner_type
from public.customers c;

-- =========================================
-- 8. RLS 활성화 및 정책
-- =========================================
alter table public.company_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.items enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_lines enable row level security;
alter table public.payments enable row level security;
alter table public.monthly_closings enable row level security;
alter table public.customer_closings enable row level security;

-- company_settings: 조회는 전체, 수정은 admin만.
create policy "company_settings_select" on public.company_settings for select to authenticated using (true);
create policy "company_settings_update" on public.company_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profiles: 로그인한 사용자는 전체 프로필 조회 가능(담당자 표시용), 본인 이름은 수정 가능, role 변경은 admin만.
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_self_or_admin" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- customers / items: 로그인한 사용자는 조회·등록·수정 가능, 삭제는 admin만.
create policy "customers_select" on public.customers for select to authenticated using (true);
create policy "customers_insert" on public.customers for insert to authenticated with check (true);
create policy "customers_update" on public.customers for update to authenticated using (true) with check (true);
create policy "customers_delete" on public.customers for delete to authenticated using (public.is_admin());

create policy "items_select" on public.items for select to authenticated using (true);
create policy "items_insert" on public.items for insert to authenticated with check (true);
create policy "items_update" on public.items for update to authenticated using (true) with check (true);
create policy "items_delete" on public.items for delete to authenticated using (public.is_admin());

-- transactions / transaction_lines: 마감된 거래는 admin만 수정·삭제 가능.
create policy "transactions_select" on public.transactions for select to authenticated using (true);
create policy "transactions_insert" on public.transactions for insert to authenticated with check (true);
create policy "transactions_update" on public.transactions for update to authenticated
  using (
    (monthly_closing_id is null and customer_closing_id is null) or public.is_admin()
  )
  with check (
    (monthly_closing_id is null and customer_closing_id is null) or public.is_admin()
  );
create policy "transactions_delete" on public.transactions for delete to authenticated
  using (
    (monthly_closing_id is null and customer_closing_id is null) or public.is_admin()
  );

-- 라인 자체는 항상 헤더(transactions)와 함께 앱 코드에서 생성/삭제되므로 마감 잠금은
-- transactions 정책에서만 검사한다 (cascade 삭제 시 부모 행 가시성 문제를 피하기 위함).
create policy "transaction_lines_select" on public.transaction_lines for select to authenticated using (true);
create policy "transaction_lines_insert" on public.transaction_lines for insert to authenticated with check (true);
create policy "transaction_lines_update" on public.transaction_lines for update to authenticated using (true) with check (true);
create policy "transaction_lines_delete" on public.transaction_lines for delete to authenticated using (true);

-- payments: 로그인한 사용자는 조회·등록·수정·삭제 가능.
create policy "payments_select" on public.payments for select to authenticated using (true);
create policy "payments_insert" on public.payments for insert to authenticated with check (true);
create policy "payments_update" on public.payments for update to authenticated using (true) with check (true);
create policy "payments_delete" on public.payments for delete to authenticated using (true);

-- monthly_closings / customer_closings: 조회는 전체, 마감 실행·취소는 admin만.
create policy "monthly_closings_select" on public.monthly_closings for select to authenticated using (true);
create policy "monthly_closings_insert" on public.monthly_closings for insert to authenticated with check (public.is_admin());
create policy "monthly_closings_delete" on public.monthly_closings for delete to authenticated using (public.is_admin());

create policy "customer_closings_select" on public.customer_closings for select to authenticated using (true);
create policy "customer_closings_insert" on public.customer_closings for insert to authenticated with check (public.is_admin());
create policy "customer_closings_delete" on public.customer_closings for delete to authenticated using (public.is_admin());
