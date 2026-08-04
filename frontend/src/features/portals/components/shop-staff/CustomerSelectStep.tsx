import React from "react";
import { motion } from "motion/react";
import { Search, PhoneCall, UserPlus, Pencil, Check, MapPin } from "lucide-react";
import { C, F, Card, Btn } from "./theme";

export interface Customer {
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
    <div style={{ marginTop: 12 }}>
      <div style={{ margin: "0 20px 16px" }}>
        <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>Customer Details</div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Search a previous customer or add a new one</div>
      </div>

      {/* Customer Search Input */}
      {!isNewCustomer && (
        <div style={{ margin: "0 20px 12px", position: "relative" as const }}>
          <div style={{ position: "relative" as const }}>
            <Search size={16} color={C.muted} style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" as const }} />
            <input
              value={custSearch}
              onChange={e => { setCustSearch(e.target.value); setShowCustomerList(true); if (selectedCustomer) setSelectedCustomer(null); }}
              onFocus={() => setShowCustomerList(true)}
              placeholder="Search by name or phone number..."
              style={{
                width: "100%", height: 52, background: C.inp,
                border: `1.5px solid ${showCustomerList && !selectedCustomer ? C.burg : C.bdr}`,
                borderRadius: showCustomerList && !selectedCustomer ? "12px 12px 0 0" : 12,
                padding: "0 46px 0 42px",
                fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const,
              }}
            />
            <PhoneCall size={14} color={C.gold} style={{ position: "absolute" as const, right: 14, top: "50%", transform: "translateY(-50%)" }} />
          </div>

          {/* Customer dropdown */}
          {showCustomerList && !selectedCustomer && (
            <div style={{
              background: C.white, border: `1.5px solid ${C.burg}`, borderTop: "none",
              borderRadius: "0 0 14px 14px",
              boxShadow: "0 8px 24px rgba(44,24,16,0.12)", overflow: "hidden",
            }}>
              <div style={{ padding: "8px 14px", background: "rgba(107,26,42,0.03)", borderBottom: `1px solid ${C.bdr}` }}>
                <span style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
                  {custSearch.length >= 2 ? `${filteredCustomers.length} result${filteredCustomers.length !== 1 ? "s" : ""} for "${custSearch}"` : "Recent Customers"}
                </span>
              </div>
              {filteredCustomers.length > 0 ? filteredCustomers.slice(0, 4).map((c, i) => (
                <button key={i} onClick={() => handleSelectCustomer(c)} style={{
                  width: "100%", background: "none", border: "none",
                  borderBottom: i < Math.min(filteredCustomers.length, 4) - 1 ? `1px solid ${C.bdr}` : "none",
                  padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                }}>
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
                </button>
              )) : (
                <div style={{ padding: "14px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>No customer found for "{custSearch}"</div>
                </div>
              )}
              {/* Add new customer option */}
              <button onClick={handleAddNew} style={{
                width: "100%", background: "rgba(107,26,42,0.04)", border: "none",
                borderTop: `1px solid ${C.bdr}`, padding: "12px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(107,26,42,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserPlus size={14} color={C.burg} />
                </div>
                <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.burg }}>Add New Customer</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selected customer card */}
      {selectedCustomer && !isEditingCustomer && (
        <motion.div key="selected-cust" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card style={{ margin: "0 20px 14px", overflow: "hidden" }}>
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
                <button onClick={() => setIsEditingCustomer(true)} style={{ background: "rgba(107,26,42,0.07)", border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Pencil size={12} color={C.burg} />
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.burg }}>Edit</span>
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { val: String(selectedCustomer.purchases), label: "Purchases", color: C.burg },
                  { val: selectedCustomer.total, label: "Lifetime", color: C.gold },
                  { val: selectedCustomer.lastPurchase, label: "Last Visit", color: C.green },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(107,26,42,0.04)", borderRadius: 10, padding: "8px 10px", textAlign: "center" as const }}>
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
          <div style={{ margin: "0 20px" }}>
            {isNewCustomer && (
              <div style={{ background: "rgba(196,146,58,0.10)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={14} color={C.gold} />
                <span style={{ fontFamily: F.u, fontSize: 12, color: "#8B6520" }}>New Customer — A profile will be created after this sale</span>
              </div>
            )}
            {isEditingCustomer && (
              <div style={{ background: "rgba(107,26,42,0.06)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Pencil size={14} color={C.burg} />
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.burg }}>Editing {selectedCustomer?.name}'s details</span>
              </div>
            )}
            <div style={{ display: isMobile ? "block" : "grid", gridTemplateColumns: isMobile ? undefined : "1fr 1fr", gap: isMobile ? 0 : 16 }}>
              {[
                { label: "Full Name", val: custName, setter: setCustName, placeholder: "e.g. Smt. Annapurna Devi", type: "text", mono: false },
                { label: "Phone Number", val: phone, setter: setPhone, placeholder: "10-digit mobile number", type: "tel", mono: true },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.text, display: "block", marginBottom: 8 }}>{f.label}</label>
                  <input value={f.val} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} type={f.type}
                    style={{ width: "100%", height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: f.mono ? F.m : F.u, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.text, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <MapPin size={14} color={C.muted} /> Address <span style={{ color: C.muted, fontWeight: 400 }}>(Optional)</span>
              </label>
              <textarea value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder="Door number, street, city..." rows={2}
                style={{ width: "100%", background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "12px 16px", fontFamily: F.u, fontSize: 14, color: C.text, outline: "none", resize: "none" as const, boxSizing: "border-box" as const }}
              />
            </div>
            {isEditingCustomer && (
              <button onClick={() => setIsEditingCustomer(false)} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.muted, cursor: "pointer", marginBottom: 14, padding: 0, textDecoration: "underline" }}>
                ← Cancel — keep original details
              </button>
            )}
            {isNewCustomer && (
              <button onClick={() => { setIsNewCustomer(false); setCustSearch(""); }} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.muted, cursor: "pointer", marginBottom: 14, padding: 0, textDecoration: "underline" }}>
                ← Search existing customers instead
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Shortcut if no customer selected */}
      {!selectedCustomer && !isNewCustomer && !showCustomerList && (
        <div style={{ margin: "4px 20px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: C.bdr }} />
            <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>or</span>
            <div style={{ flex: 1, height: 1, background: C.bdr }} />
          </div>
          <button onClick={handleAddNew} style={{ width: "100%", height: 50, borderRadius: 12, border: `1.5px dashed rgba(107,26,42,0.30)`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <UserPlus size={16} color={C.burg} />
            <span style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.burg }}>Add New Customer</span>
          </button>
        </div>
      )}

      <div style={{ padding: "8px 20px 0", display: "flex", gap: 10 }}>
        <Btn
          label="Next — Scan Saree →"
          onClick={() => canProceedStep1 ? onNext() : undefined}
          style={{ flex: 1, background: canProceedStep1 ? C.burg : "#C0C0C0", cursor: canProceedStep1 ? "pointer" : "not-allowed" }}
        />
      </div>
    </div>
  );
}
