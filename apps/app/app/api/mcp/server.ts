/**
 * SPDX-License-Identifier: MIT
 */

import { MCPServer } from '@repo/mcp';
import {
  componentSchema,
  createComponentResource,
  createPackageResource,
  packageSchema,
} from '@repo/mcp';

// Singleton MCP server for the app
let _server: MCPServer | null = null;

function createServer() {
  const server = new MCPServer({
    name: 'Zopio MCP Server',
    description: 'MCP server exposing Zopio resources to AI tools',
    resources: {
      package: MCPServer.createResourceDefinition(packageSchema, {
        description: 'Zopio package information',
      }),
      component: MCPServer.createResourceDefinition(componentSchema, {
        description: 'Design system UI components',
      }),
    },
  });

  // Register example package and components. In real usage, hydrate from repo metadata.
  const designSystemPackage = createPackageResource('design-system', {
    name: '@repo/design-system',
    version: '0.1.0',
    description: 'Zopio design system components',
    private: true,
    type: 'module',
    sideEffects: false,
    main: './dist/index.js',
    module: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
        default: './dist/index.js',
      },
    },
    dependencies: {
      react: '^19.1.0',
      'tailwind-merge': '^3.3.0',
    },
  });
  server.registerResource(designSystemPackage);

  const button = createComponentResource(
    'button',
    {
      name: 'Button',
      description: 'Primary button component',
      category: 'input',
      props: {
        variant: {
          type: 'string',
          description: 'Button variant (primary, secondary, tertiary)',
          required: false,
          defaultValue: 'primary',
        },
        size: {
          type: 'string',
          description: 'Button size (sm, md, lg)',
          required: false,
          defaultValue: 'md',
        },
        disabled: {
          type: 'boolean',
          description: 'Whether the button is disabled',
          required: false,
          defaultValue: false,
        },
      },
      examples: [
        {
          name: 'Primary Button',
          code: '<Button variant="primary">Click me</Button>',
          description: 'Standard primary button',
        },
      ],
      usage:
        'Import the Button component from @repo/design-system and use it in your React components.',
      packageName: '@repo/design-system',
    },
    'design-system'
  );
  server.registerResource(button);

  const card = createComponentResource(
    'card',
    {
      name: 'Card',
      description: 'Container component for grouping related content',
      category: 'layout',
      props: {
        variant: {
          type: 'string',
          description: 'Card variant (default, elevated, outlined)',
          required: false,
          defaultValue: 'default',
        },
        padding: {
          type: 'string',
          description: 'Card padding (none, sm, md, lg)',
          required: false,
          defaultValue: 'md',
        },
      },
      packageName: '@repo/design-system',
    },
    'design-system'
  );
  server.registerResource(card);

  return server;
}

export function getMcpServer() {
  if (!_server) {
    _server = createServer();
  }
  return _server;
}
