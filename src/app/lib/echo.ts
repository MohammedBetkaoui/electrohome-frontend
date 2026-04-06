import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getToken } from "../api/auth";

let echoInstance: any = null;

type EchoEnv = {
  VITE_NOTIFICATIONS_WS_ENABLED?: string;
  VITE_PUSHER_APP_KEY?: string;
  VITE_PUSHER_APP_CLUSTER?: string;
  VITE_PUSHER_HOST?: string;
  VITE_PUSHER_PORT?: string;
  VITE_PUSHER_SCHEME?: string;
  VITE_BROADCAST_AUTH_ENDPOINT?: string;
};

function asNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getEchoClient() {
  if (typeof window === "undefined") return null;

  const env = (import.meta as ImportMeta & { env?: EchoEnv }).env ?? {};

  const wsEnabled = env.VITE_NOTIFICATIONS_WS_ENABLED === "true";
  if (!wsEnabled) return null;

  if (echoInstance) return echoInstance;

  const key = env.VITE_PUSHER_APP_KEY;
  const cluster = env.VITE_PUSHER_APP_CLUSTER ?? "mt1";
  const wsHost = env.VITE_PUSHER_HOST ?? window.location.hostname;
  const wsPort = asNumber(env.VITE_PUSHER_PORT, 6001);
  const forceTls = env.VITE_PUSHER_SCHEME === "https";
  const authEndpoint = env.VITE_BROADCAST_AUTH_ENDPOINT ?? "http://localhost:8000/api/broadcasting/auth";

  if (!key) return null;

  (window as Window & { Pusher?: typeof Pusher }).Pusher = Pusher;

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
