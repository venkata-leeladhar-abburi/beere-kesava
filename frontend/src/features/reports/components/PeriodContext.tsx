import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolvePeriod, inRange, type CustomDates, type DateRange, type PeriodKey } from "./period";
import { downloadXlsx, exportFilename } from "./export";
import { reportsApi } from "../../../shared/api/reports";

/** What a report section offers up for Excel export. */
export interface ReportExport {
  /** Report name, used for the file name. */
  name: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

interface ReportPeriodValue {
  period: PeriodKey;
  setPeriod: (p: PeriodKey) => void;
  custom: CustomDates;
  setCustom: (c: CustomDates) => void;
  compareOn: boolean;
  setCompareOn: (v: boolean) => void;
  /** Null while "All Time" (or an incomplete custom range) is selected. */
  current: DateRange | null;
  prior: DateRange | null;
  /** Human label for the active window, e.g. "August 2026" or "All time". */
  label: string;
  priorLabel: string | null;
  inCurrent: (value: string | Date | null | undefined) => boolean;
  inPrior: (value: string | Date | null | undefined) => boolean;
  /** Set by the visible report section so the toolbar can export its data. */
  setExport: (e: ReportExport | null) => void;
  exportExcel: () => void;
  canExport: boolean;
}

const ReportPeriodContext = createContext<ReportPeriodValue | null>(null);

export function ReportPeriodProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<PeriodKey>("All Time");
  const [custom, setCustom] = useState<CustomDates>({});
  const [compareOn, setCompareOn] = useState(false);
  const [reportExport, setExport] = useState<ReportExport | null>(null);

  const value = useMemo<ReportPeriodValue>(() => {
    const { current, prior } = resolvePeriod(period, custom);
    return {
      period, setPeriod, custom, setCustom, compareOn, setCompareOn,
      current, prior,
      label: current?.label ?? "All time",
      priorLabel: prior?.label ?? null,
      inCurrent: v => inRange(current, v),
      // With no prior window (All Time) nothing is 'prior' — inRange's
      // null case means 'unbounded', which is the wrong default here.
      inPrior: v => (prior ? inRange(prior, v) : false),
      setExport,
      canExport: !!reportExport && reportExport.rows.length > 0,
      exportExcel: () => {
        if (!reportExport || reportExport.rows.length === 0) return;
        const periodLabel = current?.label ?? "All time";
        downloadXlsx(
          exportFilename(reportExport.name, periodLabel),
          reportExport.name,
          reportExport.headers,
          reportExport.rows,
        );
        // Recorded so the page's own "Reports Generated" / "Downloads This
        // Month" counters reflect real activity. A failure here must not
        // break the download the user actually asked for.
        void reportsApi
          .recordDownload({ reportName: reportExport.name, fileType: "XLSX", filtersUsed: { period: periodLabel } })
          .catch(() => undefined);
      },
    };
  }, [period, custom, compareOn, reportExport]);

  return <ReportPeriodContext.Provider value={value}>{children}</ReportPeriodContext.Provider>;
}

export function useReportPeriod(): ReportPeriodValue {
  const ctx = useContext(ReportPeriodContext);
  if (!ctx) throw new Error("useReportPeriod must be used inside <ReportPeriodProvider>");
  return ctx;
}

/**
 * Registers the visible section's rows for the toolbar's Download button.
 * Sections call this with their already period-filtered data.
 */
export function useRegisterExport(payload: ReportExport): void {
  const { setExport } = useReportPeriod();
  const { name, headers, rows } = payload;
  useEffect(() => {
    setExport({ name, headers, rows });
    return () => setExport(null);
  }, [setExport, name, headers, rows]);
}
