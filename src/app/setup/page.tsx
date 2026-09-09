export default function SetupPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-4 rounded-md border border-gray-200 bg-white p-6">
        <h1 className="text-lg font-semibold">Supabase 연결이 필요합니다</h1>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
          <li>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              supabase.com
            </a>
            에서 무료 계정을 만들고 새 프로젝트를 생성하세요.
          </li>
          <li>
            프로젝트의 <strong>Settings → API</strong> 메뉴에서 Project URL과 anon public key를 확인하세요.
          </li>
          <li>
            프로젝트 루트의 <code className="rounded bg-gray-100 px-1">.env.local.example</code> 파일을{" "}
            <code className="rounded bg-gray-100 px-1">.env.local</code>로 복사한 뒤, 위 값을 붙여넣으세요.
          </li>
          <li>
            <strong>SQL Editor</strong>에서 <code className="rounded bg-gray-100 px-1">supabase/schema.sql</code>{" "}
            파일 내용 전체를 실행해 테이블을 생성하세요.
          </li>
          <li>서버를 재시작하면 로그인 화면으로 이동합니다.</li>
        </ol>
      </div>
    </div>
  );
}
