/**
 * SPDX-License-Identifier: MIT
 */

'use client';

import { type ChangeEvent, type FormEvent, useCallback, useState } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface UseChatOptions {
  api: string;
  initialMessages?: Message[];
}

export function useChat({ api, initialMessages = [] }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const append = useCallback(
    async (message: { role: 'user' | 'assistant'; content: string }) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        role: message.role,
        content: message.content,
      };

      setMessages((prev) => [...prev, newMessage]);

      if (message.role === 'user') {
        setIsLoading(true);
        try {
          const response = await fetch(api, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [...messages, newMessage],
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to get response');
          }

          const data = await response.json();
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content:
              data.message || data.content || 'Üzgünüm, bir hata oluştu.',
          };

          setMessages((prev) => [...prev, assistantMessage]);
        } catch {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
          };
          setMessages((prev) => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [api, messages]
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isLoading) {
        return;
      }

      const userMessage = input.trim();
      setInput('');
      await append({ role: 'user', content: userMessage });
    },
    [input, isLoading, append]
  );

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setMessages,
    setInput,
  };
}
