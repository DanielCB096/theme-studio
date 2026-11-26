import { describe, expect, it } from "vitest";

import {
  MAX_PAGE_ASSET_BYTES,
  buildPageAssetPath,
  validatePageImage,
} from "@/features/page-builder/pageAssets";

describe("validatePageImage", () => {
  it("acepta PNG, JPEG y WebP dentro del límite", () => {
    expect(validatePageImage({ type: "image/png", size: 1024 })).toEqual({
      ok: true,
      extension: "png",
    });
    expect(validatePageImage({ type: "image/jpeg", size: 1024 })).toEqual({
      ok: true,
      extension: "jpg",
    });
    expect(validatePageImage({ type: "image/webp", size: 1024 })).toEqual({
      ok: true,
      extension: "webp",
    });
  });

  it("rechaza formatos no permitidos, vacíos y mayores de 1 MB", () => {
    expect(validatePageImage({ type: "image/svg+xml", size: 100 }).ok).toBe(false);
    expect(validatePageImage({ type: "image/gif", size: 100 }).ok).toBe(false);
    expect(validatePageImage({ type: "image/png", size: 0 }).ok).toBe(false);
    expect(validatePageImage({ type: "image/png", size: MAX_PAGE_ASSET_BYTES + 1 }).ok).toBe(false);
  });
});

describe("buildPageAssetPath", () => {
  const userId = "2f1c1e5a-9d3b-4a7c-8e2f-1b6a4c9d0e21";
  const pageId = "4c7e8a21-3b5f-4d90-8c16-7a9e2d3f4b81";

  it("empieza por la carpeta del usuario y usa el id de página", () => {
    const path = buildPageAssetPath(userId, pageId, "png");
    expect(path).toMatch(new RegExp(`^${userId}/pages/${pageId}/[0-9a-f-]{36}\\.png$`));
  });

  it("usa draft cuando la página aún no está guardada", () => {
    const path = buildPageAssetPath(userId, null, "webp");
    expect(path).toContain(`${userId}/pages/draft/`);
    expect(path.endsWith(".webp")).toBe(true);
  });

  it("no acepta ids de página arbitrarios", () => {
    const path = buildPageAssetPath(userId, "../otra", "jpg");
    expect(path).toContain(`${userId}/pages/draft/`);
  });
});
