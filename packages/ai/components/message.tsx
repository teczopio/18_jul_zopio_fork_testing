/**
 * SPDX-License-Identifier: MIT
 */

import type { Message as MessageType } from 'ai';
import type { ComponentProps } from 'react';
import Markdown from 'react-markdown';
import { twMerge } from 'tailwind-merge';

type MessageProps = {
  data: MessageType;
  markdown?: ComponentProps<typeof Markdown>;
};

export const Message = ({ data, markdown }: MessageProps) => (
  <div
    className={twMerge(
      'm-4 my-2 flex max-w-[80%] flex-col gap-2 rounded-xl px-4 py-2',
      data.role === 'user'
        ? 'ml-auto self-end bg-primary text-primary-foreground'
        : 'mr-auto self-start bg-muted'
    )}
  >
    <Markdown {...markdown}>{data.content}</Markdown>
  </div>
);
