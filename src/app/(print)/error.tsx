"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function PrintError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[print error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-lg font-semibold">No se pudo cargar la orden</h1>
      <p className="mt-2 text-sm text-gray-600">
        Hubo un problema generando la orden de servicio. Vuelve a intentarlo o
        regresa al detalle de la recepción.
      </p>
      <div className="mt-4 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Reintentar
        </button>
        <Link
          href="/receptions"
          className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800"
        >
          Volver
        </Link>
      </div>
    </div>
  );
}
