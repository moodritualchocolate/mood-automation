import { NextRequest } from 'next/server';
import { createMemoryStore } from '@/engines/memory';

export const runtime = 'nodejs';

export async function GET() {
  const store = createMemoryStore();
  const snap = await store.read();
  return Response.json(snap);
}

export async function DELETE(_req: NextRequest) {
  const store = createMemoryStore();
  await store.reset();
  return Response.json({ ok: true });
}
