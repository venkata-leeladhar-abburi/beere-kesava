import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Tag } from "lucide-react";
import { toast } from "sonner";
import { F, T, SectionCard } from "./labelSettings/primitives";
import { LabelPreviewCard } from "./labelSettings/LabelPreviewCard";
import { LabelDimensionsCard } from "./labelSettings/LabelDimensionsCard";
import { VisibleFieldsCard } from "./labelSettings/VisibleFieldsCard";
import type { LabelFields } from "./labelSettings/VisibleFieldsCard";
import { BarcodeSettingsCard } from "./labelSettings/BarcodeSettingsCard";
import { PrinterConfigCard } from "./labelSettings/PrinterConfigCard";
import { ScanPageSettingsCard } from "./labelSettings/ScanPageSettingsCard";
import type { ScanFields } from "./labelSettings/ScanPageSettingsCard";
import { StickyFooter } from "./labelSettings/StickyFooter";
import { labelsApi, LabelSettings } from "../../../shared/api/labels";

const DEFAULT_LABEL_SIZE = "100mm × 50mm (Default)";
const DEFAULT_FIELDS: LabelFields = {
  barcode: true,
  code: true,
  weaver: true,
  date: true,
  branding: true,
};
const DEFAULT_PRINTER = "TSC TE244";
const DEFAULT_CONNECTION_TYPE = "USB";
const DEFAULT_SCAN_FIELDS: ScanFields = {
  photo: true,
  code: true,
  weaver: true,
  fabric: true,
  colour: true,
  jari: true,
  dispatchDate: true,
  productionStatus: true,
};

function toLocalState(settings: LabelSettings) {
  return {
    labelSize: settings.labelSize,
    fields: {
      barcode: settings.showBarcode,
      code: settings.showCode,
      weaver: settings.showWeaver,
      date: settings.showDate,
      branding: settings.showBranding,
    } satisfies LabelFields,
    printer: settings.defaultPrinter,
    connectionType: settings.connectionType,
    scanFields: {
      photo: settings.scanShowPhoto,
      code: settings.scanShowCode,
      weaver: settings.scanShowWeaver,
      fabric: settings.scanShowFabric,
      colour: settings.scanShowColour,
      jari: settings.scanShowJari,
      dispatchDate: settings.scanShowDispatchDate,
      productionStatus: settings.scanShowProductionStatus,
    } satisfies ScanFields,
  };
}

export function LabelSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ["label-settings"],
    queryFn: () => labelsApi.getSettings(),
    staleTime: 60_000,
  });

  const [labelSize, setLabelSize] = useState(DEFAULT_LABEL_SIZE);
  const [fields, setFields] = useState<LabelFields>(DEFAULT_FIELDS);
  const [printerConnected] = useState(true);
  const [printer, setPrinter] = useState(DEFAULT_PRINTER);
  const [connectionType, setConnectionType] = useState(DEFAULT_CONNECTION_TYPE);
  const [scanFields, setScanFields] = useState<ScanFields>(DEFAULT_SCAN_FIELDS);
  const [lastSavedLabel, setLastSavedLabel] = useState("Not yet saved");

  // Hydrate local editable state whenever the fetched settings change (initial
  // load, or after a successful save that refetches).
  useEffect(() => {
    if (!settings) return;
    const local = toLocalState(settings);
    setLabelSize(local.labelSize);
    setFields(local.fields);
    setPrinter(local.printer);
    setConnectionType(local.connectionType);
    setScanFields(local.scanFields);
    setLastSavedLabel(`Last saved: ${new Date(settings.updatedAt).toLocaleString("en-IN")}`);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      labelsApi.updateSettings({
        labelSize,
        showBarcode: fields.barcode,
        showCode: fields.code,
        showWeaver: fields.weaver,
        showDate: fields.date,
        showBranding: fields.branding,
        defaultPrinter: printer,
        connectionType,
        scanShowPhoto: scanFields.photo,
        scanShowCode: scanFields.code,
        scanShowWeaver: scanFields.weaver,
        scanShowFabric: scanFields.fabric,
        scanShowColour: scanFields.colour,
        scanShowJari: scanFields.jari,
        scanShowDispatchDate: scanFields.dispatchDate,
        scanShowProductionStatus: scanFields.productionStatus,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["label-settings"], updated);
      setLastSavedLabel(`Last saved: ${new Date(updated.updatedAt).toLocaleString("en-IN")}`);
      toast.success("Label settings saved");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to save label settings");
    },
  });

  const toggleField = (key: keyof LabelFields) =>
    setFields((f) => ({ ...f, [key]: !f[key] }));
  const toggleScanField = (key: keyof ScanFields) =>
    setScanFields((f) => ({ ...f, [key]: !f[key] }));

  const handleReset = () => {
    setLabelSize(DEFAULT_LABEL_SIZE);
    setFields(DEFAULT_FIELDS);
    setPrinter(DEFAULT_PRINTER);
    setConnectionType(DEFAULT_CONNECTION_TYPE);
    setScanFields(DEFAULT_SCAN_FIELDS);
  };

  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", paddingBottom: 110 }}>
      {/* PAGE HEADER */}
      <header
        style={{
          background: "#0D0207",
          position: "relative",
          overflow: "hidden",
          minHeight: 340,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
          {/* Eyebrow */}
          <div
            style={{
              fontFamily: F.ui,
              fontSize: "clamp(11px, 1.4vw, 13px)",
              color: "rgba(255,253,249,0.50)",
              letterSpacing: "1.8px",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            SINCE 1999 · SUPERADMIN · LABEL SETTINGS
          </div>
          {/* H1 & Subtitle */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(32px, 6vw, 56px)",
                fontWeight: 400,
                color: "#FFFDF9",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Label Settings
            </h1>
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(22px, 5vw, 36px)",
                fontStyle: "italic",
                color: T.antiqueGold,
                fontWeight: 400,
              }}
            >
              &amp; Tag Print Configuration
            </span>
          </div>
          {/* Description */}
          <p
            className="max-w-[600px]"
            style={{
              fontFamily: F.ui,
              fontSize: "clamp(14px, 2.2vw, 16px)",
              color: "rgba(255,253,249,0.70)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Configure the physical saree tag label — fields shown, barcode
            format, printer connection, and what customers see when they scan a
            saree QR code.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div
          className="px-4 md:px-7 xl:px-10"
          style={{
            textAlign: "center",
            paddingTop: 80,
            paddingBottom: 80,
            fontFamily: F.ui,
            fontSize: 14,
            color: T.taupe,
          }}
        >
          Loading label settings…
        </div>
      ) : isError ? (
        <div className="px-4 md:px-7 xl:px-10" style={{ textAlign: "center", paddingTop: 80, paddingBottom: 80 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background: "rgba(192,57,43,0.08)",
              border: "1px solid rgba(192,57,43,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <AlertTriangle size={28} color="#C0392B" />
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 400,
              fontSize: 20,
              color: T.luxuryBrown,
              marginBottom: 8,
            }}
          >
            Couldn't load label settings
          </div>
          <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
            Please try refreshing the page.
          </div>
        </div>
      ) : (
        <>
          {/* TWO-COLUMN MAIN LAYOUT */}
          <div
            className="px-4 md:px-7 xl:px-14"
            style={{
              marginTop: -40,
              position: "relative",
              zIndex: 10,
            }}
          >
          <SectionCard icon={Tag} title="Label & Barcode Settings" subtitle="Configure what prints on every saree label, and how it connects to your printer.">
            <div className="flex flex-col xl:flex-row gap-6 xl:gap-8 items-start w-full">
              <LabelPreviewCard fields={fields} />

              {/* RIGHT COLUMN */}
              <div className="w-full flex-1 flex flex-col gap-5">
                <LabelDimensionsCard labelSize={labelSize} setLabelSize={setLabelSize} />
                <VisibleFieldsCard fields={fields} toggleField={toggleField} />
                <BarcodeSettingsCard />
                <PrinterConfigCard
                  printer={printer} setPrinter={setPrinter}
                  connectionType={connectionType} setConnectionType={setConnectionType}
                  printerConnected={printerConnected}
                />
                <ScanPageSettingsCard scanFields={scanFields} toggleScanField={toggleScanField} />
              </div>
            </div>
          </SectionCard>
          </div>

          <StickyFooter
            lastSavedLabel={lastSavedLabel}
            onReset={handleReset}
            onSave={() => saveMutation.mutate()}
            isSaving={saveMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
