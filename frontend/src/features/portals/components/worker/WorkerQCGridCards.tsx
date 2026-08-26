import React from "react";
import { ChevronRight, Package, User, Factory } from "lucide-react";
import { T, F, initials, type SareeItem } from "./WorkerQCTypes";

interface WeaverGroup {
  name: string;
  code: string;
  source: string;
  sarees: SareeItem[];
}

interface BatchGroup {
  id: string;
  sarees: SareeItem[];
}

const isUuid = (str?: string | null) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

interface WorkerQCWeaverGridProps {
  filteredWeavers: WeaverGroup[];
  setSelectedWeaverQC: (name: string) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
  pad: string;
}

export function WorkerQCWeaverGrid({
  filteredWeavers,
  setSelectedWeaverQC,
  isDesktop,
  isTablet,
  pad,
}: WorkerQCWeaverGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr",
        gap: isDesktop ? 14 : 10,
        padding: pad,
      }}
    >
      {filteredWeavers.map((wg) => {
        const isWeaverCodeUuid = isUuid(wg.code);
        return (
          <button
            key={wg.name}
            type="button"
            onClick={() => setSelectedWeaverQC(wg.name)}
            aria-label={`Open QC for weaver ${wg.name}`}
            className="group relative flex flex-col justify-between items-start gap-3 rounded-2xl border border-[rgba(110,15,45,0.12)] bg-white p-4 text-left shadow-[0_4px_16px_rgba(74,6,27,0.06)] hover:shadow-[0_8px_24px_rgba(74,6,27,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
            style={{ borderTop: `3px solid ${T.gold}` }}
          >
            <div className="flex items-center gap-3 w-full">
              <div
                style={{ background: T.gradHero }}
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border border-white/20"
              >
                <span style={{ fontFamily: F.u }} className="font-bold text-[13px] text-white">
                  {initials(wg.name)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div
                  style={{ fontFamily: F.u }}
                  className="text-[14px] font-bold text-[#1D1814] truncate group-hover:text-[#6E0F2D] transition-colors"
                >
                  {wg.name}
                </div>
                {!isWeaverCodeUuid && wg.code && (
                  <div style={{ fontFamily: F.m }} className="text-[12px] font-medium text-[#69635E] mt-0.5">
                    {wg.code}
                  </div>
                )}
              </div>

              <div className="w-7 h-7 rounded-lg bg-[#FAF8F6] border border-[#EAE5E1] flex items-center justify-center text-[#69635E] group-hover:text-[#6E0F2D] group-hover:bg-[rgba(110,15,45,0.06)] group-hover:border-[rgba(110,15,45,0.15)] transition-all">
                <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="flex items-center justify-between w-full pt-2 border-t border-[#EAE5E1]/60 mt-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(171,56,50,0.08)] border border-[rgba(171,56,50,0.20)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#AB3832] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#AB3832]"></span>
                </span>
                <span style={{ fontFamily: F.u }} className="text-[12px] font-bold text-[#AB3832]">
                  {wg.sarees.length} pending
                </span>
              </div>

              <span
                style={{ fontFamily: F.u }}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  wg.source === "outsourced"
                    ? "bg-[rgba(31,119,78,0.10)] border border-[rgba(31,119,78,0.22)] text-[#1F774E]"
                    : "bg-[rgba(200,155,71,0.14)] border border-[rgba(200,155,71,0.28)] text-[#845E04]"
                }`}
              >
                {wg.source === "outsourced" ? <User size={12} /> : <Factory size={12} />}
                {wg.source === "outsourced" ? "Outsourced" : "Own Factory"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface WorkerQCBatchGridProps {
  batchGroups: BatchGroup[];
  setSelectedBatchQC: (id: string) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
  pad: string;
}

export function WorkerQCBatchGrid({
  batchGroups,
  setSelectedBatchQC,
  isDesktop,
  isTablet,
  pad,
}: WorkerQCBatchGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr 1fr",
        gap: isDesktop ? 14 : 10,
        padding: pad,
      }}
    >
      {batchGroups.map((bg) => {
        const bweavers = Array.from(new Set(bg.sarees.map((s) => s.weaver)));
        return (
          <button
            key={bg.id}
            type="button"
            onClick={() => setSelectedBatchQC(bg.id)}
            className="group relative flex flex-col justify-between items-start gap-3 rounded-2xl border border-[rgba(110,15,45,0.12)] bg-white p-4 text-left shadow-[0_4px_16px_rgba(74,6,27,0.06)] hover:shadow-[0_8px_24px_rgba(74,6,27,0.12)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
            style={{ borderTop: `3px solid ${T.burg}` }}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-11 h-11 rounded-xl bg-[rgba(200,155,71,0.14)] border border-[rgba(200,155,71,0.30)] flex items-center justify-center flex-shrink-0 text-[#845E04]">
                <Package size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  style={{ fontFamily: F.m }}
                  className="text-[14px] font-bold text-[#6E0F2D] truncate group-hover:text-[#4A061B] transition-colors"
                >
                  {bg.id}
                </div>
                <div style={{ fontFamily: F.u }} className="text-[12px] font-medium text-[#69635E] mt-0.5">
                  {bg.sarees.length} sarees waiting
                </div>
              </div>

              <div className="w-7 h-7 rounded-lg bg-[#FAF8F6] border border-[#EAE5E1] flex items-center justify-center text-[#69635E] group-hover:text-[#6E0F2D] group-hover:bg-[rgba(110,15,45,0.06)] group-hover:border-[rgba(110,15,45,0.15)] transition-all">
                <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div className="w-full pt-2 border-t border-[#EAE5E1]/60 flex items-center gap-1.5 flex-wrap">
              <span style={{ fontFamily: F.u }} className="text-[11px] font-medium text-[#69635E]">
                Weavers:
              </span>
              {bweavers.slice(0, 3).map((w) => (
                <span
                  key={w}
                  style={{ fontFamily: F.u }}
                  className="text-[11px] font-medium text-[#4F4A45] bg-[#FAF8F6] border border-[#EAE5E1] px-2 py-0.5 rounded-full"
                >
                  {w}
                </span>
              ))}
              {bweavers.length > 3 && (
                <span style={{ fontFamily: F.u }} className="text-[11px] font-semibold text-[#845E04]">
                  +{bweavers.length - 3} more
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

