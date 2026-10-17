import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PERIODS,
  resolvePeriod,
  inRange,
  toISODate,
  type CompareMode,
  type CustomDates,
  type DateRange,
  type PeriodKey,
} from "./period";
import { downloadWorkbook, exportFilename } from "./export";
import { buildReportSheets, type ReportExport } from "./reportExport";
import type { ReportTabKey } from "./types";
import { reportsApi, type ReportDownloadHistoryItem } from "../../../shared/api/reports";
import { useAuth } from "../../../contexts/AuthContext";

export type { ReportExport, ReportMetric, ReportSheet } from "./reportExport";

// Tabs that show a live snapshot of "right now" — there is nothing dated to
// filter, so the period selector and the comparison are switched off rather
// than silently ignored. "outstanding" is excluded: its items carry a
// received/batch date, so the period narrows today's unsold list down to
// stock that arrived in that window.
export const LIVE_ONLY_TABS: ReportTabKey[] = ["overdue", "outstanding-payments"];

/** Report name -> tab, for history rows recorded before the tab was stored. */
const TAB_BY_REPORT_NAME: Record<string, ReportTabKey> = {
  "Raw Material Report": "raw-material",
  "Saree Production Report": "production",
  "Outstanding Stock Report": "outstanding",
  "Outstanding Payments Report": "outstanding-payments",
  "Weaver Payment Report": "weaver-payment",
  "Retail Sales Report": "retail",
  "Wholesale Sales Report": "wholesale",
  "Profit and Loss Report": "pnl",
  "Customer Report": "customers",
  "Overdue and Alerts Report": "overdue",
};

/** What a download records, so "Download Again" can rebuild the same file. */
interface ExportFilters {
  tab?: ReportTabKey;
  period?: string;
  from?: string;
  to?: string;
  compare?: { mode: CompareMode; priorLabel: string | null } | null;
}

interface ReportPeriodValue {
  activeTab: ReportTabKey;
  setActiveTab: (t: ReportTabKey) => void;
  /** The active tab is a live snapshot: no period, no comparison. */
  isLiveTab: boolean;

  period: PeriodKey;
  setPeriod: (p: PeriodKey) => void;
  custom: CustomDates;
  setCustom: (c: CustomDates) => void;

  /** The toggle as the user left it. */
  compareOn: boolean;
  setCompareOn: (v: boolean) => void;
  compareMode: CompareMode;
  setCompareMode: (m: CompareMode) => void;
  /** A comparison is actually showing: toggle on, a bounded period, a dated tab. */
  compareActive: boolean;
  /** Why the toggle is on but nothing is being compared, for the filter bar. */
  compareBlockedReason: string | null;

  /** Null while "All Time" (or an incomplete custom range) is selected. */
  current: DateRange | null;
  prior: DateRange | null;
  /** The current window is still running and the comparison is cut to date. */
  partial: boolean;
  /** Human label for the active window, e.g. "August 2026" or "All time". */
  label: string;
  /** The stretch of `current` the prior window lines up with ("1–17 Oct 2026"). */
  compareLabel: string | null;
  priorLabel: string | null;
  inCurrent: (value: string | Date | null | undefined) => boolean;
  inPrior: (value: string | Date | null | undefined) => boolean;

  /** Set by the visible report section so the toolbar can export its data. */
  setExport: (e: ReportExport | null) => void;
  exportExcel: () => void;
  canExport: boolean;
  /** Why Download is unavailable, for its tooltip. */
  exportHint: string;
  /** Re-builds a previously downloaded report from today's data. */
  downloadAgain: (item: ReportDownloadHistoryItem) => void;
}

const ReportPeriodContext = createContext<ReportPeriodValue | null>(null);

/** Rows across every sheet — a period can hold only, say, counter sales. */
const recordCount = (e: ReportExport) =>
  e.rows.length + (e.extraSheets ?? []).reduce((n, sheet) => n + sheet.rows.length, 0);

export function ReportPeriodProvider({
  children,
  initialTab = "production",
}: {
  children: React.ReactNode;
  initialTab?: ReportTabKey;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTabKey>(initialTab);
  const [period, setPeriodState] = useState<PeriodKey>("All Time");
  const [custom, setCustom] = useState<CustomDates>({});
  const [compareOn, setCompareOnState] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>("previous");
  const [reportExport, setReportExport] = useState<ReportExport | null>(null);
  // Bumped on every registration, so a queued "Download Again" only fires on
  // rows registered after the period was restored — never the stale ones.
  const [exportVersion, setExportVersion] = useState(0);
  const [queued, setQueued] = useState<{ name: string; at: number; version: number } | null>(null);
  const versionRef = useRef(0);
  const setExport = useCallback((e: ReportExport | null) => {
    setReportExport(e);
    versionRef.current += 1;
    setExportVersion(versionRef.current);
  }, []);

  const isLiveTab = LIVE_ONLY_TABS.includes(activeTab);

  // Comparing "All Time" against nothing is meaningless, so turning the
  // comparison on from All Time moves to this month, and picking All Time
  // while comparing turns the comparison off.
  const setPeriod = useCallback((p: PeriodKey) => {
    setPeriodState(p);
    if (p === "All Time") setCompareOnState(false);
  }, []);
  const setCompareOn = useCallback(
    (v: boolean) => {
      setCompareOnState(v);
      if (v && period === "All Time") setPeriodState("This Month");
    },
    [period]
  );

  const resolved = useMemo(
    () => resolvePeriod(period, custom, new Date(), compareMode),
    [period, custom, compareMode]
  );
  const { current, prior, partial, compareLabel } = resolved;

  const compareActive = compareOn && !!prior && !isLiveTab;
  const compareBlockedReason = !compareOn
    ? null
    : isLiveTab
      ? "This report is a live snapshot — there is no earlier period to compare."
      : !prior
        ? period === "Custom Dates"
          ? "Pick both dates to compare."
          : "Pick a period to compare."
        : null;

  const inCurrent = useCallback(
    (v: string | Date | null | undefined) => inRange(current, v),
    [current]
  );
  // With no prior window nothing is 'prior' — inRange's null case means
  // 'unbounded', which is the wrong default here.
  const inPrior = useCallback(
    (v: string | Date | null | undefined) => (prior && compareActive ? inRange(prior, v) : false),
    [prior, compareActive]
  );

  const label = current?.label ?? "All time";
  const priorLabel = compareActive ? (prior?.label ?? null) : null;

  const canExport = !!reportExport && reportExport.ready !== false && recordCount(reportExport) > 0;
  const exportHint = !reportExport
    ? "This view has nothing to export."
    : reportExport.ready === false
      ? "Still loading — Download will be ready in a moment."
      : recordCount(reportExport) === 0
        ? `No records for ${reportExport.live ? "this report" : label} to export.`
        : compareActive && !reportExport.live
          ? `Download ${reportExport.name} for ${compareLabel ?? label} with the comparison against ${priorLabel}.`
          : `Download ${reportExport.name} for ${reportExport.live ? "today" : label}.`;

  const exportExcel = useCallback(() => {
    if (!reportExport || reportExport.ready === false || recordCount(reportExport) === 0) return;
    const comparing = compareActive && !reportExport.live;
    const periodText = reportExport.live ? "Live" : label;
    const filename = exportFilename(
      reportExport.name,
      reportExport.live
        ? `Live_${toISODate(new Date())}`
        : ((comparing ? compareLabel : null) ?? label),
      comparing ? `vs ${priorLabel}` : null
    );
    downloadWorkbook(
      filename,
      buildReportSheets(reportExport, {
        periodLabel: periodText,
        compareLabel: comparing ? compareLabel : null,
        priorLabel: comparing ? priorLabel : null,
        generatedAt: new Date(),
      })
    );
    toast.success(`${reportExport.name} downloaded`, { description: `${filename}.xlsx` });

    // Recorded so the page's own "Reports Generated" / "Downloads This
    // Month" counters reflect real activity, and with the exact window so
    // "Download Again" rebuilds the same report. A failure here must not
    // break the download the user actually asked for.
    const filters: ExportFilters = {
      tab: activeTab,
      period: periodText,
      from: !reportExport.live && current ? toISODate(current.from) : undefined,
      to:
        !reportExport.live && current
          ? toISODate(new Date(current.to.getTime() - 86_400_000))
          : undefined,
      compare: comparing ? { mode: compareMode, priorLabel } : null,
    };
    void reportsApi
      .recordDownload({
        reportName: reportExport.name,
        fileType: "XLSX",
        downloadedById: user?.id,
        filtersUsed: filters as Record<string, unknown>,
      })
      .then(() => queryClient.invalidateQueries({ queryKey: ["reports-download-history"] }))
      .catch(() => undefined);
  }, [
    reportExport,
    compareActive,
    compareLabel,
    priorLabel,
    label,
    current,
    activeTab,
    compareMode,
    user?.id,
    queryClient,
  ]);

  const downloadAgain = useCallback((item: ReportDownloadHistoryItem) => {
    const f = (item.filtersUsed ?? {}) as ExportFilters;
    const tab = f.tab ?? TAB_BY_REPORT_NAME[item.reportName];
    if (!tab) {
      toast.error("This report can't be rebuilt automatically — open it from the tabs above.");
      return;
    }
    setActiveTab(tab);
    if (f.from && f.to) {
      setPeriodState("Custom Dates");
      setCustom({ from: f.from, to: f.to });
    } else if (f.period === "All time" || f.period === "Live" || !f.period) {
      setPeriodState("All Time");
    } else if ((PERIODS as readonly string[]).includes(f.period)) {
      setPeriodState(f.period as PeriodKey);
    }
    if (f.compare && f.from && f.to) {
      setCompareMode(f.compare.mode);
      setCompareOnState(true);
    } else {
      setCompareOnState(false);
    }
    setQueued({ name: item.reportName, at: Date.now(), version: versionRef.current });
    document.getElementById("report-filter-bar")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Runs a queued "Download Again" once the target section has loaded and
  // registered its rows for the restored period.
  const exportRef = useRef(exportExcel);
  exportRef.current = exportExcel;
  useEffect(() => {
    if (!queued) return;
    if (
      reportExport?.name === queued.name &&
      reportExport.ready !== false &&
      exportVersion > queued.version
    ) {
      setQueued(null);
      if (recordCount(reportExport) === 0) {
        toast.info(`No records left for ${queued.name} in that period.`);
        return;
      }
      exportRef.current();
      return;
    }
    const timeout = window.setTimeout(
      () => {
        setQueued(null);
        toast.error(`Couldn't rebuild ${queued.name} — try its Download Excel button.`);
      },
      30_000 - (Date.now() - queued.at)
    );
    return () => window.clearTimeout(timeout);
  }, [queued, reportExport, exportVersion]);

  const value = useMemo<ReportPeriodValue>(
    () => ({
      activeTab,
      setActiveTab,
      isLiveTab,
      period,
      setPeriod,
      custom,
      setCustom,
      compareOn,
      setCompareOn,
      compareMode,
      setCompareMode,
      compareActive,
      compareBlockedReason,
      current,
      prior: compareActive ? prior : null,
      partial,
      label,
      compareLabel: compareActive ? compareLabel : null,
      priorLabel,
      inCurrent,
      inPrior,
      setExport,
      exportExcel,
      canExport,
      exportHint,
      downloadAgain,
    }),
    [
      activeTab,
      isLiveTab,
      period,
      setPeriod,
      custom,
      compareOn,
      setCompareOn,
      compareMode,
      compareActive,
      compareBlockedReason,
      current,
      prior,
      partial,
      label,
      compareLabel,
      priorLabel,
      inCurrent,
      inPrior,
      exportExcel,
      canExport,
      exportHint,
      downloadAgain,
      setExport,
    ]
  );

  return <ReportPeriodContext.Provider value={value}>{children}</ReportPeriodContext.Provider>;
}

export function useReportPeriod(): ReportPeriodValue {
  const ctx = useContext(ReportPeriodContext);
  if (!ctx) throw new Error("useReportPeriod must be used inside <ReportPeriodProvider>");
  return ctx;
}

/** Like useReportPeriod, but returns null outside a <ReportPeriodProvider> instead of
 *  throwing — for components (e.g. OutstandingPage) that render both embedded in
 *  Reports and standalone on their own route. */
export function useReportPeriodOptional(): ReportPeriodValue | null {
  return useContext(ReportPeriodContext);
}

/**
 * Registers the visible section's rows for the toolbar's Download button.
 * Sections call this with their already period-filtered data, memoised so the
 * registration only changes when the data does.
 */
export function useRegisterExport(payload: ReportExport): void {
  const { setExport } = useReportPeriod();
  useEffect(() => {
    setExport(payload);
  }, [setExport, payload]);
  useEffect(() => () => setExport(null), [setExport]);
}

const EMPTY_SPLIT: { cur: never[]; prev: never[] } = { cur: [], prev: [] };

/**
 * Splits dated items into the current window (`cur`) and, while comparing,
 * the prior one (`prev`) — the filter every section used to hand-roll for the
 * current window only.
 */
export function usePeriodSplit<T>(
  items: readonly T[] | undefined,
  dateOf: (item: T) => string | Date | null | undefined
): { cur: T[]; prev: T[] } {
  const { inCurrent, inPrior, compareActive } = useReportPeriod();
  const dateRef = useRef(dateOf);
  dateRef.current = dateOf;
  return useMemo(() => {
    // A constant for "nothing": callers often pass `data ?? []`, and a fresh
    // empty array each render would otherwise re-register exports forever.
    if (!items || items.length === 0) return EMPTY_SPLIT as { cur: T[]; prev: T[] };
    const list = items;
    return {
      cur: list.filter((i) => inCurrent(dateRef.current(i))),
      prev: compareActive ? list.filter((i) => inPrior(dateRef.current(i))) : [],
    };
  }, [items, inCurrent, inPrior, compareActive]);
}
