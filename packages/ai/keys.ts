/**
 * SPDX-License-Identifier: MIT
 */

import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
      AI_GATEWAY_API_KEY: z.string().optional(),
      AI_GATEWAY_BASE_URL: z.string().url().optional(),
      // OpenRouter
      OPENROUTER_API_KEY: z.string().optional(),
      OPENROUTER_API_KEY_DEEPSEEK: z.string().optional(),
      OPENROUTER_BASE_URL: z.string().url().optional(),
      OPENROUTER_CHAT_MODEL: z.string().optional(),
      OPENROUTER_EMBEDDINGS_MODEL: z.string().optional(),
    },
    runtimeEnv: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
      AI_GATEWAY_BASE_URL: process.env.AI_GATEWAY_BASE_URL,
      // OpenRouter
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      OPENROUTER_API_KEY_DEEPSEEK: process.env.OPENROUTER_API_KEY_DEEPSEEK,
      OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL,
      OPENROUTER_CHAT_MODEL: process.env.OPENROUTER_CHAT_MODEL,
      OPENROUTER_EMBEDDINGS_MODEL: process.env.OPENROUTER_EMBEDDINGS_MODEL,
    },
  });
