/**
 * Backward-compatibility re-export.
 * New code should import from "../../hooks/useResponsive".
 * Existing components import from this path — keep it working.
 */
export { useResponsive } from "../../hooks/useResponsive";
export type { Responsive, Breakpoint } from "../../hooks/useResponsive";
