import { useCanSeePrices } from "./theme";
import { useResponsive } from "../../../../hooks/useResponsive";
import { Send } from "lucide-react";


import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../../../../shared/api/inventory';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Search, Bell, LogOut, Package, IndianRupee, RotateCcw, 
  Users, BarChart3, ChevronRight, UserRound, ArrowLeft, Plus, MapPin, 
  Phone, Eye, Download, Printer, Filter, Calendar, Activity,
  ShoppingCart, Store, ArrowRight, Tag, Wallet, CreditCard, ChevronDown, CheckCircle2,
  TrendingUp, ArrowDownRight, ArrowUpRight, TrendingDown
} from 'lucide-react';

import { C, F, TEAL, Card, Btn, Chip } from './theme';
import { Button, Input } from "../../../../shared/ui/primitives";
import { scanApi, ScanLookupResult } from "../../../../shared/api/scan";

function ShopInventory() {
  const canSeePrices = useCanSeePrices();
  const { isMobile } = useResponsive();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Sarees");
  const [loomFilter, setLoomFilter] = useState<string[]>([]);
  const [weaverFilter, setWeaverFilter] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<ScanLookupResult | null>(null);

  useEffect(() => {
    const q = search.trim();
    if (q.length >= 4) {
      scanApi.lookup(q).then(setScanResult).catch(() => setScanResult(null));
    } else {
      setScanResult(null);
    }
  }, [search]);

  const { data: inventoryRes, isLoading: inventoryLoading, isError: inventoryError } = useQuery({
    queryKey: ["shop-inventory-list"],
    queryFn: () => inventoryApi.list(),
  });

  const inventory = useMemo(() => {
    return (inventoryRes ?? []).map(item => ({
      id: item.sareeId,
      src: item.source ?? "factory",
      design: item.designCode ?? "—",
      name: item.sareeTypeLabel ?? "Pure Silk Saree",
      color: "#6B1A2A",
      sareeColor: "Silk",
      type: item.sareeTypeCode ?? "Standard",
      price: "₹8,500",
      received: item.qcDate ? `Received ${new Date(item.qcDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}` : "In Stock",
      status: (item.status === "sold" ? "reserved" : "available") as "available" | "reserved",
      supplier: item.customer ?? null,
      loom: item.loomNumber ? `L${item.loomNumber}` : null,
      weaver: item.weaverName ?? null,
    }));
  }, [inventoryRes]);

  const looms = Array.from(new Set(inventory.map(s => s.loom).filter(Boolean))) as string[];
  const weavers = Array.from(new Set(inventory.map(s => s.weaver).filter(Boolean))) as string[];

  const toggleLoomFilter = (l: string) => {
    if (l === "All Looms") {
      setLoomFilter([]);
    } else {
      setLoomFilter(prev =>
        prev.includes(l) ? prev.filter(item => item !== l) : [...prev, l]
      );
    }
  };

  const toggleWeaverFilter = (w: string) => {
    if (w === "All Weavers") {
      setWeaverFilter([]);
    } else {
      setWeaverFilter(prev =>
        prev.includes(w) ? prev.filter(item => item !== w) : [...prev, w]
      );
    }
  };

  const filters = ["All Sarees", "From Factory", "External Purchase", "Available", "Reserved"];
  const filtered = inventory.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.id.toLowerCase().includes(q) || s.design.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.weaver && s.weaver.toLowerCase().includes(q)) || (s.loom && s.loom.toLowerCase().includes(q));
    const matchFilter = filter === "All Sarees" || (filter === "From Factory" && s.src === "factory") || (filter === "External Purchase" && s.src === "external") || (filter === "Available" && s.status === "available") || (filter === "Reserved" && s.status === "reserved");
    const matchLoom = loomFilter.length === 0 || (s.loom && loomFilter.includes(s.loom));
    const matchWeaver = weaverFilter.length === 0 || (s.weaver && weaverFilter.includes(s.weaver));
    return matchSearch && matchFilter && matchLoom && matchWeaver;
  });

  const dropStyle: React.CSSProperties = {
    height: 42, padding: "0 14px", borderRadius: 12, border: `1px solid ${C.bdr}`, background: C.inp,
    fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, cursor: "pointer", outline: "none",
    appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B7060' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
  };

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ background: C.dark, padding: "26px 20px 24px" }}>
        <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 3, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, marginBottom: 8 }}>SINCE 1999 · SHOP INVENTORY</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: "#FFF", lineHeight: 1.15, marginBottom: 5 }}>Shop Inventory</div>
        <div style={{ fontFamily: F.d, fontStyle: "italic", fontWeight: 500, fontSize: 18, color: C.gold }}>Current stock in the shop</div>
      </div>

      {/* Stats — stacked cards, no wrapping/truncation */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, padding: "16px 20px 4px" }}>
        <div style={{ flex: "1 1 100%", background: C.dark, borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, letterSpacing: 0.5, color: "rgba(255,255,255,0.60)", marginBottom: 6 }}>Total Sarees in Shop</div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: "#FFF", lineHeight: 1 }}>84 <span style={{ fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.60)" }}>sarees</span></div>
          </div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "right" as const }}>Currently<br />stocked</div>
        </div>
        <div style={{ flex: "1 1 calc(50% - 5px)", background: C.gold, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: "rgba(26,10,15,0.65)", marginBottom: 6 }}>Available for Sale</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.text, lineHeight: 1.1 }}>76 sarees</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: "rgba(26,10,15,0.55)", marginTop: 4 }}>Ready for customers</div>
        </div>
        <div style={{ flex: "1 1 calc(50% - 5px)", background: "rgba(192,57,43,0.12)", border: `1px solid rgba(192,57,43,0.30)`, borderRadius: 16, padding: "16px 18px" }}>
          <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 12, color: C.crim, marginBottom: 6 }}>Low Stock Threshold</div>
          <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 24, color: C.crim, lineHeight: 1.1 }}>Below 15</div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.crim, opacity: 0.8, marginTop: 4 }}>Alert active</div>
        </div>
      </div>

      {/* Search + Filter */}
      <Card style={{ margin: "16px 20px", padding: "16px" }}>
        <div style={{ marginBottom: 14 }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by Saree ID, design, weaver, or loom" iconLeft={Search} size="lg" containerClassName="rounded-xl h-12" />
        </div>
        {scanResult && (
          <div style={{ background: "rgba(30,102,64,0.08)", border: "1px solid rgba(30,102,64,0.25)", borderRadius: 12, padding: "12px 16px", marginBottom: 14, fontFamily: F.u, fontSize: 13, color: C.text }}>
            <div style={{ fontWeight: 700, color: C.green, marginBottom: 4 }}>✓ Verified DB Record Found: {scanResult.sareeId}</div>
            <div>Weaver: <b>{scanResult.weaver?.name || "—"}</b> · Design: <b>{scanResult.design?.code || "—"}</b> · Status: <b>{scanResult.inventoryStatus || "QC PASSED"}</b></div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 4, marginBottom: 12 }}>
          {filters.map(f => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              size="sm"
              className={
                "shrink-0 rounded-full px-4 py-2 h-auto whitespace-nowrap border " +
                (filter === f ? "border-[#6B1A2A] bg-[#6B1A2A] text-white font-semibold" : "border-[rgba(139,26,46,0.12)] bg-transparent text-[#69635E] font-semibold")
              }
            >{f}</Button>
          ))}
        </div>
        {/* Loom selection pills */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" as const }}>Loom</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 4 }}>
            {["All Looms", ...looms].map(l => {
              const isSel = l === "All Looms" ? loomFilter.length === 0 : loomFilter.includes(l);
              return (
                <Button
                  key={l}
                  onClick={() => toggleLoomFilter(l)}
                  size="sm"
                  className={
                    "shrink-0 rounded-full px-4 py-2 h-auto whitespace-nowrap border " +
                    (isSel ? "border-[#6B1A2A] bg-[#6B1A2A] text-white font-semibold" : "border-[rgba(139,26,46,0.12)] bg-transparent text-[#69635E] font-semibold")
                  }
                >
                  {l === "All Looms" ? "All Looms" : `Loom ${l}`}
                </Button>
              );
            })}
          </div>
        </div>
        {/* Weaver selection pills */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" as const }}>Weaver</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" as const, paddingBottom: 4 }}>
            {["All Weavers", ...weavers].map(w => {
              const isSel = w === "All Weavers" ? weaverFilter.length === 0 : weaverFilter.includes(w);
              return (
                <Button
                  key={w}
                  onClick={() => toggleWeaverFilter(w)}
                  size="sm"
                  className={
                    "shrink-0 rounded-full px-4 py-2 h-auto whitespace-nowrap border " +
                    (isSel ? "border-[#6B1A2A] bg-[#6B1A2A] text-white font-semibold" : "border-[rgba(139,26,46,0.12)] bg-transparent text-[#69635E] font-semibold")
                  }
                >
                  {w}
                </Button>
              );
            })}
          </div>
        </div>
        <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Showing {filtered.length} sarees · {filtered.filter(s => s.status === "available").length} available · {filtered.filter(s => s.status === "reserved").length} reserved</div>
      </Card>

      {/* Inventory list */}
      {inventoryLoading && (
        <div style={{ margin: "0 20px 12px", padding: 18, fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" as const }}>
          Loading inventory…
        </div>
      )}
      {inventoryError && (
        <div style={{ margin: "0 20px 12px", background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.30)", borderRadius: 16, padding: 18, fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.crim, textAlign: "center" as const }}>
          Failed to load shop inventory.
        </div>
      )}
      {!inventoryLoading && !inventoryError && filtered.length === 0 && (
        <div style={{ margin: "0 20px 12px", padding: 18, fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" as const }}>
          No sarees in stock.
        </div>
      )}
      {!inventoryLoading && !inventoryError && filtered.map((s, i) => (
        <div key={i} style={{ margin: "0 20px 12px", background: C.white, borderRadius: 16, border: `1px solid ${C.bdr}`, boxShadow: "0 2px 12px rgba(44,24,16,0.07)", padding: 18, display: "flex", gap: 14 }}>
          <div style={{ width: 6, borderRadius: 3, background: s.color, flexShrink: 0, alignSelf: "stretch" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
              <span style={{ fontFamily: F.m, fontSize: 14, color: C.burg, fontWeight: 600 }}>{s.id}</span>
              {s.src === "factory"
                ? <Chip label="🏭 Factory" color={C.green} bg="rgba(30,102,64,0.10)" />
                : <Chip label="📦 External" color={C.gold} bg="rgba(196,146,58,0.12)" />}
            </div>
            <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 3 }}>{s.name}</div>
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 8, lineHeight: 1.4 }}>{s.design !== "External" && `${s.design} · `}{s.sareeColor} · {s.type}</div>
            {s.weaver && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" as const }}>
                <Chip label={`🧵 ${s.weaver}`} color={C.burg} bg="rgba(107,26,42,0.08)" />
                {s.loom && <Chip label={`Loom ${s.loom}`} color={TEAL} bg="rgba(15,118,110,0.10)" />}
              </div>
            )}
            {canSeePrices && <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: C.gold, marginBottom: 6 }}>Retail: {s.price}</div>}
            <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 6, lineHeight: 1.4 }}>{s.received} {s.src === "factory" ? "· From factory dispatch" : "· External purchase"}</div>
            {s.supplier && <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>Supplier: {s.supplier} · <span style={{ fontFamily: F.m, fontSize: 12, background: "rgba(196,146,58,0.12)", color: C.gold, borderRadius: 999, padding: "2px 9px" }}>{s.id}</span></div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 8, flexWrap: "wrap" as const }}>
              <Chip label={s.status === "available" ? "✓ Available" : "Reserved for Customer"} color={s.status === "available" ? C.green : C.gold} bg={s.status === "available" ? "rgba(30,102,64,0.10)" : "rgba(196,146,58,0.12)"} />
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="sm" className="h-[38px] px-4 rounded-full border border-[rgba(139,26,46,0.12)] bg-transparent font-semibold text-[13px] text-[#69635E]">View</Button>
                <Button size="sm" className="h-[38px] px-4 rounded-full border-none bg-[#6B1A2A] font-semibold text-[13px] text-white">Sell</Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Low stock notice */}
      <div style={{ margin: "8px 20px", background: "rgba(192,57,43,0.06)", border: `1px solid rgba(192,57,43,0.25)`, borderRadius: 16, padding: "18px" }}>
        <div style={{ fontFamily: F.u, fontWeight: 500, fontSize: 14, color: C.text, marginBottom: 14, lineHeight: 1.5 }}>⚠ Only 84 sarees in stock. Stock is below the alert threshold.</div>
        <Btn label="Report to Admin" icon={<Send size={16} />} style={{ width: "100%", height: 54, background: C.burg, fontSize: 14 }} />
      </div>
    </div>
  );
}

// ─── PAGE 04 — PROCESS RETURN ────────────────────────────────────────────────
interface ReturnRecord {
  id: string;
  type: "retail" | "wholesale";
  date: string;
  customer?: string;
  originalSaleId?: string;
  reason?: string;
  amount?: string;
  newSareeId?: string;
  vendor?: string;
  design?: string;
  color?: string;
  weight?: string;
  price?: string;
  wsReason?: string;
}

type ReturnStep = "type" | 1 | 2 | 3 | "success";
type ReturnType = "retail" | "wholesale" | null;

export { ShopInventory };
