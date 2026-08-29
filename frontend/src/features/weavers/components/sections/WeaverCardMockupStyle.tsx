import React from "react";
import { MapPin, Phone, Eye, Edit3, Layers3 } from "lucide-react";
import { Rows3 as Rows } from "lucide-react";
import { resolveAssetUrl } from "../../../../shared/api/uploads";

export interface WeaverCardData {
  id: string;
  name: string;
  initials: string;
  code?: string;
  village?: string;
  mobile: string;
  looms: number;
  status: string; // "active" | "qc" | "idle" | "inactive"
  img?: string | null;
  photo?: string | null;
}

// Ornate Leaf Wreath SVG encircling initials
function OrnateWreathFrame({ initials, color }: { initials: string; color: string }) {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center mb-1">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" fill="none" stroke={color} strokeWidth="1.4">
        {/* Outer dashed flourish ring */}
        <circle cx="50" cy="50" r="41" strokeDasharray="3 2" opacity="0.75" />
        {/* Inner solid ring */}
        <circle cx="50" cy="50" r="35" strokeWidth="1.6" />
        {/* Top & Bottom Accents */}
        <path d="M 50 4 C 53 12, 47 12, 50 14" strokeWidth="1.5" />
        <path d="M 50 96 C 53 88, 47 88, 50 86" strokeWidth="1.5" />
        <path d="M 4 50 C 12 53, 12 47, 14 50" strokeWidth="1.5" />
        <path d="M 96 50 C 88 53, 88 47, 86 50" strokeWidth="1.5" />
        {/* Decorative corner leaves */}
        <path d="M 23 23 C 18 31 22 36 28 35" strokeWidth="1.3" />
        <path d="M 77 23 C 82 31 78 36 72 35" strokeWidth="1.3" />
        <path d="M 23 77 C 18 69 22 64 28 65" strokeWidth="1.3" />
        <path d="M 77 77 C 82 69 78 64 72 65" strokeWidth="1.3" />
      </svg>
      <span className="text-[20px] font-bold tracking-widest z-10 font-serif" style={{ color }}>
        {initials}
      </span>
    </div>
  );
}

// Ornate Lotus Filigree SVG Symbol (used for Card 2 style)
function OrnateLotusEmblem({ color }: { color: string }) {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center mb-1">
      <svg viewBox="0 0 100 100" className="w-16 h-16" fill="none" stroke={color} strokeWidth="1.4">
        {/* Lotus Petals Filigree */}
        <path d="M 50 20 C 40 38, 32 48, 50 72 C 68 48, 60 38, 50 20 Z" strokeWidth="1.6" />
        <path d="M 50 35 C 36 45, 22 58, 44 72 Z" strokeWidth="1.3" />
        <path d="M 50 35 C 64 45, 78 58, 56 72 Z" strokeWidth="1.3" />
        <path d="M 50 48 C 30 52, 18 65, 40 73 Z" strokeWidth="1.1" />
        <path d="M 50 48 C 70 52, 82 65, 60 73 Z" strokeWidth="1.1" />
        <circle cx="50" cy="50" r="2.5" fill={color} />
      </svg>
    </div>
  );
}

export function WeaverCardMockupStyle({
  weaver,
  index = 0,
  onNavigateDetails,
  onNavigateEdit,
  onNavigateBatches,
}: {
  weaver: WeaverCardData;
  index?: number;
  onNavigateDetails: () => void;
  onNavigateEdit: () => void;
  onNavigateBatches: () => void;
}) {
  const isDarkCard = index % 4 === 0 || index % 4 === 1;
  const isPurpleCard = index % 4 === 1;
  const isLotusCard = index % 4 === 2;

  // Resolve uploaded weaver image (if any exists from weaver registration)
  const rawImage = weaver.img || weaver.photo;
  const hasUploadedImage = Boolean(rawImage && typeof rawImage === "string" && rawImage.trim().length > 0);
  const uploadedImageUrl = hasUploadedImage ? resolveAssetUrl(rawImage!) : null;

  // Header background theme matching mockup (when no photo uploaded)
  const headerBgClass = isDarkCard
    ? isPurpleCard
      ? "bg-gradient-to-br from-[#270E32] via-[#481859] to-[#1E0927]"
      : "bg-gradient-to-br from-[#3D0616] via-[#5D1027] to-[#25030D]"
    : "bg-gradient-to-b from-[#FBF8F1] via-[#F6F0E4] to-[#EFE7D7]";

  // Colors for filigree header
  const headerTextColor = isDarkCard ? "#FFFDF9" : "#4A061B";
  const emblemColor = isDarkCard ? "#C89B47" : "#8D5802";
  const badgeClass = hasUploadedImage
    ? "bg-black/55 border border-white/20 text-[#E7C983]"
    : isDarkCard
    ? "bg-black/35 border border-white/20 text-[#E7C983]"
    : "bg-[#FEF6EC] border border-[#E7C983]/60 text-[#8D5802]";
  const statusColor = hasUploadedImage ? "#E7C983" : isDarkCard ? "#E7C983" : "#8D5802";

  // Header Display Name: For dark cards use uppercase first name; for light cards use Title Case
  const headerDisplayName = isDarkCard
    ? weaver.name.split(" ")[0].toUpperCase()
    : weaver.name;

  return (
    <div
      className="relative flex flex-col justify-between rounded-[12px] bg-[#FFFDFB] border border-[#F0E5D8] overflow-hidden text-left shadow-[0_4px_20px_rgba(74,6,27,0.05)] cursor-pointer h-full min-h-[490px]"
    >
      {/* Upper Header Banner Block (Height 235px) */}
      {hasUploadedImage && uploadedImageUrl ? (
        <div className="h-[235px] relative overflow-hidden flex-shrink-0 border-b border-[#F0E5D8] bg-[#2D0310]">
          <img
            src={uploadedImageUrl}
            alt={weaver.name}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/20 pointer-events-none" />

          {/* Top-Left Code Badge */}
          <div className={`absolute top-3.5 left-3.5 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-lg shadow-2xs z-20 ${badgeClass}`}>
            {(weaver.code ?? weaver.id).slice(0, 8).toUpperCase()}
          </div>

          {/* Bottom Weaver Name Overlay on Image */}
          <div className="absolute bottom-10 left-3.5 right-3.5 z-20">
            <div style={{ fontFamily: "'Fraunces', serif" }} className="text-[20px] font-bold text-[#FFFDF9] leading-tight truncate drop-shadow-md">
              {weaver.name}
            </div>
          </div>

          {/* Status Strip */}
          <div
            className="absolute bottom-3 left-3.5 z-20 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase"
            style={{ color: statusColor }}
          >
            <span className="text-[#2ECC71]">~</span>
            <span className="drop-shadow-sm">
              {weaver.status === "active"
                ? "CURRENTLY WEAVING"
                : weaver.status === "qc"
                ? "PENDING QC"
                : "IDLE"}
            </span>
          </div>
        </div>
      ) : (
        <div className={`h-[235px] relative overflow-hidden flex-shrink-0 flex flex-col items-center justify-center p-4 text-center ${headerBgClass}`}>
          {/* Pattern texture overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(231,201,131,0.14)_0,transparent_70%)] pointer-events-none" />

          {/* Top-Left Code Badge */}
          <div className={`absolute top-3.5 left-3.5 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-lg shadow-2xs z-20 ${badgeClass}`}>
            {(weaver.code ?? weaver.id).slice(0, 8).toUpperCase()}
          </div>

          {/* Center Symbol / Emblem */}
          {isLotusCard ? (
            <OrnateLotusEmblem color={emblemColor} />
          ) : (
            <OrnateWreathFrame initials={weaver.initials} color={emblemColor} />
          )}

          {/* Center Name in Header */}
          <div
            className={`text-[21px] font-bold tracking-wider mb-1 z-10 truncate max-w-[90%] ${
              isDarkCard ? "drop-shadow-sm" : ""
            }`}
            style={{ fontFamily: "'Fraunces', serif", color: headerTextColor }}
          >
            {headerDisplayName}
          </div>

          {/* Status Strip */}
          <div
            className="z-10 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase"
            style={{ color: statusColor }}
          >
            <span className="text-[#2ECC71]">~</span>
            <span>
              {weaver.status === "active"
                ? "CURRENTLY WEAVING"
                : weaver.status === "qc"
                ? "PENDING QC"
                : "IDLE"}
            </span>
          </div>
        </div>
      )}

      {/* Header / Body Divider Line with Center Flourish Motif (❖) */}
      <div className="relative flex items-center justify-center w-full bg-[#FFFDFB]">
        <div className="w-full h-[1px] bg-[#F0E5D8]" />
        <div className="absolute bg-[#FFFDFB] px-2 text-[#C89B47] text-[11px] font-bold leading-none select-none">
          ❖
        </div>
      </div>

      {/* Lower Body Content Area */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-3.5 bg-[#FFFDFB]">
        <div>
          {/* Weaver Full Name */}
          <div
            style={{ fontFamily: "'Fraunces', serif" }}
            className="text-[19px] font-bold text-[#4A061B] leading-tight mb-2 truncate"
          >
            {weaver.name}
          </div>

          {/* Location & Mobile */}
          <div className="flex flex-col gap-1.5 mb-3.5 text-[13px] text-[#69635E]">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#C89B47] flex-shrink-0" />
              <span>{weaver.village || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-[#C89B47] flex-shrink-0" />
              <span className="font-mono">{weaver.mobile}</span>
            </div>
          </div>

          {/* Looms Spec Box */}
          <div className="bg-[#FEF6EC] border border-[#F6D9BA] rounded-[8px] p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-white border border-[#F6D9BA] flex items-center justify-center text-[#8D5802] flex-shrink-0 shadow-2xs">
              <Rows size={15} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10.5px] font-bold text-[#8D5802] tracking-wider uppercase">
                LOOMS
              </span>
              <span style={{ fontFamily: "'Fraunces', serif" }} className="text-[14px] font-bold text-[#4A061B]">
                {weaver.looms} Looms
              </span>
            </div>
          </div>
        </div>

        {/* 3 Pill Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateDetails();
            }}
            className="flex-1 py-2.5 px-1 rounded-[8px] bg-[#FFFDFB] border border-[#F0E5D8] text-[#6E0F2D] font-bold text-[12px] flex items-center justify-center gap-1.5 hover:bg-[#FEF4F5] hover:border-[#FEE8EB] transition-all cursor-pointer shadow-2xs"
          >
            <Eye size={13} />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateEdit();
            }}
            className="flex-1 py-2.5 px-1 rounded-[8px] bg-[#FFFDFB] border border-[#F0E5D8] text-[#6E0F2D] font-bold text-[12px] flex items-center justify-center gap-1.5 hover:bg-[#FEF4F5] hover:border-[#FEE8EB] transition-all cursor-pointer shadow-2xs"
          >
            <Edit3 size={13} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateBatches();
            }}
            className="flex-1 py-2.5 px-1 rounded-[8px] bg-[#FFFDFB] border border-[#F0E5D8] text-[#6E0F2D] font-bold text-[12px] flex items-center justify-center gap-1.5 hover:bg-[#FEF4F5] hover:border-[#FEE8EB] transition-all cursor-pointer shadow-2xs"
          >
            <Layers3 size={13} />
            <span>Batches</span>
          </button>
        </div>
      </div>

      {/* Bottom Card Decorative Line with Center Flourish (❖) */}
      <div className="relative flex items-center justify-center w-full pb-3 bg-[#FFFDFB]">
        <div className="w-[80%] h-[1px] bg-[#F0E5D8]/80" />
        <div className="absolute bg-[#FFFDFB] px-2 text-[#C89B47] text-[10px] leading-none select-none">
          ❖
        </div>
      </div>
    </div>
  );
}
