import Link from "next/link";

export default function PrintNotFound() {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-lg font-semibold">Recepción no encontrada</h1>
      <p className="mt-2 text-sm text-gray-600">
        La orden que intentas imprimir no existe o fue eliminada.
      </p>
      <Link
        href="/receptions"
        className="mt-4 inline-block rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800"
      >
        Volver al listado
      </Link>
    </div>
  );
}
