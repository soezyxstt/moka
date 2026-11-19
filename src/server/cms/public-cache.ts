import { createHash } from 'node:crypto';
import { revalidatePath as revalidateNextPath, updateTag } from 'next/cache';
import { env } from '@/env';

export const PUBLIC_CONTENT_SCOPE = createHash('sha256').update(env.TURSO_DATABASE_URL).digest('hex');
export const PUBLIC_CONTENT_TAG = `public-cms-${PUBLIC_CONTENT_SCOPE}`;
// shortcut: direct database writes can leave stale data, add secured invalidation when external writers need immediate updates.
export const PUBLIC_CONTENT_REVALIDATE = 86_400;

export function revalidatePath(...args: Parameters<typeof revalidateNextPath>) {
  updateTag(PUBLIC_CONTENT_TAG);
  revalidateNextPath(...args);
}
