import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { registerFonts } from "./fonts";
import type { CustomerStatementData } from "./statement-data";

registerFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansKR",
    fontSize: 9,
    padding: 32,
    color: "#111827",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 16,
  },
  partiesRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  partyBox: {
    flex: 1,
    border: "1pt solid #d1d5db",
    borderRadius: 4,
    padding: 8,
  },
  partyTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  partyLine: {
    marginBottom: 2,
    color: "#374151",
  },
  table: {
    marginTop: 8,
    border: "1pt solid #d1d5db",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #e5e7eb",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
  },
  cell: {
    padding: 5,
    borderRight: "1pt solid #e5e7eb",
  },
  cDate: { width: "12%" },
  cItem: { width: "26%" },
  cQty: { width: "10%", textAlign: "right" },
  cPrice: { width: "13%", textAlign: "right" },
  cSupply: { width: "16%", textAlign: "right" },
  cVat: { width: "13%", textAlign: "right" },
  cType: { width: "10%", textAlign: "center" },
  summaryBox: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: "45%",
    border: "1pt solid #d1d5db",
    borderRadius: 4,
    padding: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  summaryLabel: { color: "#374151" },
  summaryValue: { fontWeight: "bold" },
  paymentsTitle: {
    marginTop: 16,
    marginBottom: 4,
    fontWeight: "bold",
  },
});

function won(n: number) {
  return Math.round(n).toLocaleString("ko-KR") + "원";
}

export function StatementPage({ data }: { data: CustomerStatementData }) {
  const { customer, company, from, to, openingBalance, lines, payments, totalSupply, totalVat, totalPayment, closingBalance } = data;

  return (
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>거래명세서</Text>
        <Text style={styles.subtitle}>기간: {from} ~ {to}</Text>

        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>공급자</Text>
            <Text style={styles.partyLine}>상호: {company?.name ?? "-"}</Text>
            <Text style={styles.partyLine}>사업자번호: {company?.biz_reg_no ?? "-"}</Text>
            <Text style={styles.partyLine}>대표자: {company?.ceo_name ?? "-"}</Text>
            <Text style={styles.partyLine}>주소: {company?.address ?? "-"}</Text>
            <Text style={styles.partyLine}>연락처: {company?.phone ?? "-"}</Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>공급받는자</Text>
            <Text style={styles.partyLine}>상호: {customer.name}</Text>
            <Text style={styles.partyLine}>사업자번호: {customer.biz_reg_no ?? "-"}</Text>
            <Text style={styles.partyLine}>대표자: {customer.ceo_name ?? "-"}</Text>
            <Text style={styles.partyLine}>주소: {customer.address ?? "-"}</Text>
            <Text style={styles.partyLine}>담당자: {customer.manager_name ?? "-"}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cell, styles.cDate]}>거래일</Text>
            <Text style={[styles.cell, styles.cItem]}>품목명</Text>
            <Text style={[styles.cell, styles.cQty]}>수량</Text>
            <Text style={[styles.cell, styles.cPrice]}>단가</Text>
            <Text style={[styles.cell, styles.cSupply]}>공급가액</Text>
            <Text style={[styles.cell, styles.cVat]}>세액</Text>
            <Text style={[styles.cell, styles.cType, { borderRight: "none" }]}>구분</Text>
          </View>
          {lines.map((l, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.cell, styles.cDate]}>{l.transaction_date}</Text>
              <Text style={[styles.cell, styles.cItem]}>{l.item_name_snapshot}</Text>
              <Text style={[styles.cell, styles.cQty]}>{l.quantity}</Text>
              <Text style={[styles.cell, styles.cPrice]}>{won(l.unit_price)}</Text>
              <Text style={[styles.cell, styles.cSupply]}>{won(l.supply_amount)}</Text>
              <Text style={[styles.cell, styles.cVat]}>{won(l.vat_amount)}</Text>
              <Text style={[styles.cell, styles.cType, { borderRight: "none" }]}>
                {l.transaction_type === "sale" ? "판매" : "샘플"}
              </Text>
            </View>
          ))}
          {lines.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.cell, { width: "100%", textAlign: "center", borderRight: "none" }]}>
                해당 기간의 거래 내역이 없습니다.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>전기이월잔액</Text>
            <Text style={styles.summaryValue}>{won(openingBalance)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>당기 공급가액</Text>
            <Text style={styles.summaryValue}>{won(totalSupply)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>당기 부가세</Text>
            <Text style={styles.summaryValue}>{won(totalVat)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>당기 수금액</Text>
            <Text style={styles.summaryValue}>-{won(totalPayment)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 4, borderTop: "1pt solid #d1d5db", paddingTop: 4 }]}>
            <Text style={styles.summaryLabel}>거래잔액</Text>
            <Text style={styles.summaryValue}>{won(closingBalance)}</Text>
          </View>
        </View>

        {payments.length > 0 && (
          <View>
            <Text style={styles.paymentsTitle}>수금 내역</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.cell, { width: "20%" }]}>수금일</Text>
                <Text style={[styles.cell, { width: "20%", textAlign: "right" }]}>수금액</Text>
                <Text style={[styles.cell, { width: "20%" }]}>방법</Text>
                <Text style={[styles.cell, { width: "40%", borderRight: "none" }]}>메모</Text>
              </View>
              {payments.map((p) => (
                <View key={p.id} style={styles.tableRow}>
                  <Text style={[styles.cell, { width: "20%" }]}>{p.payment_date}</Text>
                  <Text style={[styles.cell, { width: "20%", textAlign: "right" }]}>{won(p.amount)}</Text>
                  <Text style={[styles.cell, { width: "20%" }]}>{p.method ?? "-"}</Text>
                  <Text style={[styles.cell, { width: "40%", borderRight: "none" }]}>{p.memo ?? "-"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
  );
}

export function CustomerStatementDocument({ data }: { data: CustomerStatementData }) {
  return (
    <Document>
      <StatementPage data={data} />
    </Document>
  );
}

export function MonthlyStatementDocument({ items }: { items: CustomerStatementData[] }) {
  return (
    <Document>
      {items.map((data) => (
        <StatementPage key={data.customer.id} data={data} />
      ))}
    </Document>
  );
}
