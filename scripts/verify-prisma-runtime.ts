import "dotenv/config";
import { getReceptionStats } from "../src/repositories/reception-repository";

/**
 * Smoke test the full dashboard data path: this is the exact code path that
 * was throwing "Cannot read properties of undefined (reading 'findMany')"
 * because the running Prisma client lacked the freshly-added AuditLog model.
 */
getReceptionStats()
  .then((stats) => {
    console.log("✅ getReceptionStats succeeded");
    console.log("  total receptions:", stats.total);
    console.log("  recentAudits length:", stats.recentAudits.length);
    console.log("  brands top:", stats.brands.length);
    console.log("  weekly buckets:", stats.repairsPerWeek.length);
    console.log("  monthly buckets:", stats.monthlyRevenueSeries.length);
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ getReceptionStats failed:", e);
    process.exit(1);
  });
