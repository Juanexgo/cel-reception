"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/receptions", label: "Recepciones", icon: ClipboardList },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/users", label: "Usuarios", icon: UserCog },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 p-4">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-slate-800 text-white"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-white",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
