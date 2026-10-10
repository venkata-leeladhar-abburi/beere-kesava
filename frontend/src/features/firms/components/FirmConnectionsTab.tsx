import React, { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Building2, FileText, Package, Store, Wallet, X } from "lucide-react";
import type { Firm } from "../contexts/FirmsContext";
import { useFirmConnections } from "../hooks/useFirmConnections";
import type {
  FirmConnection,
  FirmDocument,
  FirmDocumentType,
  FirmPayment,
} from "../../../shared/api/firms";
import { T, F } from "./theme";
import { fmtFull } from "./utils";
import { Button, IconButton, StatusPill, type StatusTone } from "../../../shared/ui/primitives";
import { LoadingState, ErrorState, EmptyState } from "../../../shared/ui/state";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import {
  DateFilterBar,
  DateFilterState,
  DEFAULT_DATE_FILTER,
  matchesDateFilter,
} from "../../../shared/ui/DateFilterBar";
import { Modal } from "../../../shared/ui/overlay";

type PartyType = FirmConnection["partyType"];

// What each group is called, and how its money reads: we pay suppliers and
// vendors, we collect from customers.
const GROUPS: {
  type: PartyType;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  documentLabel: string;
  amountLabel: string;
  paidLabel: string;
  outstandingLabel: string;
}[] = [
  {
    type: "SUPPLIER",
    title: "Suppliers",
    subtitle: "Saree suppliers this firm has bought from — every external purchase booked to it.",
    icon: Store,
    documentLabel: "Purchases",
    amountLabel: "Purchased",
    paidLabel: "Paid",
    outstandingLabel: "Balance Due",
  },
  {
    type: "VENDOR",
    title: "Vendors",
    subtitle: "Raw material vendors this firm has raised purchase orders with.",
    icon: Package,
    documentLabel: "Orders",
    amountLabel: "Ordered",
    paidLabel: "Paid",
    outstandingLabel: "Balance Due",
  },
  {
    type: "CUSTOMER",
    title: "Wholesale Customers",
    subtitle: "Customers this firm has invoiced.",
    icon: Building2,
    documentLabel: "Invoices",
    amountLabel: "Invoiced",
    paidLabel: "Collected",
    outstandingLabel: "Yet to Collect",
  },
];

const DOCUMENT_LABEL: Record<FirmDocumentType, string> = {
  PURCHASE_ORDER: "Purchase Order",
  GOODS_RECEIPT: "Goods Receipt",
  EXTERNAL_PURCHASE: "External Purchase",
  DISPATCH_INVOICE: "Invoice",
};

const STATUS: Record<FirmDocument["status"], { tone: StatusTone; label: string }> = {
  PENDING: { tone: "warning", label: "Pending" },
  PARTIAL: { tone: "info", label: "Part paid" },
  PAID: { tone: "success", label: "Settled" },
};

/** A connection narrowed to the chosen period, with its figures recomputed. */
interface PartyRow {
  connection: FirmConnection;
  documents: FirmDocument[];
  payments: FirmPayment[];
  amount: number;
  paid: number;
  outstanding: number;
  lastActivity: string;
}

const mono: React.CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 13 };

/**
 * "Connected Parties" on a firm's page — who this firm deals with, and what
 * has passed between them.
 *
 * A party is listed because a document or payment names both it and this
 * firm, not because of a setting on its profile: the same supplier appears
 * under every firm that has bought from it, each showing only its own share.
 */
export function FirmConnectionsTab({ firm }: { firm: Firm }) {
  const { connections, isLoading, isError, error, refetch } = useFirmConnections(firm.id);
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const rows: PartyRow[] = useMemo(
    () =>
      connections.flatMap((connection): PartyRow[] => {
        const documents = connection.documents.filter((d) => matchesDateFilter(d.date, dateFilter));
        const payments = connection.payments.filter((p) => matchesDateFilter(p.date, dateFilter));
        if (documents.length === 0 && payments.length === 0) return [];
        const dates = [...documents.map((d) => d.date), ...payments.map((p) => p.date)].sort();
        return [
          {
            connection,
            documents,
            payments,
            amount: documents.reduce((s, d) => s + d.amount, 0),
            paid: payments.reduce((s, p) => s + p.amount, 0),
            outstanding: documents.reduce((s, d) => s + d.outstanding, 0),
            lastActivity: dates[dates.length - 1] ?? "—",
          },
        ];
      }),
    [connections, dateFilter]
  );

  const keyOf = (r: PartyRow) => `${r.connection.partyType}:${r.connection.partyId}`;
  const open = openKey ? (rows.find((r) => keyOf(r) === openKey) ?? null) : null;

  if (isLoading) return <LoadingState variant="skeleton" rows={4} />;
  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="w-full">
      <div
        style={{
          background: T.bgGold,
          border: `1px solid ${T.borderGold}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          fontFamily: F.ui,
          fontSize: 12,
          color: T.taupe,
          lineHeight: 1.65,
        }}
      >
        <strong style={{ color: T.antiqueGold }}>Who is listed here:</strong> every supplier, vendor
        and wholesale customer with an external purchase, purchase order or invoice raised under{" "}
        <strong style={{ color: T.luxuryBrown }}>{firm.firmName}</strong>. The firm is chosen on
        each document, so the same party can appear under more than one firm — each firm shows only
        its own documents and payments.
      </div>

      <div className="bg-[#FFFDF9] border border-[#E8DCC4] rounded-xl p-3.5 flex flex-wrap items-center gap-3 mb-5">
        <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
      </div>

      {GROUPS.map((group) => {
        const groupRows = rows.filter((r) => r.connection.partyType === group.type);
        const Icon = group.icon;
        const columns: ColumnDef<PartyRow>[] = [
          {
            id: "name",
            header: group.title === "Wholesale Customers" ? "Customer" : group.title.slice(0, -1),
            accessor: (r) => r.connection.name,
            priority: 1,
            cell: (_v, r) => (
              <span
                style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}
              >
                {r.connection.name}
              </span>
            ),
          },
          {
            id: "documents",
            header: group.documentLabel,
            type: "number",
            accessor: (r) => r.documents.length,
            cell: (_v, r) => <span style={{ ...mono, color: T.taupe }}>{r.documents.length}</span>,
          },
          {
            id: "amount",
            header: group.amountLabel,
            type: "currency",
            align: "end",
            accessor: (r) => r.amount,
            cell: (_v, r) => (
              <span style={{ ...mono, fontWeight: 700, color: T.luxuryBrown }}>
                {fmtFull(r.amount)}
              </span>
            ),
          },
          {
            id: "paid",
            header: group.paidLabel,
            type: "currency",
            align: "end",
            accessor: (r) => r.paid,
            cell: (_v, r) => (
              <span style={{ ...mono, fontWeight: 700, color: r.paid > 0 ? T.green : T.taupe }}>
                {fmtFull(r.paid)}
              </span>
            ),
          },
          {
            id: "outstanding",
            header: group.outstandingLabel,
            type: "currency",
            align: "end",
            accessor: (r) => r.outstanding,
            cell: (_v, r) => (
              <span
                style={{
                  ...mono,
                  fontWeight: 700,
                  color: r.outstanding > 0 ? T.crimson : T.green,
                }}
              >
                {r.outstanding > 0 ? fmtFull(r.outstanding) : "Settled"}
              </span>
            ),
          },
          {
            id: "lastActivity",
            header: "Last Activity",
            accessor: (r) => r.lastActivity,
            priority: 3,
            cell: (_v, r) => (
              <span style={{ ...mono, fontSize: 12, color: T.taupe }}>{r.lastActivity}</span>
            ),
          },
          {
            id: "action",
            header: "",
            type: "actions",
            accessor: () => null,
            cell: (_v, r) => (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => setOpenKey(keyOf(r))}
                className="whitespace-nowrap"
              >
                View history
              </Button>
            ),
          },
        ];

        return (
          <div
            key={group.type}
            className="mb-6 rounded-2xl border border-[#E8DCC4] overflow-hidden bg-white shadow-sm"
          >
            <div className="bg-[#6E0F2D] p-5 sm:px-6 sm:py-5 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[#F5E8D0]" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#FFFDF9] leading-snug">
                    {group.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-white/70 mt-0.5">{group.subtitle}</p>
                </div>
              </div>
              <div className="text-xs text-white/80">
                {groupRows.length} connected ·{" "}
                {fmtFull(groupRows.reduce((s, r) => s + r.amount, 0))}
              </div>
            </div>
            {groupRows.length === 0 ? (
              <EmptyState
                title={`No ${group.title.toLowerCase()} in this period`}
                description={`Nothing has been raised under ${firm.firmName} with a ${
                  group.type === "CUSTOMER" ? "wholesale customer" : group.type.toLowerCase()
                } here.`}
              />
            ) : (
              <DataTable
                responsive
                columns={columns}
                data={groupRows}
                getRowId={keyOf}
                onRowClick={(r) => setOpenKey(keyOf(r))}
                pagination
              />
            )}
          </div>
        );
      })}

      {open && <PartyHistoryModal firm={firm} row={open} onClose={() => setOpenKey(null)} />}
    </div>
  );
}

/** Everything between one firm and one party, newest first: each document and
 *  each payment as its own dated line. */
function PartyHistoryModal({
  firm,
  row,
  onClose,
}: {
  firm: Firm;
  row: PartyRow;
  onClose: () => void;
}) {
  const group = GROUPS.find((g) => g.type === row.connection.partyType)!;
  const timeline = useMemo(
    () =>
      [
        ...row.documents.map((d) => ({ kind: "document" as const, date: d.date, doc: d })),
        ...row.payments.map((p) => ({ kind: "payment" as const, date: p.date, pay: p })),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    [row]
  );

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="lg">
      <div
        style={{
          background: `linear-gradient(120deg, ${T.royalBurgundy} 0%, ${T.deepWine} 100%)`,
          padding: "22px 28px",
          paddingRight: 56,
          position: "relative",
          flexShrink: 0,
        }}
      >
        <Dialog.Title asChild>
          <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: "#FFFDF9" }}>
            {row.connection.name}
          </div>
        </Dialog.Title>
        <Dialog.Description asChild>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
            History with {firm.firmName}
          </div>
        </Dialog.Description>
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

      <div style={{ padding: "20px 28px 24px", overflowY: "auto", flex: 1, minHeight: 0 }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { label: group.amountLabel, value: fmtFull(row.amount), color: T.luxuryBrown },
            { label: group.paidLabel, value: fmtFull(row.paid), color: T.green },
            {
              label: group.outstandingLabel,
              value: fmtFull(row.outstanding),
              color: row.outstanding > 0 ? T.crimson : T.green,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: T.bgGold,
                border: `1px solid ${T.borderGold}`,
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 4 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 700, color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {timeline.map((entry) => {
            const isDoc = entry.kind === "document";
            const Icon = isDoc ? FileText : Wallet;
            return (
              <div
                key={isDoc ? `d-${entry.doc.type}-${entry.doc.id}` : `p-${entry.pay.id}`}
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
                <Icon
                  size={16}
                  color={isDoc ? T.royalBurgundy : T.green}
                  style={{ flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ ...mono, fontWeight: 700, color: T.royalBurgundy }}>
                    {isDoc ? entry.doc.reference : entry.pay.reference}
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 1 }}>
                    {isDoc
                      ? DOCUMENT_LABEL[entry.doc.type]
                      : entry.pay.documentRef
                        ? `Payment against ${entry.pay.documentRef}`
                        : "Payment — not against a specific document"}
                  </div>
                </div>
                <span style={{ ...mono, fontSize: 12, color: T.taupe }}>{entry.date}</span>
                <span
                  style={{
                    ...mono,
                    fontWeight: 700,
                    minWidth: 96,
                    textAlign: "right",
                    color: isDoc ? T.luxuryBrown : T.green,
                  }}
                >
                  {fmtFull(isDoc ? entry.doc.amount : entry.pay.amount)}
                </span>
                {isDoc ? (
                  <StatusPill
                    tone={STATUS[entry.doc.status].tone}
                    label={STATUS[entry.doc.status].label}
                    size="sm"
                  />
                ) : (
                  <StatusPill tone="success" label="Paid" size="sm" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
