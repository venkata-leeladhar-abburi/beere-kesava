// ── Search / filter / view-toggle controls for the weaver directory ────────
import { motion } from "motion/react";
import { UserPlus } from "lucide-react";
import { UploadSimple, MagnifyingGlass, CaretDown, MapPin as PhMapPin, Users } from "@phosphor-icons/react";
import { T, F } from "../theme";
import { FILTER_PILLS, VIEW_OPTIONS } from "../data";
import { FadeUp } from "../common/primitives";

export function AllWeaversControls({ view, setView, filter, setFilter, search, setSearch, onAddWeaver, onViewAll, onImport }: {
  view: string; setView: (v: string) => void; filter: string; setFilter: (f: string) => void; search: string; setSearch: (s: string) => void; onAddWeaver: () => void; onViewAll: () => void; onImport: () => void;
}) {
  return (
    <div id="weav-all-weavers" style={{ padding: "40px 48px 0" }}>
      <FadeUp>
        {/* Section title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${T.royalBurgundy}, ${T.deepWine})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(110,15,45,0.28)" }}>
              <Users size={26} color="#FFFDF9" weight="fill" />
            </div>
            <div>
              <h2 style={{ fontFamily: F.display, fontSize: 32, color: T.luxuryBrown, margin: 0, lineHeight: 1.1 }}>All Weavers</h2>
              <div style={{ fontFamily: F.ui, fontSize: 15, color: T.taupe, marginTop: 3 }}>350 weavers registered · 84 currently active</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><motion.button
            onClick={onViewAll}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 14, padding: "14px 22px", fontFamily: F.ui, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            <Users size={20} /> View All Weavers
          </motion.button><motion.button
            onClick={onImport}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", color: T.royalBurgundy, border: `1.5px solid rgba(110,15,45,0.18)`, borderRadius: 14, padding: "14px 22px", fontFamily: F.ui, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            <UploadSimple size={20} /> Import from Excel
          </motion.button><motion.button
            onClick={onAddWeaver}
            whileHover={{ scale: 1.03, backgroundColor: T.deepWine }}
            whileTap={{ scale: 0.97 }}
            style={{ display: "flex", alignItems: "center", gap: 10, backgroundColor: T.royalBurgundy, color: "#FFFDF9", border: "none", borderRadius: 14, padding: "14px 26px", fontFamily: F.ui, fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(110,15,45,0.28)" }}
          >
              <UserPlus size={20} /> Add New Weaver
            </motion.button></div>
        </div>

        <p style={{ fontFamily: F.ui, fontSize: 16, color: T.taupe, margin: "0 0 22px", lineHeight: 1.6 }}>
          Search and find any weaver. Use the filters to narrow down by status or area.
        </p>

        {/* Search + view toggle */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
            <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <MagnifyingGlass size={22} color={T.taupe} weight="regular" />
            </div>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by weaver name, weaver code, or village..."
              style={{ width: "100%", height: 54, paddingLeft: 50, paddingRight: 20, fontFamily: F.ui, fontSize: 16, color: T.luxuryBrown, background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 14, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", background: "#FFFFFF", flexShrink: 0 }}>
            {VIEW_OPTIONS.map(({ key, label, PhIcon }) => (
              <motion.button
                key={key} onClick={() => setView(key)}
                animate={{ backgroundColor: view === key ? T.royalBurgundy : "#FFFFFF" }}
                transition={{ duration: 0.18 }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 20px", fontFamily: F.ui, fontSize: 15, fontWeight: 700, color: view === key ? "#FFFDF9" : T.taupe, border: "none", cursor: "pointer" }}
              >
                <PhIcon size={18} weight={view === key ? "fill" : "regular"} /> {label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Filter pills row */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", paddingBottom: 6 }}>
          {FILTER_PILLS.map(f => (
            <motion.button
              key={f} onClick={() => setFilter(f)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14.5, padding: "9px 20px", borderRadius: 99, cursor: "pointer", background: filter === f ? T.royalBurgundy : "#FFFFFF", color: filter === f ? "#FFFDF9" : T.luxuryBrown, border: filter === f ? `1px solid ${T.royalBurgundy}` : `1.5px solid rgba(110,15,45,0.16)`, boxShadow: filter === f ? "0 4px 14px rgba(110,15,45,0.22)" : "none", transition: "all 0.18s" }}
            >
              {f}
            </motion.button>
          ))}
          <motion.button whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontWeight: 600, fontSize: 14.5, padding: "9px 20px", borderRadius: 99, cursor: "pointer", background: "#FFFFFF", color: T.taupe, border: "1.5px solid rgba(110,15,45,0.16)" }}>
            <PhMapPin size={16} weight="regular" /> Filter by Village <CaretDown size={14} weight="bold" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontWeight: 600, fontSize: 14.5, padding: "9px 20px", borderRadius: 99, cursor: "pointer", background: "#FFFFFF", color: T.taupe, border: "1.5px solid rgba(110,15,45,0.16)" }}>
            Sort: Most Sarees This Month <CaretDown size={14} weight="bold" />
          </motion.button>
        </div>
      </FadeUp>
    </div>
  );
}
