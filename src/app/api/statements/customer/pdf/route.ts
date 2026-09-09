import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireProfile } from "@/lib/auth";
import { getCustomerStatementData } from "@/lib/pdf/statement-data";
import { CustomerStatementDocument } from "@/lib/pdf/statement-document";

export async function GET(request: NextRequest) {
  await requireProfile();

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customer_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!customerId || !from || !to) {
    return NextResponse.json(
      { error: "customer_id, from, to 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const data = await getCustomerStatementData(customerId, from, to);
  if (!data) {
    return NextResponse.json({ error: "거래처를 찾을 수 없습니다." }, { status: 404 });
  }

  const buffer = await renderToBuffer(CustomerStatementDocument({ data }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="statement-${data.customer.name}-${from}_${to}.pdf"`,
    },
  });
}
