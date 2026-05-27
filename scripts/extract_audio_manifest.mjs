import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const patientsPath = path.join(root, 'data', 'patients.json');
const manifestPath = path.join(root, 'audio_manifest.json');

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'slide';
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

function normalizeLine(line, index) {
  if (Array.isArray(line)) {
    const text = line[1] || '';
    const id = slugify(text || `slide-${index + 1}`);
    return {
      id,
      speaker: line[0] || 'nurse',
      label: stripHtml(text).split(/\s+/).slice(0, 6).join(' '),
      text,
      audioText: line[2] || stripHtml(text),
      audioFile: `${id}.wav`
    };
  }
  const id = slugify(line?.id || line?.label || line?.text || `slide-${index + 1}`);
  return {
    id,
    speaker: line?.speaker || 'nurse',
    label: line?.label || stripHtml(line?.text || '').split(/\s+/).slice(0, 6).join(' '),
    text: line?.text || '',
    audioText: line?.audioText || stripHtml(line?.text || ''),
    audioFile: line?.audioFile || `${id}.wav`
  };
}

const patients = JSON.parse(await fs.readFile(patientsPath, 'utf8'));
const manifest = [];

for (const patient of patients) {
  const folder = patient.audioFolder || `patient-${patient.id}-${slugify(patient.name)}`;
  const introText = patient.introAudioText || `Patient ${patient.id}. ${patient.name}. ${patient.scenario || ''}`;
  const introAudioFile = patient.introAudioFile || 'intro.wav';
  manifest.push({
    id: `patient-${patient.id}-intro`,
    patientId: patient.id,
    slideId: 'intro',
    slideNumber: 0,
    label: 'Patient intro',
    speaker: 'intro',
    voice: 'female_nurse',
    text: introText,
    ttsText: introText,
    audioFile: introAudioFile,
    audioPath: `audio/${folder}/${introAudioFile}`
  });

  const lines = (patient.lines || []).map(normalizeLine);
  lines.forEach((line, index) => {
    const slideNumber = index + 1;
    manifest.push({
      id: `patient-${patient.id}-${line.id}`,
      patientId: patient.id,
      slideId: line.id,
      slideNumber,
      slideLabel: `slide-${pad(slideNumber)}`,
      label: line.label || `Slide ${slideNumber}`,
      speaker: line.speaker,
      voice: line.speaker === 'patient' ? 'male_patient' : 'female_nurse',
      text: stripHtml(line.text),
      ttsText: line.audioText || stripHtml(line.text),
      audioFile: line.audioFile,
      audioPath: `audio/${folder}/${line.audioFile}`
    });
  });
}

await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`Wrote ${manifest.length} stable audio item(s) to audio_manifest.json`);
