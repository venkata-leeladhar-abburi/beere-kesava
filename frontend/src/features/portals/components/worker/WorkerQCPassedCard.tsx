import React from "react";
import { CheckCircle2, Calendar, Tag } from "lucide-react";
import { F } from "./WorkerQCTypes";

export function WorkerQCPassedCard({
  id,
  weaver,
  date,
  sareeType,
  payable,
  inspectedBy,
}: {
  id: string;
  weaver: string;
  date: string;
  sareeType?: string;
  payable: string;
  inspectedBy?: string;
}) {
  return (
    <div className="group relative flex flex-col justify-between rounded-[20px] bg-[#FFFDFB] border border-[#F0E5D8] p-5 text-left shadow-[0_4px_20px_rgba(74,6,27,0.05)] hover:shadow-[0_8px_24px_rgba(74,6,27,0.09)] transition-all duration-200 overflow-hidden">
      {/* Top Header: Green Check Icon + Saree ID & Weaver + Passed Pill */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-14 h-14 rounded-[14px] bg-[#F0FAF4] border border-[#C9E8D4] text-[#1F774E] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <CheckCircle2 size={24} />
            </div>

            <div className="min-w-0 flex-1">
              <div style={{ fontFamily: F.m }} className="text-[13.5px] font-bold text-[#6E0F2D] truncate">
                {id}
              </div>
              <div style={{ fontFamily: F.u }} className="text-[13.5px] font-medium text-[#4F4A45] mt-0.5 truncate">
                {weaver}
              </div>
            </div>
          </div>

          <span style={{ fontFamily: F.u }} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0FAF4] border border-[#C9E8D4] text-[#1F774E] text-[12px] font-bold flex-shrink-0">
            <CheckCircle2 size={12} /> Passed
          </span>
        </div>

        {/* Quality Check Status Tag */}
        <div className="mt-4.5">
          <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase mb-2">
            QUALITY CHECK
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{ fontFamily: F.u }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F0FAF4] border border-[#C9E8D4] text-[#1F774E] text-[12.5px] font-semibold"
            >
              <CheckCircle2 size={13} /> Approved into Stock
            </span>
          </div>
        </div>

        {/* Specs Grid: 2x2 with clean divider lines */}
        <div className="mt-4 pt-3.5 border-t border-[#F0E5D8]/70 grid grid-cols-2 gap-x-3 gap-y-3.5">
          {/* Inspected */}
          <div className="min-w-0">
            <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase">
              INSPECTED
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[13.5px] font-bold text-[#1D1814]">
              <Calendar size={15} className="text-[#C89B47] flex-shrink-0" />
              <span style={{ fontFamily: F.u }}>{date}{inspectedBy ? ` · ${inspectedBy}` : ""}</span>
            </div>
          </div>

          {/* Payable */}
          <div className="min-w-0">
            <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase">
              PAYABLE
            </div>
            <div style={{ fontFamily: F.d }} className="text-[20px] font-bold text-[#1F774E] mt-0.5">
              {payable}
            </div>
          </div>

          {/* Saree Type */}
          <div className="min-w-0 pt-3 border-t border-[#F0E5D8]/50">
            <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase">
              SAREE TYPE
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[13px] font-semibold text-[#1D1814] min-w-0">
              <Tag size={14} className="text-[#C89B47] flex-shrink-0" />
              <span style={{ fontFamily: F.u }} className="truncate">{sareeType || "Standard Saree"}</span>
            </div>
          </div>

          {/* Status */}
          <div className="min-w-0 pt-3 border-t border-[#F0E5D8]/50">
            <div style={{ fontFamily: F.u }} className="text-[11px] font-bold tracking-widest text-[#89837E] uppercase">
              STATUS
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[13px] font-bold text-[#1F774E] min-w-0">
              <CheckCircle2 size={14} className="text-[#1F774E] flex-shrink-0" />
              <span style={{ fontFamily: F.u }} className="truncate">QC Cleared</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
