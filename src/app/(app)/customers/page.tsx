import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { PartnerBadge } from "@/components/partner-badge";
import type { Customer, CustomerBalance } from "@/lib/supabase/types";

const TABS: { value: string; label: string }[] = [
  { value: "", label: "전체" },
  { value: "customer", label: "공급거래처" },
  { value: "supplier", label: "수급거래처" },
];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("customers").select("*").order("name");
  if (type === "customer" || type === "supplier") {
    query = query.eq("partner_type", type);
  }

  const [customersRes, balancesRes] = await Promise.all([
    query,
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

      <div className="flex gap-1">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/customers?type=${tab.value}` : "/customers"}
            className={`rounded-md px-3 py-1.5 text-sm ${
              (type ?? "") === tab.value
                ? "bg-gray-900 text-white"
                : "border border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">거래처명</th>
              <th className="px-4 py-2 font-medium">유형</th>
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
                  <td className="px-4 py-2">
                    <PartnerBadge partnerType={c.partner_type} />
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
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
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
