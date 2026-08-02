

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Search, Bell, LogOut, Package, IndianRupee, RotateCcw, 
  Users, BarChart3, ChevronRight, UserRound, ArrowLeft, Plus, MapPin, 
  Phone, Eye, Download, Printer, Filter, Calendar, Activity,
  ShoppingCart, Store, ArrowRight, Tag, Wallet, CreditCard, ChevronDown, CheckCircle2,
  TrendingUp, ArrowDownRight, ArrowUpRight, TrendingDown,
  UserPlus, Camera, Check, ChevronLeft, Flower2, MessageSquare, PhoneCall, Pencil
} from 'lucide-react';

import { getSareeTypeByCode } from '../../../../app/components/RatesPricingPage';
import { useResponsive } from '../../../../app/components/useResponsive';
import { C, F, TEAL, Card, Btn, Chip, ShopPriceContext, useCanSeePrices, HeroHeader } from './theme';
function NewSaleFlow() {
  const canSeePrices = useCanSeePrices();
  const { isMobile, isTablet } = useResponsive();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | "success">(1);
  const [sareeFound, setSareeFound] = useState(false);
  const [manualId, setManualId] = useState("");
  const [payment, setPayment] = useState<"cash" | "upi" | "card" | "other" | null>(null);
  const [payRef, setPayRef] = useState("");
  const [phone, setPhone] = useState("");
  const [custName, setCustName] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [showBill, setShowBill] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<{ name: string; phone: string; purchases: number; total: string; lastPurchase: string; initials: string } | null>(null);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const saree = { id: "PADMA-L1-004", design: "BKB-045", name: "Cream Zari Border Saree", type: "Self Brocade · SB-001", typeCode: "SB-001", weight: "842 grams", weaver: "Padma Veni" };

  // Original price is auto-filled from the saree type's retail rate (RatesPricingPage)
  const originalPrice = Number(getSareeTypeByCode(saree.typeCode)?.retail ?? 0);
  const [soldPrice, setSoldPrice] = useState(originalPrice);
  const priceDiscount = originalPrice - soldPrice;
  const fmtPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const prevCustomers = [
    { name: "Smt. Annapurna Devi", phone: "98765 43210", purchases: 18, total: "₹1,84,000", lastPurchase: "3 days ago", initials: "AD" },
    { name: "Smt. Meenakshi Rao", phone: "87654 32109", purchases: 7, total: "₹68,500", lastPurchase: "2 weeks ago", initials: "MR" },
    { name: "Smt. Lakshmi Prasad", phone: "76543 21098", purchases: 12, total: "₹1,12,000", lastPurchase: "1 month ago", initials: "LP" },
    { name: "Smt. Savitri Devi", phone: "65432 10987", purchases: 3, total: "₹24,000", lastPurchase: "3 months ago", initials: "SD" },
    { name: "Smt. Radha Krishnan", phone: "54321 09876", purchases: 22, total: "₹2,40,000", lastPurchase: "1 week ago", initials: "RK" },
  ];

  const filteredCustomers = custSearch.length >= 2
    ? prevCustomers.filter(c =>
      c.phone.replace(/\s/g, "").includes(custSearch.replace(/\s/g, "")) ||
      c.name.toLowerCase().includes(custSearch.toLowerCase())
    )
    : prevCustomers;

  const handleScan = () => setSareeFound(true);

  const handleSelectCustomer = (cust: typeof prevCustomers[0]) => {
    setSelectedCustomer(cust);
    setCustName(cust.name);
    setPhone(cust.phone);
    setCustSearch(cust.name);
    setShowCustomerList(false);
    setIsEditingCustomer(false);
    setIsNewCustomer(false);
  };

  const handleAddNew = () => {
    setSelectedCustomer(null);
    setIsEditingCustomer(false);
    setIsNewCustomer(true);
    setShowCustomerList(false);
    setCustName(""); setPhone(""); setCustAddress(""); setCustSearch("");
  };

  const resetSale = () => {
    setStep(1); setSareeFound(false); setManualId(""); setPayment(null); setPayRef("");
    setPhone(""); setCustName(""); setCustAddress("");
    setCustSearch(""); setSelectedCustomer(null); setIsEditingCustomer(false);
    setIsNewCustomer(false); setShowCustomerList(false); setSoldPrice(originalPrice);
  };

  const canProceedStep1 = selectedCustomer !== null || (isNewCustomer && custName.trim() !== "");

  if (showBill) {
    return (
      <div style={{ paddingBottom: 32 }}>
        <div style={{ background: C.burg, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowBill(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><ChevronLeft size={24} color="#FFF" /></button>
          <span style={{ fontFamily: F.d, fontWeight: 600, fontSize: 18, color: "#FFF" }}>Bill Preview</span>
        </div>
        <div style={{
          margin: isMobile ? "16px 20px" : "24px auto",
          width: isMobile ? undefined : isTablet ? "80vw" : 480,
          maxWidth: isMobile ? undefined : isTablet ? "80vw" : 480,
          background: C.white, borderRadius: 14, border: `1px solid ${C.bdr}`, boxShadow: "0 2px 12px rgba(44,24,16,0.07)", overflow: "hidden",
        }}>
          <div style={{ background: C.burg, padding: "18px 20px", textAlign: "center" as const }}>
            <Flower2 size={24} color="rgba(255,255,255,0.7)" style={{ margin: "0 auto 6px" }} />
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 18, color: "#FFF" }}>Beere Kesava & Brothers Silks</div>
            <div style={{ fontFamily: F.m, fontSize: 11, color: C.gold, marginTop: 2 }}>Est. 1999</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(255,255,255,0.70)", marginTop: 4 }}>Main Street, Silk Market, Bangalore — 560001</div>
          </div>
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>Bill No: BKB-2026-1842</span>
              <span style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>13 Jun 2026 · 11:42 AM</span>
            </div>
            <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, marginBottom: 12 }}>
              {[
                ["Saree ID", saree.id], ["Design Code", saree.design], ["Description", saree.name],
                ["Customer", custName || "Smt. Annapurna"], ["Phone", `+91 ${phone || "98765 43210"}`],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k}</span>
                  <span style={{ fontFamily: F.m, fontSize: 12, color: C.text, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            {useCanSeePrices() && (
              <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Total Amount:</span>
                <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 28, color: C.gold }}>{fmtPrice(soldPrice)}</span>
              </div>
            )}
            <div style={{ textAlign: "center" as const, marginBottom: 8 }}>
              <Chip label={`Payment: ${payment === "upi" ? "UPI" : payment === "card" ? "Card" : payment === "cash" ? "Cash" : "Other"}`} color={C.burg} bg="rgba(107,26,42,0.08)" />
            </div>
            <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 14, textAlign: "center" as const }}>
              <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 13, color: C.burg }}>Thank you for shopping with Beere Kesava & Brothers Silks</div>
              <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 2, color: C.gold, marginTop: 4, textTransform: "uppercase" as const }}>Tradition · Trust · Timeless Quality</div>
            </div>
          </div>
        </div>
        <div style={{
          padding: isMobile ? "0 20px" : "0 20px",
          margin: isMobile ? undefined : "0 auto", width: isMobile ? undefined : isTablet ? "80vw" : 480,
          display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, gap: 10,
        }}>
          <Btn label="Print Bill" icon={<Printer size={16} />} style={{ width: "100%", background: C.burg }} />
          <Btn label="Send to Customer on WhatsApp" icon={<MessageSquare size={16} />} style={{ width: "100%", background: C.green }} />
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={{ paddingBottom: 32 }}>
        <HeroHeader eyebrow="SINCE 1999 · NEW SALE" title="New Retail" sub="Sale" />
        <div style={{ padding: "36px 20px 0", textAlign: "center" as const }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(30,102,64,0.10)", border: `2px solid ${C.green}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Check size={38} color={C.green} />
            </div>
          </motion.div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 28, color: C.text, marginBottom: 6 }}>Sale Confirmed!</div>
          <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginBottom: 24 }}>Bill has been generated successfully.</div>
        </div>
        <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
          <div style={{ padding: 20 }}>
            <div style={{ fontFamily: F.d, fontWeight: 600, fontSize: 15, color: C.burg, textAlign: "center" as const, marginBottom: 14 }}>Beere Kesava & Brothers Silks · Est. 1999</div>
            <div style={{ borderTop: `1px solid ${C.bdr}`, paddingTop: 12 }}>
              {[
                ["Saree ID", saree.id, true], ["Design", saree.name, false],
                ["Customer", custName || "Smt. Annapurna", false],
                ["Date & Time", "13 Jun 2026 · 11:42 AM", true],
                ["Payment", payment?.toUpperCase() ?? "UPI", true],
              ].map(([k, v, mono], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{k as string}</span>
                  <span style={{ fontFamily: mono ? F.m : F.u, fontSize: 13, color: C.text }}>{v as string}</span>
                </div>
              ))}
              {canSeePrices && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${C.bdr}`, paddingTop: 10, marginTop: 4 }}>
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Amount</span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.gold }}>{fmtPrice(soldPrice)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 16 }}>
          <Btn label="Print Bill" icon={<Printer size={16} />} onClick={() => setShowBill(true)} style={{ width: "100%", background: C.burg }} />
          <Btn label="Send to Customer on WhatsApp" icon={<MessageSquare size={16} />} style={{ width: "100%", background: C.green }} />
        </div>

        <div style={{ padding: "0 20px" }}>
          <Btn label="Record Another Sale" icon={<Plus size={16} />} variant="ghost" onClick={resetSale} style={{ width: "100%", borderColor: C.burg }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <HeroHeader eyebrow="SINCE 1999 · NEW SALE" title="New Retail" sub="Sale" desc="Record a sale at the shop counter" />

      {/* Step progress with labels */}
      <div style={{ padding: "16px 20px 8px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["Customer", "Scan Saree", "Payment", "Confirm"] as const).map((label, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 999, background: (i + 1) <= (step as number) ? C.burg : "rgba(139,26,46,0.15)", marginBottom: 5 }} />
              <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase" as const, color: (i + 1) <= (step as number) ? C.burg : C.muted, textAlign: "center" as const }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1 — Customer Details ── */}
      {step === 1 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Customer Details</div>
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
                    <span style={{ fontFamily: F.m, fontSize: 10, letterSpacing: 1.5, color: C.muted, textTransform: "uppercase" as const }}>
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
                        <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 1 }}>+91 {c.phone}</div>
                      </div>
                      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                        <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>{c.purchases} purchases</div>
                        <div style={{ fontFamily: F.u, fontSize: 10, color: C.gold }}>{c.lastPurchase}</div>
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
                        <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 15, color: C.text }}>{selectedCustomer.name}</div>
                        <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>+91 {selectedCustomer.phone}</div>
                      </div>
                    </div>
                    <button onClick={() => setIsEditingCustomer(true)} style={{ background: "rgba(107,26,42,0.07)", border: `1px solid ${C.bdr}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      <Pencil size={12} color={C.burg} />
                      <span style={{ fontFamily: F.u, fontSize: 11, color: C.burg }}>Edit</span>
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
                        <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, marginTop: 2 }}>{s.label}</div>
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

          {/* If nothing selected and no form, show "add new" shortcut */}
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
              onClick={() => canProceedStep1 ? setStep(2) : undefined}
              style={{ flex: 1, background: canProceedStep1 ? C.burg : "#C0C0C0", cursor: canProceedStep1 ? "pointer" : "not-allowed" }}
            />
          </div>
        </div>
      )}

      {/* ── Step 2 — Scan Saree ── */}
      {step === 2 && (
        <div style={{ marginTop: 12 }}>
          {!sareeFound ? (
            <>
              {/* Premium camera scan zone */}
              <div
                onClick={handleScan}
                style={{
                  margin: "0 20px 18px",
                  background: `linear-gradient(135deg, ${C.dark} 0%, ${C.burg} 100%)`,
                  borderRadius: 20, padding: "32px 24px", cursor: "pointer",
                  display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14,
                  position: "relative" as const, overflow: "hidden",
                  boxShadow: "0 12px 36px rgba(107,26,42,0.30)",
                }}
              >
                <div style={{ position: "absolute" as const, top: -28, right: -28, width: 130, height: 130, borderRadius: "50%", background: "rgba(196,146,58,0.14)" }} />
                <div style={{ position: "absolute" as const, bottom: -36, left: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
                <div style={{
                  width: 72, height: 72, borderRadius: 18, position: "relative" as const, zIndex: 1,
                  background: "rgba(255,255,255,0.13)", border: "1.5px solid rgba(255,255,255,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
                }}>
                  <Camera size={34} color="#FFF" />
                </div>
                <div style={{ textAlign: "center" as const, position: "relative" as const, zIndex: 1 }}>
                  <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF", marginBottom: 6 }}>Scan Saree Barcode</div>
                  <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.55 }}>Point camera at the barcode tag on the saree label</div>
                </div>
                <div style={{
                  background: C.gold, borderRadius: 999, padding: "9px 24px",
                  minHeight: 56, minWidth: 200, boxSizing: "border-box" as const,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative" as const, zIndex: 1,
                  fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text,
                  boxShadow: "0 2px 8px rgba(196,146,58,0.40)",
                }}>
                  Tap to Open Camera
                </div>
              </div>

              {/* Or divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 20px 16px" }}>
                <div style={{ flex: 1, height: 1, background: C.bdr }} />
                <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>or enter manually</span>
                <div style={{ flex: 1, height: 1, background: C.bdr }} />
              </div>

              {/* Manual ID input */}
              <div style={{ margin: "0 20px 20px" }}>
                <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Saree ID</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input value={manualId} onChange={e => setManualId(e.target.value)} placeholder="e.g. PADMA-L1-004"
                    style={{ flex: 1, height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none" }}
                  />
                  {manualId.length > 3 && (
                    <button onClick={() => setSareeFound(true)} style={{ height: 52, borderRadius: 12, background: C.burg, border: "none", padding: "0 20px", fontFamily: F.u, fontWeight: 600, fontSize: 14, color: "#FFF", cursor: "pointer" }}>Find</button>
                  )}
                </div>
              </div>
              <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
                <Btn label="← Back" variant="ghost" onClick={() => setStep(1)} style={{ flex: 1 }} />
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* Found banner */}
              <div style={{ margin: "0 20px 14px", background: "rgba(30,102,64,0.08)", border: `1.5px solid ${C.green}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={17} color="#FFF" />
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.green }}>Saree Found Successfully</div>
                  <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted }}>ID: {saree.id}</div>
                </div>
              </div>

              {/* Saree details card */}
              <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
                <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
                <div style={{ padding: 18, display: isMobile ? "block" : "flex", gap: isMobile ? 0 : 24, alignItems: isMobile ? undefined : "flex-start" }}>
                  <div style={{ flex: isMobile ? undefined : 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 15, color: C.burg, marginBottom: 4 }}>{saree.id}</div>
                        <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text }}>{saree.name}</div>
                      </div>
                      <Chip label="Factory" color={C.green} bg="rgba(30,102,64,0.10)" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" }}>
                      {[
                        ["Design Code", saree.design, true],
                        ["Type", saree.type, false],
                        ["Weight", saree.weight, true],
                        ["Weaver", saree.weaver, false],
                      ].map(([k, v, mono], i) => (
                        <div key={i}>
                          <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginBottom: 3 }}>{k as string}</div>
                          <div style={{ fontFamily: mono ? F.m : F.u, fontWeight: 600, fontSize: 13, color: C.text }}>{v as string}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {useCanSeePrices() && (
                    <div style={{ borderTop: isMobile ? `1px solid ${C.bdr}` : "none", borderLeft: isMobile ? "none" : `1px solid ${C.bdr}`, paddingTop: isMobile ? 14 : 0, marginTop: isMobile ? 16 : 0, paddingLeft: isMobile ? 0 : 24, width: isMobile ? undefined : 220, flexShrink: 0 }}>
                      <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Selling Price (₹)</label>
                      <div style={{ position: "relative" as const }}>
                        <span style={{ position: "absolute" as const, left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold, pointerEvents: "none" as const }}>₹</span>
                        <input
                          type="number"
                          value={soldPrice}
                          onChange={e => setSoldPrice(e.target.value === "" ? 0 : Number(e.target.value))}
                          style={{ width: "100%", height: 56, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px 0 36px", fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, outline: "none", boxSizing: "border-box" as const }}
                        />
                      </div>
                      <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 6 }}>Default: {fmtPrice(originalPrice)}</div>
                    </div>
                  )}
                </div>
              </Card>

              <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
                <button onClick={() => setSareeFound(false)} style={{ height: 52, borderRadius: 12, border: `1px solid ${C.bdr}`, background: "transparent", padding: "0 18px", fontFamily: F.u, fontSize: 13, color: C.muted, cursor: "pointer" }}>Rescan</button>
                <Btn label="Next — Payment →" onClick={() => setStep(3)} style={{ flex: 1, background: C.burg }} />
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Step 3 — Payment Method ── */}
      {step === 3 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Payment Method</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>How is the customer paying?</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 20px 16px" }}>
            {[
              { id: "cash" as const, label: "Cash", sub: "Physical currency", icon: <IndianRupee size={22} /> },
              { id: "upi" as const, label: "UPI", sub: "GPay, PhonePe, etc.", icon: <Wallet size={22} /> },
              { id: "card" as const, label: "Card", sub: "Debit or Credit", icon: <CreditCard size={22} /> },
              { id: "other" as const, label: "Other", sub: "Cheque / Transfer", icon: <Plus size={22} /> },
            ].map(p => (
              <button key={p.id} onClick={() => setPayment(p.id)} style={{
                padding: "16px 14px", borderRadius: 14,
                border: `${payment === p.id ? 2 : 1}px solid ${payment === p.id ? C.burg : C.bdr}`,
                background: payment === p.id ? "rgba(107,26,42,0.06)" : C.white,
                cursor: "pointer", display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 8,
                position: "relative" as const,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: payment === p.id ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {React.cloneElement(p.icon, { color: payment === p.id ? C.burg : C.muted })}
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: payment === p.id ? C.burg : C.text }}>{p.label}</div>
                  <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 2 }}>{p.sub}</div>
                </div>
                {payment === p.id && <div style={{ position: "absolute" as const, top: 8, right: 8, width: 18, height: 18, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={10} color={C.text} /></div>}
              </button>
            ))}
          </div>
          {payment === "upi" && (
            <div style={{ margin: "0 20px 16px" }}>
              <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>UPI Reference (Optional)</label>
              <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Transaction ID"
                style={{ width: "100%", height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box" as const }} />
            </div>
          )}
          {payment === "card" && (
            <div style={{ margin: "0 20px 16px" }}>
              <label style={{ fontFamily: F.u, fontWeight: 500, fontSize: 13, color: C.muted, display: "block", marginBottom: 8 }}>Last 4 Digits (Optional)</label>
              <input value={payRef} onChange={e => setPayRef(e.target.value)} maxLength={4} placeholder="e.g. 4872"
                style={{ width: "100%", height: 52, background: C.inp, border: `1.5px solid ${C.bdr}`, borderRadius: 12, padding: "0 16px", fontFamily: F.m, fontSize: 18, color: C.text, outline: "none", boxSizing: "border-box" as const }} />
            </div>
          )}
          <div style={{ padding: "0 20px", display: "flex", gap: 10 }}>
            <Btn label="← Back" variant="ghost" onClick={() => setStep(2)} style={{ flex: 1 }} />
            <Btn label="Next — Confirm →" onClick={() => payment && setStep(4)} style={{ flex: 2, background: payment ? C.burg : "#C0C0C0", cursor: payment ? "pointer" : "not-allowed" }} />
          </div>
        </div>
      )}

      {/* ── Step 4 — Confirm Sale ── */}
      {step === 4 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ margin: "0 20px 16px" }}>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 15, color: C.text, marginBottom: 4 }}>Review & Confirm Sale</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Please verify all details before confirming</div>
          </div>
          <Card style={{ margin: "0 20px 16px", overflow: "hidden" }}>
            <div style={{ height: 4, background: `linear-gradient(90deg, ${C.burg}, ${C.gold})` }} />
            <div style={{ padding: 18 }}>
              {[
                { label: "Saree ID", value: saree.id, mono: true },
                { label: "Design", value: saree.name, mono: false },
                { label: "Customer", value: custName || "Smt. Annapurna Devi", mono: false },
                { label: "Phone", value: `+91 ${phone || "98765 43210"}`, mono: true },
                { label: "Payment", value: payment?.toUpperCase() ?? "UPI", mono: true },
              ].map(({ label, value, mono }, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${C.bdr}` }}>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontFamily: mono ? F.m : F.u, fontWeight: 600, fontSize: 13, color: C.text, textAlign: "right" as const, maxWidth: "60%" }}>{value}</span>
                </div>
              ))}
              {canSeePrices && (
                <>
                  {soldPrice !== originalPrice && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Original Price</span>
                      <span style={{ fontFamily: F.m, fontSize: 13, color: C.muted, textDecoration: "line-through" }}>{fmtPrice(originalPrice)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 4 }}>
                    <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Sold For</span>
                    <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 32, color: C.burg }}>{fmtPrice(soldPrice)}</span>
                  </div>
                  {priceDiscount > 0 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                      <Chip label={`Discount: ${fmtPrice(priceDiscount)}`} color="#8B6018" bg="rgba(196,146,58,0.15)" />
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
          <div style={{ padding: "0 20px", display: "flex", flexDirection: "column" as const, gap: 10 }}>
            <Btn label="Confirm Sale — Generate Bill" onClick={() => setStep("success")} style={{ width: "100%", background: C.green, height: 56 }} />
            <Btn label="← Edit Details" variant="ghost" onClick={() => setStep(3)} style={{ width: "100%" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE 03 — SHOP INVENTORY ────────────────────────────────────────────────
export { NewSaleFlow };
