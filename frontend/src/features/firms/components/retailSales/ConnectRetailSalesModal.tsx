/**
 * Connect Retail Sales → Firm.
 * ═══════════════════════════════════════════════════════════════════════════
 * A counter sale is rung up by shop staff who have no idea which firm's books
 * it belongs in, so the accountant makes that call here, after the fact: pick
 * the firm, tick the sales, connect. Once connected, the firm's activity counts
 * the sale as realized income — there is no second, hand-typed ledger row, so
 * the firm's revenue can never drift from the sales it came from.
 *
 * A sale belongs to exactly one firm. Selecting one that already sits on
 * another firm MOVES it, and the modal says so before the user commits.
 */
import React from "react";
import { Link2, Building2, AlertTriangle, Check } from "lucide-react";
import type { Firm } from "../../contexts/FirmsContext";
import type { FirmRetailSale } from "../../../../shared/api/firms";
import {
  useConnectableRetailSales, useRetailSaleLinking,
} from "../../hooks/useFirmRetailSales";
import { connectableRetailSaleColumns } from "./retailSaleColumns";
import { T, F } from "../theme";
import { Modal } from "../../../../shared/ui/overlay";
import {
  Button, Field, SearchInput, Select, SelectItem, SwitchField, Textarea,
} from "../../../../shared/ui/primitives";
import { DataTable } from "../../../../shared/ui/data";
import {
  DateFilterBar, DEFAULT_DATE_FILTER, type DateFilterState,
} from "../../../../shared/ui/DateFilterBar";
import { filterToRange } from "./dateRange";
import { Money } from "../../../../shared/ui/domain";
import { rupees } from "@/lib/domain/money";


export interface ConnectRetailSalesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firms: Firm[];
  /** Pre-selected firm. When set with `lockFirm`, the firm picker is hidden —
   *  that is the case when the modal is opened from inside a firm's own page. */
  firmId?: string;
  lockFirm?: boolean;
  onLinked?: (firmId: string, linked: number) => void;
}

export function ConnectRetailSalesModal({
  open, onOpenChange, firms, firmId, lockFirm = false, onLinked,
}: ConnectRetailSalesModalProps) {
  const [selectedFirmId, setSelectedFirmId] = React.useState(firmId ?? "");
  const [search, setSearch] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [includeLinked, setIncludeLinked] = React.useState(false);
  const [note, setNote] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [formError, setFormError] = React.useState<string | null>(null);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { from, to } = filterToRange(dateFilter);
  const query = React.useMemo(
    () => ({ search: debouncedSearch, from, to, includeLinked }),
    [debouncedSearch, from, to, includeLinked],
  );

  const { sales, total, isLoading, isFetching, isError, refetch } =
    useConnectableRetailSales(query, open);
  const { linkSales, isLinking, linkError, resetLinkError } = useRetailSaleLinking();

  // Re-opening the modal must not inherit the last run's selection — the user
  // would otherwise silently re-link sales they already handled.
  React.useEffect(() => {
    if (!open) return;
    setSelectedFirmId(firmId ?? "");
    setSelected(new Set());
    setNote("");
    setSearch("");
    setDateFilter(DEFAULT_DATE_FILTER);
    setIncludeLinked(false);
    setFormError(null);
    resetLinkError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, firmId]);

  const columns = React.useMemo(() => connectableRetailSaleColumns(), []);

  // Only sales still on screen can be acted on — a selected row that a filter
  // change has scrolled out of the result set must not be silently submitted.
  const visibleSelected = React.useMemo(
    () => sales.filter(s => selected.has(s.saleRef)),
    [sales, selected],
  );
  const selectedTotal = visibleSelected.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const movingCount = visibleSelected.filter(
    s => s.firmId && s.firmId !== selectedFirmId,
  ).length;
  const alreadyHereCount = visibleSelected.filter(s => s.firmId === selectedFirmId).length;

  const selectedFirm = firms.find(f => f.id === selectedFirmId) ?? null;
  const isFiltered = Boolean(debouncedSearch || from || to);

  async function handleConnect() {
    setFormError(null);
    if (!selectedFirmId) return setFormError("Choose the firm these sales belong to.");
    if (visibleSelected.length === 0) return setFormError("Select at least one retail sale to connect.");
    if (alreadyHereCount > 0) {
      return setFormError(
        `${alreadyHereCount} of the selected sale${alreadyHereCount === 1 ? " is" : "s are"} already connected to ${selectedFirm?.firmName ?? "this firm"}. Clear ${alreadyHereCount === 1 ? "it" : "them"} from the selection first.`,
      );
    }

    try {
      const result = await linkSales({
        firmId: selectedFirmId,
        payload: {
          saleRefs: visibleSelected.map(s => s.saleRef),
          note: note.trim() || undefined,
        },
      });
      onLinked?.(selectedFirmId, result.linked);
      onOpenChange(false);
    } catch {
      // linkError renders below; the modal stays open so the selection survives.
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="full">
      <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100dvh - 120px)" }}>
        {/* Header */}
        <div
          className="p-5 sm:px-7 sm:py-6"
          style={{ background: `linear-gradient(100deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, flexShrink: 0 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Link2 size={22} color="#FFFDF9" />
            </div>
            <div>
              <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFFDF9", margin: 0 }}>
                Connect Retail Sales to a Firm
              </h2>
              <p style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.70)", margin: "4px 0 0" }}>
                Book counter sales into a firm&apos;s income. Each sale belongs to one firm.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6" style={{ overflowY: "auto", flex: 1, background: T.silkCream }}>
          {/* Step 1 — the firm */}
          <div style={{ background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 18, marginBottom: 18 }}>
            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: T.taupe, marginBottom: 12 }}>
              Step 1 — Choose the firm
            </div>
            {lockFirm && selectedFirm ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>
                <Building2 size={16} color={T.antiqueGold} />
                <strong>{selectedFirm.firmName}</strong>
                <span style={{ fontSize: 12, color: T.taupe, fontVariantNumeric: "tabular-nums" }}>{selectedFirm.id}</span>
              </div>
            ) : (
              <Field label="Firm" required>
                {/* align="start" — the default "end" right-aligns the menu to
                    the trigger, pushing long labels off the container's edge. */}
                <Select
                  value={selectedFirmId}
                  onValueChange={setSelectedFirmId}
                  placeholder="Select a firm…"
                  align="start"
                  className="w-full"
                >
                  {firms.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.firmName}
                    </SelectItem>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          {/* Step 2 — the sales */}
          <div style={{ background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase", color: T.taupe, marginBottom: 12 }}>
              Step 2 — Select the retail sales
            </div>

            <div style={{ marginBottom: 14 }}>
              <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
            </div>

            <div className="flex flex-col md:flex-row md:items-end gap-3" style={{ marginBottom: 16 }}>
              <div className="flex-1 min-w-0">
                <Field label="Search">
                  <SearchInput
                    aria-label="Search by sale ref, saree id or customer"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Sale ref, saree ID, or customer…"
                  />
                </Field>
              </div>

            </div>

            <div style={{ marginBottom: 16 }}>
              <SwitchField
                checked={includeLinked}
                onCheckedChange={setIncludeLinked}
                label="Also show sales already connected to another firm"
                description="Selecting one of those moves it to this firm."
              />
            </div>

            <DataTable<FirmRetailSale>
              columns={columns}
              data={sales}
              getRowId={s => s.saleRef}
              caption="Retail sales available to connect"
              density="compact"
              responsive
              loading={isLoading}
              error={isError}
              onRetry={refetch}
              isFiltered={isFiltered}
              onClearFilters={() => { setSearch(""); setDateFilter(DEFAULT_DATE_FILTER); }}
              emptyTitle="No retail sales to connect"
              emptyDescription={
                includeLinked
                  ? "No retail sales match these filters."
                  : "Every retail sale is already connected to a firm. Turn on the switch above to move one."
              }
              selectedIds={selected}
              onSelectionChange={setSelected}
            />

            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 10 }}>
              Showing {sales.length} of {total} retail sale{total === 1 ? "" : "s"}
              {isFetching && !isLoading ? " · refreshing…" : ""}
            </div>

            <div style={{ marginTop: 16 }}>
              <Field label="Note (optional)" hint="Why these sales are being booked to this firm.">
                <Textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  maxLength={500}
                  placeholder="e.g. March counter sales settled through this firm's account"
                />
              </Field>
            </div>
          </div>

          {movingCount > 0 && (
            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(200,155,71,0.10)", border: `1px solid ${T.borderGold}`, borderRadius: 12, padding: "12px 14px" }}>
              <AlertTriangle size={16} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.6 }}>
                {movingCount} selected sale{movingCount === 1 ? " is" : "s are"} currently booked to another firm.
                Connecting {movingCount === 1 ? "it" : "them"} here will <strong>move</strong> the revenue off that firm.
              </div>
            </div>
          )}

          {(formError || linkError) && (
            <div role="alert" style={{ marginTop: 16, background: T.crimsonBg, border: `1px solid ${T.crimson}33`, borderRadius: 12, padding: "12px 14px", fontFamily: F.ui, fontSize: 13, color: T.crimson }}>
              {formError ?? linkError?.message ?? "Could not connect these sales."}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
          style={{ borderTop: `1px solid ${T.borderDef}`, background: "#FFF", flexShrink: 0 }}
        >
          <div style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
            <strong>{visibleSelected.length}</strong> sale{visibleSelected.length === 1 ? "" : "s"} selected
            {visibleSelected.length > 0 && (
              <span style={{ marginLeft: 8, fontWeight: 700, color: T.green }}>
                <Money value={rupees(selectedTotal)} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLinking}>
              Cancel
            </Button>
            <Button
              variant="primary"
              iconLeft={Check}
              onClick={() => void handleConnect()}
              loading={isLinking}
              disabled={isLinking || visibleSelected.length === 0 || !selectedFirmId}
            >
              Connect {visibleSelected.length > 0 ? `${visibleSelected.length} ` : ""}Sale{visibleSelected.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
