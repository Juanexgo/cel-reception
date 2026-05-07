"use client";

import { useActionState } from "react";
import { createPaymentAction } from "@/actions/client-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const paymentMethods = [
  { value: "CASH", label: "Efectivo" },
  { value: "CARD", label: "Tarjeta" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "OTHER", label: "Otro" },
];

export function PaymentSection({
  receptionId,
  payments,
  totalCost,
  totalPaid,
}: {
  receptionId: string;
  payments: any[];
  totalCost: number;
  totalPaid: number;
}) {
  const [state, formAction, isPending] = useActionState(createPaymentAction, null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Costo Total</p>
              <p className="text-xl font-bold">${totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pagado</p>
              <p className="text-xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Restante</p>
              <p className="text-xl font-bold text-red-600">${(totalCost - totalPaid).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Pago</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="receptionId" value={receptionId} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input name="amount" type="number" step="0.01" required />
              </div>
              <div className="space-y-2">
                <Label>Método</Label>
                <Select name="method" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Concepto</Label>
              <Input name="concept" placeholder="Ej: Pago de reparación" required />
            </div>
            <div className="space-y-2">
              <Label>Referencia (opcional)</Label>
              <Input name="reference" placeholder="No. de transferencia, etc." />
            </div>
            {state?.error && <div className="text-sm text-red-500">{state.error}</div>}
            {state?.success && <div className="text-sm text-green-600">Pago registrado</div>}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Registrando..." : "Registrar Pago"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{payment.concept}</p>
                    <p className="text-sm text-gray-500">
                      {paymentMethods.find((m) => m.value === payment.method)?.label}
                      {payment.reference && ` • Ref: ${payment.reference}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${payment.amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(payment.createdAt).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
