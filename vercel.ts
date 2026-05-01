import { routes, type VercelConfig } from "@vercel/config/v1";

const defaultBackendApiBaseUrl = "https://mossy-smugly-connector.ngrok-free.dev/api";
const backendApiBaseUrl = (process.env.NEXO_BACKEND_URL ?? defaultBackendApiBaseUrl).replace(/\/+$/, "");
const apiRewrite = routes.rewrite("/api/(.*)", `${backendApiBaseUrl}/$1`, {
  requestHeaders: {
    "ngrok-skip-browser-warning": "true",
  },
}) as NonNullable<VercelConfig["rewrites"]>[number];

export const config: VercelConfig = {
  rewrites: [apiRewrite],
};
