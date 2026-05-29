import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveApiBaseUrl, shouldSendNgrokBrowserWarningHeader } from "./client";

const originalWindow = globalThis.window;

function mockWindowLocation(url: string) {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: new URL(url),
    },
  });
}

describe("shouldSendNgrokBrowserWarningHeader", () => {
  afterEach(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
      return;
    }

    vi.unstubAllGlobals();
  });

  it("returns true for direct ngrok requests", () => {
    mockWindowLocation("https://nexo-frontend-xi.vercel.app/#/dashboard");

    expect(shouldSendNgrokBrowserWarningHeader("https://mossy-smugly-connector.ngrok-free.dev/api/flows")).toBe(true);
  });

  it("returns true for Vercel same-origin api requests that proxy to ngrok", () => {
    mockWindowLocation("https://nexo-frontend-xi.vercel.app/#/dashboard");

    expect(shouldSendNgrokBrowserWarningHeader("https://nexo-frontend-xi.vercel.app/api/flows")).toBe(true);
    expect(shouldSendNgrokBrowserWarningHeader("/api/contacts")).toBe(true);
  });

  it("returns false for non-api Vercel requests", () => {
    mockWindowLocation("https://nexo-frontend-xi.vercel.app/#/dashboard");

    expect(shouldSendNgrokBrowserWarningHeader("https://nexo-frontend-xi.vercel.app/assets/index.js")).toBe(false);
  });

  it("returns false for localhost api requests", () => {
    mockWindowLocation("http://localhost:8080/#/dashboard");

    expect(shouldSendNgrokBrowserWarningHeader("http://localhost:8080/api/flows")).toBe(false);
  });
});

describe("resolveApiBaseUrl", () => {
  afterEach(() => {
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }

    vi.unstubAllEnvs();
  });

  it("uses configured backend URL on Vercel deployments", () => {
    mockWindowLocation("https://nexo-frontend-xi.vercel.app/#/login");
    vi.stubEnv("VITE_API_BASE_URL", "https://mossy-smugly-connector.ngrok-free.dev/api");

    expect(resolveApiBaseUrl()).toBe("https://mossy-smugly-connector.ngrok-free.dev/api");
  });
});
