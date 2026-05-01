import { describe, expect, it } from "vitest";

import { normalizeResourceResponse } from "./normalizers";

describe("normalizeResourceResponse", () => {
  it("throws when the backend returns an HTML document instead of JSON", () => {
    expect(() => normalizeResourceResponse("<!DOCTYPE html><html><body>ERR_NGROK_6024</body></html>")).toThrow(
      "Invalid resource response format",
    );
  });

  it("keeps supporting plain resource payloads", () => {
    expect(normalizeResourceResponse({ id: 68, name: "darissa" })).toEqual({
      data: { id: 68, name: "darissa" },
    });
  });
});
