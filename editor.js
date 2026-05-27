(() => {
  const AUDIO_LINK_VERSION = 'obe-bootstrap-20260527a';
  const PLAY_FULL_TEXT = '▶ Play full presentation';
  const STOP_TEXT = '⏸ Stop';
  let directAudio = null;
  let directAutoPlay = false;

  function setAutoPlaying(value) {
    directAutoPlay = Boolean(value);
    document.body.classList.toggle('presentation-auto-playing', directAutoPlay);
    applyEnglishLabels();
  }

  function applyEnglishLabels() {
    const playAllButton = document.getElementById('playAllButton');
    if (playAllButton) playAllButton.textContent = directAutoPlay ? STOP_TEXT : PLAY_FULL_TEXT;
  }

  window.updatePlayAllButton = function updatePlayAllButtonEnglish() {
    applyEnglishLabels();
  };

  function injectMobilePolishStyles() {
    if (document.getElementById('mobile-polish-styles')) return;
    const style = document.createElement('style');
    style.id = 'mobile-polish-styles';
    style.textContent = `
      body.fullscreen-mode .fullscreen-stage{
        min-height:100dvh!important;
        height:100dvh!important;
        padding:max(12px, env(safe-area-inset-top)) 12px calc(112px + env(safe-area-inset-bottom))!important;
        align-items:center!important;
        justify-content:center!important;
      }
      body.fullscreen-mode .fs-slide.active{height:100dvh!important;align-items:center!important;justify-content:center!important;}
      .fs-card,.fs-line{scrollbar-width:none;}
      .fs-card::-webkit-scrollbar,.fs-line::-webkit-scrollbar{display:none;}
      body.presentation-auto-playing .fs-slide .slide-audio-btn{
        opacity:.55!important;
        pointer-events:none!important;
        filter:grayscale(.15)!important;
      }
      @media(max-width:920px){
        .fs-line{font-size:clamp(1.65rem,5.7vw,3rem)!important;line-height:1.18!important;}
        .vital-tag{white-space:nowrap!important;}
      }
      @media(max-width:640px){
        body.fullscreen-mode .fullscreen-stage{
          padding:max(10px, env(safe-area-inset-top)) 10px calc(116px + env(safe-area-inset-bottom))!important;
        }
        .fs-card,.fs-line{
          width:94vw!important;
          max-height:calc(100dvh - 176px)!important;
          border-radius:22px!important;
          border-width:3px!important;
          padding:clamp(18px,5vw,24px)!important;
          box-shadow:0 10px 28px rgba(0,0,0,.22)!important;
        }
        .fs-line{
          font-size:clamp(1.42rem,5.7vw,1.9rem)!important;
          line-height:1.2!important;
          letter-spacing:0!important;
          word-spacing:.01em!important;
        }
        .speaker{font-size:.43em!important;letter-spacing:.15em!important;margin-bottom:12px!important;}
        .vital-tag{display:inline-flex!important;white-space:nowrap!important;font-size:.76em!important;line-height:1!important;padding:.14em .52em!important;margin:.03em .12em!important;vertical-align:.03em!important;max-width:none!important;}
        .slide-audio-btn{font-size:clamp(.95rem,4vw,1.05rem)!important;line-height:1.05!important;padding:10px 18px!important;margin-top:20px!important;border-radius:999px!important;}
        .controls{width:94vw!important;left:50%!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;transform:translateX(-50%)!important;padding:8px!important;gap:6px!important;border-radius:28px!important;justify-content:space-between!important;}
        .controls button{font-size:.78rem!important;line-height:1.08!important;padding:10px 10px!important;min-width:0!important;}
        .controls .audio-control{max-width:150px!important;white-space:normal!important;}
        .controls span{min-width:44px!important;font-size:.8rem!important;}
        .vitals-grid{grid-template-columns:1fr 1fr!important;gap:8px!important;}
        .vital-box{font-size:.9rem!important;padding:10px!important;border-radius:14px!important;}
        .vital-box span{font-size:1.35rem!important;}
        .vital-box small{font-size:.78rem!important;}
      }
      @media(max-width:390px){
        .fs-card,.fs-line{width:93vw!important;padding:18px!important;max-height:calc(100dvh - 170px)!important;}
        .fs-line{font-size:clamp(1.28rem,5.45vw,1.68rem)!important;line-height:1.22!important;}
        .vital-tag{font-size:.72em!important;padding:.13em .46em!important;}
        .slide-audio-btn{font-size:.92rem!important;padding:9px 15px!important;}
        .controls{width:95vw!important;gap:5px!important;padding:7px!important;}
        .controls button{font-size:.7rem!important;padding:9px 8px!important;}
        .controls .audio-control{max-width:136px!important;}
        .controls span{min-width:38px!important;font-size:.72rem!important;}
      }
    `;
    document.head.appendChild(style);
  }

  injectMobilePolishStyles();
  applyEnglishLabels();

  document.addEventListener('click', (event) => {
    if (!directAutoPlay) return;
    if (event.target.closest('.fs-slide .slide-audio-btn')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  function getActiveSlideIndex() {
    const slides = Array.from(document.querySelectorAll('.fs-slide'));
    const index = slides.findIndex(slide => slide.classList.contains('active'));
    return index >= 0 ? index : 0;
  }

  function getDirectAudioPath(slideIndex = getActiveSlideIndex()) {
    const patient = window.getPatient?.();
    if (!patient) return '';
    const folder = patient.audioFolder || `patient-${patient.id}-${String(patient.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
    const fileNumber = String(slideIndex).padStart(3, '0');
    return `/audio/${folder}/slide-${fileNumber}.wav?v=${AUDIO_LINK_VERSION}`;
  }

  function stopDirectAudio() {
    if (directAudio) {
      directAudio.pause();
      directAudio.currentTime = 0;
      directAudio = null;
    }
  }

  function showAudioError(path) {
    const activeSlide = document.querySelector('.fs-slide.active');
    const button = activeSlide?.querySelector('.slide-audio-btn');
    if (button) {
      button.textContent = 'Audio could not start. Generate audio, tap Next, or reload.';
      button.classList.add('audio-missing');
    }
    console.error('OBE OSCE audio failed:', path);
  }

  window.playCurrentAudio = function playCurrentAudioDirect(onEnded) {
    const fromAutoPlay = typeof onEnded === 'function';
    if (directAutoPlay && !fromAutoPlay) return;

    const slideIndex = getActiveSlideIndex();
    const path = getDirectAudioPath(slideIndex);
    if (!path) return;

    stopDirectAudio();
    directAudio = new Audio(path);
    directAudio.preload = 'auto';
    directAudio.onended = () => {
      directAudio = null;
      if (fromAutoPlay) onEnded();
    };
    directAudio.onerror = () => {
      console.error('OBE OSCE audio load failed:', path);
      if (fromAutoPlay) {
        setTimeout(onEnded, 300);
      } else {
        showAudioError(path);
      }
    };
    directAudio.play().catch((error) => {
      console.warn('OBE OSCE audio start blocked/interrupted:', error?.name || error, path);
      if (fromAutoPlay) {
        setTimeout(onEnded, 300);
      } else if (!directAutoPlay) {
        showAudioError(path);
      }
    });
  };

  window.togglePresentationPlayback = function toggleDirectPresentationPlayback() {
    const button = document.getElementById('playAllButton');
    if (directAutoPlay) {
      setAutoPlaying(false);
      stopDirectAudio();
      if (button) button.textContent = PLAY_FULL_TEXT;
      return;
    }

    setAutoPlaying(true);
    if (button) button.textContent = STOP_TEXT;

    const playThenNext = () => {
      if (!directAutoPlay) return;
      const slides = Array.from(document.querySelectorAll('.fs-slide'));
      const currentIndex = getActiveSlideIndex();
      window.playCurrentAudio(() => {
        if (!directAutoPlay) return;
        if (currentIndex >= slides.length - 1) {
          setAutoPlaying(false);
          stopDirectAudio();
          if (button) button.textContent = PLAY_FULL_TEXT;
          return;
        }
        window.nextSlide?.();
        setTimeout(playThenNext, 450);
      });
    };

    playThenNext();
  };

  const originalExitSlides = window.exitSlides;
  if (typeof originalExitSlides === 'function') {
    window.exitSlides = function exitSlidesWithAudioCleanup() {
      setAutoPlaying(false);
      stopDirectAudio();
      originalExitSlides();
    };
  }

  const originalGetAudioPath = window.getAudioPath;
  if (typeof originalGetAudioPath === 'function') {
    window.getAudioPath = function getFixedAudioPath(patient, slideNumber) {
      const originalPath = String(originalGetAudioPath(patient, slideNumber) || '');
      const cleanPath = originalPath.split('?')[0].replace(/^\/+/, '');
      return `/${cleanPath}?v=${AUDIO_LINK_VERSION}`;
    };
  }
})();
