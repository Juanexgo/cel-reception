/**
 * End-to-end verification of the reception flows against the live database.
 *
 * Exercises the same code paths the Server Actions use:
 *   - createReception (atomic folio + tracking token)
 *   - updateReceptionFields (edit)
 *   - status transitions (allowed + denied)
 *   - deliverReception (atomic delivery)
 *   - getTrackingTokenByFolio (public folio lookup)
 *   - getReceptionByTrackingToken (public tracking page payload)
 *   - getAllReceptions search
 *   - SMS mock invocation
 *
 * Cleans up its own test data at the end so the dashboard isn't polluted.
 */

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  createReception,
  deliverReception,
  getAllReceptions,
  getReceptionById,
  getReceptionByTrackingToken,
  getTrackingTokenByFolio,
  softDeleteReception,
  updateReceptionFields,
  updateReceptionStatus,
} from "../src/repositories/reception-repository";
import { isAllowedStatusTransition } from "../src/lib/validations";
import { notifyReadyForPickup } from "../src/services/sms";
import { getAuditLog } from "../src/repositories/audit-repository";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Audit log requires an actor on every mutating call. Use a null FK so we
// don't depend on a real user row for tests.
const TEST_ACTOR = {
  id: null,
  name: "Verification Script",
  email: "verify@local.test",
};

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.log(`  ❌ ${label}`, detail ?? "");
  }
}

async function main() {
  // ─────────────────────────────────────────────────────────────────────────
  // 0) Set up: a throwaway client we'll soft-delete at the end.
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== setup ===");
  const phone = `999${Math.floor(1_000_000 + Math.random() * 8_999_999)}`;
  const client = await prisma.client.create({
    data: {
      name: "TEST Cliente Verificación",
      phone,
      email: "test-verify@example.com",
    },
  });
  console.log(`  client created: ${client.id}`);

  // ─────────────────────────────────────────────────────────────────────────
  // 1, 2, 3) Create three receptions; folios should be REC-N consecutive.
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== flow 1-3: create receptions, sequential folios ===");
  const created: Awaited<ReturnType<typeof createReception>>[] = [];
  for (let i = 0; i < 3; i++) {
    const r = await createReception(
      {
        clientId: client.id,
        brand: "APPLE",
        model: `Test iPhone ${i}`,
        color: "Negro",
        problem: "Pantalla de prueba",
        accessories: "Ninguno",
        totalCost: 100 + i,
      },
      TEST_ACTOR
    );
    created.push(r);
    console.log(`  reception #${i + 1}: folio=${r.folio} folioNumber=${r.folioNumber} token=${r.trackingToken}`);
  }
  check(
    "folios match REC-${folioNumber} with no zero-padding",
    created.every((r) => r.folio === `REC-${r.folioNumber}` && !/^REC-0/.test(r.folio))
  );
  check(
    "folioNumber is strictly increasing",
    created[1].folioNumber > created[0].folioNumber &&
      created[2].folioNumber > created[1].folioNumber
  );
  check(
    "folioNumbers are consecutive (no gaps)",
    created[1].folioNumber === created[0].folioNumber + 1 &&
      created[2].folioNumber === created[1].folioNumber + 1
  );
  check(
    "tracking tokens unique and non-empty",
    new Set(created.map((r) => r.trackingToken)).size === 3 &&
      created.every((r) => r.trackingToken.startsWith("tok_"))
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 4) "Dashboard updates" — list query orders by folioNumber desc and
  //    finds the new receptions.
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== flow 4: list/dashboard order ===");
  const list = await getAllReceptions(client.name);
  const newest = list[0];
  check(
    "list returns newest first by folioNumber",
    list.length >= 3 && newest.folioNumber === created[2].folioNumber
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 5) Edit a reception.
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== flow 5: edit reception ===");
  await updateReceptionFields(
    {
      receptionId: created[0].id,
      color: "Plata editado",
      totalCost: 999,
    },
    TEST_ACTOR
  );
  const edited = await getReceptionById(created[0].id);
  check("edited color persisted", edited?.color === "Plata editado");
  check("edited totalCost persisted", edited?.totalCost === 999);
  check("non-edited fields preserved", edited?.problem === "Pantalla de prueba");

  // ─────────────────────────────────────────────────────────────────────────
  // 6) Status transitions: allowed + denied.
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== flow 6: status transitions ===");
  check(
    "RECEIVED → DIAGNOSING allowed",
    isAllowedStatusTransition("RECEIVED", "DIAGNOSING")
  );
  check(
    "DIAGNOSING → REPAIRING allowed",
    isAllowedStatusTransition("DIAGNOSING", "REPAIRING")
  );
  check(
    "DELIVERED → anything denied",
    !isAllowedStatusTransition("DELIVERED", "RECEIVED") &&
      !isAllowedStatusTransition("DELIVERED", "REPAIRING")
  );
  check(
    "CANCELLED → anything denied",
    !isAllowedStatusTransition("CANCELLED", "READY")
  );

  await updateReceptionStatus(
    {
      receptionId: created[0].id,
      status: "DIAGNOSING",
      notes: "test diagnose",
    },
    TEST_ACTOR
  );
  const afterStatus = await getReceptionById(created[0].id);
  check("status persisted on disk", afterStatus?.status === "DIAGNOSING");
  check(
    "statusHistory rows appended",
    (afterStatus?.statusHistory.length ?? 0) >= 2
  );

  await updateReceptionStatus(
    {
      receptionId: created[0].id,
      status: "READY",
      notes: "ready for pickup",
    },
    TEST_ACTOR
  );
  const ready = await getReceptionById(created[0].id);
  check("status moves to READY", ready?.status === "READY");

  // ─────────────────────────────────────────────────────────────────────────
  // 11) SMS in mock mode (no SMS_PROVIDER_API_KEY set).
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== flow 11: SMS mock mode ===");
  console.log(
    "  SMS_PROVIDER_API_KEY:",
    process.env.SMS_PROVIDER_API_KEY ? "<set>" : "<unset, mock>"
  );
  const smsOk = await notifyReadyForPickup(client.phone, ready!.folio, "iPhone X");
  check("SMS mock returns true", smsOk === true);
  check(
    "no real SMS keys configured",
    !process.env.SMS_PROVIDER_API_KEY ||
      process.env.SMS_PROVIDER_API_KEY === ""
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 7) Deliver with signature (atomic).
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== flow 7: deliver with signature ===");
  // 1×1 transparent PNG data URL (smallest valid signature payload).
  const fakeSignature =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=";
  await deliverReception(
    {
      receptionId: created[0].id,
      signatureData: fakeSignature,
      notes: "verification delivery",
    },
    TEST_ACTOR
  );
  const delivered = await getReceptionById(created[0].id);
  check("delivered status set", delivered?.status === "DELIVERED");
  check("signatureData stored", !!delivered?.signatureData);
  check("signatureDate set", !!delivered?.signatureDate);
  check(
    "DELIVERED row appended to history",
    delivered?.statusHistory.some((h) => h.status === "DELIVERED") ?? false
  );

  // ─────────────────────────────────────────────────────────────────────────
  // 8) Public QR tracking page payload.
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== flow 8: public QR tracking payload ===");
  const tracking = await getReceptionByTrackingToken(created[1].trackingToken);
  check("tracking lookup by token returns row", !!tracking);
  // 10) Sensitive data must NOT be present.
  const tracking_ = tracking as Record<string, unknown> | null;
  check("imei NOT exposed", tracking_ != null && !("imei" in tracking_));
  check("totalCost NOT exposed", tracking_ != null && !("totalCost" in tracking_));
  check("problem NOT exposed", tracking_ != null && !("problem" in tracking_));
  check("accessories NOT exposed", tracking_ != null && !("accessories" in tracking_));
  check(
    "signatureData NOT exposed",
    tracking_ != null && !("signatureData" in tracking_)
  );
  check(
    "client phone NOT exposed",
    tracking_ != null &&
      !(
        "phone" in (tracking_.client as Record<string, unknown>)
      )
  );
  // statusHistory entries should NOT include `notes`.
  const histAny = tracking?.statusHistory[0] as Record<string, unknown> | undefined;
  check("statusHistory.notes NOT exposed", !!histAny && !("notes" in histAny));

  // ─────────────────────────────────────────────────────────────────────────
  // 9) Search: by folio, by phone, by name.
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== flow 9: search ===");
  const byFolio = await getAllReceptions(created[2].folio);
  check("search by folio finds reception", byFolio.some((r) => r.id === created[2].id));
  const byPhone = await getAllReceptions(client.phone);
  check("search by phone finds reception", byPhone.some((r) => r.client.phone === client.phone));
  const byName = await getAllReceptions("TEST Cliente Verificación");
  check("search by client name finds reception", byName.length >= 3);

  // Public folio lookup returns ONLY the token.
  const tokenLookup = await getTrackingTokenByFolio(created[2].folio);
  const tokenLookup_ = tokenLookup as Record<string, unknown> | null;
  check("folio→token lookup works", tokenLookup?.trackingToken === created[2].trackingToken);
  check(
    "folio→token lookup exposes ONLY trackingToken",
    tokenLookup_ != null && Object.keys(tokenLookup_).length === 1
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Audit log: every mutation should have produced exactly one entry.
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== audit log ===");
  // Reception #0: CREATE, UPDATE, STATUS_CHANGE×2, DELIVER = 5 entries.
  const log0 = await getAuditLog(created[0].id);
  check("reception #0 has 5 audit entries", log0.length === 5);
  check("reception #0 has CREATE entry", log0.some((e) => e.action === "CREATE"));
  check("reception #0 has UPDATE entry", log0.some((e) => e.action === "UPDATE"));
  check(
    "reception #0 has 2 STATUS_CHANGE entries",
    log0.filter((e) => e.action === "STATUS_CHANGE").length === 2
  );
  check("reception #0 has DELIVER entry", log0.some((e) => e.action === "DELIVER"));
  check(
    "audit entries store actor name",
    log0.every((e) => e.userName === TEST_ACTOR.name)
  );
  check(
    "audit entries store actor email",
    log0.every((e) => e.userEmail === TEST_ACTOR.email)
  );
  check(
    "audit entries with null userId still render (system actor)",
    log0.every((e) => e.userId === null)
  );

  const create0 = log0.find((e) => e.action === "CREATE");
  const meta0 = create0?.metadata as Record<string, unknown> | null;
  check(
    "CREATE entry stores folio in metadata",
    meta0 !== null && meta0?.folio === created[0].folio
  );

  const status0 = log0.find((e) => e.action === "STATUS_CHANGE");
  const statusMeta = status0?.metadata as Record<string, unknown> | null;
  check(
    "STATUS_CHANGE entry stores from/to",
    !!statusMeta && typeof statusMeta.from === "string" && typeof statusMeta.to === "string"
  );

  const update0 = log0.find((e) => e.action === "UPDATE");
  const updateMeta = update0?.metadata as Record<string, unknown> | null;
  const changedFields = updateMeta?.changedFields as unknown[] | undefined;
  check(
    "UPDATE entry lists changed fields",
    Array.isArray(changedFields) && changedFields.includes("color") && changedFields.includes("totalCost")
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== cleanup ===");
  for (const r of created) {
    await softDeleteReception(r.id, TEST_ACTOR);
  }
  await prisma.client.update({
    where: { id: client.id },
    data: { phone: `${client.phone}-DEL-${Date.now()}` }, // free phone uniq for next run
  });
  console.log(`  ${created.length} test receptions soft-deleted, client phone freed`);

  console.log(`\n=== summary: ${pass} passed, ${fail} failed ===`);
  if (fail > 0) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
