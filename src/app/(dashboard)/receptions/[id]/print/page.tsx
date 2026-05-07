import { getReceptionAction } from "@/actions/reception-actions";
import { notFound } from "next/navigation";

export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reception = await getReceptionAction(id);

  if (!reception) notFound();

  const totalPaid = reception.payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-8 max-w-3xl mx-auto" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Centro de Servicio Multimarcas</h1>
        <p className="text-gray-500">Orden de Servicio</p>
      </div>

      <div className="flex justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Folio</p>
          <p className="text-xl font-bold font-mono">{reception.folio}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Fecha</p>
          <p className="font-medium">
            {new Date(reception.createdAt).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(reception.createdAt).toLocaleTimeString("es-MX")}
          </p>
        </div>
      </div>

      <div className="border-t border-b py-4 mb-4">
        <h2 className="font-bold mb-2">Datos del Cliente</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nombre</p>
            <p>{reception.client.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Teléfono</p>
            <p>{reception.client.phone}</p>
          </div>
          {reception.client.email && (
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p>{reception.client.email}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-b py-4 mb-4">
        <h2 className="font-bold mb-2">Dispositivo</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Marca</p>
            <p>{reception.brand}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Modelo</p>
            <p>{reception.model}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Color</p>
            <p>{reception.color}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">IMEI</p>
            <p>{reception.imei || "—"}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-b py-4 mb-4">
        <h2 className="font-bold mb-2">Problema / Falla</h2>
        <p className="whitespace-pre-wrap">{reception.problem}</p>
      </div>

      <div className="border-t border-b py-4 mb-4">
        <h2 className="font-bold mb-2">Accesorios Recibidos</h2>
        <p>{reception.accessories}</p>
      </div>

      <div className="border-t border-b py-4 mb-4">
        <h2 className="font-bold mb-2">Estado</h2>
        <p className="text-lg">{reception.status}</p>
      </div>

      <div className="border-t border-b py-4 mb-4">
        <h2 className="font-bold mb-2">Resumen de Costos</h2>
        <div className="flex justify-between">
          <span>Costo total:</span>
          <span className="font-bold">${reception.totalCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Pagado:</span>
          <span>${totalPaid.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Restante:</span>
          <span>${(reception.totalCost - totalPaid).toFixed(2)}</span>
        </div>
      </div>

      {reception.signatureData && (
        <div className="border-t border-b py-4 mb-4">
          <h2 className="font-bold mb-2">Firma del Cliente</h2>
          <img src={reception.signatureData} alt="Firma" className="max-h-32" />
          {reception.signatureDate && (
            <p className="text-sm text-gray-500 mt-1">
              Firmado: {new Date(reception.signatureDate).toLocaleString("es-MX")}
            </p>
          )}
        </div>
      )}

      <div className="mt-12 pt-4 border-t">
        <h3 className="font-bold mb-2">Términos y Condiciones</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          El cliente acepta que el Centro de Servicio Multimarcas no se hace responsable por pérdida de datos
          durante la reparación. Los equipos no reclamados después de 30 días serán considerados abandonados.
          La garantía cubre únicamente la reparación realizada por un período de 30 días. No se cubren daños
          por mal uso, golpes o líquidos después de la entrega.
        </p>
      </div>

      <div className="mt-16 flex justify-between">
        <div className="text-center">
          <div className="border-t w-48 pt-2">
            <p className="text-sm">Firma del Cliente</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t w-48 pt-2">
            <p className="text-sm">Firma del Técnico</p>
          </div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `window.onload = function() { window.print(); }`,
        }}
      />
    </div>
  );
}
