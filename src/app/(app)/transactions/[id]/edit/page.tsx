import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { TransactionForm } from "@/components/transaction-form";
import { updateTransaction, deleteTransaction } from "../../actions";
import type { Customer, Item, Transaction, TransactionLine } from "@/lib/supabase/types";

export default async function EditTransactionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: transaction }, { data: lines }, { data: customers }, { data: items }] =
    await Promise.all([
      supabase.from("transactions").select("*").eq("id", id).single(),
      supabase.from("transaction_lines").select("*").eq("transaction_id", id),
      supabase.from("customers").select("*").order("name"),
      supabase.from("items").select("*").order("name"),
    ]);

  if (!transaction) notFound();

  const typedTransaction = transaction as Transaction;
  const isClosed = Boolean(
    typedTransaction.monthly_closing_id || typedTransaction.customer_closing_id
  );
  const readOnly = isClosed && profile.role !== "admin";

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">거래 수정</h1>
        <form action={deleteTransaction.bind(null, id, typedTransaction.customer_id)}>
          <button
            type="submit"
            disabled={readOnly}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            삭제
          </button>
        </form>
      </div>

      {isClosed && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          이미 마감된 거래입니다. {readOnly ? "관리자만 수정할 수 있습니다." : "관리자 권한으로 수정합니다."}
        </p>
      )}

      {readOnly ? (
        <p className="text-sm text-gray-500">마감된 거래는 조회만 가능합니다.</p>
      ) : (
        <TransactionForm
          action={updateTransaction.bind(null, id)}
          customers={(customers ?? []) as Customer[]}
          items={(items ?? []) as Item[]}
          transaction={typedTransaction}
          lines={(lines ?? []) as TransactionLine[]}
          error={error}
        />
      )}
    </div>
  );
}
