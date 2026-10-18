/**
 * One-off backfill: book the Invoice row for every wholesale dispatch that
 * never got one, and list the ones that got the wrong number.
 *
 * A wholesale dispatch allocated an INV-<customer>-NNN number onto
 * DispatchRecord.invoiceNumber but created no Invoice row — that only
 * happened client-side, when someone opened Payments → Wholesale Collections,
 * and InvoicesService.create then allocated a second, different number. So
 * until someone opened that page the sale was missing from Outstanding
 * Payments (which reads Invoice rows only), and once they did, the receivable
 * carried a number that isn't the one printed on the dispatch.
 *
 * DispatchService.create now books the Invoice in the same write under the
 * dispatch's own number; this fixes the rows from before that.
 *
 *   1. Missing invoices — every WHOLESALE dispatch with an invoiceNumber and a
 *      customer but no linked Invoice gets one: code = dispatch.invoiceNumber,
 *      dated and totalled from the dispatch, unpaid. Written with --apply.
 *
 *   2. Mismatched codes — every Invoice linked to a dispatch whose code differs
 *      from dispatch.invoiceNumber. Listed only. Those second numbers may
 *      already be on bills sent to customers or on payment receipts, so
 *      renaming them to the dispatch's number is a separate, deliberate step:
 *      --apply --fix-codes. Payments hang off Invoice.id, not the code, so a
 *      rename never orphans them — but past notifications and audit entries
 *      keep the old number as text.
 *
 * Safe to re-run: step 1 only touches dispatches with no invoice yet, step 2
 * only invoices whose code still differs. Any number already held by a
 * different invoice is reported and skipped, never overwritten.
 *
 *   npx ts-node prisma/backfill-dispatch-invoices.ts                      # dry run, writes nothing
 *   npx ts-node prisma/backfill-dispatch-invoices.ts --apply              # creates the missing invoices
 *   npx ts-node prisma/backfill-dispatch-invoices.ts --apply --fix-codes  # …and renames mismatched codes
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { DispatchType, PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const FIX_CODES = process.argv.includes("--fix-codes");

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "—");

async function main() {
  // Every invoice number already in use, so neither step can hand a number to
  // a second invoice (Invoice.code is unique; a clash would abort mid-run).
  const takenCodes = new Map(
    (
      await prisma.invoice.findMany({
        where: { code: { not: null } },
        select: { id: true, code: true },
      })
    ).map((i) => [i.code!, i.id]),
  );

  // ── 1. Wholesale dispatches with an invoice number but no Invoice row ──
  const missing = await prisma.dispatchRecord.findMany({
    where: {
      type: DispatchType.WHOLESALE,
      invoiceNumber: { not: null },
      customerId: { not: null },
      invoice: { is: null },
    },
    include: { customer: { select: { name: true } } },
    orderBy: { dispatchDate: "asc" },
  });

  const toCreate = missing.filter((d) => !takenCodes.has(d.invoiceNumber!));
  const createClashes = missing.filter((d) => takenCodes.has(d.invoiceNumber!));

  console.log(`\n1. ${missing.length} wholesale dispatch(es) with no Invoice row:`);
  if (missing.length) {
    console.table(
      missing.map((d) => ({
        invoice: d.invoiceNumber,
        customer: d.customer?.name ?? d.customerId,
        dispatched: day(d.dispatchDate),
        invoiceDate: day(d.invoiceDate ?? d.dispatchDate),
        due: day(d.paymentDueDate),
        total: Number(d.grandTotal),
        // A dispatch against a bulk order: that order may already appear in
        // Outstanding Payments in its own right — check before applying.
        bulkOrder: d.bulkOrderRef ?? "—",
        action: takenCodes.has(d.invoiceNumber!)
          ? "SKIP: number already used by another invoice"
          : "create",
      })),
    );
  }

  // ── 2. Invoices whose code differs from their dispatch's number ──
  const linked = await prisma.invoice.findMany({
    where: { dispatchId: { not: null } },
    include: {
      dispatch: { select: { invoiceNumber: true, dispatchDate: true } },
      customer: { select: { name: true } },
      _count: { select: { payments: true } },
    },
    orderBy: { invoiceDate: "asc" },
  });
  const mismatched = linked.filter(
    (i) => i.dispatch?.invoiceNumber && i.code !== i.dispatch.invoiceNumber,
  );

  const renameBlocked = (i: (typeof mismatched)[number]) => {
    const holder = takenCodes.get(i.dispatch!.invoiceNumber!);
    return holder !== undefined && holder !== i.id;
  };

  console.log(`\n2. ${mismatched.length} invoice(s) whose number differs from their dispatch's:`);
  if (mismatched.length) {
    console.table(
      mismatched.map((i) => ({
        invoiceCode: i.code ?? "(none)",
        dispatchNumber: i.dispatch!.invoiceNumber,
        customer: i.customer.name,
        dispatched: day(i.dispatch!.dispatchDate),
        total: Number(i.total),
        paid: Number(i.paid),
        payments: i._count.payments,
        status: i.status,
        rename: renameBlocked(i) ? "BLOCKED: dispatch number used by another invoice" : "possible",
      })),
    );
  }

  if (!APPLY) {
    console.log(
      `\nDry run — nothing written. Would create ${toCreate.length} invoice(s)` +
        (createClashes.length ? `, skip ${createClashes.length} with a clashing number` : "") +
        `.${mismatched.length ? ` ${mismatched.length} mismatched code(s) listed above; renaming them needs --apply --fix-codes.` : ""}`,
    );
    return;
  }

  let created = 0;
  for (const d of toCreate) {
    await prisma.invoice.create({
      data: {
        code: d.invoiceNumber!,
        customerId: d.customerId!,
        // invoiceDate is always set alongside invoiceNumber; the dispatch date
        // is only a guard so no row is ever dated to the day of this backfill.
        invoiceDate: d.invoiceDate ?? d.dispatchDate,
        dueDate: d.paymentDueDate,
        total: d.grandTotal,
        dispatchId: d.id,
      },
    });
    takenCodes.set(d.invoiceNumber!, d.id);
    created++;
  }
  console.log(
    `\nCreated ${created} invoice(s); skipped ${createClashes.length} with a clashing number.`,
  );

  if (!FIX_CODES) {
    if (mismatched.length) {
      console.log(
        `${mismatched.length} mismatched code(s) left as they are — re-run with --fix-codes to rename.`,
      );
    }
    return;
  }

  let renamed = 0;
  let blocked = 0;
  for (const i of mismatched) {
    if (renameBlocked(i)) {
      blocked++;
      continue;
    }
    const code = i.dispatch!.invoiceNumber!;
    await prisma.invoice.update({ where: { id: i.id }, data: { code } });
    if (i.code) takenCodes.delete(i.code);
    takenCodes.set(code, i.id);
    console.log(`Renamed ${i.code ?? i.id} → ${code}`);
    renamed++;
  }
  console.log(`Renamed ${renamed} invoice code(s); ${blocked} blocked by a clashing number.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
