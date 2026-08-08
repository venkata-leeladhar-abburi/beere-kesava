import { useEffect, useState } from "react";
import { Download, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "../../../../shared/ui/DateFilterBar";
import { DownloadGate } from "../../../../shared/ui/DownloadAccess";
import { Button } from "../../../../shared/ui/primitives";
import { T, F, cardStyle, thStyle, tdStyle } from "./theme";
import { SectionTitle, GoldLink } from "./sharedUI";
import { rateRequestsApi, type BackendRateChangeRequest } from "../../../../shared/api/rateRequests";

interface HistoryRow {
  date: string;
  by: string;
  what: string;
  old: string;
  next: string;
  reason: string;
}

function toHistoryRow(req: BackendRateChangeRequest): HistoryRow {
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
    old: `₹${Number(req.oldMakingCharge).toLocaleString("en-IN")}/saree`,
    next: `₹${Number(req.newMakingCharge).toLocaleString("en-IN")}/saree`,
    reason: req.reason ?? "—",
  };
}

export function RateHistorySection() {
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
        setHistory(all.map(toHistoryRow));
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

  return (
    <div style={{ padding: "48px 56px" }}>
      <SectionTitle link={
        <DownloadGate><GoldLink><Download size={13} /> Download History →</GoldLink></DownloadGate>
      }>
        Rate Change History
      </SectionTitle>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, maxWidth: 720, margin: "0 0 20px 0", lineHeight: 1.7 }}>
        A permanent, immutable log of all rate changes made in the system. This record cannot be edited or deleted and serves as the official audit trail.
      </p>

      <DateFilterBar filter={histDateFilter} onChange={setHistDateFilter} />

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
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Date & Time", "Changed By", "What Was Changed", "Old Value", "New Value", "Reason"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.filter(row => matchesDateFilter(row.date.split(" · ")[0], histDateFilter)).length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdStyle, textAlign: "center", padding: "32px 16px", color: T.taupe, fontFamily: F.ui, fontSize: 13 }}>
                  No rate changes recorded yet.
                </td>
              </tr>
            )}
            {history.filter(row => matchesDateFilter(row.date.split(" · ")[0], histDateFilter)).map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(110,15,45,0.015)" }}>
                <td style={{ ...tdStyle, fontFamily: F.mono, fontSize: 12, color: T.taupe, whiteSpace: "nowrap" }}>{row.date}</td>
                <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 12, fontWeight: 500 }}>{row.by}</td>
                <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 13, fontWeight: 500 }}>{row.what}</td>
                <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.crimson }}>{row.old}</td>
                <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.green }}>{row.next}</td>
                <td style={{ ...tdStyle, fontFamily: F.ui, fontSize: 12, fontStyle: "italic", color: T.taupe }}>{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>

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
    </div>
  );
}
