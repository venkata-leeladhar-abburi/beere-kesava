import React, { useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Building2, FileText, Info, Wallet, X } from "lucide-react";
import type {
  FirmDocument,
  FirmDocumentType,
  FirmPayment,
  FirmSettlement,
} from "../../../shared/api/firms";
import type { FinancialEntry, MiscEntry } from "../contexts/FirmsContext";
import { T, F } from "./theme";
import { fmtFull } from "./utils";
import { IconButton, StatusPill, type StatusTone } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";
import { formatDate } from "../../../shared/ui/date";
import { calendarDay, parseISODay } from "@/lib/date";

/**
 * The "where did this number come from" views behind a firm's ledger: one
 * document and every payment that settled it, one payment and every document
 * it paid for, and the rows behind each summary card. All three read the same
 * settlements the backend works out (supplier-allocation.ts), so a document
 * that shows Settled here can always be traced to the payment that settled it.
 */

export const DOC_LABEL: Record<FirmDocumentType, string> = {
  PURCHASE_ORDER: "Purchase Order",
  GOODS_RECEIPT: "Goods Receipt",
  EXTERNAL_PURCHASE: "External Purchase",
  DISPATCH_INVOICE: "Dispatch / Invoice",
};

export const PAYMENT_LABEL: Record<FirmPayment["type"], string> = {
  WEAVER: "Weaver Payment",
  VENDOR: "Vendor Payment",
  SUPPLIER: "Supplier Payment",
  INVOICE: "Customer Receipt",
  RETAIL_SALE: "Retail Sale",
};

export const DOC_STATUS: Record<FirmDocument["status"], { tone: StatusTone; label: string }> = {
  PENDING: { tone: "warning", label: "Pending" },
  PARTIAL: { tone: "info", label: "Part paid" },
  PAID: { tone: "success", label: "Settled" },
};

/** "2026-10-24" → "24 Oct 2026". */
export function fmtDay(day: string): string {
  if (!day) return "—";
  return formatDate(parseISODay(calendarDay(day)), "cell") || day;
}

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 13 };
const label: React.CSSProperties = {
  fontFamily: F.ui,
  fontSize: 11,
  color: T.taupe,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

function ModalHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <div
      style={{
        background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`,
        padding: "20px 28px",
        paddingRight: 56,
        position: "relative",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color="#FFFDF9" />
      </div>
      <div style={{ minWidth: 0 }}>
        <Dialog.Title asChild>
          <div
            style={{
              fontFamily: F.display,
              fontSize: 18,
              fontWeight: 700,
              color: "#FFFDF9",
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
        </Dialog.Title>
        <Dialog.Description asChild>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
            {subtitle}
          </div>
        </Dialog.Description>
      </div>
      <Dialog.Close asChild>
        <IconButton
          icon={X}
          label="Close"
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 rounded-[8px] bg-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.85)] hover:bg-[rgba(255,255,255,0.20)]"
        />
      </Dialog.Close>
    </div>
  );
}

export function FigureTiles({
  tiles,
}: {
  tiles: { label: string; value: React.ReactNode; color: string; hint?: string }[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 10,
        marginBottom: 18,
      }}
    >
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            background: T.bgGold,
            border: `1px solid ${T.borderGold}`,
            borderRadius: 10,
            padding: "11px 14px",
          }}
        >
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 3 }}>
            {t.label}
          </div>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: t.color }}>
            {t.value}
          </div>
          {t.hint && (
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 2 }}>
              {t.hint}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Fact({ name, value }: { name: string; value: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={label}>{name}</div>
      <div
        style={{
          fontFamily: F.ui,
          fontSize: 13,
          fontWeight: 600,
          color: T.luxuryBrown,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        background: T.bgGold,
        border: `1px solid ${T.borderGold}`,
        borderRadius: 10,
        padding: "10px 12px",
        fontFamily: F.ui,
        fontSize: 12,
        color: T.taupe,
        lineHeight: 1.6,
        marginBottom: 14,
      }}
    >
      <Info size={14} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: F.ui,
        fontSize: 13,
        fontWeight: 700,
        color: T.luxuryBrown,
        margin: "4px 0 8px",
      }}
    >
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: F.ui,
        fontSize: 12,
        color: T.taupe,
        fontStyle: "italic",
        textAlign: "center",
        padding: "14px 0",
        border: `1px dashed ${T.borderMed}`,
        borderRadius: 10,
      }}
    >
      {children}
    </div>
  );
}

/** Each payment's share of one document. */
export function SettlementList({
  settlements,
  firmId,
}: {
  settlements: FirmSettlement[];
  /** The firm whose page this is — payments from any other firm are called out. */
  firmId: string;
}) {
  if (settlements.length === 0) return <Empty>Nothing has been paid against this yet.</Empty>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {settlements.map((s) => (
        <div
          key={s.paymentId}
          style={{
            border: `1px solid ${T.borderDef}`,
            borderLeft: `4px solid ${T.green}`,
            borderRadius: 10,
            padding: "10px 14px",
            background: "#FFFFFF",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 10,
          }}
        >
          <Fact
            name="Payment"
            value={<span style={{ ...mono, color: T.royalBurgundy }}>{s.paymentId}</span>}
          />
          <Fact name="Paid on" value={fmtDay(s.date)} />
          <Fact
            name="Amount applied"
            value={<span style={{ ...mono, color: T.green }}>{fmtFull(s.amount)}</span>}
          />
          <Fact name="Mode / UTR" value={`${s.method ?? "—"}${s.utr ? ` · ${s.utr}` : ""}`} />
          <Fact
            name="Paid from"
            value={
              <span
                style={{
                  color: s.fromFirmId && s.fromFirmId !== firmId ? T.antiqueGold : undefined,
                }}
              >
                {s.fromFirmName ?? "Firm not specified"}
              </span>
            }
          />
          <Fact
            name="How"
            value={s.appliedAs === "LINKED" ? "Paid against this bill" : "From a general payment"}
          />
        </div>
      ))}
    </div>
  );
}

export function DocumentDetailModal({
  doc,
  firmId,
  onClose,
}: {
  doc: FirmDocument;
  firmId: string;
  onClose: () => void;
}) {
  const income = doc.direction === "INCOME";
  const general = doc.settlements.some((s) => s.appliedAs === "GENERAL");
  const otherFirm = doc.settlements.some((s) => s.fromFirmId && s.fromFirmId !== firmId);
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="lg">
      <ModalHeader
        icon={FileText}
        title={doc.reference}
        subtitle={`${DOC_LABEL[doc.type]} · ${doc.party} · ${fmtDay(doc.date)}`}
      />
      <div style={{ padding: "20px 28px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
        <FigureTiles
          tiles={[
            { label: "Amount", value: fmtFull(doc.amount), color: T.luxuryBrown },
            {
              label: income ? "Collected" : "Paid",
              value: fmtFull(doc.paidAmount),
              color: doc.paidAmount > 0 ? T.green : T.taupe,
            },
            {
              label: income ? "Yet to collect" : "Balance due",
              value: doc.outstanding > 0 ? fmtFull(doc.outstanding) : "Settled ✓",
              color: doc.outstanding > 0 ? T.crimson : T.green,
            },
            {
              label: "Status",
              value: (
                <StatusPill
                  tone={DOC_STATUS[doc.status].tone}
                  label={DOC_STATUS[doc.status].label}
                  size="sm"
                />
              ),
              color: T.luxuryBrown,
            },
          ]}
        />
        {(general || otherFirm) && (
          <Note>
            {general &&
              "Part of this was settled by a general payment — one recorded against no particular bill, which is applied to the oldest unpaid bills first. "}
            {otherFirm && "Some of the money came from a different firm, shown in amber below."}
          </Note>
        )}
        <SectionTitle>
          {income ? "Collections" : "Payments"} against this {DOC_LABEL[doc.type].toLowerCase()} (
          {doc.settlements.length})
        </SectionTitle>
        <SettlementList settlements={doc.settlements} firmId={firmId} />
      </div>
    </Modal>
  );
}

export function PaymentDetailModal({
  payment,
  firmId,
  firmName,
  onClose,
}: {
  payment: FirmPayment;
  firmId: string;
  firmName: string;
  onClose: () => void;
}) {
  const income = payment.direction === "INCOME";
  const applied = payment.appliedTo.reduce((s, a) => s + a.amount, 0);
  const elsewhere = payment.appliedTo.filter(
    (a) => a.documentFirmId && a.documentFirmId !== firmId
  );
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="lg">
      <ModalHeader
        icon={Wallet}
        title={`${income ? "+" : "−"}${fmtFull(payment.amount)} · ${payment.party}`}
        subtitle={`${PAYMENT_LABEL[payment.type]} · ${fmtDay(payment.date)}`}
      />
      <div style={{ padding: "20px 28px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            border: `1px solid ${T.borderDef}`,
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 16,
            background: "#FFFFFF",
          }}
        >
          <Fact name="Payment ID" value={<span style={mono}>{payment.id}</span>} />
          <Fact name="Date" value={fmtDay(payment.date)} />
          <Fact name="Mode" value={payment.method ?? "—"} />
          <Fact name="UTR / Reference" value={payment.utr ?? "—"} />
          <Fact name={income ? "Received by" : "Paid from"} value={firmName} />
          <Fact name="Category" value={payment.category} />
          <Fact name="Recorded by" value={payment.recordedBy ?? "—"} />
        </div>

        {elsewhere.length > 0 && (
          <Note>
            This money left <strong>{firmName}</strong>, but{" "}
            {fmtFull(elsewhere.reduce((s, a) => s + a.amount, 0))} of it settled bills booked to{" "}
            {[...new Set(elsewhere.map((a) => a.documentFirmName ?? "another firm"))].join(", ")}.
            It counts as an expense here; those bills show as paid on their own firm&rsquo;s page.
          </Note>
        )}
        {payment.unapplied > 0 && (
          <Note>
            {fmtFull(payment.unapplied)} of this is more than was owed at the time — it is held as
            an advance and will settle the next bill raised with {payment.party}.
          </Note>
        )}

        <SectionTitle>
          {income ? "Applied to" : "What this paid for"} ({payment.appliedTo.length})
        </SectionTitle>
        {payment.appliedTo.length === 0 ? (
          <Empty>
            {payment.type === "RETAIL_SALE"
              ? "A counter sale — paid at the till, no bill to settle."
              : "Not tied to any document."}
          </Empty>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {payment.appliedTo.map((a) => {
              const other = a.documentFirmId && a.documentFirmId !== firmId;
              return (
                <div
                  key={a.documentRef}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    border: `1px solid ${T.borderDef}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    background: "#FFFFFF",
                  }}
                >
                  <ArrowRight size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      ...mono,
                      fontWeight: 700,
                      color: T.royalBurgundy,
                      flex: 1,
                      minWidth: 160,
                    }}
                  >
                    {a.documentRef}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontFamily: F.ui,
                      fontSize: 12,
                      color: other ? T.antiqueGold : T.taupe,
                    }}
                  >
                    <Building2 size={12} /> {a.documentFirmName ?? "No firm on bill"}
                  </span>
                  <span
                    style={{
                      ...mono,
                      fontWeight: 700,
                      color: T.green,
                      minWidth: 96,
                      textAlign: "right",
                    }}
                  >
                    {fmtFull(a.amount)}
                  </span>
                </div>
              );
            })}
            {payment.appliedTo.length > 1 && (
              <div style={{ ...mono, textAlign: "right", color: T.taupe, fontSize: 12 }}>
                Total applied {fmtFull(applied)}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export type BreakdownKind = "income" | "expense" | "net" | "receivable" | "payable";

interface BreakdownLine {
  key: string;
  date: string;
  title: string;
  sub: string;
  group: string;
  amount: number;
  onOpen?: () => void;
}

/**
 * The rows behind one summary card, grouped by category (or, for what is
 * owed, by party) — so every card can be checked line by line.
 */
export function BreakdownModal({
  kind,
  payments,
  documents,
  manualIncome,
  manualExpenses,
  manualMisc,
  onClose,
  onOpenPayment,
  onOpenDocument,
}: {
  kind: BreakdownKind;
  payments: FirmPayment[];
  documents: FirmDocument[];
  manualIncome: FinancialEntry[];
  manualExpenses: FinancialEntry[];
  manualMisc: MiscEntry[];
  onClose: () => void;
  onOpenPayment: (p: FirmPayment) => void;
  onOpenDocument: (d: FirmDocument) => void;
}) {
  const sections = useMemo(() => {
    const paymentLines = (dir: "INCOME" | "EXPENSE"): BreakdownLine[] =>
      payments
        .filter((p) => p.direction === dir)
        .map((p) => ({
          key: `p-${p.type}-${p.id}`,
          date: p.date,
          title: `${p.party} · ${p.id}`,
          sub: `${PAYMENT_LABEL[p.type]}${p.method ? ` · ${p.method}` : ""}${
            p.appliedTo.length ? ` · for ${p.appliedTo.map((a) => a.documentRef).join(", ")}` : ""
          }`,
          group: p.category,
          amount: p.amount,
          onOpen: () => onOpenPayment(p),
        }));
    const manualLines = (entries: FinancialEntry[]): BreakdownLine[] =>
      entries.map((e) => ({
        key: `m-${e.id}`,
        date: calendarDay(e.date),
        title: e.description,
        sub: "Manual entry",
        group: `${e.category} (manual)`,
        amount: e.amount,
      }));
    const miscLines = (type: "income" | "expense"): BreakdownLine[] =>
      manualMisc
        .filter((m) => m.type === type)
        .map((m) => ({
          key: `x-${m.id}`,
          date: calendarDay(m.date),
          title: m.description,
          sub: "Miscellaneous (manual)",
          group: "Miscellaneous",
          amount: m.amount,
        }));
    const docLines = (dir: "INCOME" | "EXPENSE"): BreakdownLine[] =>
      documents
        .filter((d) => d.direction === dir && d.outstanding > 0)
        .map((d) => ({
          key: `d-${d.type}-${d.id}`,
          date: d.date,
          title: d.reference,
          sub: `${DOC_LABEL[d.type]} · ${fmtFull(d.amount)} raised, ${fmtFull(d.paidAmount)} ${
            dir === "INCOME" ? "collected" : "paid"
          }`,
          group: d.party,
          amount: d.outstanding,
          onOpen: () => onOpenDocument(d),
        }));

    const income = [
      ...paymentLines("INCOME"),
      ...manualLines(manualIncome),
      ...miscLines("income"),
    ];
    const expense = [
      ...paymentLines("EXPENSE"),
      ...manualLines(manualExpenses),
      ...miscLines("expense"),
    ];
    switch (kind) {
      case "income":
        return [{ heading: "Money received", sign: 1, lines: income }];
      case "expense":
        return [{ heading: "Money paid out", sign: -1, lines: expense }];
      case "net":
        return [
          { heading: "Money received", sign: 1, lines: income },
          { heading: "Money paid out", sign: -1, lines: expense },
        ];
      case "receivable":
        return [{ heading: "Still to collect, by customer", sign: 1, lines: docLines("INCOME") }];
      case "payable":
        return [{ heading: "Still to pay, by party", sign: -1, lines: docLines("EXPENSE") }];
    }
  }, [
    kind,
    payments,
    documents,
    manualIncome,
    manualExpenses,
    manualMisc,
    onOpenPayment,
    onOpenDocument,
  ]);

  const title = {
    income: "Income Received",
    expense: "Expenses Paid",
    net: "Net Balance",
    receivable: "Receivable",
    payable: "Payable",
  }[kind];
  const total = sections.reduce(
    (s, sec) => s + sec.sign * sec.lines.reduce((a, l) => a + l.amount, 0),
    0
  );
  const committed = kind === "receivable" || kind === "payable";

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="lg">
      <ModalHeader
        icon={Wallet}
        title={`${title} · ${fmtFull(kind === "net" ? total : Math.abs(total))}`}
        subtitle={
          committed
            ? "Open documents and what is still owed on each — click one to see its payments"
            : "Every payment and entry behind this figure, for the filters you have set"
        }
      />
      <div style={{ padding: "20px 28px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
        {sections.map((sec) => {
          const groups = new Map<string, BreakdownLine[]>();
          for (const l of [...sec.lines].sort((a, b) => b.date.localeCompare(a.date))) {
            groups.set(l.group, [...(groups.get(l.group) ?? []), l]);
          }
          const secTotal = sec.lines.reduce((a, l) => a + l.amount, 0);
          return (
            <div key={sec.heading} style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  borderBottom: `2px solid ${T.borderGold}`,
                  paddingBottom: 6,
                  marginBottom: 10,
                }}
              >
                <span
                  style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}
                >
                  {sec.heading}
                </span>
                <span
                  style={{ ...mono, fontWeight: 700, color: sec.sign > 0 ? T.green : T.crimson }}
                >
                  {sec.sign > 0 ? "+" : "−"}
                  {fmtFull(secTotal)}
                </span>
              </div>
              {sec.lines.length === 0 ? (
                <Empty>Nothing here for the current filters.</Empty>
              ) : (
                [...groups].map(([group, lines]) => (
                  <div key={group} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: F.ui,
                        fontSize: 12,
                        fontWeight: 700,
                        color: T.taupe,
                        marginBottom: 6,
                      }}
                    >
                      <span>
                        {group} · {lines.length}
                      </span>
                      <span style={mono}>{fmtFull(lines.reduce((a, l) => a + l.amount, 0))}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {lines.map((l) => (
                        <BreakdownRow key={l.key} line={l} positive={sec.sign > 0} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function BreakdownRow({ line, positive }: { line: BreakdownLine; positive: boolean }) {
  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    border: `1px solid ${T.borderDef}`,
    borderRadius: 10,
    padding: "9px 12px",
    background: "#FFFFFF",
    textAlign: "left",
    width: "100%",
  };
  const body = (
    <>
      <span style={{ ...mono, fontSize: 12, color: T.taupe, minWidth: 92 }}>
        {fmtDay(line.date)}
      </span>
      <span style={{ flex: 1, minWidth: 160 }}>
        <span
          style={{
            display: "block",
            fontFamily: F.ui,
            fontSize: 13,
            fontWeight: 600,
            color: T.luxuryBrown,
            wordBreak: "break-word",
          }}
        >
          {line.title}
        </span>
        <span style={{ display: "block", fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          {line.sub}
        </span>
      </span>
      <span style={{ ...mono, fontWeight: 700, color: positive ? T.green : T.crimson }}>
        {fmtFull(line.amount)}
      </span>
    </>
  );
  return line.onOpen ? (
    <button
      type="button"
      onClick={line.onOpen}
      className="hover:bg-[rgba(200,155,71,0.08)]"
      style={{ ...style, cursor: "pointer" }}
    >
      {body}
    </button>
  ) : (
    <div style={style}>{body}</div>
  );
}
