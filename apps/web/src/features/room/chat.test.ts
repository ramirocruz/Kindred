import { createChatMessage } from "./chat";

describe("chat messages", () => {
  it("preserves the author and normalizes the draft", () => {
    expect(createChatMessage("1", "Raman", " Hello! ")).toEqual({ id: "1", author: "Raman", text: "Hello!" });
  });
  it("rejects empty or oversized messages", () => {
    expect(createChatMessage("1", "Raman", "  ")).toBeNull();
    expect(createChatMessage("1", "Raman", "a".repeat(2001))).toBeNull();
    expect(createChatMessage("1", "Raman", "a".repeat(2000))).not.toBeNull();
  });
});
