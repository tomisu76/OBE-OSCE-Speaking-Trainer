import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const patientsPath = path.join(root, 'data', 'patients.json');

function stripHtml(value) {
  return String(value || '')
    .replace(/<span[^>]*class=["']vital-tag["'][^>]*>(.*?)<\/span>/gi, '$1 ')
    .replace(/<[^>]+>/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56)
    .replace(/-+$/g, '');
  return slug || 'slide';
}

function uniqueSlug(base, used) {
  let candidate = base || 'slide';
  let counter = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  used.add(candidate);
  return candidate;
}

function makeLabel(text, fallback) {
  const clean = stripHtml(text).replace(/[?.!]+$/g, '').trim();
  if (!clean) return fallback;
  const words = clean.split(/\s+/).slice(0, 6).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function normalizeLine(line, usedIds, index) {
  const source = Array.isArray(line)
    ? {
        speaker: line[0] || 'nurse',
        text: line[1] || '',
        audioText: line[2] || '',
        label: '',
        id: '',
        audioFile: ''
      }
    : {
        speaker: line?.speaker || 'nurse',
        text: line?.text || '',
        audioText: line?.audioText || '',
        label: line?.label || '',
        id: line?.id || '',
        audioFile: line?.audioFile || ''
      };

  const speaker = ['nurse', 'patient'].includes(source.speaker) ? source.speaker : 'nurse';
  const text = String(source.text || '').replace(/\s+/g, ' ').trim();
  const audioText = String(source.audioText || stripHtml(text)).replace(/\s+/g, ' ').trim();
  const label = String(source.label || makeLabel(text, `Slide ${index + 1}`)).replace(/\s+/g, ' ').trim();
  const baseId = slugify(source.id || label || text || `slide-${index + 1}`);
  const id = uniqueSlug(baseId, usedIds);
  const audioFile = String(source.audioFile || `${id}.wav`).replace(/^\/+/, '').replace(/[^a-zA-Z0-9._-]/g, '-');

  return { id, speaker, label, text, audioText, audioFile };
}

const patients = JSON.parse(await fs.readFile(patientsPath, 'utf8'));

for (const patient of patients) {
  patient.id = Number(patient.id);
  patient.name = String(patient.name || `Patient ${patient.id}`).trim();
  patient.audioFolder = patient.audioFolder || `patient-${patient.id}-${slugify(patient.name)}`;
  patient.introAudioFile = String(patient.introAudioFile || 'intro.wav').replace(/^\/+/, '').replace(/[^a-zA-Z0-9._-]/g, '-');
  patient.scenario = String(patient.scenario || '').replace(/\s+/g, ' ').trim();
  patient.introAudioText = String(patient.introAudioText || `Patient ${patient.id}. ${patient.name}. ${patient.scenario}`).replace(/\s+/g, ' ').trim();
  patient.vitals = Array.isArray(patient.vitals) ? patient.vitals : [];
  const usedIds = new Set();
  patient.lines = Array.isArray(patient.lines)
    ? patient.lines.map((line, index) => normalizeLine(line, usedIds, index))
    : [];
}

await fs.writeFile(patientsPath, JSON.stringify(patients, null, 2) + '\n', 'utf8');
console.log(`Normalized ${patients.length} patient case(s) with stable slide IDs.`);
