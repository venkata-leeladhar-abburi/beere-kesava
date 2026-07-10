import { useState, useEffect } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

export interface Responsive {
  bp: Breakpoint;
  isMobile: boolean;   // < 768
  isTablet: boolean;   // 768 – 1279
  isDesktop: boolean;  // >= 1280
  w: number;
  px: number;          // horizontal page padding: 16 mobile, 28 tablet, 56 desktop
  cols: (m: number, t: number, d: number) => string; // grid-template-columns helper
}

export function useResponsive(): Responsive {
  const [w, setW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const isMobile  = w < 768;
  const isTablet  = w >= 768 && w < 1280;
  const isDesktop = w >= 1280;
  const bp: Breakpoint = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
  const px = isMobile ? 16 : isTablet ? 28 : 56;

  function cols(m: number, t: number, d: number): string {
    const n = isMobile ? m : isTablet ? t : d;
    return `repeat(${n}, 1fr)`;
  }

  return { bp, isMobile, isTablet, isDesktop, w, px, cols };
}
