import { useState, useEffect, useRef } from "react";
import { useInView } from "motion/react";

/**
 * Animates a numeric string from 0 to its target value when it enters the viewport.
 * Handles both integers and floats, and preserves surrounding text (e.g. "₹1.4L").
 *
 * @example
 * const displayed = useAnimatedNumber("₹1.4L");
 * return <span>{displayed}</span>;
 */
export function useAnimatedNumber(raw: string, duration = 1600) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  const getInitial = () => {
    const m = raw.match(/(\d+(?:\.\d+)?)/);
    if (!m) return raw;
    const isFloat = m[1].includes(".");
    return raw.replace(m[1], isFloat ? "0.0" : "0");
  };

  const [displayed, setDisplayed] = useState(getInitial);

  useEffect(() => {
    if (!inView) return;
    const match = raw.match(/(\d+(?:\.\d+)?)/);
    if (!match) { setDisplayed(raw); return; }

    const numStr  = match[1];
    const target  = parseFloat(numStr);
    const isFloat = numStr.includes(".");
    const idx = raw.indexOf(numStr);
    const pre = raw.slice(0, idx);
    const suf = raw.slice(idx + numStr.length);

    let t0: number | null = null;
    const step = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 4); // ease-out quartic
      setDisplayed(`${pre}${isFloat ? (e * target).toFixed(1) : Math.round(e * target)}${suf}`);
      if (p < 1) requestAnimationFrame(step);
      else setDisplayed(raw);
    };
    requestAnimationFrame(step);
  }, [inView, raw, duration]);

  return { ref, displayed };
}
