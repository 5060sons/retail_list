import { createClient } from "@/lib/supabase/server";
import { TransactionForm } from "@/components/transaction-form";
import { createTransaction } from "../actions";
import type { Customer, Item } from "@/lib/supabase/types";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; customer_id?: string }>;
}) {
  const { error, customer_id } = await searchParams;
  const supabase = await createClient();
  const [{ data: customers }, { data: items }] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    supabase.from("items").select("*").order("name"),
  ]);

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-lg font-semibold">거래 등록</h1>
      <TransactionForm
        action={createTransaction}
        customers={(customers ?? []) as Customer[]}
        items={(items ?? []) as Item[]}
        defaultCustomerId={customer_id}
        error={error}
      />
    </div>
  );
}
