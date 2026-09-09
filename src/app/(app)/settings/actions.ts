"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireProfile } from "@/lib/auth";

export async function updateCompanySettings(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const fields = {
    name: String(formData.get("name") ?? "").trim() || null,
    biz_reg_no: String(formData.get("biz_reg_no") ?? "").trim() || null,
    ceo_name: String(formData.get("ceo_name") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    business_type: String(formData.get("business_type") ?? "").trim() || null,
    business_item: String(formData.get("business_item") ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("company_settings").update(fields).eq("id", true);

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?message=" + encodeURIComponent("회사 정보가 저장되었습니다."));
}

export async function updateMyName(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    redirect("/settings?error=" + encodeURIComponent("이름을 입력해주세요."));
  }

  const { error } = await supabase.from("profiles").update({ name }).eq("id", profile.id);

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?message=" + encodeURIComponent("이름이 변경되었습니다."));
}

export async function updateUserRole(userId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const role = String(formData.get("role") ?? "staff");

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?message=" + encodeURIComponent("권한이 변경되었습니다."));
}
