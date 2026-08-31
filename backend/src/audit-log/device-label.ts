/**
 * A raw User-Agent turned into something a person can read in the Login
 * History timeline.
 *
 * The screen shows a phone or monitor icon next to this, chosen by whether
 * the label contains "mobile" — so the word has to survive into the output
 * for a handset, not just into the icon logic.
 *
 * Deliberately a short hand-rolled matcher rather than a UA-parsing
 * dependency: this feeds one display column, and a wrong guess costs a
 * slightly vague label, not a wrong figure.
 */
export function deviceLabel(userAgent?: string | null): string | undefined {
  const ua = userAgent?.trim();
  if (!ua) return undefined;

  const browser =
    /\bEdg\//.test(ua) ? "Edge"
    : /\bOPR\/|\bOpera\b/.test(ua) ? "Opera"
    : /\bFirefox\//.test(ua) ? "Firefox"
    : /\bChrome\/|\bCriOS\//.test(ua) ? "Chrome"
    : /\bSafari\//.test(ua) ? "Safari"
    : null;

  const isMobile = /\bMobi|Android|iPhone|iPad|iPod/i.test(ua);
  const platform =
    /\biPhone\b/.test(ua) ? "iPhone"
    : /\biPad\b/.test(ua) ? "iPad"
    : /\bAndroid\b/.test(ua) ? "Android"
    : /\bWindows\b/.test(ua) ? "Windows"
    : /\bMac OS X\b|\bMacintosh\b/.test(ua) ? "macOS"
    : /\bLinux\b/.test(ua) ? "Linux"
    : null;

  const base = browser && platform ? `${browser} on ${platform}` : browser ?? platform;
  if (!base) {
    // Nothing recognised — keep a bounded slice of the raw string rather than
    // storing an unbounded header verbatim or losing the evidence entirely.
    return ua.slice(0, 60);
  }

  // "Mobile" is what the timeline's icon check looks for, so it is appended
  // for handsets whose platform name alone wouldn't say so.
  return isMobile && !/iPhone|iPad|Android/.test(base) ? `${base} · Mobile` : base;
}
