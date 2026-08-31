import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Check, X, Clock } from "lucide-react";
import { T, F, cardStyle, labelStyle } from "./theme";
import { SectionCard, GoldLink } from "./sharedUI";
import { Button, NumberInput, Textarea, Input } from "../../../../shared/ui/primitives";
import { customersApi, BackendCustomer } from "../../../../shared/api/customers";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { MobileFilterBar } from "../../../../shared/ui/filter/MobileFilterBar";
import { LoadingState, ErrorState, EmptyState } from "../../../../shared/ui/state";

interface CustomerTermsState {
  termsDays: number;
  notes: string;
}

export function WholesaleTermsSection() {
  const [editTermsRowId, setEditTermsRowId] = useState<string | null>(null);
  const [editAlertDay, setEditAlertDay] = useState(false);
  const [globalAlertDay, setGlobalAlertDay] = useState(45);
  const [tempAlertDay, setTempAlertDay] = useState(45);
  const [search, setSearch] = useState("");

  const [customerTerms, setCustomerTerms] = useState<Record<string, CustomerTermsState>>({});
  const [editForm, setEditForm] = useState<{ days: number; notes: string }>({ days: 30, notes: "" });

  const { data: customersRes, isLoading, isError, refetch } = useQuery({
    queryKey: ["wholesale-terms-customers"],
    queryFn: () => customersApi.list(),
  });

  const wholesaleCustomers = useMemo(() => {
    const list = (customersRes?.items ?? []).filter(c => c.type === "WHOLESALE");
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
  }, [customersRes, search]);

  const editingCust = wholesaleCustomers.find(c => c.id === editTermsRowId);

  const handleEditClick = (cust: BackendCustomer) => {
    if (editTermsRowId === cust.id) {
      setEditTermsRowId(null);
    } else {
      setEditTermsRowId(cust.id);
      const current = customerTerms[cust.id] || { termsDays: 30, notes: "" };
      setEditForm({ days: current.termsDays, notes: current.notes });
    }
  };

  const handleSaveTerms = (id: string) => {
    setCustomerTerms(prev => ({
      ...prev,
      [id]: { termsDays: editForm.days, notes: editForm.notes },
    }));
    setEditTermsRowId(null);
  };

  const columns: ColumnDef<BackendCustomer>[] = [
    { id: "name", header: "Customer Name", accessor: c => c.name, cell: v => <span style={{ fontWeight: 500 }}>{v as string}</span> },
    {
      id: "code", header: "Code", accessor: c => c.id.slice(-6).toUpperCase(),
      cell: v => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.royalBurgundy }}>WHL-{v as string}</span>,
    },
    {
      id: "terms", header: "Current Terms", accessor: c => customerTerms[c.id]?.termsDays || 30,
      cell: v => (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.luxuryBrown, background: T.cream, padding: "3px 10px", borderRadius: 6 }}>
          {v as number} days
        </span>
      ),
    },
    {
      id: "alertStarts", header: "Alert Starts", accessor: () => globalAlertDay,
      cell: v => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.antiqueGold }}>Day {v as number}</span>,
    },
    {
      id: "overdueFrom", header: "Overdue From", accessor: () => globalAlertDay + 1,
      cell: v => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.crimson }}>Day {v as number}</span>,
    },
    {
      id: "lastChanged", header: "Last Changed", accessor: c => c.createdAt,
      cell: v => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: T.taupe }}>{new Date(v as string).toLocaleDateString("en-IN")}</span>,
    },
    {
      id: "edit", header: "Edit", accessor: () => null,
      cell: (_v, c) => (
        <Button
          variant="secondary" size="sm" iconLeft={Edit2}
          className="rounded-[10px] border-[#6E0F2D] text-[#6E0F2D] h-auto py-[5px] px-3 text-[12px] font-medium"
          onClick={() => handleEditClick(c)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 40 }}>
    <SectionCard
      icon={Clock}
      title="Wholesale Payment Terms"
      subtitle="Configure payment terms and overdue alert thresholds for each wholesale customer. Alert start day is a global setting applied to all customers."
    >
      {/* Global Alert Setting Strip */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          background: "rgba(200,155,71,0.08)", border: `1px solid rgba(200,155,71,0.28)`,
          borderRadius: 12, padding: "14px 20px", marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <Clock size={16} color={T.antiqueGold} className="shrink-0" />
          <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, lineHeight: 1.5 }}>
            Payment alerts start from:{" "}
            <strong style={{ color: T.antiqueGold, fontSize: 14 }}>Day {globalAlertDay}</strong>{" "}
            for all customers
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!editAlertDay ? (
            <div className="shrink-0 whitespace-nowrap">
              <GoldLink onClick={() => { setTempAlertDay(globalAlertDay); setEditAlertDay(true); }}>
                <Edit2 size={12} /> Edit Alert Day
              </GoldLink>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
              className="shrink-0"
            >
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>Alert starts from Day:</span>
              <NumberInput value={tempAlertDay} onValueChange={v => setTempAlertDay(Number(v))} className="w-[70px] bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]" />
              <Button onClick={() => { setGlobalAlertDay(tempAlertDay); setEditAlertDay(false); }} className="rounded-[14px] bg-[#1E6640] text-white hover:bg-[#1E6640]/90 px-3.5 py-1.5 text-[12px] font-semibold h-auto" variant="primary">
                Save
              </Button>
              <Button variant="secondary" className="rounded-[14px] h-auto px-3 py-1.5 text-[12px]" onClick={() => setEditAlertDay(false)}>
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Flipkart-style Filter Bar */}
      <div className="md:hidden mb-4 bg-white p-3.5 rounded-2xl border border-[var(--border-default)] shadow-xs">
        <MobileFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search customer by name or code..."
          filterGroups={[]}
          onResetAll={() => setSearch("")}
        />
      </div>

      {/* Desktop Filter Bar */}
      <div className="hidden md:flex items-center justify-between gap-4 mb-4">
        <div className="w-[280px]">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer by name or code..."
            className="h-10 text-sm font-sans"
          />
        </div>
      </div>

      {/* Payment Terms Table */}
      <div id="wholesale-payment-terms-table" style={cardStyle}>
        {isLoading ? (
          <LoadingState variant="skeleton" rows={4} />
        ) : isError ? (
          <ErrorState error={undefined} onRetry={() => void refetch()} />
        ) : wholesaleCustomers.length === 0 ? (
          <EmptyState title="No wholesale customers yet" description="Wholesale customers registered in the system will show up here." />
        ) : (
          <DataTable
            columns={columns}
            data={wholesaleCustomers}
            getRowId={c => c.id}
            rowClassName={c => editTermsRowId === c.id ? "bg-[rgba(110,15,45,0.05)]" : undefined}
          />
        )}
      </div>

      {/* Standalone Edit Form Card (Zero horizontal scroll) */}
      <AnimatePresence>
        {editingCust && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden mt-4"
          >
            <div style={{ ...cardStyle, padding: 24, border: `2px solid ${T.antiqueGold}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown }}>
                  Editing Payment Terms: <span style={{ color: T.royalBurgundy }}>{editingCust.name}</span>
                </div>
                <Button
                  variant="ghost" size="sm" iconLeft={X}
                  className="text-[var(--text-tertiary)] hover:bg-black/5 rounded-full p-2 h-auto"
                  onClick={() => setEditTermsRowId(null)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle} htmlFor="payment-terms-days">Payment Terms (Days) *</label>
                  <NumberInput
                    id="payment-terms-days"
                    value={editForm.days}
                    onValueChange={v => setEditForm(f => ({ ...f, days: Number(v) }))}
                    className="bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]"
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="notes">Notes</label>
                  <Textarea
                    id="notes"
                    rows={2}
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    className="resize-none bg-[#FFF8F0] border-[rgba(110,15,45,0.18)]"
                    placeholder="Optional notes about this customer's terms…"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button
                  variant="primary"
                  iconLeft={Check}
                  className="rounded-full bg-[#1E6640] hover:bg-[#1E6640]/90 h-auto px-6 py-2.5 text-[13px] font-semibold"
                  onClick={() => handleSaveTerms(editingCust.id)}
                >
                  Save Terms
                </Button>
                <Button
                  variant="secondary"
                  iconLeft={X}
                  className="rounded-full h-auto px-5 py-2.5 text-[13px]"
                  onClick={() => setEditTermsRowId(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SectionCard>
    </div>
  );
}
