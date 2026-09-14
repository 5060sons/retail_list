"use client";

import { useState } from "react";
import type { Customer, Item, Transaction, TransactionLine } from "@/lib/supabase/types";

type Direction = "sale" | "purchase";

interface LineRow {
  key: number;
  item_id: string;
  item_name: string;
  line_type: "sale" | "sample";
  unit_price: number;
  quantity: number;
}

let keySeq = 0;
function newRow(): LineRow {
  return { key: keySeq++, item_id: "", item_name: "", line_type: "sale", unit_price: 0, quantity: 1 };
}

function directionOf(customers: Customer[], customerId?: string): Direction {
  const customer = customers.find((c) => c.id === customerId);
  return customer?.partner_type === "supplier" ? "purchase" : "sale";
}

export function TransactionForm({
  action,
  customers,
  items,
  defaultCustomerId,
  transaction,
  lines,
  error,
}: {
  action: (formData: FormData) => void;
  customers: Customer[];
  items: Item[];
  defaultCustomerId?: string;
  transaction?: Transaction;
  lines?: TransactionLine[];
  error?: string;
}) {
  const initialCustomerId = transaction?.customer_id ?? defaultCustomerId ?? "";
  const [direction, setDirection] = useState<Direction>(() =>
    directionOf(customers, initialCustomerId)
  );
  const [customerId, setCustomerId] = useState(initialCustomerId);

  const [rows, setRows] = useState<LineRow[]>(() =>
    lines && lines.length > 0
      ? lines.map((l) => ({
          key: keySeq++,
          item_id: l.item_id ?? "",
          item_name: l.item_name_snapshot,
          line_type: l.line_type,
          unit_price: l.unit_price,
          quantity: l.quantity,
        }))
      : [newRow()]
  );

  function updateRow(key: number, patch: Partial<LineRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleItemSelect(key: number, itemId: string) {
    const item = items.find((i) => i.id === itemId);
    updateRow(key, {
      item_id: itemId,
      item_name: item?.name ?? "",
      unit_price: item?.default_unit_price ?? 0,
    });
  }

  function handleDirectionChange(next: Direction) {
    setDirection(next);
    // 현재 선택된 거래처가 새 구분과 맞지 않으면 초기화
    const current = customers.find((c) => c.id === customerId);
    const currentDirection = current?.partner_type === "supplier" ? "purchase" : "sale";
    if (currentDirection !== next) {
      setCustomerId("");
    }
  }

  const filteredCustomers = customers.filter((c) =>
    direction === "purchase" ? c.partner_type === "supplier" : c.partner_type !== "supplier"
  );

  const supplyTotal = rows.reduce((sum, r) => sum + r.unit_price * r.quantity, 0);
  const vatTotal = Math.round(supplyTotal * 0.1);

  return (
    <form action={action} className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <fieldset className="text-sm">
        <legend className="mb-1 text-gray-700">거래구분 *</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={direction === "sale"}
              onChange={() => handleDirectionChange("sale")}
            />
            매출 (공급거래처)
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={direction === "purchase"}
              onChange={() => handleDirectionChange("purchase")}
            />
            매입 (수급거래처)
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-gray-700">거래처 *</span>
          <select
            name="customer_id"
            required
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              선택
            </option>
            {filteredCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {filteredCustomers.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              {direction === "purchase" ? "등록된 수급거래처가 없습니다." : "등록된 공급거래처가 없습니다."}{" "}
              거래처를 먼저 등록해주세요.
            </p>
          )}
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-gray-700">거래일 *</span>
          <input
            name="transaction_date"
            type="date"
            required
            defaultValue={transaction?.transaction_date ?? new Date().toISOString().slice(0, 10)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">품목</span>
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, newRow()])}
            className="text-sm text-gray-600 underline"
          >
            + 품목 추가
          </button>
        </div>
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500">
                <th className="w-40 border-b border-gray-200 px-2 py-2 font-medium">품목</th>
                <th className="border-b border-gray-200 px-2 py-2 font-medium">품목명</th>
                <th className="w-28 border-b border-gray-200 px-2 py-2 font-medium">단가</th>
                <th className="w-24 border-b border-gray-200 px-2 py-2 font-medium">수량</th>
                <th className="w-32 border-b border-gray-200 px-2 py-2 text-right font-medium">공급가</th>
                <th className="w-24 border-b border-gray-200 px-2 py-2 font-medium">구분</th>
                <th className="w-12 border-b border-gray-200 px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-gray-100 last:border-b-0">
                  <td className="p-1">
                    <select
                      value={row.item_id}
                      onChange={(e) => handleItemSelect(row.key, e.target.value)}
                      className="w-full rounded border-0 bg-transparent px-1.5 py-1.5 text-sm focus:bg-white focus:outline focus:outline-gray-300"
                    >
                      <option value="">직접 입력</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <input type="hidden" name="line_item_id" value={row.item_id} />
                  </td>
                  <td className="p-1">
                    <input
                      name="line_item_name"
                      value={row.item_name}
                      onChange={(e) => updateRow(row.key, { item_name: e.target.value })}
                      required
                      className="w-full rounded border-0 bg-transparent px-1.5 py-1.5 text-sm focus:bg-white focus:outline focus:outline-gray-300"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      name="line_unit_price"
                      type="number"
                      value={row.unit_price}
                      onChange={(e) => updateRow(row.key, { unit_price: Number(e.target.value) })}
                      className="w-full rounded border-0 bg-transparent px-1.5 py-1.5 text-right text-sm focus:bg-white focus:outline focus:outline-gray-300"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      name="line_quantity"
                      type="number"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, { quantity: Number(e.target.value) })}
                      className="w-full rounded border-0 bg-transparent px-1.5 py-1.5 text-right text-sm focus:bg-white focus:outline focus:outline-gray-300"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right text-gray-900">
                    {(row.unit_price * row.quantity).toLocaleString("ko-KR")}
                  </td>
                  <td className="p-1">
                    <select
                      name="line_type"
                      value={row.line_type}
                      onChange={(e) =>
                        updateRow(row.key, { line_type: e.target.value as "sale" | "sample" })
                      }
                      className={`w-full rounded border-0 px-1.5 py-1.5 text-sm focus:bg-white focus:outline focus:outline-gray-300 ${
                        row.line_type === "sample" ? "bg-amber-50 text-amber-700" : "bg-transparent"
                      }`}
                    >
                      <option value="sale">{direction === "purchase" ? "구매" : "판매"}</option>
                      <option value="sample">샘플</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                      disabled={rows.length === 1}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-300"
                      aria-label="삭제"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md bg-gray-50 p-3 text-sm">
        <p>공급가 합계: {supplyTotal.toLocaleString("ko-KR")}원</p>
        <p>부가세 합계: {vatTotal.toLocaleString("ko-KR")}원</p>
        <p className="font-medium">
          거래 합계: {(supplyTotal + vatTotal).toLocaleString("ko-KR")}원
        </p>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-gray-700">메모</span>
        <textarea
          name="memo"
          defaultValue={transaction?.memo ?? ""}
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </label>

      <button
        type="submit"
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        저장
      </button>
    </form>
  );
}
