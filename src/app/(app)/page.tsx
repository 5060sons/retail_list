import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, currentYearMonth, monthRange } from "@/lib/format";
import type { CustomerBalance, PartnerType } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const yearMonth = currentYearMonth();
  const { start, end } = monthRange(yearMonth);

  const [linesRes, paymentsRes, balancesRes] = await Promise.all([
    supabase
      .from("transaction_lines")
      .select(
        "supply_amount, vat_amount, line_type, transactions!inner(transaction_date, customers!inner(partner_type))"
      )
      .gte("transactions.transaction_date", start)
      .lte("transactions.transaction_date", end),
    supabase
      .from("payments")
      .select("amount, customers!inner(partner_type)")
      .gte("payment_date", start)
      .lte("payment_date", end),
    supabase.from("customer_balances").select("*").gt("balance", 0).order("balance", { ascending: false }),
  ]);

  const lines = (linesRes.data ?? []) as unknown as {
    supply_amount: number;
    vat_amount: number;
    line_type: "sale" | "sample";
    transactions: { customers: { partner_type: PartnerType } };
  }[];

  const saleLines = lines.filter(
    (l) => l.transactions.customers.partner_type !== "supplier" && l.line_type === "sale"
  );
  const purchaseLines = lines.filter((l) => l.transactions.customers.partner_type === "supplier");

  const supplyTotal = saleLines.reduce((sum, l) => sum + Number(l.supply_amount), 0);
  const vatTotal = saleLines.reduce((sum, l) => sum + Number(l.vat_amount), 0);
  const purchaseSupplyTotal = purchaseLines.reduce((sum, l) => sum + Number(l.supply_amount), 0);
  const purchaseVatTotal = purchaseLines.reduce((sum, l) => sum + Number(l.vat_amount), 0);

  const payments = (paymentsRes.data ?? []) as unknown as {
    amount: number;
    customers: { partner_type: PartnerType };
  }[];
  const collectionTotal = payments
    .filter((p) => p.customers.partner_type !== "supplier")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const disbursementTotal = payments
    .filter((p) => p.customers.partner_type === "supplier")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const balances = (balancesRes.data ?? []) as CustomerBalance[];
  const receivables = balances.filter((b) => b.partner_type !== "supplier");
  const payables = balances.filter((b) => b.partner_type === "supplier");
  const receivableTotal = receivables.reduce((sum, c) => sum + Number(c.balance), 0);
  const payableTotal = payables.reduce((sum, c) => sum + Number(c.balance), 0);
  const topReceivables = receivables.slice(0, 10);
  const topPayables = payables.slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold">대시보드</h1>
        <p className="text-sm text-gray-500">{yearMonth} 기준 요약</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-600">매출 (공급거래처)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="이번달 공급가" value={formatCurrency(supplyTotal)} />
          <StatCard label="이번달 부가세" value={formatCurrency(vatTotal)} />
          <StatCard label="이번달 수금액" value={formatCurrency(collectionTotal)} />
          <StatCard label="전체 미수금" value={formatCurrency(receivableTotal)} highlight />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-600">매입 (수급거래처)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="이번달 매입액" value={formatCurrency(purchaseSupplyTotal)} />
          <StatCard label="이번달 매입부가세" value={formatCurrency(purchaseVatTotal)} />
          <StatCard label="이번달 지급액" value={formatCurrency(disbursementTotal)} />
          <StatCard label="전체 미지급금" value={formatCurrency(payableTotal)} highlight />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OutstandingList
          title="미수금 거래처 (상위 10개)"
          rows={topReceivables}
          emptyText="미수금이 있는 거래처가 없습니다."
        />
        <OutstandingList
          title="미지급금 거래처 (상위 10개)"
          rows={topPayables}
          emptyText="미지급금이 있는 거래처가 없습니다."
        />
      </div>
    </div>
  );
}

function OutstandingList({
  title,
  rows,
  emptyText,
}: {
  title: string;
  rows: CustomerBalance[];
  emptyText: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href="/customers" className="text-sm text-gray-500 underline">
          전체 거래처 보기
        </Link>
      </div>
      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">{emptyText}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">거래처</th>
                <th className="px-4 py-2 font-medium text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.customer_id} className="border-t border-gray-100">
                  <td className="px-4 py-2">
                    <Link href={`/customers/${c.customer_id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-red-600">
                    {formatCurrency(c.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${
          highlight ? "text-red-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
