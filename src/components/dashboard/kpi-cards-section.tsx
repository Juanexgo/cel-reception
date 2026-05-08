import {
  ClipboardList,
  Wrench,
  CheckCircle2,
  Truck,
  DollarSign,
  Timer,
  Receipt,
  Calendar,
} from "lucide-react";
import type { ReceptionStats } from "@/repositories/reception-repository";
import { KpiCard } from "./kpi-card";

/**
 * Headline metrics row. Cards collapse 1 → 2 → 4 columns by viewport.
 *
 * "Avg repair time" gracefully degrades when there are no DELIVERED rows yet
 * (avgRepairHours is null). We show "—" rather than 0h to be honest.
 */
export function KpiCardsSection({ stats }: { stats: ReceptionStats }) {
  const avgRepair = formatHours(stats.avgRepairHours);
  // 2-up on phones (8 cards in 4 rows of 2 — keeps scroll short while still
  // letting each card breathe), 4-up at md+, unchanged at lg.
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <KpiCard
        label="Total recepciones"
        value={stats.total.toLocaleString("es-MX")}
        helper={`${stats.todayCount} hoy`}
        icon={ClipboardList}
        tone="blue"
      />
      <KpiCard
        label="En reparación"
        value={stats.pendingActive.toLocaleString("es-MX")}
        helper="Recibido · Diagnóstico · Reparando"
        icon={Wrench}
        tone="amber"
      />
      <KpiCard
        label="Listo para entrega"
        value={stats.readyForPickup.toLocaleString("es-MX")}
        helper="Esperan al cliente"
        icon={CheckCircle2}
        tone="green"
      />
      <KpiCard
        label="Entregados hoy"
        value={stats.deliveredToday.toLocaleString("es-MX")}
        helper="Equipos liberados"
        icon={Truck}
        tone="slate"
      />
      <KpiCard
        label="Ingresos del mes"
        value={formatCurrency(stats.monthlyRevenue)}
        helper={`Total histórico ${formatCurrency(stats.totalRevenue)}`}
        icon={DollarSign}
        tone="green"
      />
      <KpiCard
        label="Tiempo medio de reparación"
        value={avgRepair}
        helper="Últimos 90 días"
        icon={Timer}
        tone="violet"
      />
      <KpiCard
        label="Ticket promedio"
        value={
          stats.paymentCount === 0
            ? "—"
            : formatCurrency(stats.avgTicketValue)
        }
        helper={`${stats.paymentCount} pagos`}
        icon={Receipt}
        tone="blue"
      />
      <KpiCard
        label="Reparaciones esta semana"
        value={stats.weekRepairsCompleted.toLocaleString("es-MX")}
        helper="Entregadas desde el lunes"
        icon={Calendar}
        tone="rose"
      />
    </div>
  );
}

function formatCurrency(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
}

function formatHours(hours: number | null): string {
  if (hours == null || Number.isNaN(hours) || hours <= 0) return "—";
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = hours / 24;
  return days < 10 ? `${days.toFixed(1)} d` : `${Math.round(days)} d`;
}
