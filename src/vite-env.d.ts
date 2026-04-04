/// <reference types="vite/client" />

declare module "laravel-echo";
declare module "pusher-js";

declare interface Window {
  Pusher: any;
}
