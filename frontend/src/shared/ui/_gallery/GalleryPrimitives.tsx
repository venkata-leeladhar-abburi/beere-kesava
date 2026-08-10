/**
 * Design gallery — Primitives section (design-system/08-GOVERNANCE.md Part G).
 * ═══════════════════════════════════════════════════════════════════════════
 * Every primitive from `shared/ui/primitives/index.ts`, every real variant,
 * every real state the component supports, a copy-paste snippet, and a
 * keyboard-interaction note grounded in the component's actual
 * implementation (Radix primitive it wraps, or its own key handlers).
 *
 * Contrast ratios are intentionally NOT duplicated here — that's Foundations
 * / Colour territory, built in parallel.
 */
import * as React from "react";
import {
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Checkbox,
  CheckboxField,
  Chip,
  CodeInput,
  Combobox,
  CurrencyInput,
  Field,
  IconButton,
  Input,
  MultiSelect,
  NumberInput,
  Radio,
  RadioGroup,
  RadioField,
  SearchInput,
  Select,
  SelectItem,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Progress,
  StatusPill,
  Switch,
  SwitchField,
  Tag,
  Textarea,
  Tooltip,
  TooltipProvider,
} from "../primitives";
import { ExampleBlock, GallerySection, KeyboardNote, PropsTable } from "./GalleryShared";

export function GalleryPrimitives() {
  return (
    <div>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 6px", color: "var(--text-primary, #1A0A0F)" }}>
          Primitives
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-tertiary, #8A7A6F)", maxWidth: 760, margin: 0 }}>
          Live, interactive renders of every component exported from{" "}
          <code>shared/ui/primitives</code>. Contrast ratios live in the Foundations / Colour
          section — not duplicated here.
        </p>
      </header>

      <TooltipProvider>
        <ButtonSection />
        <IconButtonSection />
        <FieldSection />
        <InputSection />
        <TextareaSection />
        <SearchInputSection />
        <NumberInputSection />
        <CurrencyInputSection />
        <CodeInputSection />
        <SelectSection />
        <ComboboxSection />
        <MultiSelectSection />
        <CheckboxSection />
        <RadioSection />
        <SwitchSection />
        <SliderSection />
        <BadgeTagStatusPillSection />
        <ChipSection />
        <AvatarSection />
        <TooltipSection />
        <SkeletonSpinnerProgressSection />
        <SeparatorSection />
      </TooltipProvider>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Button                                                                  */
/* ────────────────────────────────────────────────────────────────────── */

const BUTTON_VARIANTS = ["primary", "secondary", "tertiary", "ghost", "danger", "danger-subtle", "link"] as const;
const BUTTON_SIZES = ["sm", "md", "lg"] as const;

function ButtonSection() {
  return (
    <GallerySection
      title="Button"
      description='7 variants × 3 sizes, plus loading/disabled state. Default variant is "secondary" (not "primary").'
    >
      <ExampleBlock
        label="Variants (size=md)"
        code={BUTTON_VARIANTS.map((v) => `<Button variant="${v}">${label(v)}</Button>`).join("\n")}
      >
        {BUTTON_VARIANTS.map((v) => (
          <Button key={v} variant={v}>
            {label(v)}
          </Button>
        ))}
      </ExampleBlock>

      <ExampleBlock
        label="Sizes"
        code={BUTTON_SIZES.map((s) => `<Button variant="primary" size="${s}">Save</Button>`).join("\n")}
      >
        {BUTTON_SIZES.map((s) => (
          <Button key={s} variant="primary" size={s}>
            Save
          </Button>
        ))}
      </ExampleBlock>

      <ExampleBlock
        label="Icons"
        code={[
          '<Button variant="primary" iconLeft="check">Approve</Button>',
          '<Button variant="secondary" iconRight="expandDown">More</Button>',
        ].join("\n")}
      >
        <Button variant="primary" iconLeft="check">
          Approve
        </Button>
        <Button variant="secondary" iconRight="expandDown">
          More
        </Button>
      </ExampleBlock>

      <ExampleBlock
        label="States"
        code={[
          '<Button variant="primary" loading loadingLabel="Saving">Save</Button>',
          '<Button variant="primary" disabled>Save</Button>',
          '<Button variant="secondary" fullWidth>Full width</Button>',
        ].join("\n")}
      >
        <Button variant="primary" loading loadingLabel="Saving">
          Save
        </Button>
        <Button variant="primary" disabled>
          Save
        </Button>
        <div style={{ width: 220 }}>
          <Button variant="secondary" fullWidth>
            Full width
          </Button>
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "variant", type: "primary | secondary | tertiary | ghost | danger | danger-subtle | link", default: "secondary" },
          { prop: "size", type: "sm | md | lg", default: "md" },
          { prop: "iconLeft / iconRight", type: "IconName | LucideIcon" },
          { prop: "loading", type: "boolean", default: "false", description: "shows spinner, sets aria-busy, disables" },
          { prop: "loadingLabel", type: "string", default: '"Loading"', description: "sr-only text while loading" },
          { prop: "fullWidth", type: "boolean" },
          { prop: "asChild", type: "boolean", default: "false", description: "Radix Slot — render as child element (e.g. router Link)" },
          { prop: "disabled", type: "boolean" },
        ]}
      />

      <KeyboardNote>
        Native <code>&lt;button&gt;</code> (or Radix <code>Slot</code> when <code>asChild</code>). Tab to
        focus, Space/Enter to activate. Focus ring via <code>focus-visible</code> only (no ring on mouse click).
      </KeyboardNote>
    </GallerySection>
  );
}

function label(v: string) {
  return v
    .split("-")
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

/* ────────────────────────────────────────────────────────────────────── */
/* IconButton                                                              */
/* ────────────────────────────────────────────────────────────────────── */

const ICON_BUTTON_VARIANTS = ["primary", "secondary", "tertiary", "ghost", "danger"] as const;

function IconButtonSection() {
  return (
    <GallerySection
      title="IconButton"
      description='`label` is a required prop — TypeScript refuses to compile an icon button with no accessible name.'
    >
      <ExampleBlock
        label="Variants"
        code={ICON_BUTTON_VARIANTS.map((v) => `<IconButton icon="edit" label="Edit" variant="${v}" />`).join("\n")}
      >
        {ICON_BUTTON_VARIANTS.map((v) => (
          <IconButton key={v} icon="edit" label="Edit" variant={v} />
        ))}
      </ExampleBlock>

      <ExampleBlock
        label="Sizes & shapes"
        code={[
          '<IconButton icon="close" label="Close" size="sm" />',
          '<IconButton icon="close" label="Close" size="md" />',
          '<IconButton icon="close" label="Close" size="lg" />',
          '<IconButton icon="close" label="Close" shape="circle" variant="secondary" />',
        ].join("\n")}
      >
        <IconButton icon="close" label="Close" size="sm" />
        <IconButton icon="close" label="Close" size="md" />
        <IconButton icon="close" label="Close" size="lg" />
        <IconButton icon="close" label="Close" shape="circle" variant="secondary" />
      </ExampleBlock>

      <ExampleBlock
        label="States"
        code={[
          '<IconButton icon="download" label="Save" loading />',
          '<IconButton icon="download" label="Save" disabled />',
        ].join("\n")}
      >
        <IconButton icon="download" label="Save" loading />
        <IconButton icon="download" label="Save" disabled />
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "icon", type: "IconName | LucideIcon", description: "required" },
          { prop: "label", type: "string", description: "required — becomes aria-label" },
          { prop: "variant", type: "primary | secondary | tertiary | ghost | danger", default: "ghost" },
          { prop: "size", type: "sm | md | lg", default: "md" },
          { prop: "shape", type: "square | circle", default: "square" },
          { prop: "loading", type: "boolean", default: "false" },
        ]}
      />

      <KeyboardNote>Native &lt;button&gt;. Tab to focus, Space/Enter to activate.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Field                                                                   */
/* ────────────────────────────────────────────────────────────────────── */

function FieldSection() {
  return (
    <GallerySection
      title="Field"
      description="Composition wrapper — generates ids and wires them via context so Input/Select/Textarea/etc. never write aria-describedby / aria-invalid / htmlFor by hand."
    >
      <ExampleBlock
        label="Default / required / hint / error"
        code={[
          '<Field label="Weaver code" hint="Format: WV-000">',
          '  <Input placeholder="WV-001" />',
          "</Field>",
          "",
          '<Field label="Batch quantity" required error="Quantity is required">',
          "  <NumberInput />",
          "</Field>",
        ].join("\n")}
      >
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div style={{ width: 220 }}>
            <Field label="Weaver code" hint="Format: WV-000">
              <Input placeholder="WV-001" />
            </Field>
          </div>
          <div style={{ width: 220 }}>
            <Field label="Batch quantity" required error="Quantity is required">
              <NumberInput />
            </Field>
          </div>
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "label", type: "ReactNode", description: "required" },
          { prop: "required", type: "boolean", default: "false", description: "adds visible * and sr-only \"required\"" },
          { prop: "hint", type: "ReactNode" },
          { prop: "error", type: "ReactNode", description: "presence sets invalid=true in context, renders role=alert" },
          { prop: "id", type: "string", description: "override — otherwise React.useId()" },
        ]}
      />

      <KeyboardNote>Not itself interactive — labels/describes whatever control is nested inside it.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Input                                                                   */
/* ────────────────────────────────────────────────────────────────────── */

function InputSection() {
  const [clearableValue, setClearableValue] = React.useState("Pochampally silk");

  return (
    <GallerySection title="Input" description="Replaces raw <input> elements. Reads Field's context automatically.">
      <ExampleBlock
        label="Sizes"
        code={['<Input size="sm" placeholder="Small" />', '<Input size="md" placeholder="Medium" />', '<Input size="lg" placeholder="Large" />'].join(
          "\n"
        )}
      >
        <div style={{ width: 140 }}>
          <Input size="sm" placeholder="Small" />
        </div>
        <div style={{ width: 140 }}>
          <Input size="md" placeholder="Medium" />
        </div>
        <div style={{ width: 140 }}>
          <Input size="lg" placeholder="Large" />
        </div>
      </ExampleBlock>

      <ExampleBlock
        label="Icons & addons"
        code={[
          '<Input iconLeft="search" placeholder="Search" />',
          '<Input addonLeft="₹" placeholder="0.00" />',
        ].join("\n")}
      >
        <div style={{ width: 160 }}>
          <Input iconLeft="search" placeholder="Search" />
        </div>
        <div style={{ width: 140 }}>
          <Input addonLeft="₹" placeholder="0.00" />
        </div>
      </ExampleBlock>

      <ExampleBlock
        label="Clearable (interactive)"
        code={[
          "const [value, setValue] = useState('Pochampally silk');",
          "<Input",
          "  value={value}",
          "  onChange={(e) => setValue(e.target.value)}",
          "  clearable",
          "  onClear={() => setValue('')}",
          "/>",
        ].join("\n")}
      >
        <div style={{ width: 220 }}>
          <Input
            value={clearableValue}
            onChange={(e) => setClearableValue(e.target.value)}
            clearable
            onClear={() => setClearableValue("")}
          />
        </div>
      </ExampleBlock>

      <ExampleBlock
        label="States"
        code={['<Input invalid placeholder="Invalid" />', '<Input disabled placeholder="Disabled" value="Read-only-ish" />', '<Input readOnly value="Read only" />'].join(
          "\n"
        )}
      >
        <div style={{ width: 140 }}>
          <Input invalid placeholder="Invalid" />
        </div>
        <div style={{ width: 140 }}>
          <Input disabled placeholder="Disabled" value="Locked" readOnly />
        </div>
        <div style={{ width: 140 }}>
          <Input readOnly value="Read only" />
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "size", type: "sm | md | lg", default: "md" },
          { prop: "iconLeft / iconRight", type: "IconName | LucideIcon" },
          { prop: "addonLeft / addonRight", type: "ReactNode" },
          { prop: "invalid", type: "boolean", description: "falls back to Field context" },
          { prop: "clearable", type: "boolean" },
          { prop: "onClear", type: "() => void" },
          { prop: "...rest", type: "ComponentProps<'input'>", description: "minus size/style" },
        ]}
      />

      <KeyboardNote>Native &lt;input&gt;. Tab to focus/type. Clear button is a separate Tab stop when clearable+has value.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Textarea                                                                */
/* ────────────────────────────────────────────────────────────────────── */

function TextareaSection() {
  const [value, setValue] = React.useState("Handwoven with natural dyes.");

  return (
    <GallerySection title="Textarea" description="Optional n / max counter, turns warning at 90%, danger at 100%.">
      <ExampleBlock
        label="With counter (interactive)"
        code={[
          "const [value, setValue] = useState('Handwoven with natural dyes.');",
          "<Textarea",
          "  value={value}",
          "  onChange={(e) => setValue(e.target.value)}",
          "  maxLength={80}",
          "  showCounter",
          "/>",
        ].join("\n")}
      >
        <div style={{ width: 320 }}>
          <Textarea value={value} onChange={(e) => setValue(e.target.value)} maxLength={80} showCounter />
        </div>
      </ExampleBlock>

      <ExampleBlock label="States" code={['<Textarea invalid placeholder="Invalid" />', '<Textarea disabled value="Locked" />'].join("\n")}>
        <div style={{ width: 220 }}>
          <Textarea invalid placeholder="Invalid" />
        </div>
        <div style={{ width: 220 }}>
          <Textarea disabled value="Locked" readOnly />
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "invalid", type: "boolean", description: "falls back to Field context" },
          { prop: "showCounter", type: "boolean" },
          { prop: "maxLength", type: "number" },
        ]}
      />

      <KeyboardNote>Native &lt;textarea&gt;. Tab to focus/type. Resizable vertically by mouse drag (resize-y).</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* SearchInput                                                             */
/* ────────────────────────────────────────────────────────────────────── */

function SearchInputSection() {
  const [lastSearch, setLastSearch] = React.useState("");

  return (
    <GallerySection title="SearchInput" description='type="search", search icon, debounced onSearch (default 300ms), clear button.'>
      <ExampleBlock
        label="Interactive"
        code={["<SearchInput onSearch={(v) => console.log(v)} debounceMs={300} />"].join("\n")}
      >
        <div style={{ width: 240 }}>
          <SearchInput onSearch={setLastSearch} />
        </div>
        <span style={{ fontSize: 12, color: "var(--text-tertiary, #8A7A6F)" }}>
          last onSearch: <code>{lastSearch || "(empty)"}</code>
        </span>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "onSearch", type: "(value: string) => void", description: "fires debounceMs after typing stops" },
          { prop: "debounceMs", type: "number", default: "300" },
        ]}
      />

      <KeyboardNote>Tab to focus, type to search. Escape clears native search input in some browsers; Clear button is a separate Tab stop.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* NumberInput                                                             */
/* ────────────────────────────────────────────────────────────────────── */

function NumberInputSection() {
  const [qty, setQty] = React.useState<number | "">(12);

  return (
    <GallerySection title="NumberInput" description='inputMode="numeric", tabular figures, ↑/↓ arrow-key stepper.'>
      <ExampleBlock
        label="Interactive (min=0, max=100, step=1)"
        code={[
          "const [qty, setQty] = useState<number | ''>(12);",
          '<NumberInput value={qty} onValueChange={setQty} min={0} max={100} step={1} />',
        ].join("\n")}
      >
        <div style={{ width: 120 }}>
          <NumberInput value={qty} onValueChange={setQty} min={0} max={100} step={1} />
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "value", type: "number | ''" },
          { prop: "onValueChange", type: "(value: number | '') => void" },
          { prop: "min / max / step", type: "number", default: "step=1" },
        ]}
      />

      <KeyboardNote>Tab to focus, type digits. ArrowUp/ArrowDown increment/decrement by `step`, clamped to min/max.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* CurrencyInput                                                           */
/* ────────────────────────────────────────────────────────────────────── */

function CurrencyInputSection() {
  const [amount, setAmount] = React.useState<number | "">(24500);

  return (
    <GallerySection title="CurrencyInput" description="₹ addon, inputMode=decimal, Indian grouping applied on blur.">
      <ExampleBlock
        label="Interactive — blur to see grouping"
        code={["const [amount, setAmount] = useState<number | ''>(24500);", "<CurrencyInput value={amount} onValueChange={setAmount} />"].join("\n")}
      >
        <div style={{ width: 160 }}>
          <CurrencyInput value={amount} onValueChange={setAmount} />
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "value", type: "number | ''" },
          { prop: "onValueChange", type: "(value: number | '') => void" },
        ]}
      />

      <KeyboardNote>Tab to focus, type digits/decimal point. Grouping separators are stripped on focus, re-applied on blur.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* CodeInput                                                               */
/* ────────────────────────────────────────────────────────────────────── */

function CodeInputSection() {
  const [code, setCode] = React.useState("wv-002");

  return (
    <GallerySection title="CodeInput" description="Entity codes (WV-002, BATCH-086). Mono font, forced uppercase, no spellcheck.">
      <ExampleBlock
        label="Interactive — type lowercase, see it force uppercase"
        code={["const [code, setCode] = useState('wv-002');", "<CodeInput value={code} onChange={(e) => setCode(e.target.value)} />"].join("\n")}
      >
        <div style={{ width: 160 }}>
          <CodeInput value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
      </ExampleBlock>

      <PropsTable rows={[{ prop: "entityType", type: "string", description: "reserved for Phase 6 masking, not wired up yet" }]} />

      <KeyboardNote>Tab to focus, type — characters are force-uppercased on change.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Select                                                                  */
/* ────────────────────────────────────────────────────────────────────── */

function SelectSection() {
  const [fabric, setFabric] = React.useState("silk");

  return (
    <GallerySection title="Select" description="Built on @radix-ui/react-select. Use for ≤10 options (Hick's Law rule); >10 → Combobox.">
      <ExampleBlock
        label="Interactive"
        code={[
          "const [fabric, setFabric] = useState('silk');",
          '<Select value={fabric} onValueChange={setFabric} placeholder="Choose fabric">',
          '  <SelectItem value="silk">Silk</SelectItem>',
          '  <SelectItem value="cotton">Cotton</SelectItem>',
          '  <SelectItem value="linen">Linen</SelectItem>',
          "</Select>",
        ].join("\n")}
      >
        <div style={{ width: 180 }}>
          <Select value={fabric} onValueChange={setFabric} placeholder="Choose fabric">
            <SelectItem value="silk">Silk</SelectItem>
            <SelectItem value="cotton">Cotton</SelectItem>
            <SelectItem value="linen">Linen</SelectItem>
          </Select>
        </div>
      </ExampleBlock>

      <ExampleBlock label="Sizes" code={['<Select size="sm">…</Select>', '<Select size="lg">…</Select>'].join("\n")}>
        <div style={{ width: 140 }}>
          <Select size="sm" placeholder="Small">
            <SelectItem value="a">Option A</SelectItem>
          </Select>
        </div>
        <div style={{ width: 140 }}>
          <Select size="lg" placeholder="Large">
            <SelectItem value="a">Option A</SelectItem>
          </Select>
        </div>
      </ExampleBlock>

      <ExampleBlock label="States" code={['<Select invalid placeholder="Invalid">…</Select>', '<Select disabled placeholder="Disabled">…</Select>'].join("\n")}>
        <div style={{ width: 160 }}>
          <Select invalid placeholder="Invalid">
            <SelectItem value="a">Option A</SelectItem>
          </Select>
        </div>
        <div style={{ width: 160 }}>
          <Select disabled placeholder="Disabled">
            <SelectItem value="a">Option A</SelectItem>
          </Select>
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "size", type: "sm | md | lg", default: "md" },
          { prop: "placeholder", type: "string" },
          { prop: "invalid", type: "boolean" },
          { prop: "value / onValueChange / defaultValue / disabled / ...", type: "Radix Select.Root props" },
        ]}
      />

      <KeyboardNote>
        Radix Select. Tab to focus trigger, Enter/Space/ArrowDown to open, ArrowUp/ArrowDown to move between
        items, Enter to select, Escape to close, type-ahead to jump to a matching item.
      </KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Combobox                                                                */
/* ────────────────────────────────────────────────────────────────────── */

const WEAVER_OPTIONS = [
  { value: "wv-001", label: "Anjali Reddy — WV-001" },
  { value: "wv-002", label: "Basha Sk — WV-002" },
  { value: "wv-003", label: "Chandra Rao — WV-003" },
  { value: "wv-004", label: "Divya Naidu — WV-004" },
  { value: "wv-005", label: "Eshwar Goud — WV-005" },
  { value: "wv-006", label: "Farida Begum — WV-006" },
  { value: "wv-007", label: "Gopal Swamy — WV-007" },
  { value: "wv-008", label: "Hema Latha — WV-008" },
  { value: "wv-009", label: "Irfan Baig — WV-009" },
  { value: "wv-010", label: "Jyothi Devi — WV-010" },
  { value: "wv-011", label: "Kishore Babu — WV-011" },
];

function ComboboxSection() {
  const [weaver, setWeaver] = React.useState<string | undefined>("wv-003");

  return (
    <GallerySection title="Combobox" description="Search field + fuzzy filter (cmdk) + 'No results' state. Use when a choice has >10 options.">
      <ExampleBlock
        label="Interactive (11 options)"
        code={[
          "const options = [{ value: 'wv-001', label: 'Anjali Reddy — WV-001' }, /* …11 total */];",
          "const [weaver, setWeaver] = useState('wv-003');",
          '<Combobox options={options} value={weaver} onValueChange={setWeaver} placeholder="Assign weaver" />',
        ].join("\n")}
      >
        <div style={{ width: 260 }}>
          <Combobox options={WEAVER_OPTIONS} value={weaver} onValueChange={setWeaver} placeholder="Assign weaver" />
        </div>
      </ExampleBlock>

      <ExampleBlock label="Empty state" code={['<Combobox options={[]} placeholder="No matches" emptyMessage="No results" />'].join("\n")}>
        <div style={{ width: 220 }}>
          <Combobox options={[]} placeholder="No matches" emptyMessage="No results" />
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "options", type: "{ value; label; disabled? }[]" },
          { prop: "value / onValueChange", type: "string / (v: string) => void" },
          { prop: "placeholder / searchPlaceholder / emptyMessage", type: "string" },
          { prop: "size", type: "sm | md | lg", default: "md" },
          { prop: "invalid / disabled", type: "boolean" },
        ]}
      />

      <KeyboardNote>
        Built on cmdk (Command). Tab to focus trigger, Enter/Space opens and auto-focuses the search field.
        Type to filter, ArrowUp/ArrowDown to move, Enter to select, Escape to close.
      </KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* MultiSelect                                                             */
/* ────────────────────────────────────────────────────────────────────── */

const MATERIAL_OPTIONS = [
  { value: "silk", label: "Silk" },
  { value: "cotton", label: "Cotton" },
  { value: "zari", label: "Zari thread" },
  { value: "dye", label: "Natural dye" },
  { value: "linen", label: "Linen", disabled: true },
];

function MultiSelectSection() {
  const [materials, setMaterials] = React.useState<string[]>(["silk", "zari"]);

  return (
    <GallerySection title="MultiSelect" description="Checkbox items; selections render as chips, collapse to 'n selected' past 3.">
      <ExampleBlock
        label="Interactive"
        code={[
          "const options = [{ value: 'silk', label: 'Silk' }, { value: 'cotton', label: 'Cotton' }, …];",
          "const [materials, setMaterials] = useState(['silk', 'zari']);",
          '<MultiSelect options={options} value={materials} onValueChange={setMaterials} placeholder="Select materials" />',
        ].join("\n")}
      >
        <div style={{ width: 280 }}>
          <MultiSelect options={MATERIAL_OPTIONS} value={materials} onValueChange={setMaterials} placeholder="Select materials" />
        </div>
      </ExampleBlock>

      <ExampleBlock label="Disabled" code={['<MultiSelect options={options} value={[]} onValueChange={() => {}} disabled />'].join("\n")}>
        <div style={{ width: 220 }}>
          <MultiSelect options={MATERIAL_OPTIONS} value={[]} onValueChange={() => {}} disabled />
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "options", type: "{ value; label; disabled? }[]" },
          { prop: "value / onValueChange", type: "string[] / (v: string[]) => void" },
          { prop: "placeholder / invalid / disabled", type: "string / boolean / boolean" },
        ]}
      />

      <KeyboardNote>
        Custom (not Radix) — role=combobox trigger + role=listbox popup. Tab to focus trigger, Enter/Space or
        click to open. Within the list, Tab moves between options; Enter/Space toggles the focused option.
        Escape or clicking outside closes.
      </KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Checkbox                                                                */
/* ────────────────────────────────────────────────────────────────────── */

function CheckboxSection() {
  const [checked, setChecked] = React.useState<boolean | "indeterminate">(true);

  return (
    <GallerySection title="Checkbox" description="Built on @radix-ui/react-checkbox. Whole label is clickable via CheckboxField.">
      <ExampleBlock
        label="States (interactive — click to toggle)"
        code={[
          "const [checked, setChecked] = useState<boolean | 'indeterminate'>(true);",
          '<Checkbox checked={checked} onCheckedChange={setChecked} />',
          "<Checkbox checked={false} />",
          '<Checkbox checked="indeterminate" />',
          "<Checkbox checked={false} disabled />",
        ].join("\n")}
      >
        <Checkbox checked={checked} onCheckedChange={setChecked} />
        <Checkbox checked={false} />
        <Checkbox checked="indeterminate" />
        <Checkbox checked={false} disabled />
      </ExampleBlock>

      <ExampleBlock
        label="CheckboxField (label + description)"
        code={['<CheckboxField label="Send WhatsApp reminder" description="Sent 1 day before due date" defaultChecked />'].join("\n")}
      >
        <CheckboxField label="Send WhatsApp reminder" description="Sent 1 day before due date" defaultChecked />
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "checked / onCheckedChange", type: "boolean | 'indeterminate' / fn", description: "Radix CheckboxPrimitive.Root props" },
          { prop: "disabled", type: "boolean" },
          { prop: "CheckboxField: label / description / id", type: "ReactNode / ReactNode / string" },
        ]}
      />

      <KeyboardNote>Radix Checkbox. Tab to focus, Space to toggle. 44px hit area via inset pseudo-span.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Radio                                                                   */
/* ────────────────────────────────────────────────────────────────────── */

function RadioSection() {
  const [tier, setTier] = React.useState("standard");

  return (
    <GallerySection title="Radio" description="2–5 mutually exclusive, all-visible options. Built on @radix-ui/react-radio-group.">
      <ExampleBlock
        label="RadioGroup + RadioField (interactive)"
        code={[
          "const [tier, setTier] = useState('standard');",
          '<RadioGroup value={tier} onValueChange={setTier}>',
          '  <RadioField value="economy" label="Economy" description="7-day turnaround" />',
          '  <RadioField value="standard" label="Standard" description="3-day turnaround" />',
          '  <RadioField value="rush" label="Rush" description="Next-day turnaround" />',
          "</RadioGroup>",
        ].join("\n")}
      >
        <RadioGroup value={tier} onValueChange={setTier} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <RadioField value="economy" label="Economy" description="7-day turnaround" />
          <RadioField value="standard" label="Standard" description="3-day turnaround" />
          <RadioField value="rush" label="Rush" description="Next-day turnaround" />
        </RadioGroup>
      </ExampleBlock>

      <ExampleBlock label="Disabled option" code={['<RadioField value="x" label="Unavailable" disabled />'].join("\n")}>
        <RadioGroup defaultValue="standard">
          <RadioField value="x" label="Unavailable" disabled />
        </RadioGroup>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "RadioGroup: value / onValueChange", type: "Radix RadioGroupPrimitive.Root props" },
          { prop: "Radio / RadioField: disabled", type: "boolean" },
          { prop: "RadioField: label / description", type: "ReactNode" },
        ]}
      />

      <KeyboardNote>
        Radix RadioGroup. Tab enters/exits the group (one stop), ArrowUp/ArrowDown (or Left/Right) moves
        between options and selects them, Space also selects the focused option.
      </KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Switch                                                                  */
/* ────────────────────────────────────────────────────────────────────── */

function SwitchSection() {
  const [on, setOn] = React.useState(true);

  return (
    <GallerySection title="Switch" description="For settings that apply immediately, no Save button. Built on @radix-ui/react-switch.">
      <ExampleBlock
        label="Interactive"
        code={["const [on, setOn] = useState(true);", "<Switch checked={on} onCheckedChange={setOn} />", "<Switch checked={false} disabled />"].join(
          "\n"
        )}
      >
        <Switch checked={on} onCheckedChange={setOn} />
        <Switch checked={false} disabled />
      </ExampleBlock>

      <ExampleBlock
        label="SwitchField (label + description)"
        code={['<SwitchField label="Auto-approve small orders" description="Under ₹5,000, skip manual review" defaultChecked />'].join("\n")}
      >
        <div style={{ width: 320 }}>
          <SwitchField label="Auto-approve small orders" description="Under ₹5,000, skip manual review" defaultChecked />
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "checked / onCheckedChange", type: "boolean / fn", description: "Radix SwitchPrimitive.Root props" },
          { prop: "disabled", type: "boolean" },
          { prop: "SwitchField: label / description / id", type: "ReactNode / ReactNode / string" },
        ]}
      />

      <KeyboardNote>Radix Switch. Tab to focus, Space to toggle. Thumb animates via transform only.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Slider                                                                  */
/* ────────────────────────────────────────────────────────────────────── */

function SliderSection() {
  const [price, setPrice] = React.useState([2500]);
  const [range, setRange] = React.useState([1000, 8000]);

  return (
    <GallerySection title="Slider" description="Built on @radix-ui/react-slider. Pair with NumberInput for exact entry (sliders alone are imprecise for money).">
      <ExampleBlock
        label="Single thumb (interactive, drag to see value label)"
        code={[
          "const [price, setPrice] = useState([2500]);",
          '<Slider value={price} onValueChange={setPrice} min={0} max={10000} step={100} showValueLabel formatValue={(v) => `₹${v}`} />',
        ].join("\n")}
      >
        <div style={{ width: 260 }}>
          <Slider value={price} onValueChange={setPrice} min={0} max={10000} step={100} showValueLabel formatValue={(v) => `₹${v}`} />
        </div>
      </ExampleBlock>

      <ExampleBlock
        label="Range (two thumbs)"
        code={[
          "const [range, setRange] = useState([1000, 8000]);",
          '<Slider value={range} onValueChange={setRange} min={0} max={10000} step={100} />',
        ].join("\n")}
      >
        <div style={{ width: 260 }}>
          <Slider value={range} onValueChange={setRange} min={0} max={10000} step={100} />
        </div>
      </ExampleBlock>

      <ExampleBlock label="Disabled" code={'<Slider defaultValue={[40]} disabled />'}>
        <div style={{ width: 220 }}>
          <Slider defaultValue={[40]} disabled />
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "value / defaultValue", type: "number[]" },
          { prop: "onValueChange", type: "(value: number[]) => void" },
          { prop: "min / max / step", type: "number" },
          { prop: "showValueLabel", type: "boolean", description: "floating label above thumb while dragging" },
          { prop: "formatValue", type: "(value: number) => string" },
          { prop: "disabled", type: "boolean" },
        ]}
      />

      <KeyboardNote>
        Radix Slider. Tab to focus a thumb, ArrowLeft/ArrowRight (or Up/Down) to step by `step`, Home/End to
        jump to min/max, Page Up/Page Down for larger jumps. Multiple thumbs are separate Tab stops.
      </KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Badge / Tag / StatusPill                                                */
/* ────────────────────────────────────────────────────────────────────── */

const STATUS_TONES = ["neutral", "brand", "success", "warning", "danger", "info"] as const;

function BadgeTagStatusPillSection() {
  return (
    <GallerySection title="Badge / Tag / StatusPill" description="Three static (non-interactive) shells from Badge.tsx sharing one visual pattern.">
      <ExampleBlock label="Badge (count/label)" code={['<Badge>12</Badge>', '<Badge size="sm">New</Badge>'].join("\n")}>
        <Badge>12</Badge>
        <Badge size="sm">New</Badge>
      </ExampleBlock>

      <ExampleBlock label="Tag (classification)" code={['<Tag>Silk</Tag>', '<Tag>Pochampally</Tag>'].join("\n")}>
        <Tag>Silk</Tag>
        <Tag>Pochampally</Tag>
      </ExampleBlock>

      <ExampleBlock
        label="StatusPill — all 6 tones (dot + text, never colour alone)"
        code={STATUS_TONES.map((t) => `<StatusPill tone="${t}" label="${label(t)}" />`).join("\n")}
      >
        {STATUS_TONES.map((t) => (
          <StatusPill key={t} tone={t} label={label(t)} />
        ))}
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "Badge/Tag: size", type: "sm | md", default: "md" },
          { prop: "StatusPill: tone", type: "neutral | brand | success | warning | danger | info", description: "required" },
          { prop: "StatusPill: label", type: "string", description: "required — rendered next to the dot" },
        ]}
      />

      <KeyboardNote>Not interactive — plain &lt;span&gt;, no focus stop.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Chip                                                                    */
/* ────────────────────────────────────────────────────────────────────── */

function ChipSection() {
  const [filters, setFilters] = React.useState(["Silk", "Under ₹5,000", "In stock"]);

  return (
    <GallerySection title="Chip" description="The one badge-family member that's interactive/removable — active filters.">
      <ExampleBlock
        label="Interactive — click × or focus + Backspace/Delete to remove"
        code={[
          "const [filters, setFilters] = useState(['Silk', 'Under ₹5,000', 'In stock']);",
          "filters.map((f) => (",
          "  <Chip key={f} label={f} onRemove={() => setFilters((fs) => fs.filter((x) => x !== f))} />",
          "))",
        ].join("\n")}
      >
        {filters.map((f) => (
          <Chip key={f} label={f} onRemove={() => setFilters((fs) => fs.filter((x) => x !== f))} />
        ))}
        {filters.length === 0 && <span style={{ fontSize: 12, color: "var(--text-tertiary, #8A7A6F)" }}>(all removed)</span>}
      </ExampleBlock>

      <ExampleBlock label="Non-removable" code={['<Chip label="Read-only chip" />'].join("\n")}>
        <Chip label="Read-only chip" />
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "label", type: "ReactNode", description: "required" },
          { prop: "onRemove", type: "() => void", description: "presence renders the × button" },
          { prop: "removeLabel", type: "string", description: 'aria-label override, default "Remove {label}"' },
        ]}
      />

      <KeyboardNote>
        Chip itself is a Tab stop only when removable (tabIndex=0); Backspace/Delete removes it. The × button
        is a second, separate Tab stop; Enter/Space activates it.
      </KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Avatar                                                                  */
/* ────────────────────────────────────────────────────────────────────── */

function AvatarSection() {
  return (
    <GallerySection title="Avatar" description="Built on @radix-ui/react-avatar. Fallback colour deterministic from a hash of the name (8-colour verified set).">
      <ExampleBlock
        label="Sizes"
        code={(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((s) => `<Avatar name="Anjali Reddy" size="${s}" />`).join("\n")}
      >
        {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((s) => (
          <Avatar key={s} name="Anjali Reddy" size={s} />
        ))}
      </ExampleBlock>

      <ExampleBlock
        label="Status indicator"
        code={['<Avatar name="Basha Sk" status="online" />', '<Avatar name="Chandra Rao" status="busy" />', '<Avatar name="Divya Naidu" status="offline" />'].join("\n")}
      >
        <Avatar name="Basha Sk" status="online" />
        <Avatar name="Chandra Rao" status="busy" />
        <Avatar name="Divya Naidu" status="offline" />
      </ExampleBlock>

      <ExampleBlock
        label="AvatarGroup (overflow past max)"
        code={[
          "<AvatarGroup",
          "  avatars={[",
          '    { name: "Anjali Reddy" }, { name: "Basha Sk" }, { name: "Chandra Rao" },',
          '    { name: "Divya Naidu" }, { name: "Eshwar Goud" }, { name: "Farida Begum" },',
          "  ]}",
          "  max={4}",
          "/>",
        ].join("\n")}
      >
        <AvatarGroup
          avatars={[
            { name: "Anjali Reddy" },
            { name: "Basha Sk" },
            { name: "Chandra Rao" },
            { name: "Divya Naidu" },
            { name: "Eshwar Goud" },
            { name: "Farida Begum" },
          ]}
          max={4}
        />
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "name", type: "string", description: "required — drives initials + fallback colour" },
          { prop: "src", type: "string" },
          { prop: "size", type: "xs | sm | md | lg | xl | 2xl", default: "md" },
          { prop: "status", type: "online | offline | busy" },
          { prop: "AvatarGroup: avatars / size / max", type: "{name,src}[] / AvatarSize / number", default: "max=4" },
        ]}
      />

      <KeyboardNote>Not interactive — no focus stop.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Tooltip                                                                 */
/* ────────────────────────────────────────────────────────────────────── */

function TooltipSection() {
  return (
    <GallerySection title="Tooltip" description="Built on @radix-ui/react-tooltip. Never the only source of info, never contains interactive content, dismissible with Escape.">
      <ExampleBlock
        label="Hover / focus the button to see it (sides)"
        code={[
          '<Tooltip content="Approve this batch" side="top"><Button variant="secondary">Top</Button></Tooltip>',
          '<Tooltip content="Approve this batch" side="right"><Button variant="secondary">Right</Button></Tooltip>',
          '<Tooltip content="Approve this batch" side="bottom"><Button variant="secondary">Bottom</Button></Tooltip>',
        ].join("\n")}
      >
        <Tooltip content="Approve this batch" side="top">
          <Button variant="secondary">Top</Button>
        </Tooltip>
        <Tooltip content="Approve this batch" side="right">
          <Button variant="secondary">Right</Button>
        </Tooltip>
        <Tooltip content="Approve this batch" side="bottom">
          <Button variant="secondary">Bottom</Button>
        </Tooltip>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "content", type: "ReactNode", description: "required" },
          { prop: "children", type: "ReactElement", description: "required, single trigger element" },
          { prop: "side", type: "top | right | bottom | left", default: "top" },
          { prop: "delayDuration", type: "number", default: "500" },
        ]}
      />

      <KeyboardNote>
        Radix Tooltip — requires a <code>TooltipProvider</code> ancestor (wraps this whole gallery section).
        Opens on hover after delayDuration, or immediately on keyboard focus of the trigger. Escape dismisses.
      </KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Skeleton / Spinner / Progress                                          */
/* ────────────────────────────────────────────────────────────────────── */

function SkeletonSpinnerProgressSection() {
  return (
    <GallerySection title="Skeleton / Spinner / Progress" description="Skeleton is the default loading state for page/section loads; Spinner is reserved for inline/button-scoped async.">
      <ExampleBlock label="Skeleton" code={['<Skeleton style={{ width: 200, height: 16 }} />', '<Skeleton style={{ width: 44, height: 44, borderRadius: 999 }} />'].join("\n")}>
        <Skeleton style={{ width: 200, height: 16 }} />
        <Skeleton style={{ width: 44, height: 44, borderRadius: 999 }} />
      </ExampleBlock>

      <ExampleBlock
        label="Spinner sizes"
        code={(["sm", "md", "lg", "xl"] as const).map((s) => `<Spinner size="${s}" />`).join("\n")}
      >
        {(["sm", "md", "lg", "xl"] as const).map((s) => (
          <Spinner key={s} size={s} />
        ))}
      </ExampleBlock>

      <ExampleBlock
        label="Progress"
        code={[
          '<Progress value={62} label="Uploading batch photos" />',
          '<Progress value={30} intent="warning" size="sm" />',
          "<Progress value={0} indeterminate />",
        ].join("\n")}
      >
        <div style={{ width: 260, display: "flex", flexDirection: "column", gap: 12 }}>
          <Progress value={62} label="Uploading batch photos" />
          <Progress value={30} intent="warning" size="sm" />
          <Progress value={0} indeterminate />
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "Skeleton: (any div props)", type: "ComponentProps<'div'>", description: "aria-hidden, motion-safe:animate-pulse" },
          { prop: "Spinner: size", type: "sm | md | lg | xl", default: "md" },
          { prop: "Progress: value", type: "number (0-100)", description: "required" },
          { prop: "Progress: size", type: "sm | md | lg", default: "md" },
          { prop: "Progress: intent", type: "brand | success | warning | danger", default: "brand" },
          { prop: "Progress: label / indeterminate", type: "ReactNode / boolean" },
        ]}
      />

      <KeyboardNote>None of the three are interactive. Progress exposes role=progressbar with aria-valuenow/min/max for assistive tech.</KeyboardNote>
    </GallerySection>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Separator                                                               */
/* ────────────────────────────────────────────────────────────────────── */

function SeparatorSection() {
  return (
    <GallerySection title="Separator" description="Built on @radix-ui/react-separator. Prefer spacing over rules — reach for this only when space alone is ambiguous.">
      <ExampleBlock label="Horizontal" code={["<Separator />"].join("\n")}>
        <div style={{ width: 260 }}>
          <Separator />
        </div>
      </ExampleBlock>

      <ExampleBlock label="With label" code={['<Separator label="OR" />'].join("\n")}>
        <div style={{ width: 260 }}>
          <Separator label="OR" />
        </div>
      </ExampleBlock>

      <ExampleBlock label="Vertical" code={['<div style={{ height: 40 }}><Separator orientation="vertical" /></div>'].join("\n")}>
        <div style={{ height: 40, display: "flex" }}>
          <Separator orientation="vertical" />
        </div>
      </ExampleBlock>

      <PropsTable
        rows={[
          { prop: "orientation", type: "horizontal | vertical", default: "horizontal" },
          { prop: "label", type: "ReactNode", description: "horizontal only — renders rule / label / rule" },
        ]}
      />

      <KeyboardNote>Decorative by default (role=none via Radix decorative flag) — not a landmark, no focus stop.</KeyboardNote>
    </GallerySection>
  );
}
