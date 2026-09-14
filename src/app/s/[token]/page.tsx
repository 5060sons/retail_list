import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerStatementData } from "@/lib/pdf/statement-data";
import { formatCurrency, balanceLabel } from "@/lib/format";
import type { StatementShare } from "@/lib/supabase/types";

export default async function SharedStatementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: share } = await admin
    .from("statement_shares")
    .select("*")
    .eq("token", token)
    .single();

  if (!share) notFound();

  const typedShare = share as StatementShare;
  const data = await getCustomerStatementData(
    typedShare.customer_id,
    typedShare.period_start,
    typedShare.period_end,
    admin
  );

  if (!data) notFound();

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-md border border-gray-200 bg-white p-6">
        <div>
          <p className="text-xs text-gray-500">{data.company?.name ?? ""}</p>
          <h1 className="text-lg font-semibold">{data.customer.name} 거래명세서</h1>
          <p className="mt-1 text-sm text-gray-500">
            기간: {typedShare.period_start} ~ {typedShare.period_end}
          </p>
        </div>

        <div className="rounded-md bg-gray-50 p-4 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-500">공급가액</span>
            <span>{formatCurrency(data.totalSupply)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">부가세</span>
            <span>{formatCurrency(data.totalVat)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 py-1 pt-2 font-medium">
            <span>{balanceLabel(data.customer.partner_type)}</span>
            <span>{formatCurrency(data.closingBalance)}</span>
          </div>
        </div>

        <a
          href={`/api/s/${token}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="block w-full rounded-md bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
        >
          PDF 보기/다운로드
        </a>
      </div>
    </div>
  );
}
