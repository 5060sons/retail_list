"use client";

export function RoleSelect({
  action,
  defaultValue,
  disabled,
}: {
  action: (formData: FormData) => void;
  defaultValue: string;
  disabled?: boolean;
}) {
  return (
    <form action={action}>
      <select
        name="role"
        defaultValue={defaultValue}
        disabled={disabled}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-gray-300 px-2 py-1 disabled:bg-gray-50"
      >
        <option value="staff">직원</option>
        <option value="admin">관리자</option>
      </select>
    </form>
  );
}
