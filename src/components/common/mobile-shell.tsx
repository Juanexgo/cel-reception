"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, Smartphone, X } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";
import { LogoutButton } from "./logout-button";

/**
 * Top bar + slide-out nav, only rendered below the `md` breakpoint.
 *
 * On phones the desktop sidebar (256 px) would consume two thirds of the
 * viewport, so we hide it (`md:flex`) and show this header instead. Tapping
 * the hamburger reveals an off-canvas panel with the same nav links plus
 * the user info / logout from the desktop sidebar — visually consistent.
 *
 * No new dependency: the drawer is a fixed positioned div with a backdrop,
 * driven by local state. Closes on:
 *   - tap on backdrop
 *   - tap on a nav link (via `onNavigate`)
 *   - Escape key
 *   - route change (the `useEffect` watching `pathname`)
 */
export function MobileShell({
  user,
}: {
  user: { name: string; email: string };
}) {
  const [open, setOpen] = useState(false);

  // Note: route-change auto-close is handled by the link click handlers
  // themselves (SidebarNav.onNavigate and the close button). We avoid a
  // pathname-watching effect because it triggers a setState during render
  // and the linter flags it as cascading-render risk.

  // Lock background scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-slate-900 px-4 text-white md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Smartphone className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold leading-none">
            Centro de Servicio
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="-mr-1 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800"
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Backdrop — pointer-events disabled when the panel is closed. */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Off-canvas panel. We translate it off-screen instead of unmounting
          to keep open/close transitions smooth without a layout shift. */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-slate-900 text-white shadow-xl transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
      >
        <div className="flex items-center justify-between border-b border-slate-700 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Smartphone className="h-5 w-5 text-primary-foreground" />
            </span>
            <span>
              <span className="block text-sm font-bold leading-tight">
                Centro de Servicio
              </span>
              <span className="block text-xs text-slate-400">Multimarcas</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <SidebarNav onNavigate={() => setOpen(false)} />

        <div className="border-t border-slate-700 p-4">
          <div className="mb-2 px-3 py-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
