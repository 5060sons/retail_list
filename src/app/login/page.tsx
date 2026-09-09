import Link from "next/link";
import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const isSignup = params.mode === "signup";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold">공급 거래 내역 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isSignup ? "새 계정 만들기" : "로그인"}
          </p>
        </div>

        {params.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-600">
            {params.message}
          </p>
        )}

        {isSignup ? (
          <form action={signUp} className="space-y-3">
            <Field label="이름" name="name" type="text" required />
            <Field label="이메일" name="email" type="email" required />
            <Field label="비밀번호" name="password" type="password" required minLength={6} />
            <button
              type="submit"
              className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              가입하기
            </button>
          </form>
        ) : (
          <form action={signIn} className="space-y-3">
            <Field label="이메일" name="email" type="email" required />
            <Field label="비밀번호" name="password" type="password" required />
            <button
              type="submit"
              className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              로그인
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500">
          {isSignup ? (
            <>
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-gray-900 underline">
                로그인
              </Link>
            </>
          ) : (
            <>
              처음 사용하시나요?{" "}
              <Link href="/login?mode=signup" className="text-gray-900 underline">
                계정 만들기
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  required,
  minLength,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
    </label>
  );
}
