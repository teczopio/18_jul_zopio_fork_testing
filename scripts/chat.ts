/**
 * SPDX-License-Identifier: MIT
 */

import 'dotenv/config'
import { confirm, isCancel, text } from '@clack/prompts'
import { spawn } from 'node:child_process'
import { streamText, generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

// Lightweight intent check for ZOPIO queries (mirrors app chat API logic)
const ZOPIO_REGEX = /zopio/i
// Normalize text to be robust against Turkish dotted İ (e.g., "ZOPİO") and accents
const toNormalizedLower = (s: string): string =>
  s
    .normalize('NFKD')
    // Strip diacritics
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase('tr')

// Keywords for install intent on normalized text
const INSTALL_KEYWORDS = [
  'kur',
  'kurmak',
  'kurulum',
  'kurulur',
  'kurulumu',
  'nasil kurulur',
  'nasıl kurulur',
  'nasil kurarim',
  'nasıl kurarım',
  'yükle',
  'yüklemek',
  'yükleme',
  'yukle',
  'yuklemek',
  'yukleme',
  'install',
  'installation',
  'setup',
  'başlat',
  'baslat',
  'init'
]

export const chat = async () => {
  // Simple REPL loop
  while (true) {
    const msg = await text({ message: 'mesajınız: ' })
    if (isCancel(msg)) {
      break
    }

    const content = String(msg ?? '').trim()
    if (!content) {
      // Empty input: ask again
      continue
    }

    const norm = toNormalizedLower(content)
    const mentionsZopio = norm.includes('zopio') || ZOPIO_REGEX.test(content)
    const wantsInstall = INSTALL_KEYWORDS.some((k) => norm.includes(k))

    if (mentionsZopio && wantsInstall) {
      console.log('bunun için "npx zopio@latest init" komutunu çalıştırmalısınız.')
      const ok = await confirm({ message: 'kurmak istiyor musunuz ? ', initialValue: true })
      if (isCancel(ok)) {
        // back to prompt
        continue
      }
      if (ok === true) {
        console.log('Komut çalıştırılıyor: npx zopio@latest init')
        await new Promise<void>((resolve) => {
          const child = spawn('npx', ['zopio@latest', 'init'], { stdio: 'inherit', shell: true })
          child.on('exit', () => resolve())
        })
        // after init finishes, return to prompt
        continue
      } else {
        console.log('İşlem iptal edildi.')
        continue
      }
    }

    // AI response for other messages
    const zopioSystem = `Sen ZOPIO asistansın. ZOPIO, Next.js ve Turborepo tabanlı, ölçeklenebilir iş uygulamaları geliştirmek için modern, full‑stack bir business framework'tür.

Öne çıkan özellikler:
- Auto UI ve eklenti (plugin) mimarisiyle genişletilebilir yapı
- Monorepo yaklaşımı, shadcn/ui + Tailwind CSS, Clerk ile kimlik doğrulama
- Çoklu uygulamalar için tip güvenli API mikroservisi, webhook işleyicileri ve ORM (Prisma)
- React tabanlı e‑posta şablonları (Resend ile gönderim)
- BaseHub ile tip güvenli web sitesi, SEO, yasal sayfalar ve blog
- Otomatik belge/dokümantasyon oluşturma, Storybook ile bileşen çalıştayı

Açık kaynak ve ücretsizdir. Daha fazla bilgi: https://www.zopio.dev ve dokümantasyon: https://docs.zopio.dev
Cevaplarını Türkçe ver ve gerektiğinde maddeler halinde kısa, net yanıtla.`

    const needsZopioContext = mentionsZopio
    const system = needsZopioContext ? zopioSystem : undefined

    // Model selection mirroring @repo/ai logic
    const env = process.env
    const hasAnyKey = Boolean(
      env.AI_GATEWAY_API_KEY ||
      env.OPENAI_API_KEY ||
      env.OPENROUTER_API_KEY_DEEPSEEK ||
      env.OPENROUTER_API_KEY
    )
    if (!hasAnyKey) {
      console.log('AI: Lütfen OPENAI_API_KEY veya OPENROUTER_API_KEY ortam değişkenlerini ayarlayın.')
      continue
    }
    const primaryOpenAI = createOpenAI({
      apiKey: env.AI_GATEWAY_API_KEY ?? env.OPENAI_API_KEY,
      baseURL: env.AI_GATEWAY_API_KEY
        ? (env.AI_GATEWAY_BASE_URL ?? 'https://ai-gateway.vercel.sh/v1')
        : undefined,
      compatibility: 'strict',
    })
    const openrouter = createOpenAI({
      apiKey: env.OPENROUTER_API_KEY_DEEPSEEK ?? env.OPENROUTER_API_KEY,
      baseURL: env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
      compatibility: 'strict',
    })
    const preferOpenRouter = Boolean(env.OPENROUTER_API_KEY_DEEPSEEK || env.OPENROUTER_API_KEY)
    const openrouterModelName = env.OPENROUTER_CHAT_MODEL ?? 'deepseek/deepseek-chat'
    let model = preferOpenRouter ? openrouter(openrouterModelName) : primaryOpenAI('gpt-4o-mini')
    let provider = preferOpenRouter ? 'openrouter' : 'openai'
    process.stdout.write(`[AI] provider=${provider} model=${preferOpenRouter ? openrouterModelName : 'gpt-4o-mini'}\n`)

    try {
      const result = await streamText({ model, prompt: content, system })
      process.stdout.write('AI: ')
      let wrote = false
      for await (const part of result.textStream) {
        process.stdout.write(part)
        wrote = true
      }
      if (!wrote) {
        // Fallback to non-stream generation
        const full = await generateText({ model, prompt: content, system })
        process.stdout.write(full.text)
      }
      process.stdout.write('\n')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`AI hata: ${message}`)
      // Fallback provider if available
      if (provider === 'openrouter' && (env.AI_GATEWAY_API_KEY || env.OPENAI_API_KEY)) {
        provider = 'openai'
        model = primaryOpenAI('gpt-4o-mini')
        process.stdout.write(`[AI] fallback provider=${provider} model=gpt-4o-mini\n`)
        try {
          const full = await generateText({ model, prompt: content, system })
          process.stdout.write('AI: ' + full.text + '\n')
        } catch (err2) {
          const message2 = err2 instanceof Error ? err2.message : String(err2)
          console.error(`AI fallback hata: ${message2}`)
        }
      }
    }
  }
}
