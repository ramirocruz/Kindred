import { createLocalRoom } from "./local-room";

describe("local room setup", () => {
  it("rejects whitespace-only names before creating a room", () => {
    expect(() => createLocalRoom("  ", "Film night", true)).toThrow();
    expect(() => createLocalRoom("Raman", " ", true)).toThrow();
  });
  it("normalizes names and preserves the reactions preference", () => {
    expect(createLocalRoom(" Raman ", " Film night ", false)).toEqual({
      displayName: "Raman",
      name: "Film night",
      reactions: false,
    });
  });
});
