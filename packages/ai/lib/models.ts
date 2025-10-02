/**
 * SPDX-License-Identifier: MIT
 */

import { createOpenAI } from '@ai-sdk/openai';
import { keys } from '../keys';

const env = keys();

// Primary OpenAI-compatible provider: prefers AI Gateway, then OpenAI
const primaryOpenAI = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY ?? env.OPENAI_API_KEY,
  baseURL: env.AI_GATEWAY_API_KEY
    ? (env.AI_GATEWAY_BASE_URL ?? 'https://ai-gateway.vercel.sh/v1')
    : undefined,
  compatibility: 'strict',
});

// OpenRouter (for DeepSeek and others)
const openrouter = createOpenAI({
  apiKey: env.OPENROUTER_API_KEY_DEEPSEEK ?? env.OPENROUTER_API_KEY,
  baseURL: env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  compatibility: 'strict',
});

// Choose chat model: prefer OpenRouter (DeepSeek) when key is present
const chatModel = (() => {
  const hasOpenRouter = Boolean(
    env.OPENROUTER_API_KEY_DEEPSEEK || env.OPENROUTER_API_KEY
  );
  if (hasOpenRouter) {
    const modelName = env.OPENROUTER_CHAT_MODEL ?? 'deepseek/deepseek-chat';
    return openrouter(modelName);
  }
  return primaryOpenAI('gpt-4o-mini');
})();

export const models = {
  chat: chatModel,
  // Keep embeddings on the primary provider for broad compatibility
  embeddings: primaryOpenAI('text-embedding-3-small'),
};
