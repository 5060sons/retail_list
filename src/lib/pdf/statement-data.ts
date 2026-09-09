import { createClient } from "@/lib/supabase/server";
import type { CompanySettings, Customer, Payment } from "@/lib/supabase/types";

export interface StatementLine {
  transaction_id: string;
  transaction_date: string;
  transaction_type: "sale" | "sample";
  item_name_snapshot: string;
  unit_price: number;
  quantity: number;
  supply_amount: number;
  vat_amount: number;
}

export interface CustomerStatementData {
  customer: Customer;
  company: CompanySettings | null;
  from: string;
  to: string;
  openingBalance: number;
  lines: StatementLine[];
  payments: Payment[];
  totalSupply: number;
  totalVat: number;
  totalPayment: number;
  closingBalance: number;
}

export async function getCustomerStatementData(
  customerId: string,
  from: string,
  to: string
): Promise<CustomerStatementData | null> {
  const supabase = await createClient();

  const [{ data: customer }, { data: company }, { data: priorLedger }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", customerId).single(),
    supabase.from("company_settings").select("*").single(),
    supabase
      .from("customer_ledger")
      .select("running_balance")
      .eq("customer_id", customerId)
      .lt("entry_date", from)
      .order("entry_date", { ascending: false })
      .order("entry_created_at", { ascending: false })
      .limit(1),
  ]);

  if (!customer) return null;
  const typedCustomer = customer as Customer;

  const openingBalance =
    priorLedger && priorLedger.length > 0
      ? Number(priorLedger[0].running_balance)
      : Number(typedCustomer.opening_balance);

  const [{ data: transactions }, { data: payments }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, transaction_date, transaction_lines ( item_name_snapshot, line_type, unit_price, quantity, supply_amount, vat_amount )")
      .eq("customer_id", customerId)
      .gte("transaction_date", from)
      .lte("transaction_date", to)
      .order("transaction_date"),
    supabase
      .from("payments")
      .select("*")
      .eq("customer_id", customerId)
      .gte("payment_date", from)
      .lte("payment_date", to)
      .order("payment_date"),
  ]);

  type TxnRow = {
    id: string;
    transaction_date: string;
    transaction_lines: {
      item_name_snapshot: string;
      line_type: "sale" | "sample";
      unit_price: number;
      quantity: number;
      supply_amount: number;
      vat_amount: number;
    }[];
  };

  const lines: StatementLine[] = ((transactions ?? []) as TxnRow[]).flatMap((t) =>
    t.transaction_lines.map((l) => ({
      transaction_id: t.id,
      transaction_date: t.transaction_date,
      transaction_type: l.line_type,
      item_name_snapshot: l.item_name_snapshot,
      unit_price: l.unit_price,
      quantity: l.quantity,
      supply_amount: l.supply_amount,
      vat_amount: l.vat_amount,
    }))
  );

  const totalSupply = lines.reduce((sum, l) => sum + Number(l.supply_amount), 0);
  const totalVat = lines.reduce((sum, l) => sum + Number(l.vat_amount), 0);
  const totalPayment = ((payments ?? []) as Payment[]).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  return {
    customer: typedCustomer,
    company: (company as CompanySettings) ?? null,
    from,
    to,
    openingBalance,
    lines,
    payments: (payments ?? []) as Payment[],
    totalSupply,
    totalVat,
    totalPayment,
    closingBalance: openingBalance + totalSupply + totalVat - totalPayment,
  };
}
