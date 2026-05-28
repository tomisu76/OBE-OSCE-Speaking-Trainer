import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
const variant = (process.env.APP_VARIANT || 'trainer').toLowerCase();
const editor = variant === 'editor';

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

let html = await fs.readFile(path.join(root, 'index.html'), 'utf8');

if (!editor) {
  html = html.replace('<button class="admin-open" onclick="openEditor()">Admin editor</button>', '');
  const start = html.indexOf('    <section id="editor" class="editor">');
  const end = html.indexOf('    <nav id="patientTabs"', start);
  if (start >= 0 && end > start) html = html.slice(0, start) + html.slice(end);
  html = html.replace(/\n\s*<script src="editor\.js\?[^\n]+/g, '');
  html = html.replace(/\n\s*<script src="studio-audio-player\.js\?[^\n]+/g, '');
} else {
  html = html.replace('OBE OSCE Speaking Trainer</title>', 'OBE OSCE Speaking Editor</title>');
  html = html.replace('<h1>OBE OSCE Speaking Trainer</h1>', '<h1>OBE OSCE Speaking Editor</h1>');
  html = html.replace('Choose a patient. Practise English for nursing OSCE communication with full-screen slides and audio.', 'Edit patient slides, audio text, and OSCE metadata.');
}

await fs.writeFile(path.join(out, 'index.html'), html);
for (const item of ['data', 'audio']) {
  try { await fs.cp(path.join(root, item), path.join(out, item), { recursive: true }); } catch {}
}
for (const file of ['audio-fallback.js', 'editor.js', 'studio-audio-player.js']) {
  if (!editor && file !== 'audio-fallback.js') continue;
  try { await fs.copyFile(path.join(root, file), path.join(out, file)); } catch {}
}
console.log(`Built ${variant} variant to dist`);
