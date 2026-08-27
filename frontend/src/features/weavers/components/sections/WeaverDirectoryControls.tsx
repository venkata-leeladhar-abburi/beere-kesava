// ── Search / filter / view-toggle controls for the weaver directory ────────
import type { ReactNode } from "react";
import { UserPlus } from "lucide-react";
import { Upload as UploadSimple, Search as MagnifyingGlass, ChevronDown as CaretDown, MapPin as PhMapPin, Users } from "lucide-react";
import { T, F } from "../theme";
import { FILTER_PILLS, VIEW_OPTIONS } from "../data";
import { FadeUp, SectionCard } from "../common/primitives";
import { Button, Input } from "../../../../shared/ui/primitives";

export function AllWeaversControls({ view, setView, filter, setFilter, search, setSearch, onAddWeaver, onViewAll, onImport, children }: {
  view: string; setView: (v: string) => void; filter: string; setFilter: (f: string) => void; search: string; setSearch: (s: string) => void; onAddWeaver: () => void; onViewAll: () => void; onImport: () => void; children?: ReactNode;
}) {
  return (
    <div className="px-4 md:px-7 xl:px-12" style={{ paddingTop: 40 }}>
      <FadeUp>
      <SectionCard
        id="weav-all-weavers"
        icon={Users}
        title="All Weavers"
        subtitle="350 weavers registered · 84 currently active"
        actions={
          <>
            <Button
              onClick={onViewAll}
              variant="secondary"
              size="lg"
              className="rounded-[14px] bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/20 hover:text-white hover:border-white/30"
            >
              <Users size={20} /> View All Weavers
            </Button>
            <Button
              onClick={onImport}
              variant="secondary"
              size="lg"
              className="rounded-[14px] bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/20 hover:text-white hover:border-white/30"
            >
              <UploadSimple size={20} /> Import from Excel
            </Button>
            <Button
              onClick={onAddWeaver}
              variant="primary"
              size="lg"
              className="rounded-[14px] bg-[#C89B47] text-[#3B2314] hover:bg-[#E7C983]"
            >
              <UserPlus size={20} /> Add New Weaver
            </Button>
          </>
        }
      >
        <p style={{ fontFamily: F.ui, fontSize: 16, color: T.taupe, margin: "0 0 22px", lineHeight: 1.6 }}>
          Search and find any weaver. Use the filters to narrow down by status or area.
        </p>

        {/* Search + view toggle */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
            <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <MagnifyingGlass size={22} color={T.taupe} />
            </div>
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by weaver name, weaver code, or village..."
              className="h-[54px] pl-[50px] pr-5 rounded-[14px] border-[1.5px] border-[var(--border-default)]"
            />
          </div>
          <div style={{ display: "flex", border: `1.5px solid ${T.borderDef}`, borderRadius: 12, overflow: "hidden", background: "#FFFFFF", flexShrink: 0 }}>
            {VIEW_OPTIONS.map(({ key, label, PhIcon }) => (
              <Button
                key={key} onClick={() => setView(key)}
                variant={view === key ? "primary" : "secondary"}
                className={
                  view === key
                    ? "rounded-none border-none bg-[#6E0F2D] transition-colors duration-[180ms]"
                    : "rounded-none border-none bg-white text-[var(--text-tertiary)] transition-colors duration-[180ms]"
                }
              >
                <PhIcon size={18} /> {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Filter pills row */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", paddingBottom: 32 }}>
          {FILTER_PILLS.map(f => (
            <Button
              key={f} onClick={() => setFilter(f)}
              variant={filter === f ? "primary" : "secondary"}
              size="sm"
              className={
                filter === f
                  ? "rounded-full bg-[#6E0F2D] border-none shadow-[0_4px_14px_rgba(110,15,45,0.22)]"
                  : "rounded-full bg-white text-[#3B2314] border-[1.5px] border-[rgba(110,15,45,0.16)]"
              }
            >
              {f}
            </Button>
          ))}
          <Button variant="secondary" size="sm" className="rounded-[14px] bg-white text-[var(--text-tertiary)] border-[1.5px] border-[rgba(110,15,45,0.16)]">
            <PhMapPin size={16} /> Filter by Village <CaretDown size={14} />
          </Button>
          <Button variant="secondary" size="sm" className="rounded-[14px] bg-white text-[var(--text-tertiary)] border-[1.5px] border-[rgba(110,15,45,0.16)]">
            Sort: Most Sarees This Month <CaretDown size={14} />
          </Button>
        </div>

        {children}
      </SectionCard>
      </FadeUp>
    </div>
  );
}
