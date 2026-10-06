import { describe, expect, it } from "vitest";
import OpenGraphImage, { alt, contentType, size } from "./opengraph-image";

describe("custom calendar maker social image", () => {
  it("publishes a large PNG with descriptive alternative text", () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(alt).toContain("custom calendar maker");
  });

  it("returns an image response", () => {
    const response = OpenGraphImage();

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("content-type")).toBe("image/png");
  });
});
