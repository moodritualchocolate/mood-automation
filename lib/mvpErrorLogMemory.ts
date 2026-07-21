/**
 * MVP ERROR LOG (roadmap #20 · FIFO)
 *
 * Minimal server-side error journal for the MVP surface. When the
 * first paying customer hits a failure, this is how the operator
 * finds out — without any external monitoring vendor.
 *
 * Lives at data/memory/mvp-error-log-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'mvp-error-log-memory.json';

export const MVP_ERROR_LOG_LIMIT = 200;

export interface ErrorLogRecord {
  errorId: string;
  scope: string;          // e.g. 'generate', 'selection', 'waitlist'
  message: string;
  operatorId?: string;
  organizationId?: string;
  createdAt: number;
}

interface State {
  records: ErrorLogRecord[];
  totalErrors: number;
  updatedAt: number;
}

let __seq = 0;
const g = globalThis as unknown as { __moodMvpErrorLog?: State };

function filePath(dir: string): string { return path.join(dir, FILE); }

async function read(dir: string): Promise<State> {
  if (g.__moodMvpErrorLog) return g.__moodMvpErrorLog;
  try {
    const txt = await fs.readFile(filePath(dir), 'utf8');
    g.__moodMvpErrorLog = {
      records: [], totalErrors: 0, updatedAt: Date.now(),
      ...(JSON.parse(txt) as Partial<State>),
    };
  } catch {
    g.__moodMvpErrorLog = { records: [], totalErrors: 0, updatedAt: Date.now() };
  }
  return g.__moodMvpErrorLog;
}

/** Fire-and-forget error logging · never throws into the caller. */
export async function logMvpError(
  scope: string,
  message: string,
  ctx?: { operatorId?: string; organizationId?: string },
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): Promise<void> {
  try {
    __seq += 1;
    const cur = await read(dir);
    const next: State = {
      records: [
        ...cur.records,
        {
          errorId: `err-${Date.now().toString(36)}-${__seq.toString(36)}`,
          scope,
          message: message.slice(0, 500),
          operatorId: ctx?.operatorId,
          organizationId: ctx?.organizationId,
          createdAt: Date.now(),
        },
      ].slice(-MVP_ERROR_LOG_LIMIT),
      totalErrors: cur.totalErrors + 1,
      updatedAt: Date.now(),
    };
    g.__moodMvpErrorLog = next;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath(dir), JSON.stringify(next, null, 2));
  } catch {
    /* the error log must never be a source of errors */
  }
}

export async function readMvpErrors(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): Promise<ErrorLogRecord[]> {
  return (await read(dir)).records;
}
