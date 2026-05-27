import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const patientsPath = path.join(root, 'data', 'patients.json');
const manifestPath = path.join(root, 'audio_manifest.json');

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pad(number, size = 3) {
  return String(number).padStart(size, '0');
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<span[^>]*class=["']vital-tag["'][^>]*>(.*?)<\/span>/gi, '$1 ')
    .replace(/<[^>]+>/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLine(line) {
  if (Array.isArray(line)) {
    return {
      speaker: line[0] || 'nurse',
      text: line[1] || '',
      audioText: line[2] || stripHtml(line[1] || '')
    };
  }
  return {
    speaker: line?.speaker || 'nurse',
    text: line?.text || '',
    audioText: line?.audioText || stripHtml(line?.text || '')
  };
}

const patients = JSON.parse(await fs.readFile(patientsPath, 'utf8'));
const manifest = [];

for (const patient of patients) {
  const folder = patient.audioFolder || `patient-${patient.id}-${slugify(patient.name)}`;
  const introText = patient.introAudioText || `Patient ${patient.id}. ${patient.name}. ${patient.scenario || ''}`;
  manifest.push({
    id: `patient-${patient.id}-slide-000`,
    patientId: patient.id,
    slideNumber: 0,
    speaker: 'intro',
    voice: 'female_nurse',
    text: introText,
    ttsText: introText,
    audioPath: `audio/${folder}/slide-000.wav`
  });

  const lines = (patient.lines || []).map(normalizeLine);
  lines.forEach((line, index) => {
    const slideNumber = index + 1;
    manifest.push({
      id: `patient-${patient.id}-slide-${pad(slideNumber)}`,
      patientId: patient.id,
      slideNumber,
      speaker: line.speaker,
      voice: line.speaker === 'patient' ? 'male_patient' : 'female_nurse',
      text: stripHtml(line.text),
      ttsText: line.audioText || stripHtml(line.text),
      audioPath: `audio/${folder}/slide-${pad(slideNumber)}.wav`
    });
  });
}

await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`Wrote ${manifest.length} audio items to audio_manifest.json`);
