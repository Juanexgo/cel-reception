"use client";

import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { saveSignatureAction } from "@/actions/reception-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

export function SignatureSection({
  receptionId,
  signatureData,
}: {
  receptionId: string;
  signatureData: string | null;
}) {
  const sigRef = useRef<SignatureCanvas>(null);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [recapturing, setRecapturing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Use ResizeObserver to keep the canvas crisp on container resizes.
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sig = sigRef.current;
    if (!sig) return;
    const canvas = sig.getCanvas();
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);
      sig.clear();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [recapturing]);

  const handleSave = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErrorMsg("Por favor capture la firma antes de guardar.");
      return;
    }
    setErrorMsg(null);
    setIsSaving(true);
    try {
      const dataURL = sigRef.current.toDataURL("image/png");
      const formData = new FormData();
      formData.append("receptionId", receptionId);
      formData.append("signatureData", dataURL);
      const result = await saveSignatureAction(null, formData);
      if (result && !result.success) {
        setErrorMsg(result.message);
        toast.error(result.message);
      } else {
        toast.success(result?.message ?? "Firma guardada");
        setRecapturing(false);
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar la firma";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    sigRef.current?.clear();
    setErrorMsg(null);
  };

  if (signatureData && !recapturing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Firma del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* base64 data URL — next/image cannot optimize this */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signatureData}
            alt="Firma del cliente"
            className="max-h-48 rounded-md border bg-white"
          />
          <p className="text-sm text-gray-500">Firma capturada y guardada.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecapturing(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Capturar de nuevo
          </Button>
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
        <p className="text-sm text-gray-500">
          Pida al cliente que firme con el dedo o un stylus dentro del cuadro.
        </p>
        <div ref={containerRef} className="overflow-hidden rounded-md border bg-white">
          <SignatureCanvas
            ref={sigRef}
            penColor="black"
            canvasProps={{ className: "block w-full h-48 touch-none" }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleClear} disabled={isSaving}>
            Limpiar
          </Button>
          {recapturing && (
            <Button
              variant="outline"
              onClick={() => {
                setRecapturing(false);
                setErrorMsg(null);
              }}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
            {isSaving ? "Guardando..." : "Guardar Firma"}
          </Button>
        </div>
        {errorMsg && (
          <p className="rounded-md bg-red-50 p-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {errorMsg}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
