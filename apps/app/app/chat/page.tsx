/**
 * SPDX-License-Identifier: MIT
 */

'use client';

import { Message as MessageBubble } from '@repo/ai/components/message';
import { Thread } from '@repo/ai/components/thread';
import { useChat } from '@repo/ai/lib/react';
import { Button } from '@repo/design-system/ui/button';
import { Input } from '@repo/design-system/ui/input';
import { useEffect, useRef } from 'react';

export default function ChatPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    setInput,
  } = useChat({
    api: '/api/ai/chat',
  });

  const lastMessageId = messages.at(-1)?.id;
  const endRef = useRef<HTMLDivElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll only when the last message changes
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lastMessageId]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="font-semibold text-lg">Chat</h1>
        {error ? (
          <div className="text-red-500 text-sm">
            {typeof error === 'string' ? error : (error as Error).message}
          </div>
        ) : null}
      </div>

      <Thread className="flex-1">
        {messages.map((m) => (
          <MessageBubble key={m.id} data={m} />
        ))}
        {isLoading ? (
          <div className="animate-pulse self-start text-muted-foreground text-sm">
            Thinking…
          </div>
        ) : null}
        <div ref={endRef} />
      </Thread>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask something…"
          disabled={isLoading}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setInput('')}
          disabled={isLoading || !input}
        >
          Clear
        </Button>
      </form>
    </div>
  );
}
