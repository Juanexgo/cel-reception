"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useActionState } from "react";
import { saveSignatureAction } from "@/actions/reception-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SignatureSection({ receptionId, signatureData }: { receptionId: string; signatureData: string | null }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [state, formAction, isPending] = useActionState(saveSignatureAction, null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) return;
    const dataURL = sigRef.current.toDataURL();
    const formData = new FormData();
    formData.append("receptionId", receptionId);
    formData.append("signatureData", dataURL);
    await formAction(formData);
    setSaved(true);
  };

  const handleClear = () => {
    sigRef.current?.clear();
    setSaved(false);
  };

  if (signatureData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Firma del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <img src={signatureData} alt="Firma del cliente" className="border rounded-md max-h-48" />
          <p className="text-sm text-gray-500 mt-2">Firma capturada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capturar Firma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-md bg-white">
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{ className: "w-full h-48" }}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>
            Limpiar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar Firma"}
          </Button>
        </div>
        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        {saved && <p className="text-sm text-green-600">Firma guardada</p>}
      </CardContent>
    </Card>
  );
}
