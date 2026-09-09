import { requireProfile } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar profile={profile} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
