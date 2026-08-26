import { useEffect, useState } from "react";
import { getIsSlowNetwork, subscribeToSlowNetwork } from "../api/requestActivity";

/**
 * True once any in-flight request has been running for longer than
 * SLOW_NETWORK_THRESHOLD_MS (requestActivity.ts). Global rather than
 * per-request: on the connections this drives (shop-floor 2G/3G), several
 * requests are usually crawling at once, and one shared hint is clearer
 * than N separate ones flickering independently.
 */
export function useSlowNetwork(): boolean {
  const [isSlow, setIsSlow] = useState(getIsSlowNetwork);

  useEffect(() => subscribeToSlowNetwork(setIsSlow), []);

  return isSlow;
}
