import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getToken } from "../api/auth";

let echoInstance: any = null;

function asNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getEchoClient() {
  if (typeof window === "undefined") return null;

  const wsEnabled = (import.meta.env.VITE_NOTIFICATIONS_WS_ENABLED as string | undefined) === "true";
  if (!wsEnabled) return null;

  if (echoInstance) return echoInstance;

  const key = import.meta.env.VITE_PUSHER_APP_KEY as string | undefined;
  const cluster = (import.meta.env.VITE_PUSHER_APP_CLUSTER as string | undefined) ?? "mt1";
  const wsHost = (import.meta.env.VITE_PUSHER_HOST as string | undefined) ?? window.location.hostname;
  const wsPort = asNumber(import.meta.env.VITE_PUSHER_PORT as string | undefined, 6001);
  const forceTls = (import.meta.env.VITE_PUSHER_SCHEME as string | undefined) === "https";
  const authEndpoint =
    (import.meta.env.VITE_BROADCAST_AUTH_ENDPOINT as string | undefined) ??
    "http://localhost:8000/api/broadcasting/auth";

  if (!key) return null;

  window.Pusher = Pusher;

  try {
    echoInstance = new Echo({
      broadcaster: "pusher",
      key,
      cluster,
      wsHost,
      wsPort,
      wssPort: wsPort,
      forceTLS: forceTls,
      enabledTransports: ["ws", "wss"],
      authEndpoint,
      auth: {
        headers: {
          Authorization: `Bearer ${getToken() ?? ""}`,
          Accept: "application/json",
        },
      },
    });
  } catch {
    return null;
  }

  return echoInstance;
}

export function disconnectEchoClient() {
  if (!echoInstance) return;
  echoInstance.disconnect();
  echoInstance = null;
}
