"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, requireProfile } from "@/lib/auth";

function generateTempPassword(): string {
  return randomBytes(9).toString("base64url");
}

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

export async function createStaffAccount(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "staff") === "admin" ? "admin" : "staff";

  if (!name || !email) {
    redirect("/settings?error=" + encodeURIComponent("이름과 이메일을 입력해주세요."));
  }

  const tempPassword = generateTempPassword();
  const admin = createAdminClient();

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error || !created.user) {
    redirect("/settings?error=" + encodeURIComponent(error?.message ?? "계정 생성에 실패했습니다."));
  }

  if (role === "admin") {
    await admin.from("profiles").update({ role: "admin" }).eq("id", created.user.id);
  }

  revalidatePath("/settings");
  redirect(
    "/settings?message=" +
      encodeURIComponent(
        `계정이 생성되었습니다. 이메일: ${email} / 임시 비밀번호: ${tempPassword} (직원에게 전달 후 로그인해서 비밀번호를 변경하도록 안내해주세요)`
      )
  );
}

export async function deleteStaffAccount(userId: string) {
  const profile = await requireAdmin();

  if (userId === profile.id) {
    redirect("/settings?error=" + encodeURIComponent("본인 계정은 삭제할 수 없습니다."));
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?message=" + encodeURIComponent("계정이 삭제되었습니다."));
}

export async function updateMyPassword(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    redirect("/settings?error=" + encodeURIComponent("비밀번호는 6자 이상이어야 합니다."));
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/settings?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect(`/settings?message=${encodeURIComponent(`${profile.name}님의 비밀번호가 변경되었습니다.`)}`);
}
