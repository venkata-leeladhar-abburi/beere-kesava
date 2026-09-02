import { Printer } from "lucide-react";
import { CardSection, F, T } from "./primitives";
import { Button, Select, SelectItem } from "../../../../shared/ui/primitives";
import { usePrintSareeTags } from "@/features/weavers";

export function PrinterConfigCard({
  printer, setPrinter, connectionType, setConnectionType, printerConnected,
}: {
  printer: string; setPrinter: (v: string) => void;
  connectionType: string; setConnectionType: (v: string) => void;
  printerConnected: boolean;
}) {
  const printSareeTags = usePrintSareeTags();
  return (
    <CardSection title="Printer Configuration">
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontFamily: F.ui,
            fontSize: 12,
            color: T.taupe,
            marginBottom: 6,
          }}
        >
          Default Printer
        </div>
        <Select value={printer} onValueChange={setPrinter}>
          <SelectItem value="TSC TE244">TSC TE244</SelectItem>
          <SelectItem value="Zebra ZD420">Zebra ZD420</SelectItem>
          <SelectItem value="DYMO LabelWriter">DYMO LabelWriter</SelectItem>
        </Select>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontFamily: F.ui,
            fontSize: 12,
            color: T.taupe,
            marginBottom: 6,
          }}
        >
          Connection Type
        </div>
        <Select value={connectionType} onValueChange={setConnectionType}>
          <SelectItem value="USB">USB</SelectItem>
          <SelectItem value="Network">Network (Ethernet)</SelectItem>
        </Select>
      </div>
      {/* Test print row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 16,
        }}
      >
        {/* Was a fake toast with no real print call. Sends an actual tag
            through the browser's print dialog — same path every other
            printed tag in the app uses — so this genuinely proves output
            reaches whatever printer you pick there, not just a canned
            success message. */}
        <Button
          variant="secondary"
          size="sm"
          iconLeft={Printer}
          disabled={!printerConnected}
          onClick={() => printSareeTags([{ sareeId: "TEST-PRINT-001", sareeTypeName: "Test Label" }])}
        >
          Send Test Print
        </Button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: printerConnected ? T.green : T.crimson,
            }}
          />
          <span
            style={{
              fontFamily: F.ui,
              fontSize: 12,
              color: printerConnected ? T.green : T.crimson,
            }}
          >
            {printerConnected ? "Printer Ready" : "Not Connected"}
          </span>
        </div>
      </div>
    </CardSection>
  );
}
