import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import type { Customer, CustomerBalance } from "@/lib/supabase/types";

export default async function CustomersPage() {
  const supabase = await createClient();
  const [customersRes, balancesRes] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    supabase.from("customer_balances").select("*"),
  ]);

  const customers = (customersRes.data ?? []) as Customer[];
  const balanceMap = new Map(
    ((balancesRes.data ?? []) as CustomerBalance[]).map((b) => [b.customer_id, b.balance])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">거래처</h1>
        <Link
          href="/customers/new"
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          + 거래처 등록
        </Link>
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">거래처명</th>
              <th className="px-4 py-2 font-medium">담당자</th>
              <th className="px-4 py-2 font-medium">연락처</th>
              <th className="px-4 py-2 font-medium text-right">거래잔액</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const balance = balanceMap.get(c.id) ?? c.opening_balance;
              return (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/customers/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{c.manager_name ?? "-"}</td>
                  <td className="px-4 py-2 text-gray-600">{c.phone ?? "-"}</td>
                  <td
                    className={`px-4 py-2 text-right font-medium ${
                      balance > 0 ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {formatCurrency(balance)}
                  </td>
                </tr>
              );
            })}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  등록된 거래처가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
