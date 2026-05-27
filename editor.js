(() => {
  const AUDIO_LINK_VERSION = 'stable-audio-20260527c';
  const PLAY_FULL_TEXT = '▶ Play full presentation';
  const STOP_TEXT = '⏸ Stop';
  let directAudio = null;
  let directAutoPlay = false;

  function applyEnglishLabels() {
    const playAllButton = document.getElementById('playAllButton');
    if (playAllButton) playAllButton.textContent = directAutoPlay ? STOP_TEXT : PLAY_FULL_TEXT;
  }

  function setAutoPlaying(value) {
    directAutoPlay = Boolean(value);
    document.body.classList.toggle('presentation-auto-playing', directAutoPlay);
    applyEnglishLabels();
  }

  window.updatePlayAllButton = applyEnglishLabels;

  function injectPolishStyles() {
    if (document.getElementById('obe-editor-polish-styles')) return;
    const style = document.createElement('style');
    style.id = 'obe-editor-polish-styles';
    style.textContent = `
      body{background:linear-gradient(180deg,#eef6ff 0,#f8fbff 52%,#eef6ff 100%)!important;}
      .admin-open{background:#0f4c81!important;color:white!important;border:none!important;padding:12px 20px!important;box-shadow:0 10px 26px rgba(15,76,129,.22)!important;}
      .editor.show{display:block!important;}
      .editor{width:min(1380px,96vw)!important;max-width:1380px!important;margin:28px auto!important;padding:0!important;overflow:hidden!important;background:#fff!important;border:1px solid #dbeafe!important;border-radius:28px!important;box-shadow:0 24px 70px rgba(15,76,129,.18)!important;text-align:left!important;}
      .editor::before{content:'Teacher Workspace';display:block;background:linear-gradient(135deg,#0f4c81,#0b6aa8);color:white;font-weight:900;font-size:.8rem;letter-spacing:.15em;text-transform:uppercase;padding:12px 26px;}
      .editor h2{margin:0!important;padding:24px 28px 4px!important;color:#082f49!important;font-size:clamp(1.45rem,2.6vw,2.1rem)!important;}
      .editor>p.hint{margin:0 28px 18px!important;color:#475569!important;font-size:1rem!important;}
      .editor-grid{display:grid!important;grid-template-columns:minmax(210px,250px) minmax(0,1fr)!important;gap:14px 18px!important;padding:0 28px 24px!important;align-items:start!important;}
      .editor label{color:#334155!important;font-size:.82rem!important;letter-spacing:.08em!important;text-transform:uppercase!important;font-weight:900!important;padding-top:13px!important;}
      .editor input,.editor textarea,.editor select{border:1px solid #cbd5e1!important;border-radius:16px!important;padding:13px 14px!important;font-size:1rem!important;color:#0f172a!important;background:#f8fafc!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75)!important;transition:border .15s ease,box-shadow .15s ease,background .15s ease!important;}
      .editor input:focus,.editor textarea:focus,.editor select:focus{outline:none!important;border-color:#38bdf8!important;background:white!important;box-shadow:0 0 0 4px rgba(56,189,248,.18)!important;}
      .editor textarea{min-height:112px!important;line-height:1.55!important;resize:vertical!important;}
      .editor .small-json{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;font-size:.93rem!important;background:#f1f5f9!important;}
      .editor .slide-text{min-height:190px!important;font-size:1.05rem!important;background:#fff7ed!important;border-color:#fed7aa!important;}
      .editor .audio-text{min-height:160px!important;background:#eef6ff!important;border-color:#bfdbfe!important;}
      .slide-nav{gap:10px!important;align-items:center!important;}
      .slide-nav button,.editor-actions button{border:none!important;border-radius:14px!important;padding:12px 16px!important;font-weight:900!important;box-shadow:0 8px 20px rgba(15,23,42,.12)!important;}
      .slide-nav button{background:#0f4c81!important;color:white!important;}.slide-nav .danger{background:#dc2626!important;color:white!important;}
      .editor-actions{position:sticky!important;bottom:0!important;z-index:20!important;margin:0!important;padding:18px 28px!important;background:rgba(255,255,255,.92)!important;backdrop-filter:blur(10px)!important;border-top:1px solid #e2e8f0!important;justify-content:flex-end!important;}
      .save-only{background:#0f4c81!important;color:white!important}.save-generate{background:#ea580c!important;color:white!important}.close-editor{background:#64748b!important;color:white!important}
      .editor-status{margin:0!important;padding:0 28px 18px!important;color:#0f4c81!important;font-size:1rem!important;}
      .slide-preview{background:linear-gradient(180deg,#fff,#f8fbff)!important;border:1px solid #bfdbfe!important;border-radius:20px!important;padding:18px!important;color:#0f172a!important;box-shadow:0 12px 28px rgba(15,76,129,.08)!important;}
      .audio-file{background:#dbeafe!important;color:#1e3a8a!important;border-radius:999px!important;padding:8px 12px!important;font-size:.95rem!important;}
      .modern-editor-toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin:0 28px 20px;padding:16px;border-radius:20px;background:#f1f7ff;border:1px solid #dbeafe;}
      .modern-editor-toolbar strong{font-size:1.05rem;color:#082f49}.modern-editor-toolbar span{color:#64748b;font-size:.95rem}.modern-chip-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.modern-chip{border-radius:999px;background:#e0f2fe;color:#075985;font-weight:900;font-size:.78rem;padding:5px 9px;}
      .slide-list-wrap{margin:0 28px 22px;padding:16px;border:1px solid #e2e8f0;border-radius:22px;background:#f8fafc}.slide-list-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px;color:#082f49;font-weight:900}.slide-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;max-height:320px;overflow:auto;padding:4px;}
      .slide-card{border:1px solid #cbd5e1;background:white;border-radius:18px;padding:13px;text-align:left;cursor:pointer;color:#334155;font-weight:800;box-shadow:0 6px 16px rgba(15,23,42,.06);transition:.15s ease;}.slide-card:hover{transform:translateY(-2px);border-color:#38bdf8;box-shadow:0 10px 22px rgba(15,76,129,.13);}.slide-card.active{border:3px solid #0f4c81;background:#eff6ff}.slide-card small{display:block;color:#64748b;margin-bottom:6px;font-size:.77rem}.slide-card .line-speaker{display:inline-block;background:#e0f2fe;color:#075985;border-radius:999px;padding:3px 9px;font-size:.76rem;margin-bottom:7px}.slide-card .line-speaker.patient{background:#dcfce7;color:#166534}.slide-card .line-text{display:block;font-size:.92rem;line-height:1.35;color:#0f172a}.slide-card .line-audio{display:block;margin-top:7px;font-size:.8rem;color:#64748b;font-weight:700;}
      body.fullscreen-mode .fullscreen-stage{min-height:100dvh!important;height:100dvh!important;padding:max(12px,env(safe-area-inset-top)) 12px calc(112px + env(safe-area-inset-bottom))!important;align-items:center!important;justify-content:center!important;}body.presentation-auto-playing .fs-slide .slide-audio-btn{opacity:.55!important;pointer-events:none!important;filter:grayscale(.15)!important;}
      @media(max-width:900px){.editor-grid{grid-template-columns:1fr!important;padding:0 18px 20px!important}.editor label{padding-top:0!important}.modern-editor-toolbar,.slide-list-wrap{margin-left:18px!important;margin-right:18px!important}.editor h2{padding-left:18px!important}.editor>p.hint{margin-left:18px!important;margin-right:18px!important}.editor-actions{padding:14px 18px!important;justify-content:stretch!important}.editor-actions button{flex:1 1 180px}.slide-list{grid-template-columns:1fr!important}}
      @media(max-width:640px){.fs-card,.fs-line{width:94vw!important;max-height:calc(100dvh - 176px)!important;border-radius:22px!important;border-width:3px!important;padding:clamp(18px,5vw,24px)!important}.fs-line{font-size:clamp(1.42rem,5.7vw,1.9rem)!important;line-height:1.2!important}.controls{width:94vw!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;border-radius:28px!important;justify-content:space-between!important}.controls button{font-size:.78rem!important;padding:10px!important}.controls .audio-control{max-width:150px!important;white-space:normal!important}.vitals-grid{grid-template-columns:1fr 1fr!important}}
    `;
    document.head.appendChild(style);
  }

  function stripTags(value) { return String(value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
  function truncate(value, length = 110) { const text = String(value || ''); return text.length > length ? `${text.slice(0, length - 1)}…` : text; }

  function getLine(patient, index) {
    if (!patient || index <= 0) return null;
    const raw = (patient.lines || [])[index - 1];
    return window.normalizeLine ? normalizeLine(raw, index - 1, patient) : raw;
  }

  function stableAudioPath(slideIndex = getActiveSlideIndex()) {
    const patient = window.getPatient?.();
    if (!patient) return '';
    const folder = patient.audioFolder || `patient-${patient.id}-${String(patient.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
    const file = slideIndex === 0 ? (patient.introAudioFile || 'intro.wav') : (getLine(patient, slideIndex)?.audioFile || 'missing-audio.wav');
    return `/audio/${folder}/${file}?v=${AUDIO_LINK_VERSION}`;
  }

  function ensureModernEditorUI() {
    const editor = document.getElementById('editor');
    if (!editor || editor.dataset.modernized === '1') return;
    editor.dataset.modernized = '1';
    const title = editor.querySelector('h2');
    if (title) title.textContent = 'Admin editor';
    const firstHint = editor.querySelector(':scope > .hint');
    if (firstHint) firstHint.textContent = 'Edit patient cases, stable slide audio files, visible slide text, and clean audio text in one workspace.';
    const grid = editor.querySelector('.editor-grid');
    const toolbar = document.createElement('div');
    toolbar.id = 'modernEditorToolbar';
    toolbar.className = 'modern-editor-toolbar';
    toolbar.innerHTML = '<div><strong>Current case</strong><div id="modernEditorCaseName">Select a patient</div><div id="modernEditorChips" class="modern-chip-row"></div></div><div><span>Slide numbers are visual. Audio filenames are stable.</span></div>';
    if (grid) editor.insertBefore(toolbar, grid);
    const slideWrap = document.createElement('div');
    slideWrap.id = 'slideListWrap';
    slideWrap.className = 'slide-list-wrap';
    slideWrap.innerHTML = '<div class="slide-list-title"><span>Conversation slide cards</span><small>Click a card to edit it</small></div><div id="editorSlideList" class="slide-list"></div>';
    if (grid) editor.insertBefore(slideWrap, grid);
  }

  function renderModernEditorSummary() {
    const patient = window.getEditedPatient?.();
    const nameBox = document.getElementById('modernEditorCaseName');
    const chipsBox = document.getElementById('modernEditorChips');
    if (!patient || !nameBox || !chipsBox) return;
    nameBox.textContent = `Patient ${patient.id} — ${patient.name || 'Unnamed patient'}`;
    const chips = [patient.course, patient.week, ...(patient.clo || []), patient.skill].filter(Boolean).slice(0, 6);
    chipsBox.innerHTML = chips.map(chip => `<span class="modern-chip">${escapeHtml(chip)}</span>`).join('');
  }

  function renderEditorSlideList() {
    ensureModernEditorUI();
    const list = document.getElementById('editorSlideList');
    const patient = window.getEditedPatient?.();
    if (!list || !patient) return;
    const currentIndex = typeof editorSlideIndex === 'number' ? editorSlideIndex : 0;
    const cards = [`<button type="button" class="slide-card ${currentIndex === 0 ? 'active' : ''}" onclick="selectEditorSlide(0)"><small>slide-000 · ${escapeHtml(patient.introAudioFile || 'intro.wav')}</small><span class="line-speaker">Intro</span><span class="line-text">${escapeHtml(truncate(patient.scenario || 'Patient intro', 120))}</span><span class="line-audio">Audio: ${escapeHtml(truncate(patient.introAudioText || '', 90))}</span></button>`];
    (patient.lines || []).forEach((raw, index) => {
      const line = window.normalizeLine ? normalizeLine(raw, index, patient) : raw;
      const slideNumber = index + 1;
      const speakerLabel = line.speaker === 'patient' ? 'Patient' : 'Practical nurse';
      cards.push(`<button type="button" class="slide-card ${currentIndex === slideNumber ? 'active' : ''}" onclick="selectEditorSlide(${slideNumber})"><small>slide-${pad(slideNumber)} · ${escapeHtml(line.audioFile || '')}</small><span class="line-speaker ${line.speaker === 'patient' ? 'patient' : ''}">${speakerLabel}</span><span class="line-text">${escapeHtml(truncate(stripTags(line.text), 120))}</span><span class="line-audio">Audio: ${escapeHtml(truncate(line.audioText || makeAudioText(line.text), 90))}</span></button>`);
    });
    list.innerHTML = cards.join('');
    renderModernEditorSummary();
  }

  function selectEditorSlideModern(slideNumber) {
    try { window.saveCurrentSlideToMemory?.(); window.savePatientMetaToMemory?.(); }
    catch (error) { window.setEditorStatus?.(error.message); return; }
    editorSlideIndex = Number(slideNumber) || 0;
    window.populateSlideSelect?.();
    window.loadSlideIntoEditor?.();
    renderEditorSlideList();
  }

  injectPolishStyles();
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
    const path = stableAudioPath(getActiveSlideIndex());
    if (!path) return;
    stopDirectAudio();
    directAudio = new Audio(path);
    directAudio.preload = 'auto';
    directAudio.onended = () => { directAudio = null; if (fromAutoPlay) onEnded(); };
    directAudio.onerror = () => { if (fromAutoPlay) setTimeout(onEnded, 300); else showAudioError(path); };
    directAudio.play().catch(() => { if (fromAutoPlay) setTimeout(onEnded, 300); else if (!directAutoPlay) showAudioError(path); });
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
    window.getAudioPath = function getStableAudioPath(patient, slideNumber) {
      const file = Number(slideNumber) === 0 ? (patient.introAudioFile || 'intro.wav') : (window.normalizeLine ? normalizeLine((patient.lines || [])[Number(slideNumber) - 1], Number(slideNumber) - 1, patient).audioFile : 'missing-audio.wav');
      const folder = patient.audioFolder || `patient-${patient.id}-${String(patient.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
      return `/audio/${folder}/${file}?v=${AUDIO_LINK_VERSION}`;
    };
  }

  const originalOpenEditor = window.openEditor;
  const originalLoadPatientIntoEditor = window.loadPatientIntoEditor;
  const originalPopulateSlideSelect = window.populateSlideSelect;
  const originalLoadSlideIntoEditor = window.loadSlideIntoEditor;
  const originalMarkEditorDirty = window.markEditorDirty;
  const originalSaveEditor = window.saveEditor;
  const originalChangeEditorPatient = window.changeEditorPatient;
  const originalChangeEditorSlide = window.changeEditorSlide;

  window.openEditor = function openModernEditor() { originalOpenEditor?.(); ensureModernEditorUI(); renderEditorSlideList(); };
  window.loadPatientIntoEditor = function loadModernPatientIntoEditor() { originalLoadPatientIntoEditor?.(); ensureModernEditorUI(); renderEditorSlideList(); };
  window.populateSlideSelect = function populateModernSlideSelect() { originalPopulateSlideSelect?.(); renderEditorSlideList(); };
  window.loadSlideIntoEditor = function loadModernSlideEditor() { originalLoadSlideIntoEditor?.(); renderEditorSlideList(); };
  window.markEditorDirty = function markModernEditorDirty() { originalMarkEditorDirty?.(); renderEditorSlideList(); };
  window.changeEditorPatient = function changeModernEditorPatient() { originalChangeEditorPatient?.(); renderEditorSlideList(); };
  window.changeEditorSlide = function changeModernEditorSlide() { originalChangeEditorSlide?.(); renderEditorSlideList(); };
  window.saveEditor = async function saveModernEditor(regenerateAudio) { await originalSaveEditor?.(regenerateAudio); renderEditorSlideList(); };
  window.selectEditorSlide = selectEditorSlideModern;
  window.renderEditorSlideList = renderEditorSlideList;
})();
