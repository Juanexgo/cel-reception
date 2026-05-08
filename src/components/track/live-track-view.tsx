"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone } from "lucide-react";
import { BRAND_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { getPublicTrackingAction } from "@/actions/reception-actions";

// Polling cadence (ms). Kept short enough to feel "live" without hammering the
// DB. The page also pauses polling when the tab is hidden (visibility API).
const POLL_INTERVAL_MS = 8000;

export type PublicTrackingReception = NonNullable<
  Awaited<ReturnType<typeof getPublicTrackingAction>>
>;

export function LiveTrackView({
  token,
  initialReception,
}: {
  token: string;
  initialReception: PublicTrackingReception;
}) {
  const [reception, setReception] = useState<PublicTrackingReception>(initialReception);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isFetching, setIsFetching] = useState(false);
  // Avoid setState on unmounted component if a slow request resolves late.
  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!aliveRef.current) return;
    setIsFetching(true);
    try {
      const next = await getPublicTrackingAction(token);
      if (!aliveRef.current) return;
      if (next) {
        setReception(next);
        setLastUpdated(new Date());
      }
    } catch (err) {
      // Network/server hiccup — just skip this tick. Next interval will retry.
      console.error("[track] refresh failed", err);
    } finally {
      if (aliveRef.current) setIsFetching(false);
    }
  }, [token]);

  useEffect(() => {
    aliveRef.current = true;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (intervalId) return;
      intervalId = setInterval(refresh, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        // Refresh immediately on tab focus so the user sees the latest state.
        refresh();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      aliveRef.current = false;
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [refresh]);

  const statusLabel = STATUS_LABELS[reception.status] ?? reception.status;
  const statusColor = STATUS_COLORS[reception.status] ?? STATUS_COLORS.RECEIVED;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl">Centro de Servicio Multimarcas</CardTitle>
          <p className="text-gray-500">Estado de tu reparación</p>
          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="relative inline-flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${
                  isFetching ? "animate-ping opacity-75" : "opacity-0"
                }`}
              />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>
              En vivo · actualizado{" "}
              {lastUpdated.toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">Folio</p>
            <p className="text-2xl font-bold font-mono">{reception.folio}</p>
          </div>

          <div className="text-center">
            <Badge className={`${statusColor} text-base px-4 py-1`}>{statusLabel}</Badge>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Dispositivo</span>
              <span className="font-medium">
                {BRAND_LABELS[reception.brand] ?? reception.brand} {reception.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Color</span>
              <span className="font-medium">{reception.color}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fecha de ingreso</span>
              <span className="font-medium">
                {new Date(reception.createdAt).toLocaleDateString("es-MX")}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Historial</h3>
            <div className="space-y-3">
              {reception.statusHistory.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        i === reception.statusHistory.length - 1 ? "bg-primary" : "bg-gray-300"
                      }`}
                    />
                    {i < reception.statusHistory.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="pb-3">
                    <Badge
                      className={
                        STATUS_COLORS[entry.status] ?? "bg-gray-100 text-gray-800"
                      }
                    >
                      {STATUS_LABELS[entry.status] ?? entry.status}
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(entry.createdAt).toLocaleString("es-MX")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-gray-400 pt-4 border-t">
            <p>Centro de Servicio Multimarcas</p>
            <p>Si tienes dudas, contacta al centro de servicio</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
