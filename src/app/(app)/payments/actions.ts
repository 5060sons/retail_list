"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function createPayment(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const customer_id = String(formData.get("customer_id") ?? "");
  const transaction_id = String(formData.get("transaction_id") ?? "") || null;
  const payment_date = String(formData.get("payment_date") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "").trim() || null;
  const memo = String(formData.get("memo") ?? "").trim() || null;

  if (!customer_id || !payment_date || !amount) {
    redirect(
      `/payments?customer_id=${customer_id}&error=` +
        encodeURIComponent("거래처, 수금일, 수금액을 입력해주세요.")
    );
  }

  const { error } = await supabase.from("payments").insert({
    customer_id,
    transaction_id,
    payment_date,
    amount,
    method,
    memo,
    created_by: profile.id,
  });

  if (error) {
    redirect(`/payments?customer_id=${customer_id}&error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/payments");
  revalidatePath(`/customers/${customer_id}`);
  redirect(`/payments?customer_id=${customer_id}`);
}

export async function deletePayment(id: string, customerId: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);

  if (error) {
    redirect(`/payments?customer_id=${customerId}&error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/payments");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/payments?customer_id=${customerId}`);
}
