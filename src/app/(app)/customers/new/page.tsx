import { CustomerForm } from "@/components/customer-form";
import { createCustomer } from "../actions";

export default async function NewCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">거래처 등록</h1>
      <CustomerForm action={createCustomer} error={error} />
    </div>
  );
}
