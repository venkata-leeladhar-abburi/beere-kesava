import { useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";

/** Signed-in sessions end after this long with no user activity. */
export const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const LAST_ACTIVITY_KEY = "bk_last_activity";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;

function readLastActivity(): number {
  try {
    const v = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

function writeLastActivity(ts: number) {
  try { localStorage.setItem(LAST_ACTIVITY_KEY, String(ts)); } catch { /* ignore */ }
}

/**
 * Logs the user out after 5 minutes of inactivity. The last-activity time
 * lives in localStorage so every open tab shares it — working in one tab
 * keeps the others alive, and a tab reopened after a long gap logs out
 * immediately instead of resuming a stale session.
 */
export function IdleLogout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    const expire = () => {
      try { localStorage.removeItem(LAST_ACTIVITY_KEY); } catch { /* ignore */ }
      logout();
      toast.info("You were logged out after 5 minutes of inactivity.");
      navigate("/login", { replace: true });
    };

    const last = readLastActivity();
    if (last && Date.now() - last >= IDLE_TIMEOUT_MS) {
      expire();
      return;
    }
    if (!last) writeLastActivity(Date.now());

    // Throttled: mousemove fires constantly, storage writes need not.
    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 5_000) {
        lastWrite = now;
        writeLastActivity(now);
      }
    };
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    onActivity();

    const timer = window.setInterval(() => {
      if (Date.now() - readLastActivity() >= IDLE_TIMEOUT_MS) expire();
    }, 10_000);

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity));
      window.clearInterval(timer);
    };
  }, [isAuthenticated, logout, navigate]);

  return null;
}
