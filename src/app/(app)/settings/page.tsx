import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { RoleSelect } from "@/components/role-select";
import { updateCompanySettings, updateMyName, updateUserRole } from "./actions";
import type { CompanySettings, Profile } from "@/lib/supabase/types";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const profile = await requireProfile();
  const { error, message } = await searchParams;
  const supabase = await createClient();

  const [{ data: company }, { data: profiles }] = await Promise.all([
    supabase.from("company_settings").select("*").single(),
    profile.role === "admin"
      ? supabase.from("profiles").select("*").order("created_at")
      : Promise.resolve({ data: null }),
  ]);

  const typedCompany = company as CompanySettings | null;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-lg font-semibold">설정</h1>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">내 정보</h2>
        <form action={updateMyName} className="flex items-end gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm">
          <label>
            <span className="mb-1 block text-gray-700">이름</span>
            <input
              name="name"
              defaultValue={profile.name}
              className="rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-white">
            저장
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">공급자(회사) 정보 — 거래명세서에 표시됩니다</h2>
        <form
          action={updateCompanySettings}
          className="grid grid-cols-2 gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm"
        >
          <Field label="상호" name="name" defaultValue={typedCompany?.name ?? ""} disabled={profile.role !== "admin"} />
          <Field label="사업자번호" name="biz_reg_no" defaultValue={typedCompany?.biz_reg_no ?? ""} disabled={profile.role !== "admin"} />
          <Field label="대표자" name="ceo_name" defaultValue={typedCompany?.ceo_name ?? ""} disabled={profile.role !== "admin"} />
          <Field label="연락처" name="phone" defaultValue={typedCompany?.phone ?? ""} disabled={profile.role !== "admin"} />
          <Field label="업태" name="business_type" defaultValue={typedCompany?.business_type ?? ""} disabled={profile.role !== "admin"} />
          <Field label="종목" name="business_item" defaultValue={typedCompany?.business_item ?? ""} disabled={profile.role !== "admin"} />
          <div className="col-span-2">
            <Field label="주소" name="address" defaultValue={typedCompany?.address ?? ""} disabled={profile.role !== "admin"} />
          </div>
          {profile.role === "admin" && (
            <div className="col-span-2">
              <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-white">
                저장
              </button>
            </div>
          )}
        </form>
      </section>

      {profile.role === "admin" && profiles && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">사용자 관리</h2>
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">이름</th>
                  <th className="px-4 py-2 font-medium">이메일</th>
                  <th className="px-4 py-2 font-medium">권한</th>
                </tr>
              </thead>
              <tbody>
                {(profiles as Profile[]).map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2 text-gray-600">{p.email}</td>
                    <td className="px-4 py-2">
                      <RoleSelect
                        action={updateUserRole.bind(null, p.id)}
                        defaultValue={p.role}
                        disabled={p.id === profile.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            새 직원은 로그인 화면에서 &ldquo;계정 만들기&rdquo;로 직접 가입하면 자동으로 직원 권한이 부여됩니다.
          </p>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-gray-700">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="w-full rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-50 disabled:text-gray-500"
      />
    </label>
  );
}
