import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { LogoutButton } from "@/components/common/logout-button";
import { SidebarNav } from "@/components/common/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="flex w-64 flex-col bg-slate-900 text-white">
        <div className="border-b border-slate-700 p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Smartphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">
                Centro de Servicio
              </h1>
              <p className="text-xs text-slate-400">Multimarcas</p>
            </div>
          </Link>
        </div>
        <SidebarNav />
        <div className="border-t border-slate-700 p-4">
          <div className="mb-2 px-3 py-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
