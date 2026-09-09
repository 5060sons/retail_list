"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { monthRange } from "@/lib/format";

export async function closeMonth(formData: FormData) {
  const profile = await requireAdmin();
  const yearMonth = String(formData.get("year_month") ?? "");

  if (!yearMonth) {
    redirect("/closing/monthly?error=" + encodeURIComponent("마감할 연월을 선택해주세요."));
  }

  const supabase = await createClient();
  const { start, end } = monthRange(yearMonth);

  const { data: closing, error } = await supabase
    .from("monthly_closings")
    .insert({ year_month: yearMonth, closed_by: profile.id })
    .select()
    .single();

  if (error || !closing) {
    redirect(
      "/closing/monthly?error=" +
        encodeURIComponent(error?.message ?? "이미 마감된 연월이거나 처리에 실패했습니다.")
    );
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update({ monthly_closing_id: closing.id })
    .gte("transaction_date", start)
    .lte("transaction_date", end)
    .is("monthly_closing_id", null);

  if (updateError) {
    redirect("/closing/monthly?error=" + encodeURIComponent(updateError.message));
  }

  revalidatePath("/closing/monthly");
  redirect("/closing/monthly?message=" + encodeURIComponent(`${yearMonth} 마감이 완료되었습니다.`));
}
