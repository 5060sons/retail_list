export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + "원";
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
