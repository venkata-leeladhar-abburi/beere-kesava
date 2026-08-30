/**
 * Firm → Retail Sales tab.
 * ═══════════════════════════════════════════════════════════════════════════
 * Every counter sale booked to this firm, shown with the same columns as the
 * Shop Staff sales report so the two screens reconcile line for line, plus the
 * headline numbers an accountant needs: how many sales, what they came to, the
 * average ticket, and how the money was taken.
 *
 * The revenue tile reads the server's aggregate over the whole filtered set,
 * not a sum of the rows on screen, so it stays right when the result is capped.
 */
import React from "react";
import { motion } from "motion/react";
import {
  ShoppingBag, IndianRupee, TrendingUp, Users, Link2, Wallet,
} from "lucide-react";
import type { Firm } from "../../contexts/FirmsContext";
import type { FirmRetailSale } from "../../../../shared/api/firms";
import {
  useFirmRetailSales, useRetailSaleLinking, useRetailSaleFilterOptions,
} from "../../hooks/useFirmRetailSales";
import { firmRetailSaleColumns, customerName, paymentLabel } from "./retailSaleColumns";
import { ConnectRetailSalesModal } from "./ConnectRetailSalesModal";
import { T, F } from "../theme";
import { fmtFull } from "../utils";
import { SectionCard } from "../primitives";
import { Button, SearchInput, Field, Select, SelectItem } from "../../../../shared/ui/primitives";
import { DataTable } from "../../../../shared/ui/data";
import { Money } from "../../../../shared/ui/domain";
import { rupees } from "@/lib/domain/money";
import { useConfirm } from "../../../../shared/ui/overlay";
import {
  DateFilterBar, DEFAULT_DATE_FILTER, type DateFilterState,
} from "../../../../shared/ui/DateFilterBar";
import { filterToRange } from "./dateRange";


function StatTile({ label, value, sub, icon: Icon, accent }: {
  label: string; value: React.ReactNode; sub: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div style={{
      background: accent ? "linear-gradient(135deg, rgba(30,102,64,0.07), rgba(200,155,71,0.07))" : "#FFFDF9",
      border: `1px solid ${accent ? T.borderGold : T.borderDef}`,
      borderRadius: 14, padding: "16px 18px", display: "flex", gap: 13, alignItems: "flex-start",
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: T.bgGold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={19} color={T.antiqueGold} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: T.taupe }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.luxuryBrown, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
        <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

export function FirmRetailSalesTab({ firm, firms }: { firm: Firm; firms: Firm[] }) {
  const confirm = useConfirm();
  const [search, setSearch] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [paymentMethod, setPaymentMethod] = React.useState("all");
  const [soldById, setSoldById] = React.useState("all");
  const [linkType, setLinkType] = React.useState<"all" | "auto" | "manual">("all");
  const [connectOpen, setConnectOpen] = React.useState(false);

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { from, to } = filterToRange(dateFilter);
  const query = React.useMemo(
    () => ({
      search: debouncedSearch,
      from,
      to,
      paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
      soldById: soldById === "all" ? undefined : soldById,
      linkType,
    }),
    [debouncedSearch, from, to, paymentMethod, soldById, linkType],
  );

  const { sales, count, totalAmount, averageAmount, isLoading, isError, refetch } =
    useFirmRetailSales(firm.id, query);
  const { unlinkSale, isUnlinking } = useRetailSaleLinking();
  // Facets come from the firm's whole history, not the current filter, so
  // picking one option never empties the others.
  const { paymentMethods, soldBy } = useRetailSaleFilterOptions(firm.id);

  const handleUnlink = React.useCallback(async (sale: FirmRetailSale) => {
    const confirmed = await confirm({
      title: `Disconnect ${sale.saleRef}?`,
      description: `This removes ${fmtFull(Number(sale.amount) || 0)} from ${firm.firmName}'s income. The sale itself is not deleted — it goes back to the unconnected pool and can be booked to another firm.`,
      confirmLabel: "Disconnect",
      tone: "danger",
    });
    if (!confirmed) return;
    await unlinkSale({ firmId: firm.id, saleRef: sale.saleRef });
  }, [confirm, firm.id, firm.firmName, unlinkSale]);

  const columns = React.useMemo(
    () => firmRetailSaleColumns(sale => void handleUnlink(sale), isUnlinking),
    [handleUnlink, isUnlinking],
  );

  // Derived from the rows on screen — these describe the visible page, and the
  // labels say so, unlike the revenue tile which is a server-side aggregate.
  const uniqueCustomers = React.useMemo(
    () => new Set(sales.map(customerName)).size, [sales],
  );
  const paymentMix = React.useMemo(() => {
    const map = new Map<string, { method: string; count: number; total: number }>();
    for (const s of sales) {
      const method = paymentLabel(s.paymentMethod);
      const entry = map.get(method) ?? { method, count: 0, total: 0 };
      entry.count += 1;
      entry.total += Number(s.amount) || 0;
      map.set(method, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [sales]);

  const isFiltered = Boolean(
    debouncedSearch || from || to || paymentMethod !== "all" || soldById !== "all" || linkType !== "all",
  );
  const clearFilters = () => {
    setSearch("");
    setDateFilter(DEFAULT_DATE_FILTER);
    setPaymentMethod("all");
    setSoldById("all");
    setLinkType("all");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <SectionCard
        icon={ShoppingBag}
        title="Retail Sales"
        subtitle={`Counter sales booked to ${firm.firmName}. Connected sales count as this firm's realized income.`}
        actions={
          <Button
            variant="secondary"
            iconLeft={Link2}
            onClick={() => setConnectOpen(true)}
            className="bg-white/10 text-[#FFFDF9] border-white/20"
          >
            Connect Retail Sales
          </Button>
        }
      >
        {/* Headline numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5" style={{ marginBottom: 20 }}>
          <StatTile
            label="Connected Sales" value={String(count)}
            sub={isFiltered ? "Matching the filters" : "All time"} icon={ShoppingBag}
          />
          <StatTile
            label="Total Revenue" value={<Money value={rupees(totalAmount)} />}
            sub="Counted as firm income" icon={IndianRupee} accent
          />
          <StatTile
            label="Average Sale" value={<Money value={rupees(averageAmount)} />}
            sub="Per connected sale" icon={TrendingUp}
          />
          <StatTile
            label="Customers" value={String(uniqueCustomers)}
            sub="Distinct, on this page" icon={Users}
          />
        </div>

        {/* Payment mix — how the money actually came in */}
        {paymentMix.length > 0 && (
          <div style={{ background: "#FFFDF9", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: T.taupe, marginBottom: 10 }}>
              <Wallet size={14} color={T.antiqueGold} /> Payment mix (this page)
            </div>
            <div className="flex flex-wrap gap-2.5">
              {paymentMix.map(p => (
                <div key={p.method} style={{ background: T.bgGold, border: `1px solid ${T.borderGold}`, borderRadius: 10, padding: "7px 12px", fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown }}>
                  <strong>{p.method}</strong>
                  <span style={{ color: T.taupe }}> · {p.count} sale{p.count === 1 ? "" : "s"} · </span>
                  <span style={{ fontWeight: 700, color: T.green }}><Money value={rupees(p.total)} /></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ marginBottom: 16 }}>
          <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" style={{ marginBottom: 16 }}>
          <Field label="Search">
            <SearchInput
              aria-label="Search connected retail sales"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sale ref, saree ID, or customer…"
            />
          </Field>

          <Field label="Payment method">
            <Select value={paymentMethod} onValueChange={setPaymentMethod} align="start" className="w-full">
              <SelectItem value="all">All payment methods</SelectItem>
              {paymentMethods.map(m => (
                <SelectItem key={m.value} value={m.value}>
                  {paymentLabel(m.value)} ({m.count})
                </SelectItem>
              ))}
            </Select>
          </Field>

          <Field label="Sold by">
            <Select value={soldById} onValueChange={setSoldById} align="start" className="w-full">
              <SelectItem value="all">All staff</SelectItem>
              {soldBy.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </Select>
          </Field>

          <Field label="Booked" hint="Automatically by the rule, or by hand.">
            <Select
              value={linkType}
              onValueChange={v => setLinkType(v as "all" | "auto" | "manual")}
              align="start"
              className="w-full"
            >
              <SelectItem value="all">Any way</SelectItem>
              <SelectItem value="auto">Automatically</SelectItem>
              <SelectItem value="manual">Manually</SelectItem>
            </Select>
          </Field>
        </div>

        {isFiltered && (
          <div style={{ marginBottom: 16 }}>
            <Button variant="tertiary" size="sm" onClick={clearFilters}>Clear all filters</Button>
          </div>
        )}

        <DataTable<FirmRetailSale>
          columns={columns}
          data={sales}
          getRowId={s => s.saleRef}
          caption={`Retail sales connected to ${firm.firmName}`}
          density="compact"
          responsive
          loading={isLoading}
          error={isError}
          onRetry={refetch}
          isFiltered={isFiltered}
          onClearFilters={clearFilters}
          emptyTitle="No retail sales connected yet"
          emptyDescription={`Use “Connect Retail Sales” above to book counter sales into ${firm.firmName}'s income.`}
        />
      </SectionCard>

      <ConnectRetailSalesModal
        open={connectOpen}
        onOpenChange={setConnectOpen}
        firms={firms}
        firmId={firm.id}
        lockFirm
      />
    </motion.div>
  );
}
