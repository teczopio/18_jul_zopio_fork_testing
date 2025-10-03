#!/usr/bin/env node
/**
 * SPDX-License-Identifier: MIT
 */


import { Command } from 'commander';
import { initialize } from './initialize.js';
import { update } from './update.js';
import { aiInit } from './ai.js';
import { chat } from './chat.js';

const program = new Command();

program
  .command('init')
  .description('Initialize a new zopio project')
  .option('--name <name>', 'Name of the project')
  .option(
    '--package-manager <manager>',
    'Package manager to use (npm, yarn, bun, pnpm)'
  )
  .option('--disable-git', 'Disable git initialization')
  .option('--ai', 'Use AI-assisted initialization')
  .option('--non-interactive', 'Run without prompts (AI mode only)')
  .option('--dry-run', 'Plan only, do not make changes (AI mode only)')
  .action((options) => {
    if (options.ai) {
      return aiInit(options);
    }
    return initialize(options);
  });

program
  .command('ai-init')
  .description('AI-assisted initialization for a new zopio project')
  .option('--name <name>', 'Name of the project')
  .option(
    '--package-manager <manager>',
    'Package manager to use (npm, yarn, bun, pnpm)'
  )
  .option('--disable-git', 'Disable git initialization')
  .option('--non-interactive', 'Run without prompts')
  .option('--dry-run', 'Plan only, do not make changes')
  .action(aiInit);

program
  .command('update')
  .description('Update the project from one version to another')
  .option('--from <version>', 'Version to update from e.g. 1.0.0')
  .option('--to <version>', 'Version to update to e.g. 2.0.0')
  .action(update);

program
  .command('chat')
  .description('Terminal chat for ZOPIO assistant')
  .action(chat);

program.parse(process.argv);
