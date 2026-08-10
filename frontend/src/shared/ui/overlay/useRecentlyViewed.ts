/**
 * useRecentlyViewed — design-system/05-OVERLAYS.md Part H (Command Palette,
 * RECENT group).
 * ═══════════════════════════════════════════════════════════════════════════
 * A small, self-contained "recently viewed" tracker backed by `localStorage`.
 * Detail pages call `recordView({ key, label, path })` once when they mount;
 * `CommandPalette` reads the list back out to render the RECENT group.
 *
 * There is no per-entity route in this app today (weaver/vendor/supplier/loom
 * profiles are shown via local `selected*` state inside a tab, not a routed
 * `/admin/weavers/:id`), so `path` is the closest routable location for the
 * record — e.g. the tab's list page. Selecting a RECENT item in the palette
 * gets you back to the right list, not deep-linked to the open record; that's
 * a real limitation, not an oversight, and the fix (per-entity routes) is out
 * of scope here.
 *
 * Storage is a flat JSON array, most-recent-first, capped at MAX_ENTRIES,
 * deduped by `key` (re-viewing a record moves it to the front instead of
 * duplicating it). A same-tab custom event keeps multiple mounted instances
 * (e.g. the palette re-opening) in sync without a page reload.
 */
import * as React from "react";

export interface RecentlyViewedEntry {
  key: string;
  label: string;
  path: string;
  /** Sub-label shown under the label, e.g. an entity type ("Weaver", "Vendor"). */
  kind?: string;
  viewedAt: number;
}

export type RecordViewInput = Pick<RecentlyViewedEntry, "key" | "label" | "path" | "kind">;

const STORAGE_KEY = "bk:recently-viewed";
const MAX_ENTRIES = 12;
const RECENTLY_VIEWED_EVENT = "bk:recently-viewed-changed";

function readEntries(): RecentlyViewedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e): e is RecentlyViewedEntry =>
      e && typeof e.key === "string" && typeof e.label === "string" && typeof e.path === "string"
    );
  } catch {
    // Corrupt/unavailable storage (private browsing, quota, hand-edited
    // value) degrades to "no recents" rather than throwing.
    return [];
  }
}

function writeEntries(entries: RecentlyViewedEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable — recording a view is best-effort, never
    // something a page mount should fail over.
  }
  // The native `storage` event only fires in *other* tabs/windows, not the
  // one that wrote the value — so notify same-tab listeners (the palette)
  // manually via a custom event.
  window.dispatchEvent(new CustomEvent(RECENTLY_VIEWED_EVENT));
}

/** Records that a record was viewed. Safe to call once from any detail page's mount effect. */
export function recordView(entry: RecordViewInput) {
  if (!entry.key || !entry.path) return;
  const existing = readEntries().filter((e) => e.key !== entry.key);
  const next: RecentlyViewedEntry[] = [
    { ...entry, viewedAt: Date.now() },
    ...existing,
  ].slice(0, MAX_ENTRIES);
  writeEntries(next);
}

/** Live-reads the recently-viewed list, most-recent-first, updating as `recordView` is called. */
export function useRecentlyViewed(): RecentlyViewedEntry[] {
  const [entries, setEntries] = React.useState<RecentlyViewedEntry[]>(() => readEntries());

  React.useEffect(() => {
    const refresh = () => setEntries(readEntries());
    window.addEventListener(RECENTLY_VIEWED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(RECENTLY_VIEWED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return entries;
}
