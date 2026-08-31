import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, Send, X } from "lucide-react";
import { C, F } from "../theme";
import { Button, IconButton, Textarea } from "../../../../../shared/ui/primitives";
import { Modal } from "../../../../../shared/ui/overlay";

export function LowStockDialog({
  open, onClose, priority, setPriority, message, setMessage, onSend,
}: {
  open: boolean; onClose: () => void;
  priority: "urgent" | "normal"; setPriority: (p: "urgent" | "normal") => void;
  message: string; setMessage: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={o => { if (!o) onClose(); }} size="sm">
      <Dialog.Title className="sr-only">Report Low Stock</Dialog.Title>
      <Dialog.Description className="sr-only">Notify Admin and Superadmin of low stock</Dialog.Description>
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #4A061B 100%)`, padding: "28px 32px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(192,57,43,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <AlertTriangle size={24} color="#FF8080" />
            </div>
            <div>
              <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Report Low Stock</div>
              <div style={{ fontFamily: F.u, fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Send an alert to Admin & Superadmin</div>
            </div>
            <Dialog.Close asChild>
              <IconButton
                icon={X}
                label="Close"
                onClick={onClose}
                variant="ghost"
                shape="circle"
                className="ml-auto bg-white/10 text-white/70 w-9 h-9"
              />
            </Dialog.Close>
          </div>
        </div>
        <div style={{ padding: "28px 32px 32px" }}>
              {/* Stock status */}
              <div style={{ background: "rgba(192,57,43,0.06)", border: `1.5px solid rgba(192,57,43,0.22)`, borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text }}>Current shop stock</span>
                  <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 30, color: C.crim }}>84</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Minimum threshold</span>
                  <span style={{ fontFamily: F.m, fontSize: 14, color: C.muted }}>100 sarees</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(192,57,43,0.12)", overflow: "hidden" }}>
                  <div style={{ width: "84%", height: "100%", background: `linear-gradient(90deg, ${C.crim}, #E05050)`, borderRadius: 4 }} />
                </div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.crim, marginTop: 8, fontWeight: 600 }}>↓ 16 below threshold</div>
              </div>
              {/* Priority */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>Priority level</div>
                <div style={{ display: "flex", gap: 12 }}>
                  {(["urgent", "normal"] as const).map(p => {
                    const isActive = priority === p;
                    const activeColor = p === "urgent" ? "border-[#C0392B] bg-[rgba(192,57,43,0.08)] text-[#C0392B]" : "border-[#6E0F2D] bg-[rgba(110,15,45,0.06)] text-[#6E0F2D]";
                    return (
                      <Button
                        key={p}
                        onClick={() => setPriority(p)}
                        variant="ghost"
                        className={"flex-1 h-12 rounded-xl border-2 font-semibold text-sm " + (isActive ? activeColor : "border-[rgba(110,15,45,0.12)] bg-white text-[#69635E]")}
                      >
                        {p === "urgent" ? "🔴 Urgent" : "🟡 Normal"}
                      </Button>
                    );
                  })}
                </div>
              </div>
              {/* Message */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 10 }}>Additional note <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span></div>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="E.g. Festival orders incoming — need Kanjivaram and plain silks urgently..." rows={3}
                  className="rounded-[14px] min-h-[100px] resize-none" />
              </div>
              {/* Recipients note */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(110,15,45,0.05)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "12px 16px", marginBottom: 24 }}>
                <Send size={14} color={C.muted} />
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>This report will be sent to <strong style={{ color: C.text }}>Admin</strong> and <strong style={{ color: C.text }}>Superadmin</strong></span>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <Button onClick={onClose} variant="ghost" className="flex-1 h-[52px] rounded-[14px] border-[1.5px] border-[rgba(110,15,45,0.12)] bg-white hover:bg-[rgba(110,15,45,0.06)] font-semibold text-sm text-[#69635E] hover:text-[#1A0A0F]">
                  Cancel
                </Button>
                <Button onClick={onSend} variant="danger" className="flex-[2] h-[52px] rounded-[14px] border-none bg-[#C0392B] hover:bg-[#962D22] font-bold text-sm text-white hover:text-white gap-2 shadow-[0_4px_18px_rgba(192,57,43,0.35)]">
                  <Send size={17} /> Send Report to Admin
                </Button>
              </div>
            </div>
      </div>
    </Modal>
  );
}
