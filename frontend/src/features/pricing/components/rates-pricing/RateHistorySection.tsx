import { useEffect, useState } from "react";
import { Download, Lock, ChevronLeft, ChevronRight, History } from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { Button } from "../../../../shared/ui/primitives";
import { T, F, cardStyle, thStyle, tdStyle } from "./theme";
import { SectionCard, GoldLink } from "./sharedUI";
import { rateRequestsApi, type BackendRateChangeRequest } from "../../../../shared/api/rateRequests";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { rupees, formatMoney } from "@/lib/domain/money";
import { useDataAccess } from "@/shared/ui/domain";

interface HistoryRow {
  date: string;
  by: string;
  what: string;
  old: string;
  next: string;
  reason: string;
}

function toHistoryRow(req: BackendRateChangeRequest, canSeeCost: boolean): HistoryRow {
  const dateSrc = req.decidedAt ?? req.createdAt;
  const date = new Date(dateSrc).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  }).replace(",", " ·");
  const by = req.decidedBy ? `${req.decidedBy.firstName} ${req.decidedBy.lastName}` : `${req.requestedBy.firstName} ${req.requestedBy.lastName}`;
  const status = req.status === "REJECTED" ? " (Rejected)" : "";
  return {
    date,
    by,
    what: `${req.sareeType?.type ?? req.sareeTypeCode} Making Charge${status}`,
    old: canSeeCost ? `${formatMoney(rupees(Number(req.oldMakingCharge)))}/saree` : "••••",
    next: canSeeCost ? `${formatMoney(rupees(Number(req.newMakingCharge)))}/saree` : "••••",
    reason: req.reason ?? "—",
  };
}

export function RateHistorySection() {
  const canSeeCost = useDataAccess("cost");
  const [histDateFilter, setHistDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [histPage, setHistPage] = useState(1);

  function loadHistory() {
    setIsLoading(true);
    setIsError(false);
    Promise.all([rateRequestsApi.list("APPROVED"), rateRequestsApi.list("REJECTED")])
      .then(([approved, rejected]) => {
        const all = [...approved.items, ...rejected.items].sort(
          (a, b) => new Date(b.decidedAt ?? b.createdAt).getTime() - new Date(a.decidedAt ?? a.createdAt).getTime(),
        );
        setHistory(all.map(req => toHistoryRow(req, canSeeCost)));
      })
      .catch((err: unknown) => {
        console.error("Failed to load rate change history", err);
        setIsError(true);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = history.filter(row => matchesDateFilter(row.date.split(" · ")[0], histDateFilter));

  const historyColumns: ColumnDef<HistoryRow>[] = [
    {
      id: "date", header: "Date & Time", accessor: r => r.date,
      cell: (_v, r) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{r.date}</span>,
    },
    {
      id: "by", header: "Changed By", accessor: r => r.by, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500 }}>{r.by}</span>,
    },
    {
      id: "what", header: "What Was Changed", accessor: r => r.what, priority: 1,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 500 }}>{r.what}</span>,
    },
    {
      id: "old", header: "Old Value", accessor: r => r.old,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.crimson }}>{r.old}</span>,
    },
    {
      id: "next", header: "New Value", accessor: r => r.next,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.green }}>{r.next}</span>,
    },
    {
      id: "reason", header: "Reason", accessor: r => r.reason, priority: 3,
      cell: (_v, r) => <span style={{ fontFamily: F.ui, fontSize: 12, fontStyle: "italic", color: T.taupe }}>{r.reason}</span>,
    },
  ];

  return (
    <div style={{ padding: "40px 56px 0" }}>
    <SectionCard
      icon={History}
      title="Rate Change History"
      subtitle="A permanent, immutable log of all rate changes made in the system. This record cannot be edited or deleted and serves as the official audit trail."
      actions={<DownloadGate><GoldLink><Download size={13} /> Download History →</GoldLink></DownloadGate>}
    >
      <div style={{ marginBottom: 16 }}>
        <DateFilterBar filter={histDateFilter} onChange={setHistDateFilter} />
      </div>

      {isLoading ? (
        <div style={{ ...cardStyle, padding: "32px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
          Loading rate change history…
        </div>
      ) : isError ? (
        <div style={{
          ...cardStyle, padding: "16px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 16, borderLeft: `4px solid ${T.crimson}`,
        }}>
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.crimson }}>Failed to load rate change history.</span>
          <Button onClick={loadHistory} variant="primary" size="sm">
            Retry
          </Button>
        </div>
      ) : (
      <div style={cardStyle}>
        <DataTable
          responsive
          columns={historyColumns}
          data={filteredHistory}
          getRowId={r => String(filteredHistory.indexOf(r))}
          emptyTitle="No rate changes recorded yet."
        />

        {/* Table footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderTop: `1px solid ${T.borderDef}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={12} color={T.taupe} />
            <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
              This history is permanent and cannot be edited or deleted.
            </span>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Button
              variant="secondary" size="sm" iconLeft={ChevronLeft}
              className="rounded-[8px] text-[var(--text-tertiary)]"
              onClick={() => setHistPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {[1, 2, 3].map(p => (
              <Button
                key={p}
                variant={histPage === p ? "primary" : "tertiary"}
                size="sm"
                className="h-[30px] w-[30px] rounded-[8px] p-0"
                onClick={() => setHistPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="secondary" size="sm" iconRight={ChevronRight}
              className="rounded-[8px] text-[var(--text-tertiary)]"
              onClick={() => setHistPage(p => Math.min(3, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      )}
    </SectionCard>
    </div>
  );
}
