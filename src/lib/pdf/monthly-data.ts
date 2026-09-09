import { createClient } from "@/lib/supabase/server";
import { monthRange } from "@/lib/format";
import { getCustomerStatementData, type CustomerStatementData } from "./statement-data";

export async function getMonthlyStatementData(
  yearMonth: string
): Promise<CustomerStatementData[]> {
  const { start, end } = monthRange(yearMonth);
  const supabase = await createClient();

  const { data: customerIdsFromTxn } = await supabase
    .from("transactions")
    .select("customer_id")
    .gte("transaction_date", start)
    .lte("transaction_date", end);

  const uniqueIds = Array.from(
    new Set((customerIdsFromTxn ?? []).map((r) => r.customer_id as string))
  );

  const results = await Promise.all(
    uniqueIds.map((id) => getCustomerStatementData(id, start, end))
  );

  return results.filter((r): r is CustomerStatementData => r !== null);
}
