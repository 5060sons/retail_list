import type { Customer } from "@/lib/supabase/types";

export function CustomerForm({
  action,
  customer,
  error,
}: {
  action: (formData: FormData) => void;
  customer?: Customer;
  error?: string;
}) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <Field label="거래처명 *" name="name" defaultValue={customer?.name} required />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="사업자번호"
          name="biz_reg_no"
          defaultValue={customer?.biz_reg_no ?? ""}
        />
        <Field label="대표자" name="ceo_name" defaultValue={customer?.ceo_name ?? ""} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="연락처" name="phone" defaultValue={customer?.phone ?? ""} />
        <Field label="이메일" name="email" defaultValue={customer?.email ?? ""} />
      </div>
      <Field label="주소" name="address" defaultValue={customer?.address ?? ""} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="담당자"
          name="manager_name"
          defaultValue={customer?.manager_name ?? ""}
        />
        <Field
          label="카카오톡 연락처"
          name="kakao_contact"
          defaultValue={customer?.kakao_contact ?? ""}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="결제조건"
          name="payment_terms"
          defaultValue={customer?.payment_terms ?? ""}
          placeholder="예: 월말 정산"
        />
        <Field
          label="기초(이월) 잔액"
          name="opening_balance"
          type="number"
          defaultValue={customer?.opening_balance ?? 0}
        />
      </div>
      <label className="block text-sm">
        <span className="mb-1 block text-gray-700">메모</span>
        <textarea
          name="memo"
          defaultValue={customer?.memo ?? ""}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
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

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-700">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
    </label>
  );
}
