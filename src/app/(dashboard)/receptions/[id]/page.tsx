import { getReceptionAction } from "@/actions/reception-actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusUpdateForm } from "@/components/receptions/status-update-form";
import { PaymentSection } from "@/components/receptions/payment-section";
import { SignatureSection } from "@/components/receptions/signature-section";
import { QRCode } from "@/components/receptions/qr-code";
import { CopyButton } from "@/components/receptions/copy-button";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BRAND_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

export default async function ReceptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reception = await getReceptionAction(id);

  if (!reception) notFound();

  const statusLabel = STATUS_LABELS[reception.status] ?? reception.status;
  const statusColor = STATUS_COLORS[reception.status] ?? STATUS_COLORS.RECEIVED;
  const totalPaid = reception.payments.reduce((sum, p) => sum + p.amount, 0);
  const trackingUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/track/${reception.trackingToken}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/receptions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{reception.folio}</h1>
              <Badge className={statusColor}>{statusLabel}</Badge>
            </div>
            <p className="text-gray-500">
              {new Date(reception.createdAt).toLocaleString("es-MX")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/receptions/${reception.id}/print`} target="_blank">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="timeline">Historial</TabsTrigger>
              <TabsTrigger value="payments">Pagos</TabsTrigger>
              <TabsTrigger value="signature">Firma</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="font-medium">{reception.client.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium">{reception.client.phone}</p>
                    </div>
                    {reception.client.email && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{reception.client.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dispositivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Marca</p>
                      <p className="font-medium">{BRAND_LABELS[reception.brand] ?? reception.brand}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Modelo</p>
                      <p className="font-medium">{reception.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Color</p>
                      <p className="font-medium">{reception.color}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">IMEI</p>
                      <p className="font-medium">{reception.imei || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Problema / Falla</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{reception.problem}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Accesorios Recibidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{reception.accessories}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tracking público (QR)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Comparta este código con el cliente para que consulte el
                    estado de su reparación sin necesidad de iniciar sesión.
                  </p>
                  <QRCode value={trackingUrl} />
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                    <p className="flex-1 break-all font-mono text-xs">{trackingUrl}</p>
                    <CopyButton text={trackingUrl} label="Copiar enlace" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Estados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reception.statusHistory.map((entry, i) => (
                      <div key={entry.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          {i < reception.statusHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 my-1" />
                          )}
                        </div>
                        <div className="pb-4">
                          <Badge className={STATUS_COLORS[entry.status] ?? ""}>
                            {STATUS_LABELS[entry.status] ?? entry.status}
                          </Badge>
                          {entry.notes && <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(entry.createdAt).toLocaleString("es-MX")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <PaymentSection
                receptionId={reception.id}
                payments={reception.payments}
                totalCost={reception.totalCost}
                totalPaid={totalPaid}
              />
            </TabsContent>

            <TabsContent value="signature" className="mt-4">
              <SignatureSection receptionId={reception.id} signatureData={reception.signatureData} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusUpdateForm receptionId={reception.id} currentStatus={reception.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Costo total</span>
                <span className="font-bold">${reception.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pagado</span>
                <span className="font-bold text-green-600">${totalPaid.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-gray-500">Restante</span>
                <span className="font-bold text-red-600">
                  ${(reception.totalCost - totalPaid).toFixed(2)}
                </span>
              </div>
              {reception.technician && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-500">Técnico</p>
                    <p className="font-medium">{reception.technician.name}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
