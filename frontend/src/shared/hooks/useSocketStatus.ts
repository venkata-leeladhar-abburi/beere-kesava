import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";

export type SocketStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

/**
 * Tracks a socket.io connection's lifecycle so the UI can show something
 * better than silence when realtime push isn't actually live — a
 * "Notification Feed" that looks the same whether it's receiving pushes or
 * has been silently disconnected for ten minutes is exactly the kind of gap
 * this rollout exists to close (design-system/10-UI-STATES.md §6/S6).
 *
 * Takes the socket instance itself (not a factory) so callers keep full
 * control of connect/disconnect lifecycle; this hook only observes.
 */
export function useSocketStatus(socket: Socket | null | undefined): SocketStatus {
  const [status, setStatus] = useState<SocketStatus>(socket?.connected ? "connected" : "connecting");

  useEffect(() => {
    if (!socket) {
      setStatus("disconnected");
      return;
    }

    setStatus(socket.connected ? "connected" : "connecting");

    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onReconnectAttempt = () => setStatus("reconnecting");
    const onAuthError = () => setStatus("disconnected");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("auth_error", onAuthError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("auth_error", onAuthError);
    };
  }, [socket]);

  return status;
}
