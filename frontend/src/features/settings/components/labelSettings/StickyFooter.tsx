import { RotateCcw, Save } from "lucide-react";
import { F, T } from "./primitives";
import { Button } from "../../../../shared/ui/primitives";

export function StickyFooter({
  lastSavedLabel,
  onReset,
  onSave,
  isSaving,
}: {
  lastSavedLabel: string;
  onReset: () => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div
      className="px-4 sm:px-6 md:px-7 xl:px-14 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 py-3 fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[rgba(110,15,45,0.10)] shadow-[0_-4px_20px_rgba(44,24,16,0.07)]"
    >
      <span
        className="text-[11px] sm:text-12 truncate max-w-full text-center sm:text-left"
        style={{ fontFamily: F.ui, color: T.taupe }}
      >
        {lastSavedLabel}
      </span>
      <div className="flex items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
        <Button variant="tertiary" size="sm" iconLeft={RotateCcw} onClick={onReset} disabled={isSaving} className="flex-1 sm:flex-initial">
          Reset
        </Button>
        <Button variant="primary" size="md" iconLeft={Save} onClick={onSave} disabled={isSaving} className="flex-1 sm:flex-initial">
          {isSaving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
