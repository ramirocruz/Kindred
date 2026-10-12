export interface ChatMessage {
  id: string;
  author: string;
  text: string;
}

export function createChatMessage(id: string, author: string, draft: string): ChatMessage | null {
  const text = draft.trim();
  if (!text || text.length > 2000) return null;
  return { id, author, text };
}
