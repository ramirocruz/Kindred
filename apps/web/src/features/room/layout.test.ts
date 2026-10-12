import { readFileSync } from "node:fs";

const styles = readFileSync("src/styles/index.css", "utf8");

describe("compact room layout contracts", () => {
  it("bounds expanded chat and allows messages to scroll", () => {
    expect(styles).toMatch(/\.chat-content\s*\{[^}]*height: min\(260px, 40dvh\)/);
    expect(styles).toMatch(/\.chat-messages\s*\{[^}]*overflow-y: auto/);
  });

  it("keeps reduced-motion reactions finite so animation-end cleanup runs", () => {
    expect(styles).toContain("animation: reaction-float 1.6s ease-out forwards");
    expect(styles).toContain("prefers-reduced-motion: reduce");
    expect(styles).toContain("animation: reaction-fade 1.6s linear forwards");
  });
});
