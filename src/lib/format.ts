import type { PartnerType } from "@/lib/supabase/types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + "원";
}

export function isSupplier(partnerType: PartnerType): boolean {
  return partnerType === "supplier";
}

export function partnerTypeLabel(partnerType: PartnerType): string {
  return isSupplier(partnerType) ? "수급거래처" : "공급거래처";
}

export function transactionDirectionLabel(partnerType: PartnerType): string {
  return isSupplier(partnerType) ? "매입" : "매출";
}

export function paymentLabel(partnerType: PartnerType): string {
  return isSupplier(partnerType) ? "지급" : "수금";
}

export function balanceLabel(partnerType: PartnerType): string {
  return isSupplier(partnerType) ? "미지급금" : "미수금";
}

export function formatDate(date: string): string {
  return date;
}

export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = `${yearMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}
