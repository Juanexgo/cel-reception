import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDashboardStatsAction } from "@/actions/reception-actions";
import { KpiCardsSection } from "@/components/dashboard/kpi-cards-section";
import { StatusOverview } from "@/components/dashboard/status-overview";
import { RecentReceptionsCard } from "@/components/dashboard/recent-receptions-card";
import { NeedsAttentionCard } from "@/components/dashboard/needs-attention-card";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { ActivityFeedCard } from "@/components/dashboard/activity-feed-card";
import { BrandStatsCard } from "@/components/dashboard/brand-stats-card";
import { RepairsPerWeekChart } from "@/components/dashboard/repairs-per-week-chart";
import { MonthlyRevenueChart } from "@/components/dashboard/monthly-revenue-chart";

/**
 * Dashboard page.
 *
 * Single Server Component fetch (`getDashboardStatsAction`) hydrates every
 * widget. Sub-components are split into `src/components/dashboard/*` so this
 * page stays a thin layout file.
 *
 * Layout reasoning:
 *   - 8 KPI cards on top: scannable at-a-glance summary (matches a typical
 *     SaaS dashboard intro).
 *   - 2-column main grid below: charts on the left (where the eye lingers),
 *     "needs attention" + activity on the right (operational column).
 *   - Footer row: status distribution, recent receptions, brand mix, quick
 *     actions — depending on viewport, they reflow to a single column.
 */
export default async function DashboardPage() {
  const stats = await getDashboardStatsAction();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Dashboard
          </h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            Resumen del centro de servicio · {today()}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/receptions">
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/receptions/new">
              <Plus className="mr-2 h-4 w-4" />
              <span className="truncate">Nueva</span>
            </Link>
          </Button>
        </div>
      </header>

      <KpiCardsSection stats={stats} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RepairsPerWeekChart data={stats.repairsPerWeek} />
          <MonthlyRevenueChart data={stats.monthlyRevenueSeries} />
          <RecentReceptionsCard items={stats.recentReceptions} />
        </div>
        <div className="space-y-6">
          <QuickActionsCard />
          <NeedsAttentionCard stats={stats} />
          <ActivityFeedCard entries={stats.recentAudits} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatusOverview statusCounts={stats.statusCounts} />
        <BrandStatsCard brands={stats.brands} />
      </div>
    </div>
  );
}

function today(): string {
  return new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
