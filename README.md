# INK 거래 관리

거래처와의 매출(공급)·매입(수급) 거래, 수금/지급, 월별/업체별 마감, 거래명세서 PDF 출력·이메일 발송·카카오톡 공유를 관리하는 웹사이트입니다.

## 처음 설정하기

1. 의존성 설치
   ```bash
   npm install
   ```
2. [supabase.com](https://supabase.com)에서 무료 계정을 만들고 새 프로젝트를 생성합니다.
3. 프로젝트의 **Settings → API**에서 Project URL, anon public key, service_role secret key(직원 계정 생성 기능에 필요, 외부에 노출되면 안 되는 값)를 확인합니다.
4. `.env.local.example`을 `.env.local`로 복사한 뒤 위 값들을 채워 넣습니다.
5. Supabase 대시보드의 **SQL Editor**에서 [`supabase/schema.sql`](./supabase/schema.sql) 파일 내용 전체를 실행해 테이블/뷰/보안 정책을 생성합니다.
6. 개발 서버 실행
   ```bash
   npm run dev
   ```
7. 첫 계정(관리자)은 자율 가입이 막혀 있어서, Supabase 대시보드 **Authentication → Users → Add user**에서 직접 만들어야 합니다. 이메일/비밀번호를 지정하고 "Auto Confirm User"를 체크해서 만들면, 첫 번째로 생성되는 사용자이므로 자동으로 **관리자** 권한이 부여됩니다. 이후 직원 계정은 로그인 후 `/settings`에서 관리자가 직접 생성합니다 (임시 비밀번호가 자동 발급되어 화면에 표시됩니다).

Supabase 연결 정보가 없으면 모든 페이지가 자동으로 `/setup` 안내 페이지로 이동합니다.

## 주요 기능

- 거래처 마스터 — 공급거래처(매출)/수급거래처(매입) 유형 구분
- 거래 등록 — 품목별 판매(구매)/샘플 구분, 공급가·부가세 자동 계산
- 수금/지급 등록 및 거래처별 잔액(이월잔액 포함) 자동 계산
- 대시보드 — 매출·매입 이번달 통계, 미수금/미지급금 거래처 목록
- 월별 마감 → 월별 거래내역서 PDF 출력
- 업체별 마감 → 기간 선택 거래명세서 PDF 출력(매입 거래처는 공급자/공급받는자 자동 스왑)
- 거래명세서 이메일 발송 (Resend)
- 거래명세서 카카오톡 공유 (로그인 없이 열람 가능한 1회성 공유 링크 생성)
- 사용자 권한: 관리자(전체 관리, 마감 실행, 계정 관리) / 직원(입력·조회)

## 선택 기능 연동

- **이메일 발송**: [Resend](https://resend.com) 계정 생성 → 도메인 인증(또는 테스트 발신 주소 사용) → `.env.local`에 `RESEND_API_KEY`, `RESEND_FROM_EMAIL` 채우면 `/closing/customer`에서 거래명세서를 이메일로 바로 발송할 수 있습니다.
- **카카오톡 공유**: [Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → 앱 추가 → JavaScript 키 복사 → **플랫폼 설정 → Web**에 사이트 도메인 등록(로컬 `http://localhost:3000` 및 실제 배포 도메인 둘 다) → `.env.local`에 `NEXT_PUBLIC_KAKAO_JS_KEY` 채우면 `/closing/customer`의 "카카오톡으로 공유" 버튼이 활성화됩니다.
- **배포**: Vercel에 이 저장소를 연결하고 동일한 환경변수를 등록하면 외부에서 접속 가능한 웹사이트로 배포됩니다. 배포 후 Supabase 대시보드 **Authentication → URL Configuration**에 실제 배포 도메인을 추가해야 로그인이 정상 동작합니다.

## 참고: 공개 공유 링크

카카오톡 "공유하기"는 파일이 아니라 링크를 공유하는 방식이라, 로그인 없이도 특정 거래명세서 1건만 열람 가능한 임시 링크(`/s/[token]`)를 발급하는 구조로 되어 있습니다. 이 링크는 `statement_shares` 테이블에 저장된 무작위 토큰을 알아야만 열람 가능하며, 앱 화면 어디에서도 전체 목록을 조회할 수 없도록 되어 있습니다.
