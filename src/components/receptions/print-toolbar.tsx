"use client";

import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="print:hidden mb-6 flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm">
      <Button asChild variant="outline" size="sm">
        <Link href={backHref}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>
      </Button>
      <Button onClick={() => window.print()} size="sm">
        <Printer className="mr-2 h-4 w-4" />
        Imprimir
      </Button>
    </div>
  );
}
