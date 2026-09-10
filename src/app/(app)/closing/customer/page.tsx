import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { currentYearMonth, monthRange } from "@/lib/format";
import { isEmailConfigured } from "@/lib/email";
import { closeCustomerPeriod, sendStatementEmail } from "./actions";
import type { Customer, CustomerClosing } from "@/lib/supabase/types";

export default async function CustomerClosingPage({
  searchParams,
}: {
  searchParams: Promise<{
    customer_id?: string;
    from?: string;
    to?: string;
    error?: string;
    message?: string;
  }>;
}) {
  const profile = await requireProfile();
  const { customer_id, from, to, error, message } = await searchParams;
  const { start, end } = monthRange(currentYearMonth());
  const periodFrom = from ?? start;
  const periodTo = to ?? end;

  const supabase = await createClient();
  const { data: customers } = await supabase.from("customers").select("*").order("name");
  const typedCustomers = (customers ?? []) as Customer[];

  const { data: closings } = customer_id
    ? await supabase
        .from("customer_closings")
        .select("*")
        .eq("customer_id", customer_id)
        .order("period_start", { ascending: false })
    : { data: [] };

  const pdfHref = customer_id
    ? `/api/statements/customer/pdf?customer_id=${customer_id}&from=${periodFrom}&to=${periodTo}`
    : null;

  const selectedCustomer = typedCustomers.find((c) => c.id === customer_id);
  const emailReady = isEmailConfigured();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-lg font-semibold">업체별 마감 / 거래명세서 출력</h1>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {message && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
      )}

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm">
        <label>
          <span className="mb-1 block text-gray-700">거래처 *</span>
          <select
            name="customer_id"
            required
            defaultValue={customer_id ?? ""}
            className="rounded-md border border-gray-300 px-2 py-1.5"
          >
            <option value="" disabled>
              선택
            </option>
            {typedCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-gray-700">시작일</span>
          <input type="date" name="from" defaultValue={periodFrom} className="rounded-md border border-gray-300 px-2 py-1.5" />
        </label>
        <label>
          <span className="mb-1 block text-gray-700">종료일</span>
          <input type="date" name="to" defaultValue={periodTo} className="rounded-md border border-gray-300 px-2 py-1.5" />
        </label>
        <button type="submit" className="rounded-md border border-gray-300 px-4 py-2">
          조회
        </button>
      </form>

      {customer_id && (
        <div className="flex flex-wrap gap-2">
          <a
            href={pdfHref!}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            거래명세서 PDF 보기/다운로드
          </a>
          {profile.role === "admin" && (
            <form action={closeCustomerPeriod}>
              <input type="hidden" name="customer_id" value={customer_id} />
              <input type="hidden" name="from" value={periodFrom} />
              <input type="hidden" name="to" value={periodTo} />
              <button
                type="submit"
                className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                해당 기간 마감 실행
              </button>
            </form>
          )}
        </div>
      )}

      {customer_id && emailReady && (
        <form
          action={sendStatementEmail}
          className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm"
        >
          <input type="hidden" name="customer_id" value={customer_id} />
          <input type="hidden" name="from" value={periodFrom} />
          <input type="hidden" name="to" value={periodTo} />
          <label>
            <span className="mb-1 block text-gray-700">받는 이메일</span>
            <input
              type="email"
              name="recipient_email"
              required
              defaultValue={selectedCustomer?.email ?? ""}
              className="w-64 rounded-md border border-gray-300 px-2 py-1.5"
            />
          </label>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            이메일로 거래명세서 보내기
          </button>
        </form>
      )}

      {customer_id && (
        <div>
          <h2 className="mb-2 text-sm font-semibold">이 거래처의 마감 이력</h2>
          <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">기간</th>
                  <th className="px-4 py-2 font-medium">마감일시</th>
                  <th className="px-4 py-2 font-medium text-right">출력</th>
                </tr>
              </thead>
              <tbody>
                {((closings ?? []) as CustomerClosing[]).map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      {c.period_start} ~ {c.period_end}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {new Date(c.closed_at).toLocaleString("ko-KR")}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <a
                        href={`/api/statements/customer/pdf?customer_id=${customer_id}&from=${c.period_start}&to=${c.period_end}`}
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
      )}
    </div>
  );
}
