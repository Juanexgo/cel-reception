"use client";

import { logoutAction } from "@/actions/auth-actions";
import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-slate-800 transition-colors w-full text-left"
    >
      <LogOut className="h-5 w-5" />
      Cerrar Sesión
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton />
    </form>
  );
}
