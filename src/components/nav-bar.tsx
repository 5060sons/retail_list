"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/lib/supabase/types";
import { signOut } from "@/app/login/actions";

const LINKS = [
  { href: "/", label: "대시보드" },
  { href: "/customers", label: "거래처" },
  { href: "/items", label: "품목" },
  { href: "/transactions", label: "거래" },
  { href: "/payments", label: "수금" },
  { href: "/closing/monthly", label: "월별 마감" },
  { href: "/closing/customer", label: "업체별 마감" },
  { href: "/settings", label: "설정" },
];

export function NavBar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold whitespace-nowrap">
            공급 거래 관리
          </Link>
          <nav className="hidden gap-1 md:flex">
            {LINKS.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    active
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-500 sm:inline">
            {profile.name} ({profile.role === "admin" ? "관리자" : "직원"})
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </form>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-2 py-1.5 text-sm md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            메뉴
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-gray-200 px-4 py-2 md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
