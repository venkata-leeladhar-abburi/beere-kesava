import React from "react";
import { motion } from "motion/react";
import { Search, PhoneCall, UserPlus, Pencil, Check, MapPin } from "lucide-react";
import { C, F, Card } from "./theme";
import { StepHeader, StepBody, FlowActions, ACCENT_SALE } from "./flow-kit";
import { Button, Input, Textarea } from "../../../../shared/ui/primitives";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  purchases: number;
  total: string;
  lastPurchase: string;
  initials: string;
}

interface CustomerSelectStepProps {
  custSearch: string;
  setCustSearch: (v: string) => void;
  showCustomerList: boolean;
  setShowCustomerList: (v: boolean) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;
  filteredCustomers: Customer[];
  customersLoading?: boolean;
  isEditingCustomer: boolean;
  setIsEditingCustomer: (v: boolean) => void;
  isNewCustomer: boolean;
  setIsNewCustomer: (v: boolean) => void;
  custName: string;
  setCustName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  custAddress: string;
  setCustAddress: (v: string) => void;
  isMobile?: boolean;
  handleSelectCustomer: (c: Customer) => void;
  handleAddNew: () => void;
  canProceedStep1: boolean;
  onNext: () => void;
}

export function CustomerSelectStep({
  custSearch,
  setCustSearch,
  showCustomerList,
  setShowCustomerList,
  selectedCustomer,
  setSelectedCustomer,
  filteredCustomers,
  customersLoading,
  isEditingCustomer,
  setIsEditingCustomer,
  isNewCustomer,
  setIsNewCustomer,
  custName,
  setCustName,
  phone,
  setPhone,
  custAddress,
  setCustAddress,
  isMobile,
  handleSelectCustomer,
  handleAddNew,
  canProceedStep1,
  onNext,
}: CustomerSelectStepProps) {
  return (
    <>
      <StepBody>
        <StepHeader
          title="Who is buying?"
          subtitle="Search an existing customer by name or phone — their details fill in automatically. Otherwise add a new one."
        />

      {/* Customer Search Input */}
      {!isNewCustomer && (
        <div style={{ marginBottom: 14, position: "relative" as const }}>
          <div style={{ position: "relative" as const }}>
            <Input
              value={custSearch}
              onChange={e => { setCustSearch(e.target.value); setShowCustomerList(true); if (selectedCustomer) setSelectedCustomer(null); }}
              onFocus={() => setShowCustomerList(true)}
              placeholder="Search by name or phone number..."
              size="lg"
              iconLeft={Search}
              iconRight={PhoneCall}
              className={showCustomerList && !selectedCustomer ? "rounded-b-none border-[#6E0F2D]" : ""}
            />
          </div>

          {/* Customer dropdown */}
          {showCustomerList && !selectedCustomer && (
            <div style={{
              background: C.white, border: `1.5px solid ${C.burg}`, borderTop: "none",
              borderRadius: "0 0 14px 14px",
              boxShadow: "0 8px 24px rgba(44,24,16,0.12)", overflow: "hidden",
            }}>
              <div style={{ padding: "8px 14px", background: "rgba(110,15,45,0.03)", borderBottom: `1px solid ${C.bdr}` }}>
                <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
                  {customersLoading ? "Loading…" : custSearch.length >= 2 ? `${filteredCustomers.length} result${filteredCustomers.length !== 1 ? "s" : ""} for "${custSearch}"` : "Recent Customers"}
                </span>
              </div>
              {customersLoading ? (
                <div style={{ padding: "16px 14px", fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" as const }}>Loading customers…</div>
              ) : filteredCustomers.length > 0 ? filteredCustomers.slice(0, 4).map((c, i) => (
                <Button key={c.id} variant="tertiary" fullWidth onClick={() => handleSelectCustomer(c)}
                  className={`justify-start gap-3 rounded-none border-0 px-3.5 py-3 ${i < Math.min(filteredCustomers.length, 4) - 1 ? "border-b border-[rgba(110,15,45,0.12)]" : ""}`}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${C.burg}, ${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{c.initials}</span>
                  </div>
                  <div style={{ flex: 1, textAlign: "left" as const }}>
                    <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{c.name}</div>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 1 }}>+91 {c.phone}</div>
                  </div>
                  <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{c.purchases} purchases</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.gold }}>{c.lastPurchase}</div>
                  </div>
                </Button>
              )) : (
                <div style={{ padding: "14px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No customer found for "{custSearch}"</div>
                </div>
              )}
              {/* Add new customer option */}
              <Button variant="tertiary" fullWidth onClick={handleAddNew}
                className="justify-start gap-2.5 rounded-none border-0 border-t border-[rgba(110,15,45,0.12)] bg-[rgba(110,15,45,0.04)] px-3.5 py-3 hover:bg-[rgba(110,15,45,0.04)]">
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(110,15,45,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserPlus size={14} color={C.burg} />
                </div>
                <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.burg }}>Add New Customer</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Selected customer card */}
      {selectedCustomer && !isEditingCustomer && (
        <motion.div key="selected-cust" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card style={{ marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${C.green}, rgba(30,102,64,0.3))` }} />
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg, ${C.burg}, ${C.dark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: "#FFF" }}>{selectedCustomer.initials}</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 14, color: C.text }}>{selectedCustomer.name}</div>
                    <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>+91 {selectedCustomer.phone}</div>
                  </div>
                </div>
                <Button variant="tertiary" size="sm" iconLeft={Pencil} onClick={() => setIsEditingCustomer(true)}
                  className="rounded-lg border border-[rgba(110,15,45,0.12)] bg-[rgba(110,15,45,0.07)] px-2.5 py-1.5 hover:bg-[rgba(110,15,45,0.07)]">
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.burg }}>Edit</span>
                </Button>
              </div>
              <div className="grid-cols-1 md:grid-cols-3" style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                {[
                  { val: String(selectedCustomer.purchases), label: "Purchases", color: C.burg },
                  { val: selectedCustomer.total, label: "Lifetime", color: C.gold },
                  { val: selectedCustomer.lastPurchase, label: "Last Visit", color: C.green },
                ].map((s) => (
                  <div key={s.label} style={{ background: "rgba(110,15,45,0.04)", borderRadius: 10, padding: "8px 10px", textAlign: "center" as const }}>
                    <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: s.color, lineHeight: 1.3 }}>{s.val}</div>
                    <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(30,102,64,0.06)", border: `1px solid rgba(30,102,64,0.20)`, borderRadius: 8, padding: "8px 12px" }}>
                <Check size={13} color={C.green} />
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.green }}>Existing customer — details filled automatically</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Edit existing or new customer form */}
      {(isEditingCustomer || isNewCustomer) && (
        <motion.div key="cust-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            {isNewCustomer && (
              <div style={{ background: "rgba(200,155,71,0.10)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={14} color={C.gold} />
                <span style={{ fontFamily: F.u, fontSize: 12, color: "#8B6520" }}>New Customer — A profile will be created after this sale</span>
              </div>
            )}
            {isEditingCustomer && (
              <div style={{ background: "rgba(110,15,45,0.06)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Pencil size={14} color={C.burg} />
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.burg }}>Editing {selectedCustomer?.name}'s details</span>
              </div>
            )}
            <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? undefined : "1fr 1fr", gap: isMobile ? 0 : 16 }}>
              {[
                { id: "cust-name", label: "Full Name", val: custName, setter: setCustName, placeholder: "e.g. Smt. Annapurna Devi", type: "text", mono: false },
                { id: "cust-phone", label: "Phone Number", val: phone, setter: setPhone, placeholder: "10-digit mobile number", type: "tel", mono: true },
              ].map((f) => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <label htmlFor={f.id} style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.text, display: "block", marginBottom: 8 }}>{f.label}</label>
                  <Input id={f.id} value={f.val} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} type={f.type}
                    size="lg" className={f.mono ? "w-full font-mono" : "w-full"}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label htmlFor="customer-address" style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.text, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <MapPin size={14} color={C.muted} /> Address <span style={{ color: C.muted, fontWeight: 400 }}>(Optional)</span>
              </label>
              <Textarea id="customer-address" value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder="Door number, street, city..." rows={2}
                className="w-full resize-none"
              />
            </div>
            {isEditingCustomer && (
              <Button variant="link" onClick={() => setIsEditingCustomer(false)} className="mb-3.5 p-0 text-xs text-[#69635E] underline">
                ← Cancel — keep original details
              </Button>
            )}
            {isNewCustomer && (
              <Button variant="link" onClick={() => { setIsNewCustomer(false); setCustSearch(""); }} className="mb-3.5 p-0 text-xs text-[#69635E] underline">
                ← Search existing customers instead
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Shortcut if no customer selected */}
      {!selectedCustomer && !isNewCustomer && !showCustomerList && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: C.bdr }} />
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.bdr }} />
          </div>
          <Button variant="secondary" fullWidth iconLeft={UserPlus} onClick={handleAddNew}
            className="h-[50px] rounded-xl border-[1.5px] border-dashed border-[rgba(110,15,45,0.30)] bg-transparent text-[#6E0F2D]">
            Add New Customer
          </Button>
        </div>
      )}

      </StepBody>

      <FlowActions
        accent={ACCENT_SALE}
        primaryLabel="Next — Scan Saree"
        onPrimary={onNext}
        primaryDisabled={!canProceedStep1}
        hint="Pick a customer, or add a new one with a name"
      />
    </>
  );
}
