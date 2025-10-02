/**
 * SPDX-License-Identifier: MIT
 */

import { type Message, convertToCoreMessages, streamText } from '@repo/ai';
import { models } from '@repo/ai/lib/models';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { messages, prompt, system } = body as {
    messages?: Message[];
    prompt?: string;
    system?: string;
  };

  const result = await streamText(
    messages && messages.length > 0
      ? {
          model: models.chat,
          messages: convertToCoreMessages(messages),
          system,
        }
      : {
          model: models.chat,
          prompt: prompt ?? '',
          system,
        }
  );

  // Return a data stream compatible with AI SDK UI hooks (e.g., useChat)
  return result.toDataStreamResponse();
}
