# 개발 기록 — 공급 거래 내역 관리

마지막 업데이트: 2026-09-09

이 문서는 GitHub에 처음 커밋하는 시점까지 진행된 작업 내용을 정리한 기록입니다. 코드 자체의 사용법은 [README.md](./README.md)를 참고하세요.

## 1. 프로젝트 목적

거래처와의 공급 거래(판매/샘플)를 기록하고, 월별·업체별로 마감하여 거래명세서를 발행하며, 이를 이메일이나 카카오톡으로 전달하는 내부 업무용 웹사이트. 2~5명(직원 포함)이 함께 사용.

## 2. 기술 스택 선택 이유

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router) + TypeScript | 서버 컴포넌트/서버 액션으로 별도 백엔드 없이 CRUD 구현 가능 |
| 스타일 | Tailwind CSS | 빠른 UI 작업 |
| DB/인증 | Supabase (Postgres + Auth) | 무료 티어로 시작 가능, RLS로 권한 제어를 DB 레벨에서 강제 |
| PDF 생성 | @react-pdf/renderer | Node 서버에서 직접 PDF 스트림 생성, 한글 폰트(Noto Sans KR) 내장 |
| 배포(예정) | Vercel | Next.js와 궁합이 가장 좋고 무료 티어 제공 |

## 3. 실제 사용 중인 Supabase 프로젝트

- Organization: `5060sons`
- Project: `Retail_list`
- Region: Northeast Asia (Seoul, `ap-northeast-2`)
- Project URL: `https://wvdsnmjzmchbioslefrk.supabase.co`
- 접속에 필요한 키/비밀번호는 `.env.local`에만 저장되어 있으며 `.gitignore`로 제외되어 GitHub에는 올라가지 않습니다. (`.env.local.example`이 템플릿 역할)

## 4. 데이터베이스 구조 (`supabase/schema.sql`)

### 테이블
- `profiles` — 로그인 사용자 (역할: `admin` / `staff`). **첫 가입자는 자동으로 admin.**
- `company_settings` — 공급자(우리 회사) 정보, 단일 행. 거래명세서 상단에 표시.
- `customers` — 거래처 마스터 (사업자번호, 담당자, 결제조건, 기초잔액 등)
- `items` — 품목 마스터 (기본 단가 자동완성용)
- `transactions` — 거래 헤더 (거래처, 거래일, 메모, 마감 참조)
- `transaction_lines` — 거래 라인 (품목, **판매/샘플 구분(`line_type`)**, 단가, 수량). 공급가·부가세는 `generated always as` 컬럼으로 DB가 자동 계산.
- `payments` — 수금 내역 (거래와 선택적으로 매칭)
- `monthly_closings` / `customer_closings` — 마감 이력

### 뷰
- `customer_ledger` — 거래처별 거래/수금을 시간순으로 합쳐 누적 잔액(`running_balance`)을 윈도우 함수로 계산
- `customer_balances` — 거래처별 "현재" 거래잔액 (거래/수금이 없는 거래처는 기초잔액 그대로 표시)

### 보안 (RLS)
- 모든 테이블에 Row Level Security 적용
- 조회/입력: 로그인한 사용자 전체 허용
- 마감된 거래(`monthly_closing_id`/`customer_closing_id`가 채워진 행) 수정·삭제: **admin만 가능**
- 마감 실행/취소, 회사 정보 수정, 거래처·품목 삭제, 사용자 권한 변경: **admin만 가능**

## 5. 구현된 기능

- **인증**: 이메일/비밀번호 가입·로그인. 첫 계정 = 관리자, 이후 = 직원. 관리자가 `/settings`에서 권한 변경 가능.
- **거래처 관리** (`/customers`): CRUD, 상세 페이지에서 거래·수금 이력과 누적 잔액 표
- **품목 관리** (`/items`): 인라인 등록/수정, 기본 단가 저장
- **거래 등록** (`/transactions`): 엑셀 스타일 표로 여러 품목을 한 번에 입력, 품목별로 판매/샘플 개별 지정, 공급가·부가세 자동 계산
- **수금 관리** (`/payments`): 거래처별 수금 등록/조회
- **대시보드** (`/`): 이번달 공급가/부가세/수금액, 미수금 거래처 상위 목록
- **월별 마감** (`/closing/monthly`): 특정 월을 마감하면 해당 월 거래가 잠기고, 월별 통합 거래내역서 PDF 출력 가능
- **업체별 마감** (`/closing/customer`): 거래처 + 기간(월 또는 임의 구간) 선택 후 마감, 거래명세서 PDF 출력
- **거래명세서 PDF**: 공급자/공급받는자 정보, 품목별 내역(판매/샘플 표시), 전기이월잔액·당기공급가·부가세·수금액·거래잔액 요약, 수금 내역 표. 한글 폰트(Noto Sans KR) 내장으로 어떤 환경에서도 한글이 깨지지 않음.
- **설정** (`/settings`): 회사(공급자) 정보 관리, 사용자 권한 관리, 본인 이름 수정
- **미설정 안내**: Supabase 환경변수가 없으면 모든 페이지가 `/setup` 안내 페이지로 자동 이동

## 6. 개발 중 주요 의사결정

1. **판매/샘플 구분을 거래 헤더가 아닌 품목 라인 단위로 변경**
   처음에는 거래 전체에 하나의 유형(판매 또는 샘플)만 있었으나, 실제로는 한 거래 안에 판매 품목과 샘플 품목이 섞이는 경우가 있어 `transaction_lines.line_type` 컬럼으로 이동. 이미 입력되어 있던 실거래 데이터(거래처 2건, 품목 7건, 거래 3건/라인 8건)는 손실 없이 마이그레이션 완료.
2. **카카오톡 전달은 "공유하기" 버튼 방식으로 결정**
   카카오 비즈니스 알림톡 API는 사업자 인증과 비용이 필요해, 무료이고 승인 없이 쓸 수 있는 카카오톡 공유하기(Kakao.Share) 버튼 방식으로 결정. **아직 미구현** — Kakao Developers 앱 키가 준비되면 연동 예정.
3. **이메일 발송은 추후 연동**
   Resend 계정 준비되는 대로 거래명세서 PDF 첨부 발송 기능 추가 예정. **아직 미구현.**
4. **거래잔액은 저장하지 않고 뷰에서 계산**
   데이터 정합성을 위해 거래잔액 컬럼을 두지 않고, `customer_ledger` 뷰가 기초잔액 + 거래 - 수금을 시간순 누적 계산.

## 7. 아직 안 된 것 (다음 단계)

- [ ] 이메일 발송 (Resend 연동)
- [ ] 카카오톡 공유하기 버튼 (Kakao Developers 연동)
- [ ] 프로덕션 배포 (GitHub → Vercel)
- [ ] 배포 후 Supabase Auth Redirect URL을 실제 도메인으로 업데이트
- [ ] (선택) 엑셀 일괄 업로드/다운로드
- [ ] (선택) 거래처 여신한도 초과 경고

## 8. 로컬 개발 환경 재현 방법

`README.md`의 "처음 설정하기" 절 참고. 요약하면:
1. `npm install`
2. `.env.local.example` → `.env.local` 복사 후 Supabase 값 채우기
3. `supabase/schema.sql`을 Supabase SQL Editor에서 실행 (신규 프로젝트인 경우)
4. `npm run dev`
