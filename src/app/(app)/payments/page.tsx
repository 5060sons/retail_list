import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { createPayment, deletePayment } from "./actions";
import type { Customer, Payment } from "@/lib/supabase/types";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ customer_id?: string; error?: string }>;
}) {
  const { customer_id, error } = await searchParams;
  const supabase = await createClient();

  const [{ data: customers }, paymentsRes] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    customer_id
      ? supabase
          .from("payments")
          .select("*")
          .eq("customer_id", customer_id)
          .order("payment_date", { ascending: false })
      : supabase
          .from("payments")
          .select("*, customers ( name )")
          .order("payment_date", { ascending: false })
          .limit(50),
  ]);

  const payments = (paymentsRes.data ?? []) as (Payment & { customers?: { name: string } })[];
  const typedCustomers = (customers ?? []) as Customer[];
  const selectedCustomer = typedCustomers.find((c) => c.id === customer_id);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">수금 관리</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form action={createPayment} className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm">
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
          <span className="mb-1 block text-gray-700">수금일 *</span>
          <input
            type="date"
            name="payment_date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-md border border-gray-300 px-2 py-1.5"
          />
        </label>
        <label>
          <span className="mb-1 block text-gray-700">수금액 *</span>
          <input
            type="number"
            name="amount"
            required
            className="w-32 rounded-md border border-gray-300 px-2 py-1.5"
          />
        </label>
        <label>
          <span className="mb-1 block text-gray-700">수금방법</span>
          <input
            name="method"
            placeholder="계좌이체 등"
            className="rounded-md border border-gray-300 px-2 py-1.5"
          />
        </label>
        <label>
          <span className="mb-1 block text-gray-700">메모</span>
          <input name="memo" className="rounded-md border border-gray-300 px-2 py-1.5" />
        </label>
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-white">
          수금 등록
        </button>
      </form>

      {selectedCustomer && (
        <p className="text-sm text-gray-500">
          {selectedCustomer.name}의 수금 내역만 표시 중입니다. -{" "}
          <a href="/payments" className="underline">
            전체 보기
          </a>
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">수금일</th>
              {!customer_id && <th className="px-4 py-2 font-medium">거래처</th>}
              <th className="px-4 py-2 font-medium text-right">수금액</th>
              <th className="px-4 py-2 font-medium">방법</th>
              <th className="px-4 py-2 font-medium">메모</th>
              <th className="px-4 py-2 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{p.payment_date}</td>
                {!customer_id && <td className="px-4 py-2">{p.customers?.name ?? "-"}</td>}
                <td className="px-4 py-2 text-right">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-2 text-gray-600">{p.method ?? "-"}</td>
                <td className="px-4 py-2 text-gray-600">{p.memo ?? "-"}</td>
                <td className="px-4 py-2 text-right">
                  <form action={deletePayment.bind(null, p.id, p.customer_id)}>
                    <button type="submit" className="text-red-600 hover:underline">
                      삭제
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  수금 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
