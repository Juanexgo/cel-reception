import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Smartphone, LayoutDashboard, ClipboardList, Users, UserCog, LogOut } from "lucide-react";
import { LogoutButton } from "@/components/common/logout-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/receptions", label: "Recepciones", icon: ClipboardList },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/users", label: "Usuarios", icon: UserCog },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-sm">Centro de Servicio</h1>
              <p className="text-xs text-slate-400">Multimarcas</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
