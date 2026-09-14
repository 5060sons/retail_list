import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerStatementData } from "@/lib/pdf/statement-data";
import { CustomerStatementDocument } from "@/lib/pdf/statement-document";
import { contentDisposition } from "@/lib/pdf/content-disposition";
import type { StatementShare } from "@/lib/supabase/types";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: share } = await admin
    .from("statement_shares")
    .select("*")
    .eq("token", token)
    .single();

  if (!share) {
    return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
  }

  const typedShare = share as StatementShare;
  const data = await getCustomerStatementData(
    typedShare.customer_id,
    typedShare.period_start,
    typedShare.period_end,
    admin
  );

  if (!data) {
    return NextResponse.json({ error: "거래처 정보를 찾을 수 없습니다." }, { status: 404 });
  }

  const buffer = await renderToBuffer(CustomerStatementDocument({ data }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition(
        `statement-${data.customer.name}-${typedShare.period_start}_${typedShare.period_end}.pdf`
      ),
    },
  });
}
