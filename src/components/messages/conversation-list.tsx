"use client";

export function ConversationList({ onSelect, selectedId }: { onSelect?: (id: number) => void; selectedId?: number | null }) {
  return <div className="p-4 text-muted-foreground">No conversations yet</div>;
}
