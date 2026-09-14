"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireProfile } from "@/lib/auth";
import { getResend } from "@/lib/email";
import { getCustomerStatementData } from "@/lib/pdf/statement-data";
import { CustomerStatementDocument } from "@/lib/pdf/statement-document";

export async function closeCustomerPeriod(formData: FormData) {
  const profile = await requireAdmin();
  const customer_id = String(formData.get("customer_id") ?? "");
  const period_start = String(formData.get("from") ?? "");
  const period_end = String(formData.get("to") ?? "");

  if (!customer_id || !period_start || !period_end) {
    redirect("/closing/customer?error=" + encodeURIComponent("거래처와 기간을 선택해주세요."));
  }

  const supabase = await createClient();

  const { data: closing, error } = await supabase
    .from("customer_closings")
    .insert({ customer_id, period_start, period_end, closed_by: profile.id })
    .select()
    .single();

  if (error || !closing) {
    redirect(
      `/closing/customer?customer_id=${customer_id}&error=` +
        encodeURIComponent(error?.message ?? "마감 처리에 실패했습니다.")
    );
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update({ customer_closing_id: closing.id })
    .eq("customer_id", customer_id)
    .gte("transaction_date", period_start)
    .lte("transaction_date", period_end)
    .is("customer_closing_id", null);

  if (updateError) {
    redirect(
      `/closing/customer?customer_id=${customer_id}&error=` + encodeURIComponent(updateError.message)
    );
  }

  revalidatePath("/closing/customer");
  redirect(
    `/closing/customer?customer_id=${customer_id}&message=` +
      encodeURIComponent(`${period_start} ~ ${period_end} 마감이 완료되었습니다.`)
  );
}

export async function sendStatementEmail(formData: FormData) {
  await requireProfile();

  const customer_id = String(formData.get("customer_id") ?? "");
  const from = String(formData.get("from") ?? "");
  const to = String(formData.get("to") ?? "");
  const recipient = String(formData.get("recipient_email") ?? "").trim();

  const backTo = `/closing/customer?customer_id=${customer_id}&from=${from}&to=${to}`;

  if (!customer_id || !from || !to || !recipient) {
    redirect(`${backTo}&error=` + encodeURIComponent("받는 이메일 주소를 입력해주세요."));
  }

  const data = await getCustomerStatementData(customer_id, from, to);
  if (!data) {
    redirect(`${backTo}&error=` + encodeURIComponent("거래처 정보를 찾을 수 없습니다."));
  }

  const buffer = await renderToBuffer(CustomerStatementDocument({ data }));
  const companyName = data.company?.name ?? "거래명세서";

  const resend = getResend();
  const { error } = await resend.emails.send({
    from: `${companyName} <${process.env.RESEND_FROM_EMAIL}>`,
    to: [recipient],
    subject: `[${companyName}] 거래명세서 (${from} ~ ${to})`,
    html: `<p>${data.customer.name} 담당자님, 안녕하세요.</p><p>${from} ~ ${to} 기간 거래명세서를 첨부해 드립니다.</p>`,
    attachments: [
      {
        filename: `statement-${data.customer.name}-${from}_${to}.pdf`,
        content: buffer,
      },
    ],
  });

  if (error) {
    redirect(`${backTo}&error=` + encodeURIComponent(error.message));
  }

  redirect(`${backTo}&message=` + encodeURIComponent(`${recipient}로 거래명세서를 발송했습니다.`));
}

export async function createShareLink(
  customerId: string,
  from: string,
  to: string
): Promise<{ url: string } | { error: string }> {
  const profile = await requireProfile();

  if (!customerId || !from || !to) {
    return { error: "거래처와 기간을 선택해주세요." };
  }

  const token = randomBytes(20).toString("base64url");
  const supabase = await createClient();

  const { error } = await supabase.from("statement_shares").insert({
    token,
    customer_id: customerId,
    period_start: from,
    period_end: to,
    created_by: profile.id,
  });

  if (error) {
    return { error: error.message };
  }

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return { url: `${proto}://${host}/s/${token}` };
}
