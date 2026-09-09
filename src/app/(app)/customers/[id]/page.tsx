import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { deleteCustomer } from "../actions";
import type { Customer, CustomerLedgerEntry } from "@/lib/supabase/types";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: customer }, { data: ledger }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id).single(),
    supabase
      .from("customer_ledger")
      .select("*")
      .eq("customer_id", id)
      .order("entry_date", { ascending: false })
      .order("entry_created_at", { ascending: false }),
  ]);

  if (!customer) notFound();

  const typedCustomer = customer as Customer;
  const entries = (ledger ?? []) as CustomerLedgerEntry[];
  const currentBalance = entries[0]?.running_balance ?? typedCustomer.opening_balance;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">{typedCustomer.name}</h1>
          <p className="text-sm text-gray-500">
            {typedCustomer.manager_name && `담당자: ${typedCustomer.manager_name} · `}
            {typedCustomer.phone ?? ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/customers/${id}/edit`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            수정
          </Link>
          {profile.role === "admin" && (
            <form action={deleteCustomer.bind(null, id)}>
              <button
                type="submit"
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">현재 거래잔액</p>
          <p
            className={`mt-1 text-lg font-semibold ${
              currentBalance > 0 ? "text-red-600" : "text-gray-900"
            }`}
          >
            {formatCurrency(currentBalance)}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">기초 잔액</p>
          <p className="mt-1 text-lg font-semibold">
            {formatCurrency(typedCustomer.opening_balance)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={`/transactions/new?customer_id=${id}`}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          + 거래 등록
        </Link>
        <Link
          href={`/payments?customer_id=${id}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          + 수금 등록
        </Link>
        <Link
          href={`/closing/customer?customer_id=${id}`}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          거래명세서 출력
        </Link>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">거래/수금 이력</h2>
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">일자</th>
                <th className="px-4 py-2 font-medium">구분</th>
                <th className="px-4 py-2 font-medium text-right">금액</th>
                <th className="px-4 py-2 font-medium text-right">거래잔액</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="px-4 py-2">{e.entry_date}</td>
                  <td className="px-4 py-2">
                    {e.entry_type === "transaction" ? (
                      <Link
                        href={`/transactions/${e.transaction_id}/edit`}
                        className="hover:underline"
                      >
                        거래
                      </Link>
                    ) : (
                      "수금"
                    )}
                  </td>
                  <td
                    className={`px-4 py-2 text-right ${
                      e.amount < 0 ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    {e.amount < 0 ? "-" : ""}
                    {formatCurrency(Math.abs(e.amount))}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(e.running_balance)}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    거래/수금 이력이 없습니다.
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
