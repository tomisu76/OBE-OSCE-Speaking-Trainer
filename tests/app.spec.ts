import { test, expect } from '@playwright/test';

type PatientLine = { audioFile?: string; id?: string; label?: string; text?: string };
type Patient = { id: number; lines?: PatientLine[]; introAudioFile?: string };

function installAudioMocks() {
  (window as any).__audioCalls = [];

  class FakeAudio {
    src: string;
    onplaying?: () => void;
    onended?: () => void;
    onerror?: () => void;
    preload = 'auto';

    constructor(src: string) {
      this.src = src;
      (window as any).__audioCalls.push(src);
    }

    play() {
      this.onplaying?.();
      this.onended?.();
      return Promise.resolve();
    }

    pause() {}
    set currentTime(_value: number) {}
  }

  // @ts-expect-error injected test mock
  window.Audio = FakeAudio;

  const speech = {
    cancel: () => {},
    speak: () => {},
    getVoices: () => []
  };

  // @ts-expect-error injected test mock
  window.speechSynthesis = speech;
}

async function getPatients(baseURL: string | undefined): Promise<Patient[]> {
  const res = await fetch(`${baseURL || 'http://127.0.0.1:4173'}/data/patients.json`);
  if (!res.ok) throw new Error('Failed to load patients.json in test');
  return res.json();
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.addInitScript(installAudioMocks);
  await page.addInitScript(() => {
    window.prompt = () => 'fake-admin-code';
    window.alert = () => {};
    window.confirm = () => true;
  });

  (page as any).__collectedErrors = errors;
});

test.afterEach(async ({ page }) => {
  const errors = ((page as any).__collectedErrors || []) as string[];
  expect(errors, `Unexpected page errors: ${errors.join('\n')}`).toEqual([]);
});

test('A) smoke: app loads and key UI is visible', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.getByRole('heading', { name: 'OBE OSCE Speaking Trainer' })).toBeVisible();
  expect(await page.locator('.patient-tab').count()).toBeGreaterThan(0);
});

test('B) student fullscreen audio routing uses current slide audio, not intro', async ({ page, baseURL }) => {
  const patients = await getPatients(baseURL);
  const patient1 = patients.find((p) => p.id === 1)!;
  const expectedAudio = patient1.lines?.[0]?.audioFile;
  expect(expectedAudio).toBeTruthy();

  await page.goto('/');
  await page.locator('.patient-tab[data-patient="1"]').click();

  await expect(page.locator('body')).toHaveClass(/fullscreen-mode/);
  await expect(page.locator('#slideCounter')).toContainText('1 /');

  await page.getByRole('button', { name: /Next/i }).click();
  await expect(page.locator('#slideCounter')).toContainText('2 /');

  await page.locator('.fs-slide.active .slide-audio-btn').click();

  const calls = await page.evaluate(() => (window as any).__audioCalls as string[]);
  const last = calls[calls.length - 1] || '';

  expect(last).toContain(expectedAudio!);
  expect(last).not.toContain('intro.wav');
});

test('C) clicked-slide audio matches audioFile from patients.json', async ({ page, baseURL }) => {
  const patients = await getPatients(baseURL);
  const patient1 = patients.find((p) => p.id === 1)!;
  const targetIndex = 3; // slide counter 4/.. -> lines[3]
  const expectedAudio = patient1.lines?.[targetIndex]?.audioFile;
  expect(expectedAudio).toBeTruthy();

  await page.goto('/');
  await page.locator('.patient-tab[data-patient="1"]').click();

  for (let i = 0; i < targetIndex + 1; i += 1) {
    await page.getByRole('button', { name: /Next/i }).click();
  }

  await page.locator('.fs-slide.active .slide-audio-btn').click();

  const calls = await page.evaluate(() => (window as any).__audioCalls as string[]);
  const last = calls[calls.length - 1] || '';

  expect(last).toContain(expectedAudio!);
  expect(last).not.toContain('intro.wav');
});

test('D) admin studio Play this slide audio follows #editorSlide current value', async ({ page, baseURL }) => {
  const patients = await getPatients(baseURL);
  const patient1 = patients.find((p) => p.id === 1)!;
  const firstAudio = patient1.lines?.[0]?.audioFile;
  const secondAudio = patient1.lines?.[1]?.audioFile;
  expect(firstAudio).toBeTruthy();
  expect(secondAudio).toBeTruthy();

  await page.goto('/');
  await page.getByRole('button', { name: /Admin editor/i }).click();

  await expect(page.locator('#editor')).toHaveClass(/show/);

  await page.selectOption('#editorPatient', '0');
  await page.selectOption('#editorSlide', '1');
  await page.locator('#studioPlayCurrentAudio').click();

  let calls = await page.evaluate(() => (window as any).__audioCalls as string[]);
  let last = calls[calls.length - 1] || '';
  expect(last).toContain(firstAudio!);
  expect(last).not.toContain('intro.wav');

  await page.selectOption('#editorSlide', '2');
  await page.locator('#studioPlayCurrentAudio').click();

  calls = await page.evaluate(() => (window as any).__audioCalls as string[]);
  last = calls[calls.length - 1] || '';
  expect(last).toContain(secondAudio!);
  expect(last).not.toContain('intro.wav');
});

test('E) index structure + script inclusion regression guard', async ({ page }) => {
  await page.goto('/');

  const srcs = await page.locator('script[src]').evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute('src') || '')
  );

  expect(srcs.some((s) => s.includes('audio-fallback.js'))).toBeTruthy();
  const studioSrc = srcs.find((s) => s.includes('studio-audio-player.js')) || '';
  expect(studioSrc).toBeTruthy();
  expect(studioSrc).not.toContain('studio-audio-player-20260527a');

  await expect(page.locator('header h1')).toBeVisible();
  await expect(page.locator('main.app')).toBeVisible();
  await expect(page.locator('#patientTabs')).toBeVisible();
  await expect(page.locator('#fullscreenStage')).toBeVisible();
});
