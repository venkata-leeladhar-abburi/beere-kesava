import React, { useState } from "react";
import {
  Users,
  Scissors,
  BarChart3,
  UsersRound,
  BellRing,
  Boxes,
  Store,
  Tag,
  FileText,
  Download,
} from "lucide-react";
import { useDownloadsAllowed } from "../../../../shared/ui/DownloadAccess";
import { T, F } from "../theme";
import { FadeUp, SectionCard } from "../common/primitives";
import { Button } from "../../../../shared/ui/primitives";

// Wired to real backend: GET /reports/history (ReportDownloadHistory model),
// recorded via POST /reports/history whenever a report is generated/downloaded.
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { reportsApi, type ReportDownloadHistoryItem } from "../../../../shared/api/reports";
import { resolveAssetUrl } from "../../../../shared/api/uploads";
import { Pagination } from "../../../../shared/ui/DataPagination";
import { useReportPeriod } from "../PeriodContext";

const PAGE_SIZE = 8;

/** "October 2026", plus "vs September 2026" when the download carried a comparison. */
function periodOf(item: ReportDownloadHistoryItem): string | null {
  const f = (item.filtersUsed ?? {}) as {
    period?: string;
    compare?: { priorLabel?: string | null } | null;
  };
  if (!f.period) return null;
  return f.compare?.priorLabel ? `${f.period} vs ${f.compare.priorLabel}` : f.period;
}

export function DownloadHistorySection() {
  const downloadsAllowed = useDownloadsAllowed();
  const { downloadAgain } = useReportPeriod();
  const [page, setPage] = useState(1);

  // Paged on the server: the list grows with every download, and used to be
  // fetched and rendered in full.
  const {
    data: histRes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["reports-download-history", "page", page],
    queryFn: () => reportsApi.listHistory(PAGE_SIZE, (page - 1) * PAGE_SIZE),
    enabled: downloadsAllowed,
    placeholderData: keepPreviousData,
  });
  const historyItems = histRes?.items ?? [];
  const total = histRes?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!downloadsAllowed) return null;
  const dlIconMap: Record<string, React.ReactNode> = {
    "Weaver Payment Report": <Users size={24} color={T.antiqueGold} />,
    "Saree Production Report": <Scissors size={24} color={T.antiqueGold} />,
    "Profit and Loss Report": <BarChart3 size={24} color={T.antiqueGold} />,
    "Customer Report": <UsersRound size={24} color={T.antiqueGold} />,
    "Overdue and Alerts Report": <BellRing size={24} color={T.antiqueGold} />,
    "Outstanding Stock Report": <Boxes size={24} color={T.antiqueGold} />,
    "Outstanding Payments Report": <BellRing size={24} color={T.antiqueGold} />,
    "Raw Material Report": <Boxes size={24} color={T.antiqueGold} />,
    "Wholesale Sales Report": <Store size={24} color={T.antiqueGold} />,
    "Retail Sales Report": <Tag size={24} color={T.antiqueGold} />,
  };

  return (
    <div
      id="rep-history"
      className="px-4 md:px-7 xl:px-10"
      style={{ paddingTop: 36, paddingBottom: 40 }}
    >
      <FadeUp>
        <SectionCard
          icon={Download}
          title="Previously Downloaded Reports"
          subtitle={`Every report that was downloaded${total ? ` — ${total} so far` : ""}. Download Again rebuilds the same report for the same dates from today's data.`}
        >
          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: 16, alignItems: "stretch" }}
          >
            {isLoading ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: 32,
                  textAlign: "center",
                  fontFamily: F.ui,
                  fontSize: 14,
                  color: T.taupe,
                  background: "#FFF",
                  borderRadius: 16,
                  border: `1px solid ${T.borderDef}`,
                }}
              >
                Loading download history…
              </div>
            ) : isError ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: 32,
                  textAlign: "center",
                  fontFamily: F.ui,
                  fontSize: 14,
                  color: T.royalBurgundy,
                  background: "#FFF",
                  borderRadius: 16,
                  border: `1px solid ${T.borderDef}`,
                }}
              >
                Failed to load download history.
              </div>
            ) : historyItems.length === 0 ? (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: 32,
                  textAlign: "center",
                  fontFamily: F.ui,
                  fontSize: 14,
                  color: T.taupe,
                  background: "#FFF",
                  borderRadius: 16,
                  border: `1px solid ${T.borderDef}`,
                }}
              >
                No report download history recorded yet.
              </div>
            ) : (
              historyItems.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 14,
                    border: `1px solid ${T.borderDef}`,
                    boxShadow: "0 2px 10px rgba(74,6,27,0.06)",
                    padding: "20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {/* Header: icon + report name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        minWidth: 50,
                        borderRadius: 13,
                        background: "rgba(200,155,71,0.10)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(200,155,71,0.10)",
                      }}
                    >
                      {dlIconMap[r.reportName] ?? <FileText size={24} color={T.antiqueGold} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: F.ui,
                          fontSize: 16,
                          fontWeight: 700,
                          color: T.luxuryBrown,
                          lineHeight: 1.3,
                        }}
                      >
                        {r.reportName}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 32 }}>
                      <div>
                        <div
                          style={{
                            fontFamily: F.ui,
                            fontSize: 12,
                            fontWeight: 600,
                            color: T.taupe,
                            marginBottom: 2,
                          }}
                        >
                          Generated On
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 13,
                            color: T.luxuryBrown,
                          }}
                        >
                          {new Date(r.downloadedAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      {r.downloadedBy && (
                        <div>
                          <div
                            style={{
                              fontFamily: F.ui,
                              fontSize: 12,
                              fontWeight: 600,
                              color: T.taupe,
                              marginBottom: 2,
                            }}
                          >
                            Generated By
                          </div>
                          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                            {r.downloadedBy.firstName} {r.downloadedBy.lastName}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      <span
                        style={{
                          padding: "3px 11px",
                          borderRadius: 6,
                          background: "rgba(110,15,45,0.07)",
                          color: T.royalBurgundy,
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {r.fileType}
                      </span>
                      {periodOf(r) && (
                        <span
                          style={{
                            padding: "3px 11px",
                            borderRadius: 6,
                            background: "rgba(200,155,71,0.12)",
                            color: "#8B6018",
                            fontFamily: F.ui,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {periodOf(r)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Download button */}
                  <Button
                    variant="primary"
                    size="lg"
                    iconLeft={Download}
                    fullWidth
                    onClick={() => {
                      const url = resolveAssetUrl(r.downloadUrl);
                      // Reports are built in the browser, so there is usually
                      // no stored file — rebuild it for the same report and dates.
                      if (url) window.open(url, "_blank", "noopener");
                      else downloadAgain(r);
                    }}
                  >
                    Download Again
                  </Button>
                </div>
              ))
            )}
          </div>
          {total > PAGE_SIZE && (
            <div style={{ marginTop: 16 }}>
              <Pagination
                page={page}
                pageCount={pageCount}
                total={total}
                pageSize={PAGE_SIZE}
                start={(page - 1) * PAGE_SIZE}
                onPageChange={setPage}
                itemLabel="downloads"
                targetId="rep-history"
              />
            </div>
          )}
        </SectionCard>
      </FadeUp>
    </div>
  );
}
