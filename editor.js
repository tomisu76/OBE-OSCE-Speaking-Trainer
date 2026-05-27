(() => {
  const VERSION = 'osce-slide-studio-20260527d';
  const PLAY_FULL_TEXT = '▶ Play full presentation';
  const STOP_TEXT = '⏸ Stop';
  let directAudio = null;
  let directAutoPlay = false;

  function applyEnglishLabels() {
    const playAllButton = document.getElementById('playAllButton');
    if (playAllButton) playAllButton.textContent = directAutoPlay ? STOP_TEXT : PLAY_FULL_TEXT;
  }

  window.updatePlayAllButton = applyEnglishLabels;

  function setAutoPlaying(value) {
    directAutoPlay = Boolean(value);
    document.body.classList.toggle('presentation-auto-playing', directAutoPlay);
    applyEnglishLabels();
  }

  function injectStudioStyles() {
    if (document.getElementById('osce-slide-studio-styles')) return;
    const style = document.createElement('style');
    style.id = 'osce-slide-studio-styles';
    style.textContent = `
      body.studio-open{overflow:hidden!important;}
      .editor.studio-mode.show{
        position:fixed!important;
        inset:0!important;
        z-index:5000!important;
        display:grid!important;
        grid-template-rows:72px minmax(0,1fr)!important;
        width:100vw!important;
        max-width:none!important;
        height:100dvh!important;
        margin:0!important;
        padding:0!important;
        border:0!important;
        border-radius:0!important;
        background:#eef2f7!important;
        box-shadow:none!important;
        overflow:hidden!important;
        color:#0f172a!important;
      }
      .editor.studio-mode::before,.editor.studio-mode>h2,.editor.studio-mode>p.hint{display:none!important;}
      .studio-topbar{
        display:flex;align-items:center;justify-content:space-between;gap:16px;
        padding:12px 18px;background:linear-gradient(135deg,#0f4c81,#2563eb 55%,#7c3aed);
        color:white;box-shadow:0 8px 22px rgba(15,23,42,.2);min-width:0;
      }
      .studio-brand{display:flex;align-items:center;gap:12px;min-width:0;}
      .studio-mark{width:42px;height:42px;border-radius:16px;background:rgba(255,255,255,.18);display:grid;place-items:center;font-weight:900;font-size:1.15rem;}
      .studio-title{font-weight:900;font-size:1.08rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .studio-subtitle{font-size:.82rem;opacity:.82;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:62vw;}
      .studio-top-actions{display:flex;align-items:center;gap:10px;flex-wrap:nowrap;}
      .studio-top-actions .editor-actions{position:static!important;display:flex!important;gap:8px!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;backdrop-filter:none!important;box-shadow:none!important;}
      .studio-top-actions .editor-actions button{border:0!important;border-radius:14px!important;padding:10px 14px!important;font-weight:900!important;color:white!important;box-shadow:0 8px 18px rgba(0,0,0,.16)!important;cursor:pointer!important;white-space:nowrap!important;}
      .studio-top-actions .save-only{background:#0ea5e9!important;}.studio-top-actions .save-generate{background:#f97316!important;}.studio-top-actions .close-editor{background:rgba(15,23,42,.64)!important;}
      .studio-shell{display:grid;grid-template-columns:290px minmax(420px,1fr) 390px;gap:14px;min-height:0;padding:14px;overflow:hidden;}
      .studio-panel{min-height:0;background:#fff;border:1px solid #dbe4ef;border-radius:24px;box-shadow:0 14px 34px rgba(15,23,42,.08);overflow:hidden;}
      .studio-left{display:grid;grid-template-rows:auto minmax(0,1fr);}
      .studio-panel-head{padding:16px 16px 10px;border-bottom:1px solid #e2e8f0;}
      .studio-panel-head strong{display:block;color:#082f49;font-size:.95rem;}.studio-panel-head span{display:block;color:#64748b;font-size:.82rem;margin-top:3px;}
      .studio-slide-list{display:flex;flex-direction:column;gap:10px;padding:14px;overflow:auto;min-height:0;background:#f8fafc;}
      .studio-slide-card{border:1px solid #d5e1ef;background:white;border-radius:18px;padding:12px;text-align:left;cursor:pointer;box-shadow:0 6px 15px rgba(15,23,42,.05);transition:.14s ease;}
      .studio-slide-card:hover{transform:translateY(-2px);border-color:#38bdf8;box-shadow:0 12px 24px rgba(15,76,129,.14);}
      .studio-slide-card.active{border:3px solid #0f4c81;background:#eff6ff;}
      .studio-slide-card small{display:block;color:#64748b;font-weight:800;font-size:.73rem;margin-bottom:6px;}
      .studio-chip{display:inline-flex;border-radius:999px;padding:3px 9px;font-size:.72rem;font-weight:900;background:#e0f2fe;color:#075985;margin-bottom:7px;}
      .studio-chip.patient{background:#dcfce7;color:#166534;}.studio-chip.intro{background:#ede9fe;color:#5b21b6;}
      .studio-slide-card b{display:block;color:#0f172a;font-size:.9rem;line-height:1.25;margin-bottom:5px;}.studio-slide-card span.text{display:block;color:#64748b;font-size:.78rem;line-height:1.3;}
      .studio-center{display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:12px;background:#dbeafe;border-radius:24px;border:1px solid #bfdbfe;overflow:hidden;}
      .studio-canvas-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:rgba(255,255,255,.72);border-bottom:1px solid rgba(148,163,184,.35);}
      .studio-canvas-toolbar strong{color:#082f49}.studio-canvas-toolbar span{color:#64748b;font-weight:800;font-size:.84rem;}
      .studio-canvas-wrap{display:grid;place-items:center;min-height:0;padding:24px;overflow:auto;}
      .studio-canvas{width:min(960px,92%);aspect-ratio:16/9;background:white;border-radius:26px;box-shadow:0 30px 75px rgba(15,23,42,.2);padding:54px;display:flex;flex-direction:column;justify-content:center;position:relative;overflow:hidden;border:1px solid #e2e8f0;}
      .studio-canvas.nurse{background:linear-gradient(135deg,#eff6ff,#fff)}.studio-canvas.patient{background:linear-gradient(135deg,#ecfdf5,#fff)}.studio-canvas.intro{background:linear-gradient(135deg,#eef2ff,#fff)}
      .studio-canvas::after{content:'';position:absolute;right:-90px;top:-90px;width:250px;height:250px;border-radius:50%;background:rgba(37,99,235,.13);}
      .canvas-speaker{position:relative;z-index:1;text-transform:uppercase;letter-spacing:.15em;font-weight:900;color:#0f4c81;font-size:clamp(.82rem,1.4vw,1.1rem);margin-bottom:18px;}
      .studio-canvas.patient .canvas-speaker{color:#166534}.studio-canvas.intro .canvas-speaker{color:#5b21b6;}
      .canvas-main{position:relative;z-index:1;font-weight:900;color:#0f172a;font-size:clamp(2rem,4vw,4.6rem);line-height:1.08;letter-spacing:-.02em;}
      .canvas-sub{position:relative;z-index:1;margin-top:20px;color:#475569;font-weight:800;font-size:clamp(1rem,1.6vw,1.45rem);}
      .canvas-file{position:absolute;left:26px;bottom:22px;z-index:1;background:#dbeafe;color:#1e3a8a;border-radius:999px;padding:8px 12px;font-size:.82rem;font-weight:900;}
      .studio-vitals{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:18px;position:relative;z-index:1;}.studio-vital{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:10px;text-align:center;font-weight:900;color:#0f4c81;font-size:.85rem}.studio-vital b{display:block;color:#0f172a;font-size:1.22rem;margin-top:3px;}
      .studio-bottom{display:flex;align-items:center;justify-content:center;padding:10px 14px;background:rgba(255,255,255,.72);border-top:1px solid rgba(148,163,184,.35);}
      .editor.studio-mode .slide-nav{display:flex!important;gap:9px!important;flex-wrap:wrap!important;align-items:center!important;}
      .editor.studio-mode .slide-nav button{border:0!important;border-radius:13px!important;background:#0f4c81!important;color:#fff!important;font-weight:900!important;padding:10px 13px!important;box-shadow:0 8px 18px rgba(15,76,129,.16)!important;}
      .editor.studio-mode .slide-nav .danger{background:#dc2626!important;}
      .studio-right{display:grid;grid-template-rows:auto minmax(0,1fr) auto;}
      .studio-right-scroll{overflow:auto;min-height:0;padding:14px;background:#fff;}
      .editor.studio-mode .editor-grid{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;padding:0!important;align-items:start!important;}
      .editor.studio-mode .editor-grid label{font-size:.72rem!important;letter-spacing:.08em!important;text-transform:uppercase!important;font-weight:900!important;color:#475569!important;padding:10px 0 0!important;}
      .editor.studio-mode input,.editor.studio-mode textarea,.editor.studio-mode select{width:100%!important;border:1px solid #cbd5e1!important;border-radius:14px!important;padding:11px 12px!important;background:#f8fafc!important;color:#0f172a!important;font-size:.95rem!important;}
      .editor.studio-mode textarea{min-height:82px!important;resize:vertical!important;}.editor.studio-mode .slide-text{min-height:160px!important;background:#fff7ed!important;border-color:#fed7aa!important;}.editor.studio-mode .audio-text{min-height:140px!important;background:#eff6ff!important;border-color:#bfdbfe!important;}.editor.studio-mode .small-json{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;font-size:.84rem!important;min-height:90px!important;}
      .editor.studio-mode .slide-preview{display:none!important;}.editor.studio-mode .audio-file{display:inline-flex!important;background:#dbeafe!important;color:#1e3a8a!important;border-radius:999px!important;padding:8px 11px!important;font-weight:900!important;width:max-content!important;}
      .studio-status{padding:10px 14px;border-top:1px solid #e2e8f0;color:#0f4c81;font-weight:900;background:#f8fafc;min-height:42px;}
      .studio-hidden{display:none!important;}
      body.fullscreen-mode .fullscreen-stage{min-height:100dvh!important;height:100dvh!important;padding:max(12px,env(safe-area-inset-top)) 12px calc(112px + env(safe-area-inset-bottom))!important;align-items:center!important;justify-content:center!important;}body.presentation-auto-playing .fs-slide .slide-audio-btn{opacity:.55!important;pointer-events:none!important;filter:grayscale(.15)!important;}
      @media(max-width:1180px){.studio-shell{grid-template-columns:250px minmax(360px,1fr) 340px}.studio-canvas{padding:36px}.canvas-main{font-size:clamp(1.7rem,4vw,3.6rem)}}
      @media(max-width:900px){.editor.studio-mode.show{grid-template-rows:auto minmax(0,1fr)!important}.studio-topbar{align-items:flex-start;flex-direction:column}.studio-top-actions{width:100%;overflow:auto}.studio-shell{grid-template-columns:1fr;grid-template-rows:220px minmax(360px,1fr) minmax(420px,1fr);overflow:auto}.studio-left,.studio-center,.studio-right{min-height:0}.studio-slide-list{flex-direction:row;overflow-x:auto}.studio-slide-card{min-width:220px}.studio-canvas{width:96%;padding:28px}.studio-vitals{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:640px){.studio-shell{padding:8px;gap:8px}.studio-canvas{border-radius:20px;padding:22px}.canvas-main{font-size:clamp(1.45rem,7vw,2.4rem)}.studio-top-actions .editor-actions button{font-size:.78rem;padding:9px!important}.controls{width:94vw!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;border-radius:28px!important;justify-content:space-between!important}.controls button{font-size:.78rem!important;padding:10px!important}.controls .audio-control{max-width:150px!important;white-space:normal!important}}
    `;
    document.head.appendChild(style);
  }

  function stripTags(value) { return String(value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
  function truncate(value, length = 105) { const text = String(value || ''); return text.length > length ? `${text.slice(0, length - 1)}…` : text; }
  function getActiveSlideIndex() { const slides = Array.from(document.querySelectorAll('.fs-slide')); const index = slides.findIndex(slide => slide.classList.contains('active')); return index >= 0 ? index : 0; }
  function getLine(patient, index) { if (!patient || index <= 0) return null; const raw = (patient.lines || [])[index - 1]; return window.normalizeLine ? normalizeLine(raw, index - 1, patient) : raw; }
  function stableAudioPath(slideIndex = getActiveSlideIndex()) {
    const patient = window.getPatient?.();
    if (!patient) return '';
    const folder = patient.audioFolder || `patient-${patient.id}-${String(patient.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
    const file = slideIndex === 0 ? (patient.introAudioFile || 'intro.wav') : (getLine(patient, slideIndex)?.audioFile || 'missing-audio.wav');
    return `/audio/${folder}/${file}?v=${VERSION}`;
  }

  function ensureStudioUI() {
    const editor = document.getElementById('editor');
    if (!editor) return;
    if (editor.dataset.studio === '1') return;
    editor.dataset.studio = '1';
    editor.classList.add('studio-mode');

    const grid = editor.querySelector('.editor-grid');
    const actions = editor.querySelector('.editor-actions');
    const status = editor.querySelector('#editorStatus');
    const addDeleteNavs = Array.from(editor.querySelectorAll(':scope > .slide-nav'));
    const addDelete = addDeleteNavs[addDeleteNavs.length - 1];
    Array.from(editor.querySelectorAll(':scope > p.hint')).forEach((node, idx) => { if (idx > 0) node.classList.add('studio-hidden'); });

    const topbar = document.createElement('div');
    topbar.className = 'studio-topbar';
    topbar.innerHTML = `
      <div class="studio-brand"><div class="studio-mark">OS</div><div><div class="studio-title">OBE OSCE Slide Studio</div><div class="studio-subtitle" id="studioSubtitle">Edit what students see, hear, and practise.</div></div></div>
      <div class="studio-top-actions" id="studioTopActions"></div>`;

    const shell = document.createElement('div');
    shell.className = 'studio-shell';
    shell.innerHTML = `
      <aside class="studio-panel studio-left"><div class="studio-panel-head"><strong>Slides</strong><span>Visual order only. Audio filenames stay stable.</span></div><div class="studio-slide-list" id="studioSlideList"></div></aside>
      <main class="studio-center"><div class="studio-canvas-toolbar"><strong id="studioCanvasTitle">Slide canvas</strong><span id="studioCanvasMeta">Preview</span></div><div class="studio-canvas-wrap"><section id="studioCanvas" class="studio-canvas intro"></section></div><div class="studio-bottom" id="studioBottomTools"></div></main>
      <aside class="studio-panel studio-right"><div class="studio-panel-head"><strong>Inspector</strong><span>Patient, OBE, audio, and slide text</span></div><div class="studio-right-scroll" id="studioInspector"></div><div class="studio-status" id="studioStatusWrap"></div></aside>`;

    editor.prepend(shell);
    editor.prepend(topbar);
    const topActions = topbar.querySelector('#studioTopActions');
    if (actions) topActions.appendChild(actions);
    const inspector = shell.querySelector('#studioInspector');
    if (grid) inspector.appendChild(grid);
    const bottomTools = shell.querySelector('#studioBottomTools');
    if (addDelete) bottomTools.appendChild(addDelete);
    const statusWrap = shell.querySelector('#studioStatusWrap');
    if (status) statusWrap.appendChild(status);
  }

  function renderStudioSlides() {
    ensureStudioUI();
    const patient = window.getEditedPatient?.();
    const list = document.getElementById('studioSlideList');
    if (!patient || !list) return;
    const current = typeof editorSlideIndex === 'number' ? editorSlideIndex : 0;
    const cards = [`<button type="button" class="studio-slide-card ${current === 0 ? 'active' : ''}" onclick="selectEditorSlide(0)"><small>slide-000 · ${escapeHtml(patient.introAudioFile || 'intro.wav')}</small><span class="studio-chip intro">Intro</span><b>${escapeHtml(patient.name || 'Patient intro')}</b><span class="text">${escapeHtml(truncate(patient.scenario || '', 120))}</span></button>`];
    (patient.lines || []).forEach((raw, index) => {
      const line = window.normalizeLine ? normalizeLine(raw, index, patient) : raw;
      const n = index + 1;
      const speakerLabel = line.speaker === 'patient' ? 'Patient' : 'Practical nurse';
      cards.push(`<button type="button" class="studio-slide-card ${current === n ? 'active' : ''}" onclick="selectEditorSlide(${n})"><small>slide-${pad(n)} · ${escapeHtml(line.audioFile || '')}</small><span class="studio-chip ${line.speaker === 'patient' ? 'patient' : ''}">${speakerLabel}</span><b>${escapeHtml(line.label || line.id || `Slide ${n}`)}</b><span class="text">${escapeHtml(truncate(stripTags(line.text), 120))}</span></button>`);
    });
    list.innerHTML = cards.join('');
  }

  function renderStudioCanvas() {
    ensureStudioUI();
    const patient = window.getEditedPatient?.();
    const canvas = document.getElementById('studioCanvas');
    const title = document.getElementById('studioCanvasTitle');
    const meta = document.getElementById('studioCanvasMeta');
    const subtitle = document.getElementById('studioSubtitle');
    if (!patient || !canvas) return;
    const current = typeof editorSlideIndex === 'number' ? editorSlideIndex : 0;
    if (subtitle) subtitle.textContent = `Patient ${patient.id} — ${patient.name || 'Unnamed patient'}`;

    if (current === 0) {
      const vitals = (patient.vitals || []).slice(0, 5).map(([label, value]) => `<div class="studio-vital">${escapeHtml(label)}<b>${escapeHtml(value)}</b></div>`).join('');
      canvas.className = 'studio-canvas intro';
      canvas.innerHTML = `<div class="canvas-speaker">Patient intro</div><div class="canvas-main">${escapeHtml(patient.name || 'Patient')}</div><div class="canvas-sub">${escapeHtml(patient.scenario || '')}</div><div class="studio-vitals">${vitals}</div><div class="canvas-file">${escapeHtml(patient.introAudioFile || 'intro.wav')}</div>`;
      if (title) title.textContent = 'slide-000 — Patient intro';
      if (meta) meta.textContent = patient.introAudioFile || 'intro.wav';
      return;
    }

    const line = window.normalizeLine ? normalizeLine((patient.lines || [])[current - 1], current - 1, patient) : (patient.lines || [])[current - 1];
    if (!line) return;
    const speakerLabel = line.speaker === 'patient' ? 'Patient' : 'Practical nurse';
    const textFromField = document.getElementById('editorSlideText')?.value || line.text || '';
    canvas.className = `studio-canvas ${line.speaker === 'patient' ? 'patient' : 'nurse'}`;
    canvas.innerHTML = `<div class="canvas-speaker">${escapeHtml(speakerLabel)} · ${escapeHtml(line.label || line.id || '')}</div><div class="canvas-main">${textFromField}</div><div class="canvas-file">${escapeHtml(line.audioFile || '')}</div>`;
    if (title) title.textContent = `slide-${pad(current)} — ${line.label || line.id || 'Slide'}`;
    if (meta) meta.textContent = line.audioFile || '';
  }

  function renderStudio() { renderStudioSlides(); renderStudioCanvas(); applyEnglishLabels(); }

  function selectEditorSlideStudio(slideNumber) {
    try { window.saveCurrentSlideToMemory?.(); window.savePatientMetaToMemory?.(); }
    catch (error) { window.setEditorStatus?.(error.message); return; }
    editorSlideIndex = Number(slideNumber) || 0;
    window.populateSlideSelect?.();
    window.loadSlideIntoEditor?.();
    renderStudio();
  }

  function stopDirectAudio() { if (directAudio) { directAudio.pause(); directAudio.currentTime = 0; directAudio = null; } }
  function showAudioError(path) {
    const activeSlide = document.querySelector('.fs-slide.active');
    const button = activeSlide?.querySelector('.slide-audio-btn');
    if (button) { button.textContent = 'Audio could not start. Generate audio, tap Next, or reload.'; button.classList.add('audio-missing'); }
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
    if (directAutoPlay) { setAutoPlaying(false); stopDirectAudio(); if (button) button.textContent = PLAY_FULL_TEXT; return; }
    setAutoPlaying(true); if (button) button.textContent = STOP_TEXT;
    const playThenNext = () => {
      if (!directAutoPlay) return;
      const slides = Array.from(document.querySelectorAll('.fs-slide'));
      const currentIndex = getActiveSlideIndex();
      window.playCurrentAudio(() => {
        if (!directAutoPlay) return;
        if (currentIndex >= slides.length - 1) { setAutoPlaying(false); stopDirectAudio(); if (button) button.textContent = PLAY_FULL_TEXT; return; }
        window.nextSlide?.();
        setTimeout(playThenNext, 450);
      });
    };
    playThenNext();
  };

  const originalGetAudioPath = window.getAudioPath;
  if (typeof originalGetAudioPath === 'function') {
    window.getAudioPath = function getStableAudioPath(patient, slideNumber) {
      const file = Number(slideNumber) === 0 ? (patient.introAudioFile || 'intro.wav') : (window.normalizeLine ? normalizeLine((patient.lines || [])[Number(slideNumber) - 1], Number(slideNumber) - 1, patient).audioFile : 'missing-audio.wav');
      const folder = patient.audioFolder || `patient-${patient.id}-${String(patient.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
      return `/audio/${folder}/${file}?v=${VERSION}`;
    };
  }

  const originalExitSlides = window.exitSlides;
  if (typeof originalExitSlides === 'function') {
    window.exitSlides = function exitSlidesWithAudioCleanup() { setAutoPlaying(false); stopDirectAudio(); originalExitSlides(); };
  }

  const originalOpenEditor = window.openEditor;
  const originalCloseEditor = window.closeEditor;
  const originalLoadPatientIntoEditor = window.loadPatientIntoEditor;
  const originalPopulateSlideSelect = window.populateSlideSelect;
  const originalLoadSlideIntoEditor = window.loadSlideIntoEditor;
  const originalMarkEditorDirty = window.markEditorDirty;
  const originalSaveEditor = window.saveEditor;
  const originalChangeEditorPatient = window.changeEditorPatient;
  const originalChangeEditorSlide = window.changeEditorSlide;
  const originalAddSlideAfterCurrent = window.addSlideAfterCurrent;
  const originalDeleteCurrentSlide = window.deleteCurrentSlide;
  const originalPreviousEditorSlide = window.previousEditorSlide;
  const originalNextEditorSlide = window.nextEditorSlide;

  window.openEditor = function openStudioEditor() { originalOpenEditor?.(); injectStudioStyles(); ensureStudioUI(); document.body.classList.add('studio-open'); renderStudio(); };
  window.closeEditor = function closeStudioEditor() { document.body.classList.remove('studio-open'); originalCloseEditor?.(); };
  window.loadPatientIntoEditor = function loadStudioPatient() { originalLoadPatientIntoEditor?.(); renderStudio(); };
  window.populateSlideSelect = function populateStudioSlideSelect() { originalPopulateSlideSelect?.(); renderStudioSlides(); };
  window.loadSlideIntoEditor = function loadStudioSlide() { originalLoadSlideIntoEditor?.(); renderStudio(); };
  window.markEditorDirty = function markStudioDirty() { originalMarkEditorDirty?.(); renderStudioCanvas(); renderStudioSlides(); };
  window.changeEditorPatient = function changeStudioPatient() { originalChangeEditorPatient?.(); renderStudio(); };
  window.changeEditorSlide = function changeStudioSlide() { originalChangeEditorSlide?.(); renderStudio(); };
  window.saveEditor = async function saveStudioEditor(regenerateAudio) { await originalSaveEditor?.(regenerateAudio); renderStudio(); };
  window.addSlideAfterCurrent = function addStudioSlide() { originalAddSlideAfterCurrent?.(); renderStudio(); };
  window.deleteCurrentSlide = function deleteStudioSlide() { originalDeleteCurrentSlide?.(); renderStudio(); };
  window.previousEditorSlide = function previousStudioSlide() { originalPreviousEditorSlide?.(); renderStudio(); };
  window.nextEditorSlide = function nextStudioSlide() { originalNextEditorSlide?.(); renderStudio(); };
  window.selectEditorSlide = selectEditorSlideStudio;
  window.renderEditorSlideList = renderStudioSlides;

  injectStudioStyles();
  applyEnglishLabels();
})();
