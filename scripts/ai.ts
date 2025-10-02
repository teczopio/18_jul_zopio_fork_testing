/**
 * SPDX-License-Identifier: MIT
 */

import { basename } from 'node:path'
import { intro, outro, log, select, text, confirm, isCancel, spinner, cancel } from '@clack/prompts'
import { exec, execSyncOpts, supportedPackageManagers } from './utils.js'
import { initialize } from './initialize.js'

// Heuristic detection for available package managers
const isCmdAvailable = async (cmd: string) => {
  try {
    await exec(`${cmd} --version`, execSyncOpts)
    return true
  } catch {
    return false
  }
}

const detectPackageManager = async (): Promise<(typeof supportedPackageManagers)[number]> => {
  // Preference order for DX speed and workspace support
  const order: (typeof supportedPackageManagers)[number][] = ['pnpm', 'bun', 'yarn', 'npm']
  for (const pm of order) {
    if (await isCmdAvailable(pm)) return pm
  }
  return 'npm'
}

const proposeProjectName = (): string => {
  // Derive a sensible default from current directory
  const dir = basename(process.cwd())
  // Avoid empty or root
  const fallback = 'zopio-app'
  if (!dir || dir === '/' || dir === '.' ) return fallback
  // Simple slug
  return dir
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || fallback
}

export const aiInit = async (options: {
  name?: string
  packageManager?: string
  disableGit?: boolean
  nonInteractive?: boolean
  dryRun?: boolean
}) => {
  try {
    intro('AI-assisted Zopio setup')

    const s = spinner()

    // Compute suggestions
    s.start('Thinking about the best defaults for your environment...')
    const [suggestedPm, suggestedName] = await Promise.all([
      detectPackageManager(),
      Promise.resolve(options.name ?? proposeProjectName()),
    ])
    s.stop('Defaults ready')

    let name = suggestedName
    let packageManager = (suggestedPm as string)

    if (!options.nonInteractive) {
      // Allow user to confirm or change suggestions
      const nameAnswer = await text({
        message: 'Project name',
        placeholder: suggestedName,
        initialValue: suggestedName,
        validate(value: string) {
          if (!value || value.trim().length === 0) return 'Please enter a project name.'
        },
      })
      if (isCancel(nameAnswer)) {
        cancel('Operation cancelled.')
        return process.exit(0)
      }
      name = nameAnswer.toString()

      const pmAnswer = await select({
        message: 'Package manager',
        options: supportedPackageManagers.map((pm) => ({ value: pm, label: pm })),
        initialValue: suggestedPm,
      })
      if (isCancel(pmAnswer)) {
        cancel('Operation cancelled.')
        return process.exit(0)
      }
      packageManager = pmAnswer.toString()

      // Git initialization
      const gitAnswer = await confirm({
        message: 'Initialize a new git repository?',
        initialValue: options.disableGit ? false : true,
      })
      if (isCancel(gitAnswer)) {
        cancel('Operation cancelled.')
        return process.exit(0)
      }
      options.disableGit = gitAnswer === true ? false : true
    } else {
      // Non-interactive mode keeps provided options or suggested defaults
      if (typeof options.disableGit !== 'boolean') options.disableGit = false
    }

    // Validate package manager and fallback if needed
    if (!supportedPackageManagers.includes(packageManager as any)) {
      log.warn(`Unsupported package manager "${packageManager}". Falling back to npm.`)
      packageManager = 'npm'
    }

    // Dry run: show plan and exit
    if (options.dryRun) {
      log.info('Plan (dry-run):')
      log.info(
        JSON.stringify(
          {
            action: 'initialize',
            with: {
              name,
              packageManager,
              disableGit: options.disableGit,
            },
            steps: [
              'Clone zopio via create-next-app example',
              'Adjust packageManager and workspaces if not pnpm',
              'Copy .env example files',
              'Remove internal content',
              'Install dependencies',
              'Build and setup ORM',
              'Initialize Git (unless disabled)'
            ],
          },
          null,
          2
        )
      )
      outro('Dry run complete. No changes made.')
      return
    }

    // Run the standard initializer with computed inputs
    await initialize({
      name,
      packageManager,
      disableGit: options.disableGit,
    })

    outro('AI-assisted initialization complete')
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`
    log.error(`AI init failed: ${message}`)
    process.exit(1)
  }
}
