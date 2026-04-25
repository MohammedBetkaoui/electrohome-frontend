/// <reference types="vite/client" />

declare module "laravel-echo";
declare module "pusher-js";

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

declare interface Window {
  Pusher: any;
}
