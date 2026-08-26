import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { SariTagPhysicalLabel, SareeProps } from "./SariTagPhysicalLabel";
import { SariTagPrintSettings } from "./SariTagPrintSettings";
import { IconButton } from "../../../shared/ui/primitives";
import { Modal } from "../../../shared/ui/overlay";

const T = {
  darkBurgundy: "#3D0E1A",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

interface Props {
  saree: SareeProps;
  onClose: () => void;
}

export function SariTagPrintModal({ saree, onClose }: Props) {
  const isExternal = saree.source === "external";
  const [showWeaver, setShowWeaver]     = useState(true);
  const [showDate, setShowDate]         = useState(true);
  const [showBranding, setShowBranding] = useState(true);
  const [copies, setCopies]             = useState(1);
  const [printer, setPrinter]           = useState("TSC TE244");
  const [labelSize, setLabelSize]       = useState("100mm × 50mm");
  const [printing, setPrinting]         = useState(false);
  const [printed, setPrinted]           = useState(false);

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { setPrinting(false); setPrinted(true); }, 1800);
  };

  return (
    <Modal open onOpenChange={o => !o && onClose()} size="xl">
          {/* Modal header */}
          <div
            style={{
              background: T.darkBurgundy,
              padding: "18px 28px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <Dialog.Title asChild>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>
                  Saree Tag Preview
                </div>
              </Dialog.Title>
              <Dialog.Description className="sr-only">Preview and print saree tags</Dialog.Description>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(200,155,71,0.80)", marginTop: 2 }}>
                {saree.id}
              </div>
            </div>
            <Dialog.Close asChild>
              <IconButton icon="close" label="Close" variant="ghost" size="sm" shape="circle" className="bg-white/12 text-white hover:bg-white/20" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <SariTagPhysicalLabel
              saree={saree}
              isExternal={isExternal}
              showWeaver={showWeaver}
              showDate={showDate}
              showBranding={showBranding}
            />

            <SariTagPrintSettings
              printer={printer}
              setPrinter={setPrinter}
              labelSize={labelSize}
              setLabelSize={setLabelSize}
              copies={copies}
              setCopies={setCopies}
              isExternal={isExternal}
              showWeaver={showWeaver}
              setShowWeaver={setShowWeaver}
              showDate={showDate}
              setShowDate={setShowDate}
              showBranding={showBranding}
              setShowBranding={setShowBranding}
              printed={printed}
              printing={printing}
              handlePrint={handlePrint}
              onClose={onClose}
            />
          </div>
    </Modal>
  );
}
