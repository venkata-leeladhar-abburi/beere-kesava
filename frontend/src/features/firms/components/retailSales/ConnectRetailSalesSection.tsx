/**
 * Firms page → "Retail Sales Firm".
 * ═══════════════════════════════════════════════════════════════════════════
 * One firm at a time is the retail firm. Every counter sale rung up from that
 * moment on is booked to it automatically — shop staff never pick a firm, and
 * nobody has to tick sales afterwards. Setting it also books every sale that is
 * currently unconnected, so the firm starts from a complete picture.
 *
 * Switching later moves only FUTURE sales; anything already booked stays where
 * it is, because a firm's closed books are not rewritten by a settings change.
 * The manual picker below is kept for corrections, not for normal use.
 */
import React from "react";
import { useQueries } from "@tanstack/react-query";
import {
  Link2, ShoppingBag, ArrowRight, AlertCircle, CheckCircle2, Power,
} from "lucide-react";
import type { Firm } from "../../contexts/FirmsContext";
import { firmsApi } from "../../../../shared/api/firms";
import {
  firmRetailSalesKey, useConnectableRetailSales,
  useRetailSalesFirm, useRetailSalesFirmControl,
} from "../../hooks/useFirmRetailSales";
import { ConnectRetailSalesModal } from "./ConnectRetailSalesModal";
import { T, F } from "../theme";
import { fmtFull } from "../utils";
import { SectionCard } from "../primitives";
import { Button, Field, Select, SelectItem } from "../../../../shared/ui/primitives";
import { Money } from "../../../../shared/ui/domain";
import { useConfirm } from "../../../../shared/ui/overlay";
import { rupees } from "@/lib/domain/money";

const EMPTY_QUERY = {} as const;

export function ConnectRetailSalesSection({
  firms, onGoToRetailSales,
}: {
  firms: Firm[];
  /** Opens the firm's page directly on its Retail Sales tab. */
  onGoToRetailSales: (firmId: string) => void;
}) {
  const confirm = useConfirm();
  const [pickedFirmId, setPickedFirmId] = React.useState("");
  const [connectOpen, setConnectOpen] = React.useState(false);

  const { activeFirm, isLoading: activeLoading } = useRetailSalesFirm();
  const { setActiveFirm, clearActiveFirm, isSettingFirm, isClearingFirm, setFirmError } =
    useRetailSalesFirmControl();

  // How much is still unbooked — with an active firm this should sit at zero,
  // so anything above it is a signal, not just a number.
  const { total: unconnectedCount, sales: unconnectedSample } =
    useConnectableRetailSales(EMPTY_QUERY);
  const unconnectedValue = unconnectedSample.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const perFirm = useQueries({
    queries: firms.map(firm => ({
      queryKey: firmRetailSalesKey(firm.id, EMPTY_QUERY),
      queryFn: () => firmsApi.listRetailSales(firm.id, EMPTY_QUERY),
    })),
  });

  const connectedTotal = perFirm.reduce((sum, q) => sum + (q.data?.totalAmount ?? 0), 0);
  const connectedCount = perFirm.reduce((sum, q) => sum + (q.data?.total ?? 0), 0);

  const firmRows = firms
    .map((firm, i) => ({
      firm,
      count: perFirm[i]?.data?.total ?? 0,
      amount: perFirm[i]?.data?.totalAmount ?? 0,
    }))
    .filter(r => r.count > 0)
    .sort((a, b) => b.amount - a.amount);

  const pickedFirm = firms.find(f => f.id === pickedFirmId) ?? null;
  const isSwitch = Boolean(activeFirm && pickedFirmId && activeFirm.id !== pickedFirmId);

  async function handleSetActive() {
    if (!pickedFirmId || !pickedFirm) return;

    const confirmed = await confirm({
      title: isSwitch
        ? `Switch retail sales to ${pickedFirm.firmName}?`
        : `Make ${pickedFirm.firmName} the retail firm?`,
      description: isSwitch
        ? `Every new counter sale will be booked to ${pickedFirm.firmName} from now on. Sales already booked to ${activeFirm?.firmName} stay with that firm — this does not rewrite past books.${unconnectedCount > 0 ? ` ${unconnectedCount} currently unconnected sale${unconnectedCount === 1 ? "" : "s"} will also be booked to ${pickedFirm.firmName}.` : ""}`
        : `Every new counter sale will be booked to ${pickedFirm.firmName} automatically.${unconnectedCount > 0 ? ` ${unconnectedCount} currently unconnected sale${unconnectedCount === 1 ? "" : "s"} will be booked to it now.` : ""}`,
      confirmLabel: isSwitch ? "Switch firm" : "Set as retail firm",
      tone: "primary",
    });
    if (!confirmed) return;

    const result = await setActiveFirm(pickedFirmId);
    setPickedFirmId("");
    if (result.backfilled > 0) onGoToRetailSales(result.firmId);
  }

  async function handleClearActive() {
    const confirmed = await confirm({
      title: `Stop booking retail sales to ${activeFirm?.firmName}?`,
      description: "New counter sales will be left unconnected until you set a retail firm again. Sales already booked keep their firm — nothing is removed from anyone's income.",
      confirmLabel: "Stop automatic booking",
      tone: "danger",
    });
    if (!confirmed) return;
    await clearActiveFirm();
  }

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40 }}>
      <SectionCard
        icon={Link2}
        title="Retail Sales Firm"
        subtitle="Counter sales are booked to one firm automatically. Set that firm here."
        actions={
          <Button
            variant="secondary"
            iconLeft={Link2}
            onClick={() => setConnectOpen(true)}
            disabled={firms.length === 0}
            className="bg-white/10 text-[#FFFDF9] border-white/20"
          >
            Move Sales Manually
          </Button>
        }
      >
        {firms.length === 0 ? (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "16px 18px", background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 12 }}>
            <AlertCircle size={16} color={T.antiqueGold} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, lineHeight: 1.6 }}>
              Add a firm first — retail sales are booked <em>to</em> a firm, so there has to be one to book them to.
            </div>
          </div>
        ) : (
          <>
            {/* Who is currently receiving retail sales */}
            <div
              style={{
                display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14,
                padding: "16px 18px", marginBottom: 20, borderRadius: 14,
                background: activeFirm ? "rgba(30,102,64,0.07)" : T.crimsonBg,
                border: `1px solid ${activeFirm ? "rgba(30,102,64,0.22)" : `${T.crimson}33`}`,
              }}
            >
              {activeFirm ? <CheckCircle2 size={20} color={T.green} /> : <AlertCircle size={20} color={T.crimson} />}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: T.taupe }}>
                  Currently booking retail sales to
                </div>
                <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 700, color: activeFirm ? T.green : T.crimson, marginTop: 3 }}>
                  {activeLoading ? "…" : activeFirm ? activeFirm.firmName : "No firm set"}
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>
                  {activeFirm
                    ? "Every new counter sale is booked here automatically."
                    : "New counter sales are being left unconnected. Choose a firm below."}
                </div>
              </div>
              {activeFirm && (
                <div className="flex flex-wrap gap-2.5">
                  <Button variant="secondary" iconRight={ArrowRight} onClick={() => onGoToRetailSales(activeFirm.id)}>
                    View Firm&apos;s Sales
                  </Button>
                  <Button variant="tertiary" iconLeft={Power} onClick={() => void handleClearActive()} loading={isClearingFirm}>
                    Stop
                  </Button>
                </div>
              )}
            </div>

            {/* Choose / switch the firm */}
            <div className="flex flex-col lg:flex-row lg:items-end gap-3.5" style={{ marginBottom: 20 }}>
              <div className="flex-1 min-w-0 max-w-full lg:max-w-[420px]">
                <Field
                  label={activeFirm ? "Switch to a different firm" : "Firm"}
                  hint="New counter sales are booked to this firm from the moment you set it."
                >
                  {/* align="start" — the default "end" right-aligns the menu to
                      the trigger, which pushes long "name · GST" labels off the
                      left edge of the card. */}
                  <Select
                    value={pickedFirmId}
                    onValueChange={setPickedFirmId}
                    placeholder="Select a firm…"
                    align="start"
                    className="w-full"
                  >
                    {firms.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.firmName}{f.id === activeFirm?.id ? " · current" : ""}
                      </SelectItem>
                    ))}
                  </Select>
                </Field>
              </div>
              <Button
                variant="primary"
                iconLeft={CheckCircle2}
                disabled={!pickedFirmId || pickedFirmId === activeFirm?.id}
                loading={isSettingFirm}
                onClick={() => void handleSetActive()}
              >
                {isSwitch ? "Switch Retail Firm" : "Set as Retail Firm"}
              </Button>
            </div>

            {setFirmError && (
              <div role="alert" style={{ marginBottom: 20, background: T.crimsonBg, border: `1px solid ${T.crimson}33`, borderRadius: 12, padding: "12px 14px", fontFamily: F.ui, fontSize: 13, color: T.crimson }}>
                {setFirmError.message}
              </div>
            )}

            {/* Where things stand */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5" style={{ marginBottom: 20 }}>
              {[
                {
                  key: "unconnected",
                  label: "Unconnected Sales",
                  value: String(unconnectedCount),
                  sub: unconnectedCount === 0
                    ? "Everything is booked"
                    : unconnectedSample.length < unconnectedCount
                      ? `${fmtFull(unconnectedValue)} across the latest ${unconnectedSample.length}`
                      : fmtFull(unconnectedValue),
                  tone: unconnectedCount > 0 ? T.crimson : T.green,
                },
                { key: "count", label: "Connected Sales", value: String(connectedCount), sub: "Across all firms", tone: T.luxuryBrown },
                { key: "revenue", label: "Connected Revenue", value: <Money value={rupees(connectedTotal)} />, sub: "Counted as firm income", tone: T.green },
              ].map(s => (
                <div key={s.key} style={{ background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "15px 18px" }}>
                  <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: T.taupe }}>{s.label}</div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: s.tone, marginTop: 5, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                  <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 3 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Per-firm breakdown — each row opens that firm's Retail Sales tab */}
            {firmRows.length > 0 && (
              <div style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", background: T.bgGold, borderBottom: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: T.taupe }}>
                  <ShoppingBag size={14} color={T.antiqueGold} /> Retail sales by firm
                </div>
                {firmRows.map(r => (
                  <button
                    key={r.firm.id}
                    type="button"
                    onClick={() => onGoToRetailSales(r.firm.id)}
                    className="w-full flex items-center justify-between gap-4 text-left hover:bg-[rgba(200,155,71,0.06)] transition-colors"
                    style={{ padding: "13px 16px", borderBottom: `1px solid ${T.borderDef}`, background: "transparent" }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.firm.firmName}
                        {r.firm.id === activeFirm?.id && (
                          <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: T.green, background: "rgba(30,102,64,0.10)", border: "1px solid rgba(30,102,64,0.22)", borderRadius: 999, padding: "2px 8px" }}>
                            Active
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: T.taupe, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{r.firm.id}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.green }}><Money value={rupees(r.amount)} /></div>
                        <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 2 }}>{r.count} sale{r.count === 1 ? "" : "s"}</div>
                      </div>
                      <ArrowRight size={16} color={T.taupe} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </SectionCard>

      <ConnectRetailSalesModal
        open={connectOpen}
        onOpenChange={setConnectOpen}
        firms={firms}
        firmId={pickedFirmId || activeFirm?.id || undefined}
      />
    </div>
  );
}
