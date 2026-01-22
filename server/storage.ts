// Storage helpers - supports local file storage (dev) or Firebase Storage (production)

import * as fs from 'fs';
import * as path from 'path';
import { firebaseStorage } from './_core/firebase';

// Local storage directory
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'uploads');

// Check if we should use local storage
function useLocalStorage(): boolean {
  // Use local storage in dev mode or when Firebase Storage is not initialized
  return process.env.DEV_MODE === "true" || !firebaseStorage;
}

// Ensure local storage directory exists
async function ensureLocalStorageDir(): Promise<void> {
  await fs.promises.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// Local storage implementation
async function localStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  await ensureLocalStorageDir();

  const key = normalizeKey(relKey);
  const filePath = path.join(LOCAL_STORAGE_DIR, key);
  const fileDir = path.dirname(filePath);

  // Ensure subdirectory exists
  await fs.promises.mkdir(fileDir, { recursive: true });

  // Write file
  await fs.promises.writeFile(filePath, data);

  // Return URL that can be served by the app
  const url = `/uploads/${key}`;
  console.log(`[Local Storage] Saved file: ${filePath}`);

  return { key, url };
}

async function localStorageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const url = `/uploads/${key}`;
  return { key, url };
}

// Remote (Firebase) storage implementation
async function remoteStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (!firebaseStorage) throw new Error("Firebase Storage not initialized");

  const key = normalizeKey(relKey);
  const bucket = firebaseStorage.bucket();
  const file = bucket.file(key);

  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  await file.save(buffer, {
    contentType,
    public: true, // Try to make public
  });

  // Construct public URL
  // https://storage.googleapis.com/BUCKET_NAME/FILE_PATH
  const url = `https://storage.googleapis.com/${bucket.name}/${key}`;

  return { key, url };
}

async function remoteStorageGet(relKey: string): Promise<{ key: string; url: string }> {
  if (!firebaseStorage) throw new Error("Firebase Storage not initialized");

  const key = normalizeKey(relKey);
  const bucket = firebaseStorage.bucket();

  // Return public URL
  const url = `https://storage.googleapis.com/${bucket.name}/${key}`;

  return {
    key,
    url,
  };
}

// Main exports - automatically choose local or remote based on configuration
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (useLocalStorage()) {
    return localStoragePut(relKey, data, contentType);
  }
  return remoteStoragePut(relKey, data, contentType);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  if (useLocalStorage()) {
    return localStorageGet(relKey);
  }
  return remoteStorageGet(relKey);
}
