/**
 * SPDX-License-Identifier: MIT
 */

'use client';

import { useChat } from '@repo/ai/lib/react';
import { Button } from '@repo/design-system/ui/button';
import { Card } from '@repo/design-system/ui/card';
import { Input } from '@repo/design-system/ui/input';
import { Mic, Plus, Send, Sparkles, X } from 'lucide-react';
import { useSpeechToText } from '../hooks/use-speech-to-text';

// Type-safe helpers to avoid explicit `any` when rendering messages
type TextPart = { type: 'text'; text: string };
type ContentPart = TextPart | { type: string; [key: string]: unknown };
type MessageWithParts = { id?: string; role: string; parts: ContentPart[] };
type MessageWithContent = { id?: string; role: string; content: string };

const hasParts = (m: unknown): m is MessageWithParts => {
  return (
    typeof m === 'object' &&
    m !== null &&
    'parts' in m &&
    Array.isArray((m as { parts?: unknown }).parts)
  );
};

const hasContent = (m: unknown): m is MessageWithContent => {
  return (
    typeof m === 'object' &&
    m !== null &&
    typeof (m as { content?: unknown }).content === 'string'
  );
};

const getMessageText = (m: unknown): string | null => {
  if (hasParts(m)) {
    const text = m.parts
      .map((part) =>
        part &&
        typeof part === 'object' &&
        'type' in part &&
        (part as ContentPart).type === 'text'
          ? (part as TextPart).text
          : ''
      )
      .filter(Boolean)
      .join('');
    return text || null;
  }
  if (hasContent(m)) {
    return m.content;
  }
  return null;
};

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setMessages,
    setInput,
  } = useChat({
    api: '/api/ai/chat',
  });

  // Speech-to-text integration (client-only)
  const { isSupported, isRecording, interimText, error, start, stop } =
    useSpeechToText({
      lang: 'tr-TR',
      interimResults: true,
      continuous: true,
      onTranscription: (text, isFinal) => {
        if (isFinal) {
          // Append recognized text into the input field
          setInput((prev: string) => (prev ? `${prev} ${text}` : text));
        }
      },
    });

  const exampleQuestions = [
    'Zopio nedir?',
    'Zopio nasıl kurarım ?',
    'Zopio için gereklilikler nelerdir ?',
  ];

  const handleQuickAsk = (question: string) => {
    // Append a new user message quickly
    append({ role: 'user', content: question });
  };

  const handleNewChat = () => {
    // Clear conversation and input
    setMessages([]);
    setInput('');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          role="button"
          tabIndex={0}
          aria-label="Arka planı tıklayarak kapat"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClose();
            }
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-full transform flex-col border-border border-l bg-background transition-transform duration-300 ease-in-out sm:w-96 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-border border-b p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="font-bold text-xl">AI Asistan</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              disabled={isLoading}
            >
              <Plus className="mr-1 h-4 w-4" />
              Yeni Sohbet
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col justify-center gap-4">
              <p className="text-center text-muted-foreground text-sm">
                Başlamak için bir soru seçin veya yazın
              </p>
              <div className="space-y-2">
                {exampleQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto w-full justify-start bg-transparent px-4 py-3 text-left text-sm hover:bg-accent"
                    onClick={() => handleQuickAsk(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, idx) => (
                <Card
                  key={message.id ?? idx}
                  className={`p-3 ${
                    message.role === 'user'
                      ? 'ml-auto max-w-[85%] bg-primary text-primary-foreground'
                      : 'max-w-[90%] bg-muted'
                  }`}
                >
                  <p className="mb-1 font-semibold text-sm">
                    {message.role === 'user' ? 'Siz' : 'AI'}
                  </p>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {(() => {
                      const text = getMessageText(message);
                      return text ? <span>{text}</span> : null;
                    })()}
                  </div>
                </Card>
              ))}

              {/* Suggested questions after AI finishes responding */}
              {!isLoading && messages.at(-1)?.role === 'assistant' && (
                <div className="pt-2">
                  <p className="mb-2 text-muted-foreground text-xs">
                    Hazır sorular
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {exampleQuestions.map((question, index) => (
                      <Button
                        key={`suggest-${index}`}
                        variant="outline"
                        className="h-auto justify-start bg-transparent px-3 py-2 text-left text-xs hover:bg-accent"
                        onClick={() => handleQuickAsk(question)}
                        disabled={isLoading}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {isLoading && messages.at(-1)?.role === 'user' && (
            <Card className="max-w-[90%] bg-muted p-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0.2s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0.4s]" />
              </div>
            </Card>
          )}
        </div>

        {/* Input Form */}
        <div className="border-border border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              name="message"
              type="text"
              placeholder="Sorunuzu yazın..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              autoComplete="off"
              className="flex-1"
            />

            {/* Microphone: toggle start/stop speech recognition */}
            <Button
              type="button"
              size="icon"
              variant={isRecording ? 'destructive' : 'outline'}
              disabled={isLoading || !isSupported}
              aria-pressed={isRecording}
              onClick={async () => {
                if (isRecording) {
                  stop();
                } else {
                  await start();
                }
              }}
              title={(() => {
                if (isSupported) {
                  if (isRecording) {
                    return 'Kaydı durdur';
                  }
                  return 'Kaydı başlat';
                }
                return 'Tarayıcı konuşma tanımayı desteklemiyor';
              })()}
            >
              <Mic
                className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`}
              />
              <span className="sr-only">Mikrofon</span>
            </Button>

            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Gönder</span>
            </Button>
          </form>

          {/* Live transcription */}
          {(isRecording || interimText) && (
            <div className="mt-2 text-muted-foreground text-xs">
              {isRecording ? 'Dinliyor: ' : 'Son kayıt: '}
              <span className="font-medium">{interimText}</span>
            </div>
          )}
          {error && (
            <div className="mt-1 text-destructive text-xs">{error}</div>
          )}
        </div>
      </aside>
    </>
  );
}
