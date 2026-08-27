import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Palette,
  Tag,
  Scale,
  User,
  Factory,
  Package,
  Clock,
} from "lucide-react";
import { T, F, SareeItem, variance, splitDesignField, initials } from "./WorkerQCTypes";
import { useRatesPricing } from "@/features/pricing";

interface WorkerQCSareeCardProps {
  saree: SareeItem;
  isDesktop?: boolean;
  onMarkPassed: (s: SareeItem) => void;
  onStartSemiApproved: (s: SareeItem) => void;
  onStartDefect: (s: SareeItem) => void;
  onOpenDesignCode: (code: string) => void;
  onOpenSareeTypeCode: (typeCode: string) => void;
}

export function WorkerQCSareeCard({
  saree: s,
  onMarkPassed,
  onStartSemiApproved,
  onStartDefect,
  onOpenDesignCode,
  onOpenSareeTypeCode,
}: WorkerQCSareeCardProps) {
  const { getSareeTypeByName } = useRatesPricing();
  const v = variance(s.weight, s.std);

  const { code: designCode, typeName } = splitDesignField(s.design);
  const typeRec = typeName ? getSareeTypeByName(typeName) : undefined;
  const weaverInitials = initials(s.weaver);

  return (
    <div
      key={s.id}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] bg-[#FFFDFB] border border-[#F0E5D8] p-5 space-y-3.5 shadow-[0_6px_24px_rgba(74,6,27,0.06)] hover:shadow-[0_12px_32px_rgba(74,6,27,0.10)] hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Top Header Row: Package Icon + Saree ID + Status Pill + Menu */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#FEF4F5] border border-[#FEE8EB] flex items-center justify-center text-[#6E0F2D] flex-shrink-0">
            <Package size={17} />
          </div>
          <div
            style={{ fontFamily: F.m }}
            className="text-[13.5px] font-bold text-[#4A061B] tracking-tight truncate"
            title={`Saree ID: ${s.id}`}
          >
            {s.id}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            style={{ fontFamily: F.u }}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FEF6EC] border border-[#F6D9BA] text-[11.5px] font-semibold text-[#8D5802]"
          >
            Pending QC
          </span>
        </div>
      </div>

      {/* Tags Row: Batch, Source, Stock / Order */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        {/* Batch Pill */}
        <span
          style={{ fontFamily: F.m }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#EAE5E1] text-[11.5px] font-bold text-[#6E0F2D]"
        >
          <Package size={12} className="text-[#6E0F2D]" />
          {s.batch}
        </span>

        {/* Source Pill */}
        {s.source === "outsourced" ? (
          <span
            style={{ fontFamily: F.u }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#F0FAF4] border border-[#C9E8D4] text-[11.5px] font-medium text-[#1F774E]"
          >
            <User size={12} />
            Outsourced
          </span>
        ) : (
          <span
            style={{ fontFamily: F.u }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FEF6EC] border border-[#F6D9BA] text-[11.5px] font-medium text-[#8D5802]"
          >
            <Factory size={12} />
            Own Factory
          </span>
        )}

        {/* Bulk Order / General Stock */}
        {s.bulkOrderLabel ? (
          <span
            style={{ fontFamily: F.u }}
            className="inline-flex items-center px-3 py-1 rounded-xl bg-[#F0FAF4] border border-[#C9E8D4] text-[11.5px] font-medium text-[#0F4C30]"
          >
            {s.bulkOrderLabel}
          </span>
        ) : (
          <span
            style={{ fontFamily: F.u }}
            className="inline-flex items-center px-3 py-1 rounded-xl bg-[#F5F2EE] border border-[#EAE5E1] text-[11.5px] font-normal text-[#69635E]"
          >
            General Stock
          </span>
        )}
      </div>

      {/* Assigned Weaver Box */}
      <div className="rounded-2xl border border-[#F0E5D8] bg-[#FAF8F5] p-3.5 sm:p-4 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div
            style={{ fontFamily: F.u }}
            className="text-[10px] font-bold text-[#9F7315] uppercase tracking-wider mb-1"
          >
            ASSIGNED WEAVER
          </div>
          <div
            style={{ fontFamily: F.d }}
            className="text-[16.5px] font-bold text-[#2C1810] leading-tight truncate"
          >
            {s.weaver}
          </div>
        </div>

        <div className="w-10 h-10 rounded-full bg-white border-2 border-[#C89B47] flex items-center justify-center flex-shrink-0 ml-3 shadow-2xs">
          <span style={{ fontFamily: F.u }} className="font-bold text-[13px] text-[#845E04]">
            {weaverInitials}
          </span>
        </div>
      </div>



      {/* Weight Spec Box */}
      <div className="rounded-2xl border border-[#F0E5D8] bg-[#FAF8F5] p-3.5 sm:p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Scale size={15} className="text-[#9F7315]" />
            <span
              style={{ fontFamily: F.u }}
              className="text-[10px] font-bold text-[#9F7315] uppercase tracking-wider"
            >
              WEIGHT SPEC
            </span>
          </div>

          {s.weight > 0 ? (
            <span
              style={{ fontFamily: F.u }}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                v.ok
                  ? "bg-[#F0FAF4] border border-[#C9E8D4] text-[#1F774E]"
                  : "bg-[#FEF5F3] border border-[#FED3CD] text-[#AB3832]"
              }`}
            >
              {v.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {v.ok ? "Within Spec" : `${v.d > 0 ? "+" : ""}${v.d}g`}
            </span>
          ) : (
            <span
              style={{ fontFamily: F.u }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8D5802] bg-[#FEF6EC] border border-[#F6D9BA] px-2.5 py-0.5 rounded-full"
            >
              <Clock size={12} /> Weighing Pending
            </span>
          )}
        </div>

        {/* Weaver Info Block */}
        <div className="mb-2.5 px-3 py-2 rounded-xl bg-[#FAF8F6] border border-[#EAE5E1] flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div
              style={{ fontFamily: F.u }}
              className="text-[10px] font-semibold text-[#69635E] uppercase tracking-wider"
            >
              Assigned Weaver
            </div>
            <div
              style={{ fontFamily: F.u }}
              className="text-[13px] font-bold text-[#1D1814] truncate"
            >
              {s.weaver}
            </div>
          </div>
          {s.weaverCode && (
            <span
              style={{ fontFamily: F.m }}
              className="ml-2 px-2 py-0.5 rounded bg-white border border-[#D8D2CE] text-[11px] font-semibold text-[#4F4A45] flex-shrink-0"
            >
              {s.weaverCode}
            </span>
          )}
        </div>

        {/* Design Code & Saree Type Specs Box */}
        <div className="mb-2.5 p-2.5 rounded-xl bg-[#FAF8F6] border border-[#EAE5E1] space-y-1.5">
          <div className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Palette size={13} className="text-[#845E04] flex-shrink-0" />
              <span style={{ fontFamily: F.u }} className="text-[#69635E] text-[11px]">Design:</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDesignCode(designCode);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    e.preventDefault();
                    onOpenDesignCode(designCode);
                  }
                }}
                style={{ fontFamily: F.m }}
                className="font-bold text-[#6E0F2D] cursor-pointer hover:underline truncate"
              >
                {designCode}
              </span>
            </div>
          </div>

          {typeName && (
            <div className="flex items-center gap-1.5 text-[12px] pt-1.5 border-t border-[#EAE5E1]/70">
              <Tag size={13} className="text-[#1F774E] flex-shrink-0" />
              <span style={{ fontFamily: F.u }} className="text-[#69635E] text-[11px]">Type:</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeRec) onOpenSareeTypeCode(typeRec.code);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    e.preventDefault();
                    if (typeRec) onOpenSareeTypeCode(typeRec.code);
                  }
                }}
                style={{ fontFamily: F.u }}
                className={`font-semibold text-[#1D1814] truncate ${typeRec ? "cursor-pointer hover:underline" : ""}`}
              >
                {typeName}
              </span>
            </div>
          )}
        </div>

        {/* Weight Specification & Variance Card */}
        <div className="p-2.5 rounded-xl bg-white border border-[#EAE5E1]">
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontFamily: F.u }} className="text-[10px] font-semibold text-[#69635E] uppercase tracking-wider flex items-center gap-1">
              <Scale size={11} className="text-[#845E04]" /> Weight Spec
            </span>
            {s.weight > 0 ? (
              <span
                style={{ fontFamily: F.u }}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                  v.ok ? "text-[#1F774E]" : "text-[#AB3832]"
                }`}
              >
                {v.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {v.ok ? "Within Spec" : `${v.d > 0 ? "+" : ""}${v.d}g`}
              </span>
            ) : (
              <span style={{ fontFamily: F.u }} className="inline-flex items-center gap-1 text-[11px] font-medium text-[#845E04] bg-[rgba(200,155,71,0.12)] px-2 py-0.5 rounded-full">
                <Clock size={11} /> Weighing Pending
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between pt-0.5">
            <div style={{ fontFamily: F.m }} className="text-[13px] font-bold text-[#1D1814]">
              {s.weight > 0 ? `${s.weight}g` : "0g"}
              <span style={{ fontFamily: F.u }} className="text-[11px] font-normal text-[#69635E] ml-1">
                / {s.std}g std
              </span>
            </div>
            <div style={{ fontFamily: F.u }} className="text-[11px] text-[#69635E]">
              {s.submitted}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-3 gap-2.5 pt-1.5">
        <button
          type="button"
          onClick={() => onMarkPassed(s)}
          className="h-10.5 rounded-xl bg-[#F0FAF4] border border-[#319061] text-[#1F774E] text-[12.5px] font-bold hover:bg-[#E2F3E8] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 size={15} /> Passed
        </button>

        <button
          type="button"
          onClick={() => onStartSemiApproved(s)}
          className="h-10.5 rounded-xl bg-[#FEF6EC] border border-[#CA8104] text-[#8D5802] text-[12.5px] font-bold hover:bg-[#FBEBDA] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <AlertTriangle size={15} /> Semi
        </button>

        <button
          type="button"
          onClick={() => onStartDefect(s)}
          className="h-10.5 rounded-xl bg-[#6E0F2D] hover:bg-[#4A061B] text-white text-[12.5px] font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <XCircle size={15} /> Defective
        </button>
      </div>
    </div>
  );
}



