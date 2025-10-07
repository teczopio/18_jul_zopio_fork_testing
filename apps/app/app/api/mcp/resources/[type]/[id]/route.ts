/**
 * SPDX-License-Identifier: MIT
 */

import { getMcpServer } from '../../../server';

export function GET(
  _request: Request,
  context: { params: { type: string; id: string } }
) {
  const { type, id } = context.params;

  try {
    const server = getMcpServer();
    const response = server.handleReadResource(type, id);
    const status = 'error' in response ? 404 : 200;
    return Response.json(response, { status });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 500 });
  }
}
