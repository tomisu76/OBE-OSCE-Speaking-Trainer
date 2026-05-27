(() => {
  const FALLBACK_VERSION = 'audio-fallback-20260527c';
  const PLAY_FULL_TEXT = '▶ Play full presentation';
  const STOP_TEXT = '⏸ Stop';
  let fallbackAudio = null;
  let fallbackAutoPlay = false;

  function allSlides() {
    return Array.from(document.querySelectorAll('.fs-slide'));
  }

  function getSlideIndexFromButton(button) {
    const slide = button?.closest?.('.fs-slide');
    if (!slide) return -1;
    return allSlides().indexOf(slide);
  }

  function getActiveSlideIndex() {
    const slides = allSlides();
    const activeIndex = slides.findIndex(slide => slide.classList.contains('active'));
    if (activeIndex >= 0) return activeIndex;

    const counter = document.getElementById('slideCounter')?.textContent || '';
    const match = counter.match(/(\d+)\s*\/\s*\d+/);
    if (match) return Math.max(0, Number(match[1]) - 1);

    return 0;
  }

  function stripHtml(value) {
    const div = document.createElement('div');
    div.innerHTML = String(value || '');
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function getVisibleSlideText(slideIndex = getActiveSlideIndex()) {
    const slide = allSlides()[slideIndex];
    const line = slide?.querySelector('.fs-line');
    if (!line) return '';
    const clone = line.cloneNode(true);
    clone.querySelector('.speaker')?.remove();
    clone.querySelector('.slide-audio-btn')?.remove();
    return stripHtml(clone.innerHTML);
  }

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'patient';
  }

  function getPatientSafe() {
    try {
      return window.getPatient?.() || null;
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

  function getAudioPath(slideIndex = getActiveSlideIndex()) {
    const patient = getPatientSafe();
    if (!patient) return '';
    const folder = patient.audioFolder || `patient-${patient.id}-${slugify(patient.name)}`;
    const line = getLine(patient, slideIndex);
    const file = slideIndex === 0
      ? (patient.introAudioFile || 'intro.wav')
      : (line?.audioFile || `slide-${String(slideIndex).padStart(3, '0')}.wav`);
    return `/audio/${folder}/${file}?v=${FALLBACK_VERSION}&ts=${Date.now()}`;
  }

  function getFallbackText(slideIndex = getActiveSlideIndex()) {
    const patient = getPatientSafe();
    if (!patient) return '';
    if (slideIndex === 0) {
      return patient.introAudioText || `Patient ${patient.id}. ${patient.name}. ${patient.scenario || ''}`;
    }
    const line = getLine(patient, slideIndex);
    const visibleText = getVisibleSlideText(slideIndex);
    return visibleText || line?.audioText || stripHtml(line?.text || '');
  }

  function getFallbackSpeaker(slideIndex = getActiveSlideIndex()) {
    const patient = getPatientSafe();
    if (!patient || slideIndex === 0) return 'intro';
    return getLine(patient, slideIndex)?.speaker || 'nurse';
  }

  function setPlayAllLabel() {
    const button = document.getElementById('playAllButton');
    if (button) button.textContent = fallbackAutoPlay ? STOP_TEXT : PLAY_FULL_TEXT;
  }

  function stopFallbackAudio() {
    if (fallbackAudio) {
      fallbackAudio.pause();
      fallbackAudio.currentTime = 0;
      fallbackAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  function setSlideAudioButton(text, isWarning = false, slideIndex = getActiveSlideIndex()) {
    const slide = allSlides()[slideIndex] || document.querySelector('.fs-slide.active');
    const button = slide?.querySelector('.slide-audio-btn');
    if (!button) return;
    button.textContent = text;
    button.classList.toggle('audio-missing', Boolean(isWarning));
  }

  function speakFallback(text, speaker, onEnded, slideIndex) {
    const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleanText || !('speechSynthesis' in window)) {
      setSlideAudioButton('Audio missing. Generate WAV audio.', true, slideIndex);
      if (typeof onEnded === 'function') setTimeout(onEnded, 300);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.86;
    utterance.pitch = speaker === 'patient' ? 0.92 : 1.04;
    utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices?.() || [];
    const preferred = voices.find(v => /English|United States|US/i.test(`${v.name} ${v.lang}`));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setSlideAudioButton('▶ Browser voice fallback playing', false, slideIndex);
    utterance.onend = () => {
      setSlideAudioButton('▶ Play Audio', false, slideIndex);
      if (typeof onEnded === 'function') onEnded();
    };
    utterance.onerror = () => {
      setSlideAudioButton('Audio missing. Generate WAV audio.', true, slideIndex);
      if (typeof onEnded === 'function') setTimeout(onEnded, 300);
    };

    window.speechSynthesis.speak(utterance);
  }

  function playWithFallback(slideIndex = getActiveSlideIndex(), onEnded) {
    const path = getAudioPath(slideIndex);
    const fallbackText = getFallbackText(slideIndex);
    const speaker = getFallbackSpeaker(slideIndex);
    const fromAutoPlay = typeof onEnded === 'function';

    stopFallbackAudio();

    if (!path) {
      speakFallback(fallbackText, speaker, onEnded, slideIndex);
      return;
    }

    fallbackAudio = new Audio(path);
    fallbackAudio.preload = 'auto';
    fallbackAudio.onplaying = () => setSlideAudioButton('▶ WAV audio playing', false, slideIndex);
    fallbackAudio.onended = () => {
      fallbackAudio = null;
      setSlideAudioButton('▶ Play Audio', false, slideIndex);
      if (fromAutoPlay) onEnded();
    };
    fallbackAudio.onerror = () => {
      fallbackAudio = null;
      console.warn('WAV missing, using browser voice fallback:', path);
      speakFallback(fallbackText, speaker, onEnded, slideIndex);
    };

    fallbackAudio.play().catch(error => {
      fallbackAudio = null;
      console.warn('WAV blocked or failed, using browser voice fallback:', error);
      speakFallback(fallbackText, speaker, onEnded, slideIndex);
    });
  }

  window.playCurrentAudio = function playCurrentAudioWithFallback(onEnded) {
    if (fallbackAutoPlay && typeof onEnded !== 'function') return;
    playWithFallback(getActiveSlideIndex(), onEnded);
  };

  document.addEventListener('click', event => {
    const button = event.target.closest?.('.fs-slide .slide-audio-btn');
    if (!button) return;
    const clickedIndex = getSlideIndexFromButton(button);
    if (clickedIndex < 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    playWithFallback(clickedIndex);
  }, true);

  window.togglePresentationPlayback = function togglePresentationPlaybackWithFallback() {
    if (fallbackAutoPlay) {
      fallbackAutoPlay = false;
      stopFallbackAudio();
      setPlayAllLabel();
      return;
    }

    fallbackAutoPlay = true;
    setPlayAllLabel();

    const playThenAdvance = () => {
      if (!fallbackAutoPlay) return;
      const slides = allSlides();
      const currentIndex = getActiveSlideIndex();
      playWithFallback(currentIndex, () => {
        if (!fallbackAutoPlay) return;
        if (currentIndex >= slides.length - 1) {
          fallbackAutoPlay = false;
          stopFallbackAudio();
          setPlayAllLabel();
          return;
        }
        window.nextSlide?.();
        setTimeout(playThenAdvance, 350);
      });
    };

    playThenAdvance();
  };

  const previousExitSlides = window.exitSlides;
  if (typeof previousExitSlides === 'function') {
    window.exitSlides = function exitSlidesWithFallbackCleanup() {
      fallbackAutoPlay = false;
      stopFallbackAudio();
      setPlayAllLabel();
      previousExitSlides();
    };
  }

  window.addEventListener('beforeunload', stopFallbackAudio);
})();
