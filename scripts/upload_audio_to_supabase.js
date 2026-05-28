import { createReadStream, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const bucket = process.env.SUPABASE_AUDIO_BUCKET || 'osce-audio';
const audioRoot = 'audio';

async function findWavFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findWavFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.wav')) {
      files.push(fullPath);
    }
  }

  return files;
}

function toStoragePath(filePath) {
  return filePath
    .replaceAll('\\\\', '/')
    .replaceAll('\\', '/')
    .replace(/^audio\//, '');
}

async function uploadFile(filePath) {
  const objectPath = toStoragePath(filePath);
  const targetUrl = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`;
  const size = statSync(filePath).size;

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'audio/wav',
      'Cache-Control': 'max-age=60',
      'x-upsert': 'true'
    },
    duplex: 'half',
    body: createReadStream(filePath)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to upload ${filePath} -> ${objectPath}: HTTP ${response.status} ${details}`);
  }

  console.log(`Uploaded ${objectPath} (${size} bytes)`);
}

async function main() {
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!bucket) missing.push('SUPABASE_AUDIO_BUCKET');

  if (missing.length) {
    throw new Error(`Missing required Supabase environment variable(s): ${missing.join(', ')}`);
  }

  const files = await findWavFiles(audioRoot);
  if (!files.length) {
    console.log('No WAV files found under audio/.');
    return;
  }

  for (const file of files) {
    await uploadFile(file);
  }

  console.log(`Uploaded ${files.length} WAV file(s) to Supabase bucket ${bucket}.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
