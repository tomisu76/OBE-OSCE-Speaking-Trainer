(() => {
  const VERSION = 'studio-simplifier-20260528a';

  function currentSlideIndex() {
    try { return typeof editorSlideIndex === 'number' ? editorSlideIndex : 0; }
    catch { return 0; }
  }

  function cleanText(value) {
    if (typeof window.makeAudioText === 'function') return window.makeAudioText(value || '');
    return String(value || '')
      .replace(/<span[^>]*class=["']vital-tag["'][^>]*>(.*?)<\/span>/gi, '$1 ')
      .replace(/<[^>]+>/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findLabel(grid, text) {
    return Array.from(grid.querySelectorAll('label')).find(label => label.textContent.trim() === text) || null;
  }

  function pair(grid, text) {
    const label = findLabel(grid, text);
    if (!label) return null;
    return { label, control: label.nextElementSibling };
  }

  function appendPair(section, item) {
    if (!item || !item.label || !item.control) return;
    section.appendChild(item.label);
    section.appendChild(item.control);
  }

  function ensureCopyButton(audioControl) {
    if (!audioControl || document.getElementById('copyCleanSlideTextToAudio')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'studio-audio-helper';
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'copyCleanSlideTextToAudio';
    button.className = 'studio-copy-audio';
    button.textContent = 'Copy clean slide text to audio text';
    button.addEventListener('click', () => {
      if (currentSlideIndex() === 0) return;
      const slideText = document.getElementById('editorSlideText');
      const audioText = document.getElementById('editorAudioText');
      if (!slideText || !audioText) return;
      audioText.value = cleanText(slideText.value);
      audioText.dispatchEvent(new Event('input', { bubbles: true }));
    });
    wrapper.appendChild(button);
    audioControl.parentNode.insertBefore(wrapper, audioControl);
  }

  function syncIntroFields() {
    const isIntro = currentSlideIndex() === 0;
    const slideText = document.getElementById('editorSlideText');
    const audioText = document.getElementById('editorAudioText');
    const scenario = document.getElementById('editorScenario');
    const introAudio = document.getElementById('editorIntroAudio');
    const copyButton = document.getElementById('copyCleanSlideTextToAudio');

    if (copyButton) copyButton.disabled = isIntro;
    if (!isIntro || !slideText || !audioText || !scenario || !introAudio) return;

    slideText.readOnly = false;
    audioText.readOnly = false;
    slideText.classList.remove('readonly-note');
    audioText.classList.remove('readonly-note');
    slideText.value = scenario.value || '';
    audioText.value = introAudio.value || '';

    slideText.oninput = () => {
      scenario.value = slideText.value;
      window.markEditorDirty?.();
    };
    audioText.oninput = () => {
      introAudio.value = audioText.value;
      window.markEditorDirty?.();
    };
  }

  function simplifyInspector() {
    const inspector = document.getElementById('studioInspector');
    const grid = inspector?.querySelector('.editor-grid');
    if (!inspector || !grid) return;

    const head = inspector.closest('.studio-right')?.querySelector('.studio-panel-head');
    if (head) {
      const title = head.querySelector('strong');
      const subtitle = head.querySelector('span');
      if (title) title.textContent = 'Slide editor';
      if (subtitle) subtitle.textContent = 'Edit slide text and audio text. Advanced patient data is hidden below.';
    }

    const audioLabel = findLabel(grid, 'Text for audio') || findLabel(grid, 'Text spoken by audio');
    if (audioLabel) audioLabel.textContent = 'Text spoken by audio';

    const scenarioLabel = findLabel(grid, 'Scenario / intro text');
    if (scenarioLabel) scenarioLabel.textContent = 'Scenario shown on intro slide';

    const introAudioLabel = findLabel(grid, 'Intro audio text');
    if (introAudioLabel) introAudioLabel.textContent = 'Intro audio text';

    const audioText = document.getElementById('editorAudioText');
    if (audioText) ensureCopyButton(audioText);

    if (!grid.dataset.simplified) {
      grid.dataset.simplified = '1';

      const basic = document.createElement('section');
      basic.className = 'studio-basic-fields';
      basic.innerHTML = '<h3>Basic slide editing</h3><p class="studio-field-note">Most teachers only need these fields.</p>';

      const advanced = document.createElement('details');
      advanced.className = 'studio-advanced-fields';
      advanced.innerHTML = '<summary>Advanced settings</summary><div class="studio-advanced-grid"></div>';
      const advancedGrid = advanced.querySelector('.studio-advanced-grid');

      const basicPairs = [
        pair(grid, 'Slide'),
        pair(grid, 'Audio file'),
        pair(grid, 'Speaker'),
        pair(grid, 'Text shown on slide'),
        pair(grid, 'Text spoken by audio'),
        pair(grid, 'Preview')
      ];
      const advancedPairs = [
        pair(grid, 'Patient'),
        pair(grid, 'Name'),
        pair(grid, 'Course / Week'),
        pair(grid, 'OBE metadata JSON'),
        pair(grid, 'Scenario shown on intro slide'),
        pair(grid, 'Intro audio text'),
        pair(grid, 'Vital signs JSON')
      ];

      basicPairs.forEach(item => appendPair(basic, item));
      advancedPairs.forEach(item => appendPair(advancedGrid, item));
      grid.replaceChildren(basic, advanced);
    }

    syncIntroFields();
  }

  function injectSimplifierStyles() {
    if (document.getElementById('studio-simplifier-styles')) return;
    const style = document.createElement('style');
    style.id = 'studio-simplifier-styles';
    style.textContent = `
      .editor.studio-mode .studio-right{grid-template-rows:auto minmax(0,1fr) auto;}
      .studio-basic-fields,.studio-advanced-grid{display:grid;grid-template-columns:1fr;gap:8px;}
      .studio-basic-fields h3{margin:0 0 2px;color:#082f49;font-size:1.05rem;}
      .studio-field-note{margin:0 0 8px;color:#64748b;font-size:.84rem;font-weight:700;}
      .studio-advanced-fields{margin-top:16px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;padding:10px;}
      .studio-advanced-fields summary{cursor:pointer;font-weight:900;color:#475569;}
      .studio-advanced-grid{margin-top:10px;}
      .studio-audio-helper{margin:2px 0 0;}
      .studio-copy-audio{border:0;border-radius:999px;background:#0f4c81;color:#fff;font-weight:900;padding:9px 12px;cursor:pointer;}
      .studio-copy-audio:disabled{opacity:.45;cursor:not-allowed;}
      .editor.studio-mode #editorAudioFile{user-select:text;}
    `;
    document.head.appendChild(style);
  }

  function afterRender() {
    injectSimplifierStyles();
    setTimeout(simplifyInspector, 0);
  }

  const wrap = (name) => {
    const original = window[name];
    if (typeof original !== 'function' || original.__studioSimplified) return;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      afterRender();
      return result;
    };
    wrapped.__studioSimplified = true;
    window[name] = wrapped;
  };

  ['openEditor','loadPatientIntoEditor','populateSlideSelect','loadSlideIntoEditor','markEditorDirty','changeEditorPatient','changeEditorSlide','previousEditorSlide','nextEditorSlide','addSlideAfterCurrent','deleteCurrentSlide'].forEach(wrap);

  window.copyCleanSlideTextToAudio = () => {
    const button = document.getElementById('copyCleanSlideTextToAudio');
    if (button) button.click();
  };

  injectSimplifierStyles();
  afterRender();
  console.log(`Loaded ${VERSION}`);
})();
