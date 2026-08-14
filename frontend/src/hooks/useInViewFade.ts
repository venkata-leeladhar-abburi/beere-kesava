import { useRef } from "react";
import { useInView, type UseInViewOptions } from "motion/react";

/**
 * Returns a ref and inView boolean for scroll-triggered fade/slide animations.
 * Attach the ref to any DOM element.
 *
 * @example
 * const { ref, inView } = useInViewFade();
 * return (
 *   <motion.div
 *     ref={ref}
 *     initial={{ opacity: 0, y: 40 }}
 *     animate={inView ? { opacity: 1, y: 0 } : undefined}
 *   />
 * );
 */
export function useInViewFade(margin: UseInViewOptions["margin"] = "-80px 0px") {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin });
  return { ref, inView };
}
