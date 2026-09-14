"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireProfile } from "@/lib/auth";

function readCustomerFields(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    partner_type: String(formData.get("partner_type") ?? "customer") === "supplier" ? "supplier" : "customer",
    biz_reg_no: emptyToNull(formData.get("biz_reg_no")),
    ceo_name: emptyToNull(formData.get("ceo_name")),
    phone: emptyToNull(formData.get("phone")),
    address: emptyToNull(formData.get("address")),
    email: emptyToNull(formData.get("email")),
    kakao_contact: emptyToNull(formData.get("kakao_contact")),
    manager_name: emptyToNull(formData.get("manager_name")),
    payment_terms: emptyToNull(formData.get("payment_terms")),
    opening_balance: Number(formData.get("opening_balance") ?? 0),
    memo: emptyToNull(formData.get("memo")),
  };
}

function emptyToNull(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str.length === 0 ? null : str;
}

export async function createCustomer(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const fields = readCustomerFields(formData);

  if (!fields.name) {
    redirect("/customers/new?error=" + encodeURIComponent("거래처명을 입력해주세요."));
  }

  const { error } = await supabase
    .from("customers")
    .insert({ ...fields, created_by: profile.id });

  if (error) {
    redirect("/customers/new?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomer(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const fields = readCustomerFields(formData);

  if (!fields.name) {
    redirect(`/customers/${id}/edit?error=` + encodeURIComponent("거래처명을 입력해주세요."));
  }

  const { error } = await supabase.from("customers").update(fields).eq("id", id);

  if (error) {
    redirect(`/customers/${id}/edit?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) {
    redirect(`/customers/${id}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/customers");
  redirect("/customers");
}
