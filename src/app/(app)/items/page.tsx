import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { createItem, updateItem, deleteItem } from "./actions";
import type { Item } from "@/lib/supabase/types";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; edit?: string }>;
}) {
  const profile = await requireProfile();
  const { error, edit } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("items").select("*").order("name");
  const items = (data ?? []) as Item[];

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">품목</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <form action={createItem} className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-gray-700">품목명 *</span>
          <input
            name="name"
            required
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-700">단위/규격</span>
          <input
            name="unit"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-gray-700">기본 단가</span>
          <input
            name="default_unit_price"
            type="number"
            defaultValue={0}
            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          추가
        </button>
      </form>

      <div className="overflow-x-auto rounded-md border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">품목명</th>
              <th className="px-4 py-2 font-medium">단위/규격</th>
              <th className="px-4 py-2 font-medium text-right">기본 단가</th>
              <th className="px-4 py-2 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) =>
              edit === item.id ? (
                <tr key={item.id} className="border-t border-gray-100 bg-gray-50">
                  <td colSpan={4} className="px-4 py-3">
                    <form
                      action={updateItem.bind(null, item.id)}
                      className="flex flex-wrap items-end gap-3"
                    >
                      <input
                        name="name"
                        defaultValue={item.name}
                        required
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="unit"
                        defaultValue={item.unit ?? ""}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        name="default_unit_price"
                        type="number"
                        defaultValue={item.default_unit_price}
                        className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
                      >
                        저장
                      </button>
                      <Link
                        href="/items"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        취소
                      </Link>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2 text-gray-600">{item.unit ?? "-"}</td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(item.default_unit_price)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/items?edit=${item.id}`}
                        className="text-gray-600 hover:underline"
                      >
                        수정
                      </Link>
                      {profile.role === "admin" && (
                        <form action={deleteItem.bind(null, item.id)}>
                          <button type="submit" className="text-red-600 hover:underline">
                            삭제
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              )
            )}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  등록된 품목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
