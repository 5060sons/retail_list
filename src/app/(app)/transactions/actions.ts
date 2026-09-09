"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

interface LineInput {
  item_id: string | null;
  item_name_snapshot: string;
  line_type: "sale" | "sample";
  unit_price: number;
  quantity: number;
}

function readLines(formData: FormData): LineInput[] {
  const itemIds = formData.getAll("line_item_id") as string[];
  const itemNames = formData.getAll("line_item_name") as string[];
  const lineTypes = formData.getAll("line_type") as string[];
  const unitPrices = formData.getAll("line_unit_price") as string[];
  const quantities = formData.getAll("line_quantity") as string[];

  return itemNames
    .map((name, idx) => ({
      item_id: itemIds[idx] || null,
      item_name_snapshot: name.trim(),
      line_type: lineTypes[idx] === "sample" ? ("sample" as const) : ("sale" as const),
      unit_price: Number(unitPrices[idx] ?? 0),
      quantity: Number(quantities[idx] ?? 0),
    }))
    .filter((line) => line.item_name_snapshot.length > 0 && line.quantity !== 0);
}

export async function createTransaction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const customer_id = String(formData.get("customer_id") ?? "");
  const transaction_date = String(formData.get("transaction_date") ?? "");
  const memo = String(formData.get("memo") ?? "").trim() || null;
  const lines = readLines(formData);

  if (!customer_id || !transaction_date || lines.length === 0) {
    redirect(
      "/transactions/new?error=" +
        encodeURIComponent("거래처, 거래일, 최소 1개 이상의 품목 라인을 입력해주세요.")
    );
  }

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({ customer_id, transaction_date, memo, created_by: profile.id })
    .select()
    .single();

  if (error || !transaction) {
    redirect("/transactions/new?error=" + encodeURIComponent(error?.message ?? "거래 생성 실패"));
  }

  const { error: lineError } = await supabase.from("transaction_lines").insert(
    lines.map((line) => ({ ...line, transaction_id: transaction.id }))
  );

  if (lineError) {
    await supabase.from("transactions").delete().eq("id", transaction.id);
    redirect("/transactions/new?error=" + encodeURIComponent(lineError.message));
  }

  revalidatePath("/transactions");
  revalidatePath(`/customers/${customer_id}`);
  redirect("/transactions");
}

export async function updateTransaction(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const customer_id = String(formData.get("customer_id") ?? "");
  const transaction_date = String(formData.get("transaction_date") ?? "");
  const memo = String(formData.get("memo") ?? "").trim() || null;
  const lines = readLines(formData);

  if (!customer_id || !transaction_date || lines.length === 0) {
    redirect(
      `/transactions/${id}/edit?error=` +
        encodeURIComponent("거래처, 거래일, 최소 1개 이상의 품목 라인을 입력해주세요.")
    );
  }

  const { error } = await supabase
    .from("transactions")
    .update({ customer_id, transaction_date, memo })
    .eq("id", id);

  if (error) {
    redirect(`/transactions/${id}/edit?error=` + encodeURIComponent(error.message));
  }

  await supabase.from("transaction_lines").delete().eq("transaction_id", id);
  const { error: lineError } = await supabase
    .from("transaction_lines")
    .insert(lines.map((line) => ({ ...line, transaction_id: id })));

  if (lineError) {
    redirect(`/transactions/${id}/edit?error=` + encodeURIComponent(lineError.message));
  }

  revalidatePath("/transactions");
  revalidatePath(`/customers/${customer_id}`);
  redirect("/transactions");
}

export async function deleteTransaction(id: string, customerId: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);

  if (error) {
    redirect(`/transactions?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/transactions");
  revalidatePath(`/customers/${customerId}`);
  redirect("/transactions");
}
