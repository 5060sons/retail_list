// supabase/schema.sql 과 동기화되는 수기 작성 타입.
// 스키마를 변경하면 이 파일도 함께 업데이트하세요.

export type Role = "admin" | "staff";
export type TransactionType = "sale" | "sample";
// 'customer' = 공급거래처(매출 대상), 'supplier' = 수급거래처(매입 대상)
export type PartnerType = "customer" | "supplier";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: Role;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  partner_type: PartnerType;
  biz_reg_no: string | null;
  ceo_name: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  kakao_contact: string | null;
  manager_name: string | null;
  payment_terms: string | null;
  opening_balance: number;
  memo: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Item {
  id: string;
  name: string;
  unit: string | null;
  default_unit_price: number;
  created_at: string;
  created_by: string | null;
}

export interface MonthlyClosing {
  id: string;
  year_month: string;
  closed_at: string;
  closed_by: string | null;
}

export interface CustomerClosing {
  id: string;
  customer_id: string;
  period_start: string;
  period_end: string;
  closed_at: string;
  closed_by: string | null;
}

export interface Transaction {
  id: string;
  customer_id: string;
  transaction_date: string;
  memo: string | null;
  monthly_closing_id: string | null;
  customer_closing_id: string | null;
  created_at: string;
  created_by: string | null;
}

export interface TransactionLine {
  id: string;
  transaction_id: string;
  item_id: string | null;
  item_name_snapshot: string;
  line_type: TransactionType;
  unit_price: number;
  quantity: number;
  supply_amount: number;
  vat_amount: number;
}

export interface Payment {
  id: string;
  customer_id: string;
  transaction_id: string | null;
  payment_date: string;
  amount: number;
  method: string | null;
  memo: string | null;
  created_at: string;
  created_by: string | null;
}

export interface CustomerLedgerEntry {
  customer_id: string;
  transaction_id: string | null;
  payment_id: string | null;
  entry_date: string;
  entry_created_at: string;
  entry_type: "transaction" | "payment";
  amount: number;
  running_balance: number;
}

export interface CompanySettings {
  id: true;
  name: string | null;
  biz_reg_no: string | null;
  ceo_name: string | null;
  address: string | null;
  phone: string | null;
  business_type: string | null;
  business_item: string | null;
  logo_url: string | null;
  stamp_url: string | null;
  updated_at: string;
}

export interface CustomerBalance {
  customer_id: string;
  name: string;
  balance: number;
  partner_type: PartnerType;
}

export interface TransactionWithLines extends Transaction {
  transaction_lines: TransactionLine[];
  customers?: Pick<Customer, "id" | "name">;
}

// @supabase/ssr 제네릭에 사용하는 최소 Database 타입.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
