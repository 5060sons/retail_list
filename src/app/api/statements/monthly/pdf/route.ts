import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireProfile } from "@/lib/auth";
import { getMonthlyStatementData } from "@/lib/pdf/monthly-data";
import { MonthlyStatementDocument } from "@/lib/pdf/statement-document";
import { contentDisposition } from "@/lib/pdf/content-disposition";

export async function GET(request: NextRequest) {
  await requireProfile();

  const { searchParams } = new URL(request.url);
  const yearMonth = searchParams.get("year_month");

  if (!yearMonth) {
    return NextResponse.json({ error: "year_month 파라미터가 필요합니다." }, { status: 400 });
  }

  const items = await getMonthlyStatementData(yearMonth);
  const buffer = await renderToBuffer(MonthlyStatementDocument({ items }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition(`monthly-statement-${yearMonth}.pdf`),
    },
  });
}
