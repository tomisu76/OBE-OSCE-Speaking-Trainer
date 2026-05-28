(() => {
  const VERSION = 'studio-simplifier-20260528c';

  function currentSlideIndex() {
    const selectValue = document.getElementById('editorSlide')?.value;
    if (selectValue !== undefined && selectValue !== '') return Number(selectValue) || 0;
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

  function fieldRoot(control) {
    if (!control) return null;
    const nav = control.closest?.('.slide-nav');
    if (nav?.contains(control)) return nav;
    if (control.id === 'editorAudioFile' && control.parentElement) return control.parentElement;
    return control;
  }

  function labelBeforeRoot(root) {
    if (!root) return null;
    let node = root.previousElementSibling;
    while (node && node.tagName !== 'LABEL') node = node.previousElementSibling;
    return node || null;
  }

  function relabel(id, text) {
    const control = document.getElementById(id);
    const label = labelBeforeRoot(fieldRoot(control));
    if (label) label.textContent = text;
    return label;
  }

  function fieldById(id, text) {
    const control = document.getElementById(id);
    const root = fieldRoot(control);
    const label = relabel(id, text);
    if (!control || !root || !label) return null;
    return { label, control: root };
  }

  function appendField(section, item) {
    if (!section || !item?.label || !item?.control) return;
    section.appendChild(item.label);
    section.appendChild(item.control);
  }

  function ensureAudioGroup(audioText) {
    if (!audioText) return null;
    let group = document.getElementById('studioAudioTextGroup');
    if (!group) {
      group = document.createElement('div');
      group.id = 'studioAudioTextGroup';
      group.className = 'studio-audio-group';
      audioText.parentNode.insertBefore(group, audioText);
      group.appendChild(audioText);
    }
    let button = document.getElementById('copyCleanSlideTextToAudio');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.id = 'copyCleanSlideTextToAudio';
      button.className = 'studio-copy-audio';
      button.textContent = 'Copy clean slide text to audio text';
      button.addEventListener('click', () => {
        if (currentSlideIndex() === 0) return;
        const slideText = document.getElementById('editorSlideText');
        const audio = document.getElementById('editorAudioText');
        if (!slideText || !audio) return;
        audio.value = cleanText(slideText.value);
        audio.dispatchEvent(new Event('input', { bubbles: true }));
        window.markEditorDirty?.();
      });
      group.prepend(button);
    }
    return group;
  }

  function syncIntroFields() {
    const isIntro = currentSlideIndex() === 0;
    const slideText = document.getElementById('editorSlideText');
    const audioText = document.getElementById('editorAudioText');
    const scenario = document.getElementById('editorScenario');
    const introAudio = document.getElementById('editorIntroAudio');
    const copyButton = document.getElementById('copyCleanSlideTextToAudio');

    if (copyButton) copyButton.disabled = isIntro;
    if (!slideText || !audioText) return;

    if (isIntro) {
      if (scenario && slideText.value !== scenario.value) slideText.value = scenario.value || '';
      if (introAudio && audioText.value !== introAudio.value) audioText.value = introAudio.value || '';
      slideText.readOnly = false;
      audioText.readOnly = false;
      slideText.classList.remove('readonly-note');
      audioText.classList.remove('readonly-note');
      slideText.oninput = () => {
        if (scenario) scenario.value = slideText.value;
        window.markEditorDirty?.();
      };
      audioText.oninput = () => {
        if (introAudio) introAudio.value = audioText.value;
        window.markEditorDirty?.();
      };
      return;
    }

    slideText.oninput = () => window.markEditorDirty?.();
    audioText.oninput = () => window.markEditorDirty?.();
  }

  function simplifyInspector() {
    const inspector = document.getElementById('studioInspector');
    const grid = inspector?.querySelector('.editor-grid');
    if (!inspector || !grid) return;

    const requiredIds = ['editorSlide', 'editorAudioFile', 'editorSpeaker', 'editorSlideText', 'editorAudioText'];
    if (requiredIds.some(id => !document.getElementById(id))) {
      console.warn('Studio simplifier skipped because core editor fields are missing. Reload the page to rebuild the editor DOM.');
      return;
    }

    const head = inspector.closest('.studio-right')?.querySelector('.studio-panel-head');
    if (head) {
      const title = head.querySelector('strong');
      const subtitle = head.querySelector('span');
      if (title) title.textContent = 'Slide editor';
      if (subtitle) subtitle.textContent = 'Edit slide text and audio text. Advanced patient data is hidden below.';
    }

    relabel('editorScenario', 'Scenario shown on intro slide');
    relabel('editorAudioText', 'Text spoken by audio');
    relabel('editorSlideText', 'Text shown on slide');

    const audioText = document.getElementById('editorAudioText');
    const audioGroup = ensureAudioGroup(audioText);

    if (!grid.dataset.simplified) {
      grid.dataset.simplified = '1';

      const basic = document.createElement('section');
      basic.className = 'studio-basic-fields';
      basic.innerHTML = '<h3>Basic slide editing</h3><p class="studio-field-note">Most teachers only need these fields.</p>';

      const advanced = document.createElement('details');
      advanced.className = 'studio-advanced-fields';
      advanced.innerHTML = '<summary>Advanced settings</summary><div class="studio-advanced-grid"></div>';
      const advancedGrid = advanced.querySelector('.studio-advanced-grid');

      appendField(basic, fieldById('editorSlide', 'Slide'));
      appendField(basic, fieldById('editorAudioFile', 'Audio file'));
      appendField(basic, fieldById('editorSpeaker', 'Speaker'));
      appendField(basic, fieldById('editorSlideText', 'Text shown on slide'));
      const audioLabel = relabel('editorAudioText', 'Text spoken by audio');
      if (audioLabel && audioGroup) {
        basic.appendChild(audioLabel);
        basic.appendChild(audioGroup);
      }
      appendField(basic, fieldById('editorPreview', 'Preview'));

      appendField(advancedGrid, fieldById('editorPatient', 'Patient'));
      appendField(advancedGrid, fieldById('editorName', 'Name'));
      appendField(advancedGrid, fieldById('editorCourse', 'Course / Week'));
      appendField(advancedGrid, fieldById('editorObe', 'OBE metadata JSON'));
      appendField(advancedGrid, fieldById('editorScenario', 'Scenario shown on intro slide'));
      appendField(advancedGrid, fieldById('editorIntroAudio', 'Intro audio text'));
      appendField(advancedGrid, fieldById('editorVitals', 'Vital signs JSON'));

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
      .studio-audio-group{display:grid;grid-template-columns:1fr;gap:8px;}
      .studio-copy-audio{border:0;border-radius:999px;background:#0f4c81;color:#fff;font-weight:900;padding:9px 12px;cursor:pointer;justify-self:start;}
      .studio-copy-audio:disabled{opacity:.45;cursor:not-allowed;}
      .editor.studio-mode #editorAudioFile{user-select:text;}
      .editor.studio-mode #editorSlideText:not([readonly]),.editor.studio-mode #editorAudioText:not([readonly]){background:#fff!important;}
    `;
    document.head.appendChild(style);
  }

  function afterRender() {
    injectSimplifierStyles();
    setTimeout(simplifyInspector, 0);
    setTimeout(simplifyInspector, 80);
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

  window.copyCleanSlideTextToAudio = () => document.getElementById('copyCleanSlideTextToAudio')?.click();

  injectSimplifierStyles();
  afterRender();
  console.log(`Loaded ${VERSION}`);
})();
