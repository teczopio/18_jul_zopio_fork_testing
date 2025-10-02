/**
 * SPDX-License-Identifier: MIT
 */

'use client';

import { Button } from '@repo/design-system/ui/button';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { ChatSidebar } from './chat-sidebar';

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Main Content */}
      <div className="container mx-auto flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="max-w-3xl space-y-6 text-center">
          <h1 className="text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-5xl text-transparent md:text-6xl">
            ZOPİO KURULUM ASİSTANI
          </h1>
          <p className="text-pretty text-muted-foreground text-xl leading-relaxed">
            Vercel AI SDK ile güçlendirilmiş yapay zeka asistanınız. Merak
            ettiğiniz her konuda size yardımcı olmaya hazır.
          </p>
          <div className="flex flex-col justify-center gap-4 pt-8 sm:flex-row">
            <Button
              size="lg"
              onClick={() => setIsSidebarOpen(true)}
              className="px-8 py-6 text-lg"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Sohbete Başla
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur">
            <h3 className="mb-2 font-semibold text-lg">Hızlı Yanıtlar</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sorularınıza anında ve detaylı yanıtlar alın
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur">
            <h3 className="mb-2 font-semibold text-lg">Türkçe Destek</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tamamen Türkçe dil desteği ile rahatça iletişim kurun
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-6 backdrop-blur">
            <h3 className="mb-2 font-semibold text-lg">Akıllı Asistan</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              GPT-4 teknolojisi ile güçlendirilmiş yapay zeka
            </p>
          </div>
        </div>
      </div>

      {/* Floating Chat Button - Mobile */}
      <Button
        size="icon"
        className="fixed right-6 bottom-6 z-30 h-14 w-14 rounded-full shadow-lg lg:hidden"
        onClick={() => setIsSidebarOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </main>
  );
}
