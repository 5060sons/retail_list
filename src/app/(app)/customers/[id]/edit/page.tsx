import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerForm } from "@/components/customer-form";
import { updateCustomer } from "../../actions";
import type { Customer } from "@/lib/supabase/types";

export default async function EditCustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">거래처 수정</h1>
      <CustomerForm
        action={updateCustomer.bind(null, id)}
        customer={customer as Customer}
        error={error}
      />
    </div>
  );
}
