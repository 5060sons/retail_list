import Image from "next/image";
import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Image src="/icon.png" alt="" width={56} height={56} className="mx-auto rounded" />
          <h1 className="mt-3 text-xl font-semibold">거래 관리</h1>
          <p className="mt-1 text-sm text-gray-500">로그인</p>
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

        <p className="text-center text-sm text-gray-500">
          계정이 없으신가요? 관리자에게 계정 생성을 요청해주세요.
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
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
    </label>
  );
}
