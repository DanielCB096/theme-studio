import { describe, expect, it } from "vitest";

import { isSafeUrl } from "@/lib/url";

describe("isSafeUrl", () => {
  it("acepta rutas internas, anclas y protocolos permitidos", () => {
    expect(isSafeUrl("#contacto")).toBe(true);
    expect(isSafeUrl("/p/mi-pagina")).toBe(true);
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://example.com")).toBe(true);
    expect(isSafeUrl("mailto:hola@example.com")).toBe(true);
    expect(isSafeUrl("tel:+34600000000")).toBe(true);
  });

  it("bloquea javascript, data y URLs protocol-relative", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("JavaScript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("//evil.example")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });
});
