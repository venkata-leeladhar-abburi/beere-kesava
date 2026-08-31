/**
 * StatementOfAccountDocument — design-system/07-DOCUMENTS.md Part H.6.
 * ═══════════════════════════════════════════════════════════════════════════
 * Sixth and last of the six document types, and the most structurally
 * different: a ledger (Date/Particulars/Ref/Debit/Credit/Balance), not an
 * itemised sale. Opening balance is rendered as the first table row so it
 * repeats correctly on every printed page via `table-header-group` — Part
 * K's "balance carried forward on every break" is what that buys for free.
 */
import { DocumentPage } from "./DocumentPage";
import { Letterhead, type LetterheadFirm } from "./Letterhead";
import { PartyBlock, type MetaField } from "./PartyBlock";
import { formatPaise } from "../../../lib/gst";

export interface LedgerEntry {
  date: string;
  particulars: string;
  ref?: string;
  debitPaise?: number;
  creditPaise?: number;
}

export interface AgeingBucket {
  label: string;
  amountPaise: number;
}

export interface StatementOfAccountDocumentProps {
  statementNumber: string;
  generatedDate: string;
  periodFrom: string;
  periodTo: string;
  firm: LetterheadFirm;
  party: { name: string; address?: string; gstin?: string };
  openingBalancePaise: number;
  entries: LedgerEntry[];
  ageing?: AgeingBucket[];
  pageInfo?: { page: number; of: number };
}

export function StatementOfAccountDocument({
  statementNumber, generatedDate, periodFrom, periodTo, firm, party,
  openingBalancePaise, entries, ageing, pageInfo,
}: StatementOfAccountDocumentProps) {
  // Running balance computed once, top to bottom — debit increases what the
  // party owes, credit reduces it, matching the accounts-receivable
  // convention (this statement is issued BY the firm TO the party).
  let running = openingBalancePaise;
  const rows = entries.map(e => {
    running = running + (e.debitPaise ?? 0) - (e.creditPaise ?? 0);
    return { ...e, balancePaise: running };
  });
  const closingBalancePaise = running;
  const totalDebit = entries.reduce((s, e) => s + (e.debitPaise ?? 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (e.creditPaise ?? 0), 0);

  const meta: MetaField[] = [
    { label: "Statement No", value: statementNumber, code: true },
    { label: "Generated", value: generatedDate },
    { label: "Period", value: `${periodFrom} – ${periodTo}` },
  ];

  return (
    <DocumentPage
      pageInfo={pageInfo}
      band={<Letterhead firm={firm} title="Statement of Account" documentNumber={statementNumber} />}
    >
      <PartyBlock
        parties={[{ label: "Statement For", name: party.name, address: party.address, gstin: party.gstin }]}
        meta={meta}
      />

      <table className="bk-doc__table" style={{ marginTop: "5mm" }}>
        <thead>
          <tr>
            <th style={{ width: "20mm" }}>Date</th>
            <th style={{ width: "70mm" }}>Particulars</th>
            <th style={{ width: "24mm" }}>Ref</th>
            <th data-num style={{ width: "24mm" }}>Debit</th>
            <th data-num style={{ width: "24mm" }}>Credit</th>
            <th data-num style={{ width: "28mm" }}>Balance</th>
          </tr>
          {/* Opening Balance lives inside the SAME <thead> as the column
              headers — a table can only have one, and only <thead> repeats
              across printed pages via table-header-group (Part J). That's
              what actually satisfies Part K's "balance carried forward on
              every break," rather than a <tbody> row that would print once
              on page 1 and never again. */}
          <tr style={{ fontWeight: 700, background: "var(--doc-warm)" }}>
            <td colSpan={5} style={{ padding: "1.9mm 2.5mm", color: "var(--doc-ink)", textTransform: "none", letterSpacing: "normal", fontSize: "var(--doc-table)" }}>Balance Brought Forward</td>
            <td data-num style={{ padding: "1.9mm 2.5mm", color: "var(--doc-ink)", fontSize: "var(--doc-table)" }}>{formatPaise(openingBalancePaise)}</td>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            // StatementRow has no unique id and `ref` is optional/often blank, so fall back
            // to a composite of its visible fields plus index to distinguish identical rows.
            // eslint-disable-next-line react/no-array-index-key
            <tr key={`${r.date}-${r.particulars}-${r.ref ?? ""}-${i}`}>
              <td>{r.date}</td>
              <td>{r.particulars}</td>
              <td style={{ fontFamily: "var(--font-code)" }}>{r.ref || "—"}</td>
              <td data-num>{r.debitPaise ? formatPaise(r.debitPaise) : "—"}</td>
              <td data-num>{r.creditPaise ? formatPaise(r.creditPaise) : "—"}</td>
              <td data-num style={{ fontWeight: 600 }}>{formatPaise(r.balancePaise)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700 }}>
            <td colSpan={3}>Totals</td>
            <td data-num>{formatPaise(totalDebit)}</td>
            <td data-num>{formatPaise(totalCredit)}</td>
            <td data-num>{formatPaise(closingBalancePaise)}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: "5mm", display: "flex", justifyContent: "flex-end" }}>
        <div className="bk-doc__totals-card" style={{ width: "70mm" }}>
          <div className="bk-doc__totals-grand" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3.2mm 4mm" }}>
            <span style={{ fontSize: "var(--doc-body)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.10em" }}>Closing Balance</span>
            <span style={{ fontSize: "var(--doc-total)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{formatPaise(closingBalancePaise)}</span>
          </div>
        </div>
      </div>

      {ageing && ageing.length > 0 && (
        <table className="bk-doc__table bk-doc__tax-summary" style={{ marginTop: "5mm" }}>
          <thead>
            <tr>
              {ageing.map(b => <th key={b.label} data-num={b.label !== ageing[0].label || undefined}>{b.label}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              {ageing.map(b => <td key={b.label} data-num>{formatPaise(b.amountPaise)}</td>)}
            </tr>
          </tbody>
        </table>
      )}
    </DocumentPage>
  );
}
