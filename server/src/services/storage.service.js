import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');
export const STORAGE_DIR = path.join(ROOT, 'private_uploads');

await fs.mkdir(STORAGE_DIR, { recursive: true });

/** Stores a buffer under a generated UUID. User filenames are never used as paths. */
export async function storeFile(buffer) {
  const id = crypto.randomUUID();
  const filePath = path.join(STORAGE_DIR, `${id}.pdf`);
  await fs.writeFile(filePath, buffer, { flag: 'wx', mode: 0o600 });
  return { storageIdentifier: id, filePath };
}

export async function deleteStoredFile(storageIdentifier) {
  if (!/^[0-9a-f-]{36}$/i.test(storageIdentifier)) return;
  await fs.rm(path.join(STORAGE_DIR, `${storageIdentifier}.pdf`), { force: true }).catch(() => {});
}

export const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
