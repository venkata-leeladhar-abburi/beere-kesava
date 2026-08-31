import { CardSection, F, T } from "./primitives";
import { Select, SelectItem } from "../../../../shared/ui/primitives";

const LABEL_SIZE_OPTIONS = [
  "100mm × 50mm (Default)",
  "80mm × 40mm",
  "60mm × 40mm",
];

export function LabelDimensionsCard({ labelSize, setLabelSize }: {
  labelSize: string; setLabelSize: (v: string) => void;
}) {
  return (
    <CardSection title="Label Dimensions">
      <div style={{ marginBottom: 10 }}>
        <Select value={labelSize} onValueChange={setLabelSize}>
          {LABEL_SIZE_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </Select>
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
        Match this to the roll currently loaded in TSC TE244
      </div>
    </CardSection>
  );
}
