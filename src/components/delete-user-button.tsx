"use client";

export function DeleteUserButton({
  action,
  userName,
  disabled,
}: {
  action: () => void;
  userName: string;
  disabled?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`${userName} 계정을 삭제하시겠습니까? 로그인은 즉시 막히고 되돌릴 수 없습니다.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={disabled}
        className="text-red-600 hover:underline disabled:text-gray-300 disabled:no-underline"
      >
        삭제
      </button>
    </form>
  );
}
