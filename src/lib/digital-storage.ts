import "server-only";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_DIGITAL_SUPABASE_URL || "";
const serviceRoleKey = process.env.DIGITAL_SUPABASE_SECRET_KEY || "";
const BUCKET_NAME = "digital-files";
const LOCAL_DIR = path.join(process.cwd(), "public", "digital", "files");

export async function getFileUrl(
  filePath: string
): Promise<string | null> {
  if (filePath.startsWith("http")) return filePath;

  const client = createClient(supabaseUrl, serviceRoleKey);
  const { data } = await client.storage.from(BUCKET_NAME).createSignedUrl(filePath, 3600);
  if (data?.signedUrl) return data.signedUrl;

  const localPath = path.join(LOCAL_DIR, filePath);
  if (fs.existsSync(localPath)) {
    return `/digital/files/${filePath}`;
  }

  return null;
}

export async function uploadFile(
  buffer: Buffer,
  filePath: string,
  contentType: string
): Promise<string | null> {
  const client = createClient(supabaseUrl, serviceRoleKey);

  const { error } = await client.storage.from(BUCKET_NAME).upload(filePath, buffer, {
    contentType,
    upsert: true,
  });

  if (!error) {
    const { data } = await client.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data?.publicUrl || null;
  }

  const localDir = path.dirname(path.join(LOCAL_DIR, filePath));
  fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(LOCAL_DIR, filePath), buffer);

  return `/digital/files/${filePath}`;
}

export function getLocalFilePath(filePath: string): string {
  return path.join(LOCAL_DIR, filePath);
}
