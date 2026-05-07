import { notFound } from "next/navigation";
import { PrintToolbar } from "@/components/receptions/print-toolbar";
import { Smartphone } from "lucide-react";
import { getReceptionById } from "@/repositories/reception-repository";
import {
  BRAND_LABELS,
  PAYMENT_METHOD_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";

// Pure Server Component. No browser APIs, no event handlers, no client state.
// Auth is enforced by the parent (print)/layout.tsx (which checks getSession).
// All interactive bits (Imprimir / Volver) live in <PrintToolbar/> behind a
// "use client" boundary.
export const dynamic = "force-dynamic";

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reception = await getReceptionById(id);
  if (!reception) notFound();

  const totalPaid = reception.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, reception.totalCost - totalPaid);
  const created = new Date(reception.createdAt);
  const fmtDate = created.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fmtTime = created.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-6 print:p-0">
      <PrintToolbar backHref={`/receptions/${reception.id}`} />

      <article className="rounded-md border border-gray-300 bg-white p-8 text-black shadow-sm print:border-0 print:p-0 print:shadow-none">
        <header className="mb-6 flex items-start justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">
                Centro de Servicio Multimarcas
              </h1>
              <p className="text-xs text-gray-600">Orden de Servicio</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Folio
            </p>
            <p className="font-mono text-2xl font-bold leading-none">
              {reception.folio}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              {fmtDate}
              <br />
              {fmtTime}
            </p>
          </div>
        </header>

        <section className="mb-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
            Datos del Cliente
          </h2>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-gray-500">Nombre</p>
              <p className="font-medium">{reception.client.name}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Teléfono</p>
              <p className="font-medium">{reception.client.phone}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Email</p>
              <p className="font-medium">{reception.client.email || "—"}</p>
            </div>
          </div>
        </section>

        <section className="mb-5 border-t pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
            Dispositivo
          </h2>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-gray-500">Marca</p>
              <p className="font-medium">
                {BRAND_LABELS[reception.brand] ?? reception.brand}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Modelo</p>
              <p className="font-medium">{reception.model}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">Color</p>
              <p className="font-medium">{reception.color}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500">IMEI</p>
              <p className="font-mono text-xs">{reception.imei || "—"}</p>
            </div>
          </div>
        </section>

        <section className="mb-5 border-t pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
            Problema / Falla reportada
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {reception.problem}
          </p>
        </section>

        <section className="mb-5 border-t pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
            Accesorios recibidos
          </h2>
          <p className="text-sm">{reception.accessories || "Ninguno"}</p>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-6 border-t pt-4">
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
              Estado actual
            </h2>
            <p className="text-base font-semibold">
              {STATUS_LABELS[reception.status] ?? reception.status}
            </p>
            {reception.technician && (
              <p className="mt-1 text-xs text-gray-600">
                Técnico asignado: {reception.technician.name}
              </p>
            )}
          </div>
          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
              Resumen de costos
            </h2>
            <dl className="space-y-0.5 text-sm">
              <div className="flex justify-between">
                <dt>Costo total:</dt>
                <dd className="font-medium">
                  ${reception.totalCost.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Pagado:</dt>
                <dd>${totalPaid.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between border-t pt-0.5 font-bold">
                <dt>Restante:</dt>
                <dd>${remaining.toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {reception.payments.length > 0 && (
          <section className="mb-5 border-t pt-4">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
              Pagos registrados
            </h2>
            <table className="w-full text-xs">
              <thead className="border-b text-left text-gray-600">
                <tr>
                  <th className="py-1 font-medium">Fecha</th>
                  <th className="py-1 font-medium">Concepto</th>
                  <th className="py-1 font-medium">Método</th>
                  <th className="py-1 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {reception.payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="py-1">
                      {new Date(p.createdAt).toLocaleDateString("es-MX")}
                    </td>
                    <td className="py-1">{p.concept}</td>
                    <td className="py-1">
                      {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                    </td>
                    <td className="py-1 text-right font-medium">
                      ${p.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <section className="mb-6 border-t pt-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
            Términos y condiciones
          </h2>
          <ol className="list-decimal space-y-1 pl-5 text-[11px] leading-relaxed text-gray-700">
            <li>
              El cliente acepta que el Centro de Servicio Multimarcas no se hace
              responsable por pérdida de información o datos personales durante
              el proceso de reparación.
            </li>
            <li>
              Los equipos no reclamados después de 30 días naturales contados
              desde la fecha de aviso de entrega serán considerados abandonados.
            </li>
            <li>
              La garantía cubre exclusivamente la reparación realizada por un
              período de 30 días naturales y no aplica para daños por mal uso,
              caídas, humedad o líquidos posteriores a la entrega.
            </li>
            <li>
              Cualquier diagnóstico, presupuesto o costo adicional será informado
              al cliente antes de continuar con la reparación.
            </li>
          </ol>
        </section>

        <section className="grid grid-cols-2 gap-12 pt-12 print:break-inside-avoid">
          <div className="text-center">
            <div className="mx-auto h-16 border-b border-black"></div>
            <p className="mt-2 text-xs">Firma del Cliente</p>
            <p className="text-[10px] text-gray-500">{reception.client.name}</p>
          </div>
          <div className="text-center">
            <div className="mx-auto h-16 border-b border-black"></div>
            <p className="mt-2 text-xs">Firma del Técnico / Recibió</p>
            {reception.technician && (
              <p className="text-[10px] text-gray-500">
                {reception.technician.name}
              </p>
            )}
          </div>
        </section>

        {reception.signatureData && (
          <section className="mt-8 border-t pt-4 print:break-inside-avoid">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
              Firma capturada digitalmente
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reception.signatureData}
              alt="Firma del cliente"
              className="max-h-24 border border-gray-200"
            />
            {reception.signatureDate && (
              <p className="mt-1 text-[10px] text-gray-500">
                Firmado:{" "}
                {new Date(reception.signatureDate).toLocaleString("es-MX")}
              </p>
            )}
          </section>
        )}

        <footer className="mt-6 border-t pt-3 text-center text-[10px] text-gray-500">
          Documento generado el{" "}
          {new Date().toLocaleString("es-MX", {
            dateStyle: "long",
            timeStyle: "short",
          })}{" "}
          • Folio {reception.folio}
        </footer>
      </article>
    </div>
  );
}
