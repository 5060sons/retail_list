import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { currentYearMonth } from "@/lib/format";
import { closeMonth } from "./actions";
import type { MonthlyClosing } from "@/lib/supabase/types";

export default async function MonthlyClosingPage({
  searchParams,
}: {
  searchParams: Promise<{ year_month?: string; error?: string; message?: string }>;
}) {
  const profile = await requireProfile();
  const { year_month, error, message } = await searchParams;
  const selected = year_month ?? currentYearMonth();

  const supabase = await createClient();
  const { data: closings } = await supabase
    .from("monthly_closings")
    .select("*")
    .order("year_month", { ascending: false });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold">월별 마감</h1>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
      )}

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm">
        <label>
          <span className="mb-1 block text-gray-700">연월</span>
          <input
            type="month"
            name="year_month"
            defaultValue={selected}
            className="rounded-md border border-gray-300 px-2 py-1.5"
          />
        </label>
        <button type="submit" className="rounded-md border border-gray-300 px-4 py-2">
          선택
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <a
          href={`/api/statements/monthly/pdf?year_month=${selected}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          {selected} 거래내역서 PDF 보기/다운로드
        </a>

        {profile.role === "admin" && (
          <form action={closeMonth}>
            <input type="hidden" name="year_month" value={selected} />
            <button
              type="submit"
              className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              {selected} 마감 실행
            </button>
          </form>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">마감 이력</h2>
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">연월</th>
                <th className="px-4 py-2 font-medium">마감일시</th>
                <th className="px-4 py-2 font-medium text-right">출력</th>
              </tr>
            </thead>
            <tbody>
              {((closings ?? []) as MonthlyClosing[]).map((c) => (
                <tr key={c.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{c.year_month}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(c.closed_at).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <a
                      href={`/api/statements/monthly/pdf?year_month=${c.year_month}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-600 hover:underline"
                    >
                      PDF 보기
                    </a>
                  </td>
                </tr>
              ))}
              {(closings ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    마감 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
