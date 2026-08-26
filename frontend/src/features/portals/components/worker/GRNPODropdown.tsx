import React from "react";
import { ChevronDown } from "lucide-react";
import { C, F, card } from "./tokens";
import { PurchaseOrder, usePO } from "@/features/purchasing";
import { Button } from "../../../../shared/ui/primitives";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../../../../shared/ui/overlay";
import { useIsMobile } from "../../../../hooks/useResponsive";

interface GRNPODropdownProps {
  selectedPO: PurchaseOrder | null;
  approvedPOs: PurchaseOrder[];
  showPODrop: boolean;
  setShowPODrop: React.Dispatch<React.SetStateAction<boolean>>;
  handleSelectPO: (po: PurchaseOrder) => void;
}

export function GRNPODropdown({
  selectedPO,
  approvedPOs,
  showPODrop,
  setShowPODrop,
  handleSelectPO
}: GRNPODropdownProps) {
  const isMobile = useIsMobile();
  const { isLoading, isError } = usePO();

  const selectedPOContent = selectedPO ? (
    <div>
      {/* poNumber, not id — `id` is a UUID that matches nothing
          staff ever see on paper or elsewhere in the app. */}
      <div style={{ fontWeight: 700, color: C.burg, marginBottom: 2, wordBreak: "break-all", overflowWrap: "anywhere" }}>{selectedPO.poNumber} — {selectedPO.vendor}</div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
        Firm: {selectedPO.firmName ?? "—"} · City: {selectedPO.vendorCity}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4 }}>
        {selectedPO.materials.map(m => (
          <span key={`${m.materialType}-${m.unit}`} style={{
            fontFamily: F.u,
            fontSize: 12,
            fontWeight: 700,
            color: m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : C.burg,
            background: m.materialType === "Warp" ? "rgba(196,146,58,0.1)" : m.materialType === "Resham" ? "rgba(200,155,71,0.1)" : "rgba(110,15,45,0.05)",
            padding: "2px 6px",
            borderRadius: 4
          }}>
            {m.materialType}: {m.quantity} {m.unit}
          </span>
        ))}
      </div>
    </div>
  ) : (
    <span className="text-[#8C7A6B] font-medium">Select an approved purchase order...</span>
  );

  const poReferenceCard = selectedPO && (
    <div style={{ ...card, marginTop: 10, padding: 14 }}>
      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 }}>PO Reference — What Was Ordered</div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 14, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>PO Number</div>
          <div style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg, wordBreak: "break-all" }}>{selectedPO.poNumber}</div>
        </div>
        <div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Vendor</div>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text }}>{selectedPO.vendor} · {selectedPO.vendorCity}</div>
        </div>
        <div>
          <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Firm Name</div>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text }}>{selectedPO.firmName ?? "—"}</div>
        </div>
      </div>
    </div>
  );

  // Mobile layout: In-flow expandable list (prevents floating popup viewport cutoffs)
  if (isMobile) {
    return (
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setShowPODrop(!showPODrop)}
          className="w-full h-auto min-h-[48px] flex items-center justify-between px-3.5 py-2.5 bg-[#FAF6F0] hover:bg-[#F3EBE0] border border-[#E8DCC4] rounded-xl transition-all cursor-pointer text-left"
        >
          <div style={{ color: selectedPO ? C.text : C.muted, fontFamily: F.u, fontSize: 13, flex: 1 }}>
            {selectedPOContent}
          </div>
          <ChevronDown size={18} color={C.muted} className={`shrink-0 ml-2 transition-transform duration-200 ${showPODrop ? "rotate-180" : ""}`} />
        </button>

        {showPODrop && (
          <div className="mt-2 w-full bg-white border border-[#E8DCC4] rounded-xl shadow-lg overflow-hidden max-h-[320px] overflow-y-auto divide-y divide-[#F0E6D8] transition-all">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-[#8C7A6B] font-medium">
                Loading purchase orders&hellip;
              </div>
            ) : isError ? (
              <div className="p-4 text-center text-xs text-[#C0392B] font-medium">
                Couldn&rsquo;t load purchase orders. Try again.
              </div>
            ) : approvedPOs.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8C7A6B] font-medium">
                No approved purchase orders available.
              </div>
            ) : (
              approvedPOs.map(po => (
                <div
                  key={po.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select purchase order ${po.poNumber ?? po.id}`}
                  onClick={() => {
                    handleSelectPO(po);
                    setShowPODrop(false);
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectPO(po);
                      setShowPODrop(false);
                    }
                  }}
                  className="p-3.5 hover:bg-[rgba(110,15,45,0.04)] active:bg-[rgba(110,15,45,0.08)] cursor-pointer transition-colors text-left"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }} className="break-all">
                      {po.poNumber}
                    </span>
                    {po.urgency === "Urgent" && (
                      <span style={{ fontFamily: F.u, fontSize: 10, background: "rgba(183,28,28,0.10)", color: "#B71C1C", padding: "1.5px 6px", borderRadius: 4, fontWeight: 700 }} className="shrink-0">
                        URGENT
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text }} className="mb-0.5">
                    {po.vendor} <span style={{ fontWeight: 400, color: C.muted }}>· {po.vendorCity}</span>
                  </div>
                  {po.firmName && (
                    <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted }} className="mb-1.5">
                      Firm: <span style={{ fontWeight: 500, color: C.text }}>{po.firmName}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {po.materials.map(m => (
                      <span key={m.materialType} style={{
                        fontFamily: F.u, fontSize: 11, fontWeight: 600,
                        color: m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : C.burg,
                        background: m.materialType === "Warp" ? "rgba(196,146,58,0.1)" : m.materialType === "Resham" ? "rgba(200,155,71,0.1)" : "rgba(110,15,45,0.05)",
                        padding: "1.5px 6px", borderRadius: 4
                      }}>
                        {m.materialType}: {m.quantity} {m.unit}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {poReferenceCard}
      </div>
    );
  }

  // Desktop layout: Standard Radix DropdownMenu floating overlay
  return (
    <div>
      <DropdownMenu open={showPODrop} onOpenChange={setShowPODrop}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" fullWidth className="h-auto min-h-[48px] justify-between px-3.5 py-2.5">
            <div style={{ color: selectedPO ? C.text : C.muted, fontFamily: F.u, fontSize: 13, textAlign: "left", flex: 1 }}>
              {selectedPOContent}
            </div>
            <ChevronDown size={16} color={C.muted} style={{ flexShrink: 0, marginLeft: 8, transform: showPODrop ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={12}
          className="!p-0 !rounded-[12px] z-[9999] shadow-2xl bg-white border border-[#E8DCC4] w-[var(--radix-dropdown-menu-trigger-width)] max-w-[calc(100vw-32px)] max-h-[320px] overflow-y-auto"
        >
          {isLoading && (
            <div style={{ padding: "16px", fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" }}>Loading purchase orders&hellip;</div>
          )}
          {!isLoading && isError && (
            <div style={{ padding: "16px", fontFamily: F.u, fontSize: 13, color: "#C0392B", textAlign: "center" }}>Couldn&rsquo;t load purchase orders. Try again.</div>
          )}
          {!isLoading && !isError && approvedPOs.length === 0 && (
            <div style={{ padding: "16px", fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" }}>No approved purchase orders available.</div>
          )}
          {!isLoading && !isError && approvedPOs.map(po => (
            <DropdownMenuItem key={po.id} onClick={() => handleSelectPO(po)}
              className="!h-auto !min-h-[56px] !flex-col !items-start !justify-start !rounded-none !border-b !border-[#F0E6D8] !px-4 !py-3.5 !text-left hover:bg-[rgba(110,15,45,0.04)] focus:bg-[rgba(110,15,45,0.04)] cursor-pointer whitespace-normal"
            >
              <div className="flex items-center justify-between gap-2 w-full mb-1">
                <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 700, color: C.burg }} className="break-all">
                  {po.poNumber}
                </span>
                {po.urgency === "Urgent" && (
                  <span style={{ fontFamily: F.u, fontSize: 10, background: "rgba(183,28,28,0.10)", color: "#B71C1C", padding: "1.5px 6px", borderRadius: 4, fontWeight: 700 }} className="shrink-0">
                    URGENT
                  </span>
                )}
              </div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text }} className="mb-0.5">
                {po.vendor} <span style={{ fontWeight: 400, color: C.muted }}>· {po.vendorCity}</span>
              </div>
              {po.firmName && (
                <div style={{ fontFamily: F.u, fontSize: 11.5, color: C.muted }} className="mb-1.5">
                  Firm: <span style={{ fontWeight: 500, color: C.text }}>{po.firmName}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                {po.materials.map(m => (
                  <span key={m.materialType} style={{
                    fontFamily: F.u, fontSize: 11, fontWeight: 600,
                    color: m.materialType === "Warp" ? "#7A5010" : m.materialType === "Resham" ? "#7A5E1C" : C.burg,
                    background: m.materialType === "Warp" ? "rgba(196,146,58,0.1)" : m.materialType === "Resham" ? "rgba(200,155,71,0.1)" : "rgba(110,15,45,0.05)",
                    padding: "1.5px 6px", borderRadius: 4
                  }}>
                    {m.materialType}: {m.quantity} {m.unit}
                  </span>
                ))}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {poReferenceCard}
    </div>
  );
}
