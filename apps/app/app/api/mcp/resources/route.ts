/**
 * SPDX-License-Identifier: MIT
 */

import { getMcpServer } from '../server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  try {
    const server = getMcpServer();
    const response = server.listResources(cursor ?? undefined, limit ?? 50);
    return Response.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ error: message }, { status: 400 });
  }
}
