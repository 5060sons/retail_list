"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/lib/supabase/types";
import { signOut } from "@/app/login/actions";

const LINKS = [
  { href: "/", label: "대시보드" },
  { href: "/transactions", label: "거래내역" },
  { href: "/payments", label: "수금/지급" },
  { href: "/closing/monthly", label: "월별 마감" },
  { href: "/closing/customer", label: "업체별 마감" },
  { href: "/items", label: "품목" },
  { href: "/customers", label: "거래처" },
  { href: "/settings", label: "설정" },
];

export function NavBar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap">
            <Image src="/icon.png" alt="" width={24} height={24} className="rounded" />
            거래 관리
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
          <form action={signOut} className="hidden md:block">
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </form>
          <button
            type="button"
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-700 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-gray-200 md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-2">
            {LINKS.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm ${
                    active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <span className="text-sm text-gray-500">
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
          </div>
        </div>
      )}
    </header>
  );
}
