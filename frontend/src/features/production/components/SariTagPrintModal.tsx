import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SariTagPhysicalLabel, SareeProps } from "./SariTagPhysicalLabel";
import { SariTagPrintSettings } from "./SariTagPrintSettings";
import { IconButton } from "../../../shared/ui/primitives";

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
    <AnimatePresence>
      <div
        style={{
          position: "fixed", inset: 0, zIndex: "var(--z-modal)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "absolute", inset: 0,
            background: "rgba(27,12,8,0.70)",
            backdropFilter: "blur(6px)",
          }}
        />

        {/* Modal panel */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          style={{
            position: "relative", zIndex: 1,
            width: "min(90vw, 900px)", maxHeight: "90vh",
            background: "#FFFFFF", borderRadius: 20, overflow: "hidden",
            boxShadow: "0 32px 80px rgba(27,12,8,0.28)",
            display: "flex", flexDirection: "column",
          }}
        >
          {/* Modal header */}
          <div
            style={{
              background: T.darkBurgundy,
              padding: "18px 28px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, color: "#FFF" }}>
                Saree Tag Preview
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(200,155,71,0.80)", marginTop: 2 }}>
                {saree.id}
              </div>
            </div>
            <IconButton icon="close" label="Close" variant="ghost" size="sm" shape="circle" onClick={onClose} className="bg-white/12 text-white hover:bg-white/20" />
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
