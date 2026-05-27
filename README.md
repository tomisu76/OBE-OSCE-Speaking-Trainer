# OBE OSCE Speaking Trainer

A lightweight web trainer for nursing English OSCE speaking practice.

This repository was bootstrapped from the working concept of `tomisu76/OSCE-play`, then renamed and cleaned for OBE / nursing education use.

## Purpose

Students choose a patient case, open a full-screen slide dialogue, listen to each line, and practise professional English communication as a practical nurse.

## Core features

- Patient case cards
- Full-screen OSCE dialogue player
- Separate visible slide text and Kokoro audio text
- Vital-sign slides and phrase practice
- Mobile-friendly presentation mode
- Admin editor for patient text
- Optional audio regeneration with GitHub Actions
- OBE metadata fields for CLO, skill, course, and assessment alignment

## Main files

```text
index.html                         Web app and slide player
editor.js                          Mobile/audio/editor polish layer
data/patients.json                 Editable patient cases
api/save-patients.js               Vercel admin save endpoint
scripts/normalize_patient_texts.mjs Normalizes patient JSON before audio
scripts/extract_audio_manifest.mjs  Builds audio_manifest.json
scripts/generate_audio.py           Generates WAV files with Kokoro
.github/workflows/generate-audio.yml Regenerates audio on GitHub Actions
```

## Vercel environment variables

For the admin editor and audio workflow:

```text
AUDIO_ADMIN_KEY=your-admin-code
GITHUB_WORKFLOW_TOKEN=github-token-with-contents-and-actions-permissions
```

## Development notes

This first commit is a clean bootstrap. Large generated WAV files are not manually copied from the old repository. They can be regenerated from `data/patients.json` by running the GitHub Actions workflow or locally with:

```bash
npm run normalize
npm run manifest
npm run audio:all
```
