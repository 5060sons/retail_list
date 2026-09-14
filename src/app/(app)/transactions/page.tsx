import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, transactionDirectionLabel } from "@/lib/format";
import type { Customer, Item, PartnerType } from "@/lib/supabase/types";

interface Row {
  id: string;
  transaction_date: string;
  customers: { name: string; partner_type: PartnerType } | null;
  transaction_lines: { supply_amount: number; vat_amount: number; line_type: "sale" | "sample" }[];
}

const DIRECTION_TABS: { value: string; label: string }[] = [
  { value: "", label: "전체" },
  { value: "sale", label: "매출" },
  { value: "purchase", label: "매입" },
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    customer_id?: string;
    item_id?: string;
    type?: string;
    direction?: string;
    error?: string;
  }>;
}) {
  const { from, to, customer_id, item_id, type, direction, error } = await searchParams;
  const supabase = await createClient();

  const [{ data: customers }, { data: items }] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    supabase.from("items").select("*").order("name"),
  ]);

  const needsInnerLines = Boolean(item_id || type);
  const linesEmbed = needsInnerLines ? "transaction_lines!inner" : "transaction_lines";
  let query = supabase
    .from("transactions")
    .select(
      `id, transaction_date, customers!inner ( name, partner_type ), ${linesEmbed} ( supply_amount, vat_amount, item_id, line_type )`
    )
    .order("transaction_date", { ascending: false });

  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);
  if (customer_id) query = query.eq("customer_id", customer_id);
  if (type) query = query.eq("transaction_lines.line_type", type);
  if (item_id) query = query.eq("transaction_lines.item_id", item_id);
  if (direction === "sale") query = query.eq("customers.partner_type", "customer");
  if (direction === "purchase") query = query.eq("customers.partner_type", "supplier");

  const { data } = await query;
  const rows = (data ?? []) as unknown as Row[];

  const totalSupply = rows.reduce(
    (sum, row) => sum + row.transaction_lines.reduce((s, l) => s + Number(l.supply_amount), 0),
    0
  );
  const totalVat = rows.reduce(
    (sum, row) => sum + row.transaction_lines.reduce((s, l) => s + Number(l.vat_amount), 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">거래 목록</h1>
        <Link
          href="/transactions/new"
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          + 거래 등록
        </Link>
      </div>

      <div className="flex gap-1">
        {DIRECTION_TABS.map((tab) => {
          const params = new URLSearchParams();
          if (from) params.set("from", from);
          if (to) params.set("to", to);
          if (customer_id) params.set("customer_id", customer_id);
          if (item_id) params.set("item_id", item_id);
          if (type) params.set("type", type);
          if (tab.value) params.set("direction", tab.value);
          const href = params.toString() ? `/transactions?${params.toString()}` : "/transactions";
          return (
            <Link
              key={tab.value}
              href={href}
              className={`rounded-md px-3 py-1.5 text-sm ${
                (direction ?? "") === tab.value
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-4 text-sm">
        <input type="hidden" name="direction" value={direction ?? ""} />
        <label>
          <span className="mb-1 block text-gray-700">시작일</span>
          <input type="date" name="from" defaultValue={from} className="rounded-md border border-gray-300 px-2 py-1.5" />
        </label>
        <label>
          <span className="mb-1 block text-gray-700">종료일</span>
          <input type="date" name="to" defaultValue={to} className="rounded-md border border-gray-300 px-2 py-1.5" />
        </label>
        <label>
          <span className="mb-1 block text-gray-700">거래처</span>
          <select name="customer_id" defaultValue={customer_id ?? ""} className="rounded-md border border-gray-300 px-2 py-1.5">
            <option value="">전체</option>
            {((customers ?? []) as Customer[]).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-gray-700">품목</span>
          <select name="item_id" defaultValue={item_id ?? ""} className="rounded-md border border-gray-300 px-2 py-1.5">
            <option value="">전체</option>
            {((items ?? []) as Item[]).map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1 block text-gray-700">판매/샘플</span>
          <select name="type" defaultValue={type ?? ""} className="rounded-md border border-gray-300 px-2 py-1.5">
            <option value="">전체</option>
            <option value="sale">판매</option>
            <option value="sample">샘플</option>
          </select>
        </label>
        <button type="submit" className="rounded-md bg-gray-900 px-4 py-2 text-white">
          검색
        </button>
      </form>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">거래일</th>
              <th className="px-4 py-2 font-medium">거래처</th>
              <th className="px-4 py-2 font-medium">구분</th>
              <th className="px-4 py-2 font-medium text-right">공급가</th>
              <th className="px-4 py-2 font-medium text-right">부가세</th>
              <th className="px-4 py-2 font-medium">유형</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const supply = row.transaction_lines.reduce((s, l) => s + Number(l.supply_amount), 0);
              const vat = row.transaction_lines.reduce((s, l) => s + Number(l.vat_amount), 0);
              const types = new Set(row.transaction_lines.map((l) => l.line_type));
              const rowDirection = row.customers?.partner_type ?? "customer";
              const mainLabel = rowDirection === "supplier" ? "구매" : "판매";
              const typeLabel =
                types.size === 0
                  ? "-"
                  : types.size > 1
                    ? `${mainLabel}+샘플`
                    : types.has("sample")
                      ? "샘플"
                      : mainLabel;
              return (
                <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/transactions/${row.id}/edit`} className="hover:underline">
                      {row.transaction_date}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{row.customers?.name ?? "-"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        rowDirection === "supplier"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {transactionDirectionLabel(rowDirection)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{formatCurrency(supply)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(vat)}</td>
                  <td className="px-4 py-2">{typeLabel}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  조건에 맞는 거래가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50 font-medium">
                <td className="px-4 py-2" colSpan={3}>
                  합계
                </td>
                <td className="px-4 py-2 text-right">{formatCurrency(totalSupply)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(totalVat)}</td>
                <td className="px-4 py-2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
