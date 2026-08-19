import { describe, expect, it } from "vitest";
import { publicUrl } from "./publicUrl";

describe("publicUrl", () => {
  it("joins BASE_URL with public asset path", () => {
    expect(publicUrl("/models/foo.glb")).toMatch(/models\/foo\.glb$/);
    expect(publicUrl("models/foo.glb")).toMatch(/models\/foo\.glb$/);
  });
});
