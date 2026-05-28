import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__audioCalls = [];
    const NativeAudio = window.Audio;
    class MockAudio {
      src: string;
      onended: null | (() => void) = null;
      onplaying: null | (() => void) = null;
      onerror: null | (() => void) = null;
      currentTime = 0;
      preload = 'auto';
      constructor(src: string) {
        this.src = src;
        (window as any).__audioCalls.push(src);
      }
      play() {
        this.onplaying?.();
        return Promise.resolve();
      }
      pause() {}
    }
    (window as any).__NativeAudio = NativeAudio;
    (window as any).Audio = MockAudio as any;
    window.prompt = () => 'playwright-admin';
  });

  await page.goto('/');
});

test('app is not blank and heading is visible', async ({ page }) => {
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page.getByRole('heading', { name: 'OBE OSCE Speaking Trainer' })).toBeVisible();
});

test('patient cards are visible', async ({ page }) => {
  await expect(page.locator('.patient-tab')).toHaveCount(3);
  await expect(page.locator('.patient-tab').first()).toBeVisible();
});

test('patient content stays professional', async ({ page }) => {
  const data = await page.request.get('/data/patients.json');
  expect(data.ok()).toBeTruthy();
  const text = await data.text();
  expect(text.toLowerCase()).not.toContain('shit');
  expect(text.toLowerCase()).not.toContain('antigravity');
  expect(text.toLowerCase()).not.toContain('hi you');
});

test('required script tags are present', async ({ page }) => {
  await expect(page.locator('script[src*="audio-fallback.js"]')).toHaveCount(1);
  await expect(page.locator('script[src*="studio-audio-player.js"]')).toHaveCount(1);
});

test('student Play Audio on non-intro slide does not call intro.wav', async ({ page }) => {
  await page.locator('.patient-tab').first().click();
  await page.getByRole('button', { name: '← Previous' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByRole('button', { name: '▶ Play Audio' }).click();

  const audioCalls = await page.evaluate(() => (window as any).__audioCalls as string[]);
  const latest = audioCalls[audioCalls.length - 1] || '';
  expect(latest).toBeTruthy();
  expect(latest).not.toContain('intro.wav');
});

test('editor Play this slide audio follows selected #editorSlide value', async ({ page }) => {
  await page.getByRole('button', { name: 'Admin editor' }).click();
  await expect(page.locator('#editor')).toHaveClass(/show/);
  await expect(page.locator('.studio-title')).toContainText('OBE OSCE Slide Studio');
  await expect(page.locator('#editorSlide')).toBeVisible();
  await expect(page.locator('#studioPlayCurrentAudio')).toBeVisible();

  await page.selectOption('#editorSlide', '2');
  await page.locator('#editorSlide').dispatchEvent('change');

  const expectedAudioFile = (await page.locator('#editorAudioFile').textContent())?.trim() || '';
  expect(expectedAudioFile).toBeTruthy();

  await page.getByRole('button', { name: '▶ Play this slide audio' }).click();

  const audioCalls = await page.evaluate(() => (window as any).__audioCalls as string[]);
  const latest = audioCalls[audioCalls.length - 1] || '';
  expect(latest).toContain(expectedAudioFile);
  expect(latest).not.toContain('intro.wav');
});
