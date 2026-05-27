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
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeLine(line) {
  const normalized = Array.isArray(line)
    ? { speaker: line[0] || 'nurse', text: line[1] || '', audioText: line[2] || '' }
    : { speaker: line?.speaker || 'nurse', text: line?.text || '', audioText: line?.audioText || '' };

  if (!['nurse', 'patient'].includes(normalized.speaker)) normalized.speaker = 'nurse';
  normalized.text = String(normalized.text || '').replace(/\s+/g, ' ').trim();
  normalized.audioText = String(normalized.audioText || stripHtml(normalized.text)).replace(/\s+/g, ' ').trim();
  return [normalized.speaker, normalized.text, normalized.audioText];
}

const patients = JSON.parse(await fs.readFile(patientsPath, 'utf8'));

for (const patient of patients) {
  patient.id = Number(patient.id);
  patient.name = String(patient.name || `Patient ${patient.id}`).trim();
  patient.audioFolder = patient.audioFolder || `patient-${patient.id}-${slugify(patient.name)}`;
  patient.scenario = String(patient.scenario || '').replace(/\s+/g, ' ').trim();
  patient.introAudioText = String(patient.introAudioText || `Patient ${patient.id}. ${patient.name}. ${patient.scenario}`).replace(/\s+/g, ' ').trim();
  patient.vitals = Array.isArray(patient.vitals) ? patient.vitals : [];
  patient.lines = Array.isArray(patient.lines) ? patient.lines.map(normalizeLine) : [];
}

await fs.writeFile(patientsPath, JSON.stringify(patients, null, 2) + '\n', 'utf8');
console.log(`Normalized ${patients.length} patient case(s).`);
