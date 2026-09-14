# 거래 관리

거래처와의 매출·매입 거래(판매/구매/샘플), 수금/지급, 월별/업체별 마감, 거래명세서 PDF 출력을 관리하는 웹사이트입니다.

## 처음 설정하기

1. 의존성 설치
   ```bash
   npm install
   ```
2. [supabase.com](https://supabase.com)에서 무료 계정을 만들고 새 프로젝트를 생성합니다.
3. 프로젝트의 **Settings → API**에서 Project URL과 anon public key를 확인합니다.
4. **Settings → API**에서 service_role secret key도 확인합니다 (직원 계정 생성 기능에 필요, 외부에 노출되면 안 되는 값).
5. `.env.local.example`을 `.env.local`로 복사한 뒤 위 값들을 채워 넣습니다.
6. Supabase 대시보드의 **SQL Editor**에서 [`supabase/schema.sql`](./supabase/schema.sql) 파일 내용 전체를 실행해 테이블/뷰/보안 정책을 생성합니다.
7. 개발 서버 실행
   ```bash
   npm run dev
   ```
8. 첫 계정(관리자)은 자율 가입이 막혀 있어서, Supabase 대시보드 **Authentication → Users → Add user**에서 직접 만들어야 합니다. 이메일/비밀번호를 지정하고 "Auto Confirm User"를 체크해서 만들면, 첫 번째로 생성되는 사용자이므로 자동으로 **관리자** 권한이 부여됩니다. 이후 직원 계정은 로그인 후 `/settings`에서 관리자가 직접 생성합니다 (임시 비밀번호가 자동 발급되어 화면에 표시됩니다).

Supabase 연결 정보가 없으면 모든 페이지가 자동으로 `/setup` 안내 페이지로 이동합니다.

## 주요 기능

- 거래처 / 품목 마스터 관리
- 거래(판매/샘플) 등록 — 여러 품목을 한 번에, 공급가·부가세 자동 계산
- 수금 등록 및 거래처별 거래잔액(이월잔액 포함) 자동 계산
- 대시보드: 이번달 매출/부가세/수금액, 미수금 거래처 목록
- 월별 마감 → 월별 거래내역서 PDF 출력
- 업체별 마감 → 기간 선택 거래명세서 PDF 출력
- 사용자 권한: 관리자(전체 관리, 마감 실행) / 직원(입력·조회)

## 다음 단계 (필요 시)

- **이메일 발송**: Resend 계정 생성 후 `.env.local`에 `RESEND_API_KEY`, `RESEND_FROM_EMAIL`을 채우면 거래명세서 이메일 발송 기능을 추가할 수 있습니다.
- **카카오톡 공유**: [Kakao Developers](https://developers.kakao.com)에서 무료 앱을 만들고 JavaScript 키를 `NEXT_PUBLIC_KAKAO_JS_KEY`에 채우면 거래명세서를 카카오톡 공유하기 버튼으로 전달할 수 있습니다.
- **배포**: Vercel에 이 저장소를 연결하고 동일한 환경변수를 등록하면 외부에서 접속 가능한 웹사이트로 배포됩니다.
