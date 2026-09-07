import { CardSection, F, T } from "./primitives";
import { Select, SelectItem } from "../../../../shared/ui/primitives";
import { LABEL_SIZE_OPTIONS, parseLabelSize } from "../../../../shared/ui/document";

export function LabelDimensionsCard({ labelSize, setLabelSize }: {
  labelSize: string; setLabelSize: (v: string) => void;
}) {
  // A size saved before this list existed (or removed from it later) would
  // otherwise select as blank and be silently overwritten on the next save.
  const options = LABEL_SIZE_OPTIONS.includes(labelSize)
    ? LABEL_SIZE_OPTIONS
    : [labelSize, ...LABEL_SIZE_OPTIONS];
  const { widthMm, heightMm } = parseLabelSize(labelSize);

  return (
    <CardSection title="Label Dimensions">
      <div style={{ marginBottom: 10 }}>
        <Select value={labelSize} onValueChange={setLabelSize}>
          {options.map((option) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </Select>
      </div>
      <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
        Match this to the roll currently loaded in TSC TE244. Every label the
        app prints — material (GRN) labels, saree receive tags and shop tag
        prints — is laid out at {widthMm}mm × {heightMm}mm, one sticker per
        page.
      </div>
    </CardSection>
  );
}
