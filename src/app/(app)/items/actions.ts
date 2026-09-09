"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, requireProfile } from "@/lib/auth";

export async function createItem(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || null;
  const default_unit_price = Number(formData.get("default_unit_price") ?? 0);

  if (!name) {
    redirect("/items?error=" + encodeURIComponent("품목명을 입력해주세요."));
  }

  const { error } = await supabase
    .from("items")
    .insert({ name, unit, default_unit_price, created_by: profile.id });

  if (error) {
    redirect("/items?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/items");
  redirect("/items");
}

export async function updateItem(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim() || null;
  const default_unit_price = Number(formData.get("default_unit_price") ?? 0);

  const { error } = await supabase
    .from("items")
    .update({ name, unit, default_unit_price })
    .eq("id", id);

  if (error) {
    redirect(`/items?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/items");
  redirect("/items");
}

export async function deleteItem(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error) {
    redirect(`/items?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/items");
  redirect("/items");
}
