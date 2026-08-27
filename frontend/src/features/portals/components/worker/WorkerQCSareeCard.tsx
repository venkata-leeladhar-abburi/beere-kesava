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
import { T, F, SareeItem, variance, splitDesignField } from "./WorkerQCTypes";
import { useRatesPricing } from "@/features/pricing";
import { Button } from "../../../../shared/ui/primitives";

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

  return (
    <div
      key={s.id}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-[rgba(110,15,45,0.12)] shadow-[0_4px_16px_rgba(74,6,27,0.06)] hover:shadow-[0_8px_24px_rgba(74,6,27,0.12)] hover:-translate-y-0.5 transition-all duration-200"
      style={{
        borderTop: `3px solid ${T.gold}`,
      }}
    >
      {/* Top Header Rail & Metadata */}
      <div className="p-3.5 pb-3">
        {/* Header Row: Saree ID & Status Badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div
            style={{ fontFamily: F.m }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(110,15,45,0.07)] border border-[rgba(110,15,45,0.15)] text-[12px] font-bold text-[#4A061B] tracking-wide"
            title={`Saree ID: ${s.id}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#6E0F2D]" />
            {s.id}
          </div>

          <span
            style={{ fontFamily: F.u }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(200,155,71,0.14)] border border-[rgba(200,155,71,0.30)] text-[11px] font-semibold text-[#845E04]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C89B47] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C89B47]"></span>
            </span>
            Pending QC
          </span>
        </div>

        {/* Tags Row: Batch, Source, Stock/Order */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {/* Batch Pill */}
          <span
            style={{ fontFamily: F.m }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[rgba(110,15,45,0.08)] border border-[rgba(110,15,45,0.16)] text-[11px] font-semibold text-[#6E0F2D]"
          >
            <Package size={11} className="text-[#6E0F2D]" />
            {s.batch}
          </span>

          {/* Source Pill */}
          {s.source === "outsourced" ? (
            <span
              style={{ fontFamily: F.u }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[rgba(31,119,78,0.10)] border border-[rgba(31,119,78,0.22)] text-[11px] font-medium text-[#1F774E]"
            >
              <User size={11} />
              Outsourced
            </span>
          ) : (
            <span
              style={{ fontFamily: F.u }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[rgba(200,155,71,0.15)] border border-[rgba(200,155,71,0.28)] text-[11px] font-medium text-[#845E04]"
            >
              <Factory size={11} />
              Own Factory
            </span>
          )}

          {/* Bulk Order / General Stock */}
          {s.bulkOrderLabel ? (
            <span
              style={{ fontFamily: F.u }}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-[rgba(15,76,48,0.10)] border border-[rgba(15,76,48,0.20)] text-[11px] font-medium text-[#0F4C30]"
            >
              {s.bulkOrderLabel}
            </span>
          ) : (
            <span
              style={{ fontFamily: F.u }}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-[rgba(105,99,94,0.08)] border border-[rgba(105,99,94,0.16)] text-[11px] font-normal text-[#69635E]"
            >
              General Stock
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

      {/* Action Footer Bar */}
      <div className="p-2 bg-[#FAF8F6] border-t border-[#EAE5E1] grid grid-cols-3 gap-1.5">
        <Button
          variant="primary"
          iconLeft={CheckCircle2}
          onClick={() => onMarkPassed(s)}
          className="h-9 rounded-lg bg-[#15603D] hover:bg-[#0F4C30] text-[#FFFFFF] text-[11px] font-bold shadow-xs transition-colors"
        >
          Passed
        </Button>

        <Button
          variant="primary"
          iconLeft={AlertTriangle}
          onClick={() => onStartSemiApproved(s)}
          className="h-9 rounded-lg bg-[#9F7315] hover:bg-[#845E04] text-[#FFFFFF] text-[11px] font-bold shadow-xs transition-colors"
        >
          Semi
        </Button>

        <Button
          variant="primary"
          iconLeft={XCircle}
          onClick={() => onStartDefect(s)}
          className="h-9 rounded-lg bg-[#AB3832] hover:bg-[#8C2B26] text-[#FFFFFF] text-[11px] font-bold shadow-xs transition-colors"
        >
          Defective
        </Button>
      </div>
    </div>
  );
}

