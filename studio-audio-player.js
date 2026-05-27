(() => {
  const VERSION = 'studio-audio-player-20260527b';
  let studioAudio = null;
  let audioConfigPromise = null;

  function loadAudioConfig() {
    if (audioConfigPromise) return audioConfigPromise;
    audioConfigPromise = fetch('/api/audio-config', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : { audioBaseUrl: '', version: Date.now() })
      .catch(() => ({ audioBaseUrl: '', version: Date.now() }));
    return audioConfigPromise;
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'patient';
  }

  function stripHtml(value) {
    const div = document.createElement('div');
    div.innerHTML = String(value || '');
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function getPatient() {
    try {
      return window.getEditedPatient?.() || window.getPatient?.() || null;
    } catch {
      return null;
    }
  }

  function getLine(patient, slideIndex) {
    if (!patient || slideIndex <= 0) return null;
    const raw = (patient.lines || [])[slideIndex - 1];
    if (!raw) return null;
    if (Array.isArray(raw)) {
      return {
        speaker: raw[0] || 'nurse',
        text: raw[1] || '',
        audioText: raw[2] || stripHtml(raw[1] || ''),
        audioFile: `slide-${String(slideIndex).padStart(3, '0')}.wav`
      };
    }
    return raw;
  }

  function getSlideIndex() {
    const selectValue = document.getElementById('editorSlide')?.value;
    const selectIndex = Number(selectValue);
    if (Number.isFinite(selectIndex) && selectIndex >= 0) return selectIndex;

    const activeCard = document.querySelector('.studio-slide-card.active small')?.textContent || '';
    const match = activeCard.match(/slide-(\d+)/i);
    if (match) return Number(match[1]);

    return 0;
  }

  function getCurrentAudioTextFromEditor(slideIndex) {
    if (slideIndex === 0) {
      return document.getElementById('editorIntroAudio')?.value?.trim() || '';
    }
    return document.getElementById('editorAudioText')?.value?.trim() || '';
  }

  function getCurrentVisibleTextFromEditor(slideIndex) {
    if (slideIndex === 0) return '';
    return document.getElementById('editorSlideText')?.value?.trim() || '';
  }

  async function getAudioInfo() {
    const patient = getPatient();
    const slideIndex = getSlideIndex();
    if (!patient) return null;
    const folder = patient.audioFolder || `patient-${patient.id}-${slugify(patient.name)}`;
    const config = await loadAudioConfig();
    const version = Date.now() || config.version || VERSION;
    const base = config.audioBaseUrl ? String(config.audioBaseUrl).replace(/\/+$/, '') : '';

    if (slideIndex === 0) {
      return {
        slideIndex,
        path: base
          ? `${base}/${folder}/${patient.introAudioFile || 'intro.wav'}?v=${version}`
          : `/audio/${folder}/${patient.introAudioFile || 'intro.wav'}?v=${version}`,
        text: getCurrentAudioTextFromEditor(0) || patient.introAudioText || `Patient ${patient.id}. ${patient.name}. ${patient.scenario || ''}`,
        speaker: 'intro'
      };
    }

    const line = getLine(patient, slideIndex);
    const audioFile = document.getElementById('editorAudioFile')?.textContent?.trim() || line?.audioFile || `slide-${String(slideIndex).padStart(3, '0')}.wav`;

    return {
      slideIndex,
      path: base
        ? `${base}/${folder}/${audioFile}?v=${version}`
        : `/audio/${folder}/${audioFile}?v=${version}`,
      text: getCurrentAudioTextFromEditor(slideIndex) || line?.audioText || stripHtml(getCurrentVisibleTextFromEditor(slideIndex) || line?.text || ''),
      speaker: line?.speaker || document.getElementById('editorSpeaker')?.value || 'nurse'
    };
  }

  function setButton(text, warning = false) {
    const button = document.getElementById('studioPlayCurrentAudio');
    if (!button) return;
    button.textContent = text;
    button.classList.toggle('studio-audio-warning', Boolean(warning));
  }

  function stopAudio() {
    if (studioAudio) {
      studioAudio.pause();
      studioAudio.currentTime = 0;
      studioAudio = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setButton('▶ Play this slide audio');
  }

  function speakFallback(text, speaker) {
    const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleanText || !('speechSynthesis' in window)) {
      setButton('Audio missing', true);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.86;
    utterance.pitch = speaker === 'patient' ? 0.92 : 1.04;
    utterance.onstart = () => setButton('Browser voice playing…');
    utterance.onend = () => setButton('▶ Play this slide audio');
    utterance.onerror = () => setButton('Audio missing', true);
    window.speechSynthesis.speak(utterance);
  }

  window.playStudioCurrentAudio = async function playStudioCurrentAudio() {
    const info = await getAudioInfo();
    if (!info) return;
    stopAudio();

    console.info('Studio audio playback', {
      slideIndex: info.slideIndex,
      path: info.path,
      speaker: info.speaker
    });

    studioAudio = new Audio(info.path);
    studioAudio.preload = 'auto';
    studioAudio.onplaying = () => setButton(`WAV audio playing… slide-${String(info.slideIndex).padStart(3, '0')}`);
    studioAudio.onended = () => {
      studioAudio = null;
      setButton('▶ Play this slide audio');
    };
    studioAudio.onerror = () => {
      studioAudio = null;
      console.warn('Studio WAV missing, using browser voice fallback:', info.path);
      speakFallback(info.text, info.speaker);
    };
    studioAudio.play().catch(() => {
      studioAudio = null;
      speakFallback(info.text, info.speaker);
    });
  };

  function injectStyles() {
    if (document.getElementById('studio-audio-player-styles')) return;
    const style = document.createElement('style');
    style.id = 'studio-audio-player-styles';
    style.textContent = `
      #studioPlayCurrentAudio{
        border:0!important;border-radius:13px!important;background:#15803d!important;color:white!important;
        font-weight:900!important;padding:10px 13px!important;box-shadow:0 8px 18px rgba(21,128,61,.18)!important;
        cursor:pointer!important;
      }
      #studioPlayCurrentAudio.studio-audio-warning{background:#9ca3af!important;}
    `;
    document.head.appendChild(style);
  }

  function ensureButton() {
    injectStyles();
    const bottom = document.getElementById('studioBottomTools');
    if (!bottom || document.getElementById('studioPlayCurrentAudio')) return;
    const button = document.createElement('button');
    button.id = 'studioPlayCurrentAudio';
    button.type = 'button';
    button.textContent = '▶ Play this slide audio';
    button.onclick = window.playStudioCurrentAudio;
    bottom.prepend(button);
  }

  function hook(name) {
    const previous = window[name];
    if (typeof previous !== 'function') return;
    window[name] = function hookedStudioAudioButton(...args) {
      const result = previous.apply(this, args);
      setTimeout(ensureButton, 0);
      return result;
    };
  }

  ['openEditor', 'loadSlideIntoEditor', 'changeEditorSlide', 'changeEditorPatient', 'previousEditorSlide', 'nextEditorSlide', 'addSlideAfterCurrent', 'deleteCurrentSlide'].forEach(hook);
  document.addEventListener('click', () => setTimeout(ensureButton, 0));
  window.addEventListener('beforeunload', stopAudio);
  setTimeout(ensureButton, 200);
})();
