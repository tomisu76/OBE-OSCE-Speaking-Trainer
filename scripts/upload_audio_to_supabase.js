import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const audioRoot = path.join(root, 'audio');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return fullPath;
  }));
  return files.flat();
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function uploadFile({ supabaseUrl, serviceRoleKey, bucket, filePath }) {
  const relativePath = path.relative(audioRoot, filePath).replace(/\\/g, '/');
  const objectPath = relativePath.replace(/^audio\//, '');
  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/${bucket}/${objectPath}`;
  const body = await fs.readFile(filePath);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'audio/wav',
      'x-upsert': 'true',
      'cache-control': '60'
    },
    body
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Upload failed for ${objectPath}: ${response.status} ${response.statusText} ${details}`);
  }

  console.log(`Uploaded: ${objectPath}`);
}

async function main() {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const bucket = process.env.SUPABASE_AUDIO_BUCKET || 'osce-audio';

  const wavFiles = (await walk(audioRoot)).filter(file => file.toLowerCase().endsWith('.wav'));
  if (!wavFiles.length) {
    console.log('No WAV files found under audio/.');
    return;
  }

  for (const filePath of wavFiles) {
    await uploadFile({ supabaseUrl, serviceRoleKey, bucket, filePath });
  }

  console.log(`Total uploaded WAV files: ${wavFiles.length}`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
