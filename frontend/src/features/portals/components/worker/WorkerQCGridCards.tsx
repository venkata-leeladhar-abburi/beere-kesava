import React from "react";
import { ChevronRight, Package, User, Factory } from "lucide-react";
import { F, initials, type SareeItem } from "./WorkerQCTypes";

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
        gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr",
        gap: isDesktop ? 16 : 12,
        padding: pad,
      }}
    >
      {filteredWeavers.map((wg) => {
        const isWeaverCodeUuid = isUuid(wg.code);
        const avatarInitials = initials(wg.name);
        const displayCode = (!isWeaverCodeUuid && wg.code) ? wg.code : (wg.sarees[0]?.id || "PENDING-QC");

        return (
          <button
            key={wg.name}
            type="button"
            aria-label={`Open QC queue for ${wg.name}`}
            onClick={() => setSelectedWeaverQC(wg.name)}
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

                {/* Vertical Divider Line */}
                <div className="w-[1px] h-9 bg-[#EAE5E1] mx-4 flex-shrink-0" />

                {/* Saree Code + Weaver Name */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Package size={14} className="text-[#6E0F2D] flex-shrink-0" />
                    <span style={{ fontFamily: F.m }} className="text-[12px] font-bold text-[#6E0F2D] tracking-wider uppercase truncate">
                      {displayCode}
                    </span>
                  </div>
                  <div
                    style={{ fontFamily: F.d }}
                    className="text-[20px] font-bold text-[#4A061B] truncate group-hover:text-[#6E0F2D] transition-colors leading-tight"
                  >
                    {wg.name}
                  </div>
                </div>
              </div>

              {/* Arrow Button */}
              <div className="w-11 h-11 rounded-[16px] bg-[#FFFDFB] border border-[#F0E5D8] flex items-center justify-center text-[#4F4A45] group-hover:text-[#6E0F2D] group-hover:bg-[#FEF4F5] group-hover:border-[#FEE8EB] transition-all flex-shrink-0">
                <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Bottom Row: Pending Count Badge + Source Pill */}
            <div className="flex items-center justify-between w-full gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#FEF5F3] border border-[#FED3CD]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#AB3832]" />
                <span style={{ fontFamily: F.u }} className="text-[13px] font-bold text-[#AB3832]">
                  {wg.sarees.length} pending
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  style={{ fontFamily: F.u }}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-medium ${
                    wg.source === "outsourced"
                      ? "bg-[#F0FAF4] border border-[#C9E8D4] text-[#1F774E]"
                      : "bg-[#FEF6EC] border border-[#F6D9BA] text-[#8D5802]"
                  }`}
                >
                  {wg.source === "outsourced" ? <User size={14} /> : <Factory size={14} />}
                  {wg.source === "outsourced" ? "Outsourced" : "Own Factory"}
                </span>
              </div>
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
        gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : isTablet ? "repeat(2, 1fr)" : "1fr",
        gap: isDesktop ? 16 : 12,
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
            className="group relative flex flex-col justify-between gap-5 rounded-[24px] bg-[#FFFDFB] border border-[#F0E5D8] p-5 sm:p-6 min-h-[170px] text-left shadow-[0_4px_24px_rgba(74,6,27,0.05)] hover:shadow-[0_10px_32px_rgba(74,6,27,0.10)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden max-w-full"
          >
            {/* Top Row: Package Box Icon + Batch ID + Arrow */}
            <div className="flex items-center justify-between w-full gap-3">
              <div className="flex items-center min-w-0 flex-1">
                <div className="w-14 h-14 rounded-[18px] bg-[#FEF6EC] border border-[#F6D9BA] flex items-center justify-center text-[#8D5802] flex-shrink-0 shadow-2xs">
                  <Package size={22} />
                </div>

                <div className="w-[1px] h-9 bg-[#EAE5E1] mx-4 flex-shrink-0" />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span style={{ fontFamily: F.m }} className="text-[12px] font-bold text-[#8D5802] tracking-wider uppercase truncate">
                      BATCH GROUP
                    </span>
                  </div>
                  <div
                    style={{ fontFamily: F.m }}
                    className="text-[18px] font-bold text-[#6E0F2D] truncate group-hover:text-[#4A061B] transition-colors leading-tight"
                  >
                    {bg.id}
                  </div>
                </div>
              </div>

              <div className="w-11 h-11 rounded-[16px] bg-[#FFFDFB] border border-[#F0E5D8] flex items-center justify-center text-[#4F4A45] group-hover:text-[#6E0F2D] group-hover:bg-[#FEF6EC] group-hover:border-[#F6D9BA] transition-all flex-shrink-0">
                <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Bottom Row: Pending Pill + Participating Weavers */}
            <div className="flex items-center justify-between w-full gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#FEF5F3] border border-[#FED3CD]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#AB3832]" />
                <span style={{ fontFamily: F.u }} className="text-[13px] font-bold text-[#AB3832]">
                  {bg.sarees.length} pending
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {bweavers.slice(0, 2).map((w) => (
                  <span
                    key={w}
                    style={{ fontFamily: F.u }}
                    className="text-[12px] font-medium text-[#4F4A45] bg-[#FAF8F6] border border-[#EAE5E1] px-3 py-0.5 rounded-full"
                  >
                    {w}
                  </span>
                ))}
                {bweavers.length > 2 && (
                  <span style={{ fontFamily: F.u }} className="text-[12px] font-semibold text-[#8D5802]">
                    +{bweavers.length - 2}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


