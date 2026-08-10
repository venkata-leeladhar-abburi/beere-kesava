/**
 * ConfirmDialog / useConfirm — design-system/05-OVERLAYS.md Part N.
 * ═══════════════════════════════════════════════════════════════════════════
 * Three tiers by consequence:
 *   tier 2 — destructive but recoverable → confirm, Cancel focused
 *   tier 3 — irreversible → type the record's name to confirm, Delete
 *            disabled until it matches
 * Tier 1 (reversible: archive, hide, mark read) never opens a dialog at all —
 * act immediately and toast with Undo (Part N, Tier 1). That's a call-site
 * decision, not something this component enforces.
 */
import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { cn } from "../utils";
import { Button } from "../primitives/Button";
import { Input } from "../primitives/Input";

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  /** Tier 2 (default): a normal typed confirm button. Tier 3: pass
   *  `typeToConfirm` — the button stays disabled until the user types this
   *  exact string (Part N, Tier 3 — "the friction is the point"). */
  typeToConfirm?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" for destructive actions (default), "primary" for a plain
   *  yes/no decision that isn't destructive. */
  tone?: "danger" | "primary";
}

interface ConfirmState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

const ConfirmContext = React.createContext<((opts: ConfirmOptions) => Promise<boolean>) | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmState | null>(null);
  const [typedValue, setTypedValue] = React.useState("");

  const confirm = React.useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      // A call arriving while a previous one is still pending (e.g. a
      // double-clicked trigger) would otherwise overwrite `state` and leave
      // the first promise unresolved forever — settle it as cancelled first.
      setState(prev => {
        prev?.resolve(false);
        return null;
      });
      setTypedValue("");
      setState({ ...opts, resolve });
    });
  }, []);

  const close = (confirmed: boolean) => {
    state?.resolve(confirmed);
    setState(null);
  };

  const matchRequired = !!state?.typeToConfirm;
  const canConfirm = !matchRequired || typedValue === state?.typeToConfirm;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog.Root open={!!state} onOpenChange={open => { if (!open) close(false); }}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay
            className="fixed inset-0 bg-[var(--surface-scrim)] backdrop-blur-[2px]"
            style={{ zIndex: "var(--z-overlay)" }}
          />
          <AlertDialog.Content
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[calc(100vw-32px)] flex flex-col",
              "bg-[var(--surface-overlay)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)]",
              "p-6"
            )}
            style={{ maxWidth: 400, zIndex: "var(--z-modal)" }}
          >
            {state && (
              <>
                <AlertDialog.Title className="bk-title-md" style={{ color: "var(--text-primary)" }}>
                  {state.title}
                </AlertDialog.Title>
                {state.description && (
                  <AlertDialog.Description className="mt-2 bk-body-md" style={{ color: "var(--text-secondary)" }}>
                    {state.description}
                  </AlertDialog.Description>
                )}
                {state.typeToConfirm && (
                  <div className="mt-4">
                    <Input
                      autoFocus={false}
                      value={typedValue}
                      onChange={e => setTypedValue(e.target.value)}
                      placeholder={state.typeToConfirm}
                      aria-label={`Type ${state.typeToConfirm} to confirm`}
                    />
                  </div>
                )}
                <div className="mt-5 flex items-center justify-end gap-2">
                  <AlertDialog.Cancel asChild>
                    <Button variant="tertiary" autoFocus>{state.cancelLabel ?? "Cancel"}</Button>
                  </AlertDialog.Cancel>
                  <Button
                    variant={state.tone === "primary" ? "primary" : "danger"}
                    disabled={!canConfirm}
                    onClick={() => close(true)}
                  >
                    {state.confirmLabel ?? "Confirm"}
                  </Button>
                </div>
              </>
            )}
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext.Provider>
  );
}

/** `const confirmed = await confirm({ title: 'Delete saree SR-00142?', ... })` */
export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
