"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

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
