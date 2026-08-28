import React from "react";
import { ChevronRight, Package, Layers, Scale } from "lucide-react";
import { C, F } from "../tokens";
import { Button } from "../../../../../shared/ui/primitives";
import { formatWeight, type SareeDetail } from "./sareeDetails";
import { type FinishingTableRow } from "./FinishingSareeTable";

// ── Grouping cards for both finishing queues ─────────────────────────────────
// A card used to carry a name and a count and nothing else, which made the
// grouping tabs a guessing game. Each one now states the batches, saree types
// and total weight behind it, so the drill-down is an informed choice.

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(p => p[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function uniq(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter((v): v is string => !!v && v !== "—")));
}

function detailOf(r: FinishingTableRow): Partial<SareeDetail> {
  return r.detail ?? {};
}

function Facts({ rows }: { rows: FinishingTableRow[] }) {
  const batches = uniq(rows.map(r => r.detail?.batchId ?? r.fallbackBatchId));
  const types = uniq(rows.map(r => r.detail?.sareeTypeCode ?? r.fallbackTypeCode));
  const looms = uniq(rows.map(r => detailOf(r).loomLabel));
  const totalWeight = rows.reduce((sum, r) => sum + (r.detail?.weightG ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
      {types.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          <Layers size={11} color={C.muted} style={{ flexShrink: 0 }} />
          {types.slice(0, 3).map(t => (
            <span key={t} style={{ fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#845E04", background: "rgba(200,155,71,0.12)", border: "1px solid rgba(200,155,71,0.28)", borderRadius: 999, padding: "1px 7px" }}>{t}</span>
          ))}
          {types.length > 3 && <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>+{types.length - 3}</span>}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontFamily: F.u, fontSize: 11, color: C.muted }}>
        {batches.length > 0 && <span>{batches.length} batch{batches.length === 1 ? "" : "es"}</span>}
        {looms.length > 0 && <span>· {looms.length === 1 ? looms[0] : `${looms.length} looms`}</span>}
        {totalWeight > 0 && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            · <Scale size={10} /> {formatWeight(totalWeight)}
          </span>
        )}
      </div>
    </div>
  );
}

function GroupCard({ title, subtitle, badge, badgeStyle, avatar, rows, onSelect, isDesktop }: {
  title: string; subtitle?: string; badge: string;
  badgeStyle: React.CSSProperties;
  avatar: React.ReactNode;
  rows: FinishingTableRow[];
  onSelect: () => void;
  isDesktop?: boolean;
}) {
  return (
    <Button variant="tertiary" onClick={onSelect}
      className="h-auto w-full flex-col items-start gap-2.5 whitespace-normal rounded-2xl border border-[rgba(110,15,45,0.10)] bg-white px-4 py-4 text-left shadow-[0_2px_12px_rgba(74,6,27,0.07)] hover:border-[rgba(110,15,45,0.28)] transition-colors">
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
        {avatar}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.u, fontSize: isDesktop ? 14 : 13, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
          {subtitle && <div style={{ fontFamily: F.m, fontSize: 11, color: C.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</div>}
        </div>
        <span style={{ ...badgeStyle, flexShrink: 0 }}>{badge}</span>
        <ChevronRight size={15} color={C.muted} style={{ flexShrink: 0 }} />
      </div>
      <Facts rows={rows} />
    </Button>
  );
}

const GRID = (isDesktop?: boolean, isTablet?: boolean): React.CSSProperties => ({
  display: "grid",
  gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr",
  gap: isDesktop ? 14 : 10,
});

const PILL = (fg: string, bg: string, bd: string): React.CSSProperties => ({
  fontFamily: F.u, fontSize: 12, fontWeight: 700, color: fg, background: bg,
  border: `1px solid ${bd}`, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap",
});

/** Grouped by whoever wove the saree (weaver or factory loom). */
export function PersonGroupGrid({ groups, onSelect, isDesktop, isTablet, badgeWord, gradient, badgeStyle }: {
  groups: { name: string; rows: FinishingTableRow[] }[];
  onSelect: (name: string) => void;
  isDesktop?: boolean; isTablet?: boolean;
  badgeWord: string;
  gradient: string;
  badgeStyle: React.CSSProperties;
}) {
  return (
    <div style={GRID(isDesktop, isTablet)}>
      {groups.map(g => {
        const code = g.rows.find(r => r.detail?.weaverCode)?.detail?.weaverCode;
        return (
          <GroupCard
            key={g.name}
            title={g.name}
            subtitle={code ?? undefined}
            badge={`${g.rows.length} ${badgeWord}`}
            badgeStyle={badgeStyle}
            rows={g.rows}
            isDesktop={isDesktop}
            onSelect={() => onSelect(g.name)}
            avatar={
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: gradient, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: "#FFF" }}>{initials(g.name)}</span>
              </div>
            }
          />
        );
      })}
    </div>
  );
}

/** Grouped by production batch. */
export function BatchGroupGrid({ groups, onSelect, isDesktop, isTablet, badgeWord, badgeStyle, secondaryLabel }: {
  groups: { id: string; rows: FinishingTableRow[] }[];
  onSelect: (id: string) => void;
  isDesktop?: boolean; isTablet?: boolean;
  badgeWord: string;
  badgeStyle: React.CSSProperties;
  /** How the people line is described — "weaver" for assign, "staff" for receive. */
  secondaryLabel: (rows: FinishingTableRow[]) => string;
}) {
  return (
    <div style={GRID(isDesktop, isTablet)}>
      {groups.map(g => (
        <GroupCard
          key={g.id}
          title={g.id}
          subtitle={secondaryLabel(g.rows)}
          badge={`${g.rows.length} ${badgeWord}`}
          badgeStyle={badgeStyle}
          rows={g.rows}
          isDesktop={isDesktop}
          onSelect={() => onSelect(g.id)}
          avatar={
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(200,155,71,0.15)", border: "1px solid rgba(200,155,71,0.30)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Package size={18} color="#8B6018" />
            </div>
          }
        />
      ))}
    </div>
  );
}

export const READY_PILL = PILL("#1F774E", "rgba(30,102,64,0.09)", "rgba(30,102,64,0.20)");
export const AWAITING_PILL = PILL("#8D5802", "rgba(200,155,71,0.14)", "rgba(200,155,71,0.32)");
