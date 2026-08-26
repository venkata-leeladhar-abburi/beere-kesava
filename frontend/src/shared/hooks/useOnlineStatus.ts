import { useEffect, useState } from "react";

/**
 * navigator.onLine only reflects the network *interface* — it's true on a
 * wifi network with no internet route. Good enough as a first signal (real
 * reachability is inferred from actual request failures via
 * useSlowNetwork/ApiError instead), but its transitions are still the
 * cheapest way to show/hide the offline banner immediately rather than
 * waiting for the next request to fail.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
