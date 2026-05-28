(() => {
  const VERSION = 'supabase-audio-runtime-20260528a';
  const NativeAudio = window.Audio;
  let audioBaseUrl = '';
  let configLoaded = false;

  function normalizeBaseUrl(value) {
    return String(value || '').replace(/\/+$/, '');
  }

  function localPathFromSource(source) {
    try {
      const url = new URL(String(source || ''), window.location.origin);
      if (url.origin !== window.location.origin) return '';
      if (!url.pathname.startsWith('/audio/')) return '';
      return `${url.pathname}${url.search || ''}`;
    } catch {
      const text = String(source || '');
      if (text.startsWith('/audio/')) return text;
      if (text.startsWith('audio/')) return `/${text}`;
      return '';
    }
  }

  function supabaseSourceFromLocal(localSource) {
    if (!audioBaseUrl || !localSource) return '';
    const cleanLocal = String(localSource).replace(/^\/+/, '');
    const [pathOnly, query = ''] = cleanLocal.split('?');
    const objectPath = pathOnly.replace(/^audio\//, '');
    const separator = query ? `?${query}&` : '?';
    return `${audioBaseUrl}/${objectPath}${separator}source=supabase&v=${VERSION}&ts=${Date.now()}`;
  }

  async function loadAudioConfig() {
    try {
      const response = await fetch(`/api/audio-config?ts=${Date.now()}`, { cache: 'no-store' });
      const config = response.ok ? await response.json() : {};
      audioBaseUrl = normalizeBaseUrl(config.audioBaseUrl);
      window.osceAudioBaseUrl = audioBaseUrl;
    } catch (error) {
      console.warn('Supabase audio config unavailable; using local /audio files.', error);
      audioBaseUrl = '';
      window.osceAudioBaseUrl = '';
    } finally {
      configLoaded = true;
    }
  }

  function installAudioPatch() {
    if (!NativeAudio || window.__osceSupabaseAudioPatchInstalled) return;
    window.__osceSupabaseAudioPatchInstalled = true;

    window.Audio = function patchedAudio(source) {
      const originalSource = String(source || '');
      const localSource = localPathFromSource(originalSource);
      const supabaseSource = supabaseSourceFromLocal(localSource);
      const audio = new NativeAudio(supabaseSource || source);

      if (supabaseSource && localSource) {
        let triedLocal = false;
        audio.addEventListener('error', event => {
          if (triedLocal) return;
          triedLocal = true;
          event.stopImmediatePropagation?.();
          console.warn('Supabase audio failed; retrying local audio:', supabaseSource);
          audio.src = localSource;
          audio.load();
          audio.play().catch(error => {
            console.warn('Local audio retry failed:', error);
          });
        }, true);
      } else if (!configLoaded && localSource) {
        console.info('Supabase audio config still loading; using local audio for this play request.');
      }

      return audio;
    };

    window.Audio.prototype = NativeAudio.prototype;
  }

  function keepEnglishPlayLabel() {
    const button = document.getElementById('playAllButton');
    if (!button) return;
    if (/prehr|prehrá|cel/i.test(button.textContent || '')) {
      button.textContent = '▶ Play full presentation';
    }
  }

  installAudioPatch();
  loadAudioConfig();
  document.addEventListener('click', keepEnglishPlayLabel, true);
  setInterval(keepEnglishPlayLabel, 1000);
})();
