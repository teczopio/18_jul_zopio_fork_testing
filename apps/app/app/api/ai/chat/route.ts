/**
 * SPDX-License-Identifier: MIT
 */

import { type Message, convertToCoreMessages, streamText } from '@repo/ai';
import { models } from '@repo/ai/lib/models';

// Precompile once: lightweight intent check for ZOPIO queries
const ZOPIO_REGEX = /zopio/i;
// Normalize text to be robust against Turkish dotted İ (e.g., "ZOPİO") and accents
const toNormalizedLower = (s: string): string =>
  s
    .normalize('NFKD')
    // Strip diacritics
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('tr');
const INSTALL_REGEX =
  /(kurulum|kur(ar|mak|ulum)|install|installation|setup|başlat|init)/i;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { messages, prompt, system } = body as {
    messages?: Message[];
    prompt?: string;
    system?: string;
  };

  // Extract latest user text to enable lightweight intent routing
  const latestUserText = (() => {
    const list: unknown[] = Array.isArray(messages)
      ? (messages as unknown[])
      : [];
    const lastUser = [...list].reverse().find((m) => {
      if (m && typeof m === 'object') {
        const rec = m as Record<string, unknown>;
        return rec.role === 'user';
      }
      return false;
    });
    if (!lastUser || typeof lastUser !== 'object') {
      return null as string | null;
    }
    const rec = lastUser as Record<string, unknown>;
    // Handle either `content: string` or `parts: [{ type: 'text', text: string }]`
    if (typeof rec.content === 'string') {
      return rec.content;
    }
    const parts = rec.parts as unknown;
    if (Array.isArray(parts)) {
      const text = parts
        .map((p) => {
          if (p && typeof p === 'object') {
            const pr = p as Record<string, unknown>;
            return pr.type === 'text' && typeof pr.text === 'string'
              ? pr.text
              : '';
          }
          return '';
        })
        .join('')
        .trim();
      return text || null;
    }
    return null;
  })();

  // If the user is asking about ZOPIO, enrich the system prompt with accurate Turkish context
  const needsZopioContext = (() => {
    const candidates: string[] = [];
    if (typeof latestUserText === 'string') {
      candidates.push(latestUserText);
    }
    if (typeof prompt === 'string') {
      candidates.push(prompt);
    }
    return candidates.some((text) => {
      const norm = toNormalizedLower(text);
      return norm.includes('zopio') || ZOPIO_REGEX.test(text);
    });
  })();
  const needsZopioInstall =
    (typeof latestUserText === 'string' &&
      ZOPIO_REGEX.test(latestUserText) &&
      INSTALL_REGEX.test(latestUserText)) ||
    (typeof prompt === 'string' &&
      ZOPIO_REGEX.test(prompt) &&
      INSTALL_REGEX.test(prompt));
  const zopioSystem = `Sen ZOPIO asistansın. ZOPIO, Next.js ve Turborepo tabanlı, ölçeklenebilir iş uygulamaları geliştirmek için modern, full‑stack bir business framework'tür.

Öne çıkan özellikler:
- Auto UI ve eklenti (plugin) mimarisiyle genişletilebilir yapı
- Monorepo yaklaşımı, shadcn/ui + Tailwind CSS, Clerk ile kimlik doğrulama
- Çoklu uygulamalar için tip güvenli API mikroservisi, webhook işleyicileri ve ORM (Prisma)
- React tabanlı e‑posta şablonları (Resend ile gönderim)
- BaseHub ile tip güvenli web sitesi, SEO, yasal sayfalar ve blog
- Otomatik belge/dokümantasyon oluşturma, Storybook ile bileşen çalıştayı

Açık kaynak ve ücretsizdir. Daha fazla bilgi: https://www.zopio.dev ve dokümantasyon: https://docs.zopio.dev
Cevaplarını Türkçe ver ve gerektiğinde maddeler halinde kısa, net yanıtla.`;
  const installSystem = `Eğer kullanıcı ZOPIO'yu nasıl kuracağını soruyorsa, aşağıdaki adımları net ve sıralı biçimde anlat:

1) Başlatma (Initialization)
   - Terminal komutu: npx zopio@latest init
   - Sihirbaz proje adını ve paket yöneticisini (örn. pnpm) sorar ve projeyi başlatır.
   - Not: Başlamadan önce Mintlify CLI ve Stripe CLI kurulu olması önerilir.

2) Ortam Değişkenleri (.env)
   - Proje kökünde .env dosyası oluştur ve gerekli değişkenleri tanımla.
   - Rehber: https://docs.zopio.dev/setup/env

3) Veritabanı
   - Prisma şeması yolu: packages/database/prisma/schema.prisma
   - Migrasyon komutu: pnpm migrate
   - Ayrıntılar: https://docs.zopio.dev/packages/database

4) CMS (Basehub)
   - Şablonu fork et: https://basehub.com/zopiolabs/zopio?fork=1
   - “Connect to Your App” sayfasından Read Token al.
   - .env dosyasına BASEHUB_TOKEN ekle.

5) Geliştirme (Development)
   - Tüm servisleri başlat: pnpm dev
   - Portlar: 3000 (Main App), 3001 (Website), 3002 (API), 3003 (Email Preview), 3004 (Docs), 3005 (Prisma Studio), 6006 (Storybook)

Kısa ipucu: Gerektiğinde ön‑koşullara (Node, pnpm/yarn, gerekli CLI’ler) ve .env ayarlarına özellikle dikkat çek.`;

  const effectiveSystem = (() => {
    const blocks: string[] = [];
    if (typeof system === 'string' && system.trim().length > 0) {
      blocks.push(system);
    }
    if (needsZopioContext) {
      blocks.push(zopioSystem);
    }
    if (needsZopioInstall) {
      blocks.push(installSystem);
    }
    return blocks.join('\n\n');
  })();

  const result = await streamText(
    messages && messages.length > 0
      ? {
          model: models.chat,
          messages: convertToCoreMessages(messages),
          system: effectiveSystem,
        }
      : {
          model: models.chat,
          prompt: prompt ?? '',
          system: effectiveSystem,
        }
  );

  // Return a data stream compatible with AI SDK UI hooks (e.g., useChat)
  return result.toDataStreamResponse();
}
