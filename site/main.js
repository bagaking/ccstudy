/**
 * CODEBASE-TO-COURSE — COMPLETE JS ENGINE
 * Copy this file verbatim into the course output directory.
 * Never regenerate it. It handles all interactivity generically.
 *
 * Engines included:
 *  - Navigation & progress bar
 *  - Scroll-triggered reveal animations
 *  - Keyboard navigation
 *  - Glossary tooltips
 *  - Quiz (multiple-choice & scenario)
 *  - Drag-and-drop matching
 *  - Group chat animation
 *  - Data flow / message flow animation
 *  - Architecture diagram
 *  - "Spot the bug" challenge
 *  - Layer toggle
 */
(function () {
  'use strict';

  /* ── HELPERS ──────────────────────────────────────────────── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  const IS_ZH = document.documentElement.lang.toLowerCase().startsWith('zh');
  const I18N = IS_ZH ? {
    quizPickFirst: '请先选择一个答案',
    quizCorrectPrefix: '<strong>答对了！</strong> ',
    quizWrongPrefix: '<strong>还差一点。</strong> ',
    dndDropHere: '拖到这里',
    chatProgress: (current, total) => `${current} / ${total} 条消息`,
    flowProgress: (step, total) => `第 ${step} 步 / 共 ${total} 步`,
    flowInitial: '点击“下一步”开始',
    bugFoundPrefix: '<strong>找到了！</strong> ',
    bugFallback: '不是这一行，再看看更可能导致问题的地方...',
    moduleFallback: '未命名模块',
    navDotAria: (index, title) => `模块 ${index}：${title}`,
    metricNA: '-',
    viewerIdle: '点击页面中的文件引用即可加载源码。',
    viewerLoading: '正在加载源码...',
    viewerLoadFailed: '源码加载失败：',
    viewerButton: '查看源码',
    viewerGithub: '在 GitHub 打开',
  } : {
    quizPickFirst: 'Pick an answer first!',
    quizCorrectPrefix: '<strong>Exactly!</strong> ',
    quizWrongPrefix: '<strong>Not quite.</strong> ',
    dndDropHere: 'Drop here',
    chatProgress: (current, total) => `${current} / ${total} messages`,
    flowProgress: (step, total) => `Step ${step} / ${total}`,
    flowInitial: 'Click "Next Step" to begin',
    bugFoundPrefix: '<strong>Found it!</strong> ',
    bugFallback: 'Not this line — keep looking...',
    moduleFallback: 'Untitled module',
    navDotAria: (index, title) => `Module ${index}: ${title}`,
    metricNA: '-',
    viewerIdle: 'Select a file reference to load source.',
    viewerLoading: 'Loading source...',
    viewerLoadFailed: 'Failed to load source: ',
    viewerButton: 'View Source',
    viewerGithub: 'Open on GitHub',
  };

  const body = document.body;
  const modeButtons = $$('.mode-btn');
  const chapterRail = $('#chapter-rail');
  const chapterList = $('#chapter-list');
  const contentsBtn = $('#contents-btn');
  const contentsCloseBtn = $('#contents-close');
  const railScrim = $('#rail-scrim');
  const viewerShell = $('#code-viewer-shell');
  const viewerBackdrop = $('#code-viewer-backdrop');
  const viewerClose = $('#code-viewer-close');
  const viewerPathEl = $('#code-viewer-path');
  const viewerStatusEl = $('#code-viewer-status');
  const viewerCodeEl = $('#code-viewer-code');
  const viewerGithubLink = $('#code-viewer-github');
  const heroDossier = $('#hero-dossier');
  const heroStartReading = $('#hero-start-reading');
  const heroOpenViewer = $('#hero-open-viewer');

  const REPO_OWNER = 'bagaking';
  const REPO_NAME = 'ccstudy';
  const SOURCE_BRANCHES = ['main', 'master'];
  const prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeSourcePath(rawPath) {
    if (!rawPath) return null;
    let path = String(rawPath).trim();
    path = path.replace(/^`|`$/g, '');
    path = path.replace(/^\.\//, '');
    path = path.replace(/^\/+/, '');
    path = path.replace(/[),.;:]+$/, '');

    if (path.startsWith('source/')) return path;
    if (path.startsWith('claude-code-source/')) return `source/${path}`;
    if (path.startsWith('src/') || path.startsWith('vendor/') || path.startsWith('stubs/')) {
      return `source/claude-code-source/${path}`;
    }
    return null;
  }

  function toRawUrl(path, branch) {
    return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${branch}/${path}`;
  }

  function toBlobUrl(path, branch) {
    return `https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${branch}/${path}`;
  }

  function toSearchUrl(path) {
    return `https://github.com/${REPO_OWNER}/${REPO_NAME}/search?q=${encodeURIComponent(path)}&type=code`;
  }

  function parseLineRange(rawText) {
    if (!rawText) return null;
    const text = String(rawText);
    const patterns = [
      /lines?\s*~?\s*(\d+)\s*[-–]\s*(\d+)/i,
      /第\s*~?\s*(\d+)\s*[-–]\s*(\d+)\s*行/u,
      /第\s*(\d+)\s*行/u,
      /line\s*(\d+)/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (!m) continue;
      const start = Number(m[1]);
      const end = m[2] ? Number(m[2]) : start;
      if (Number.isFinite(start) && Number.isFinite(end)) {
        return { start, end };
      }
    }
    return null;
  }

  function toLocalSourceUrl(path) {
    return IS_ZH ? `../${path}` : path;
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    return res.text();
  }

  async function fetchSource(path) {
    try {
      const text = await fetchText(toLocalSourceUrl(path));
      return { text, source: 'local' };
    } catch {}

    for (const branch of SOURCE_BRANCHES) {
      try {
        const text = await fetchText(toRawUrl(path, branch));
        return { text, source: branch };
      } catch {}
    }
    throw new Error('404');
  }

  function renderCodeLines(text, lineRange) {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    viewerCodeEl.innerHTML = lines.map((line, idx) => {
      const lineNo = idx + 1;
      const active = lineRange && lineNo >= lineRange.start && lineNo <= lineRange.end;
      return `<span class="code-viewer-line${active ? ' active' : ''}" data-line="${lineNo}">${highlightCode(line)}</span>`;
    }).join('');

    if (lineRange) {
      const target = viewerCodeEl.querySelector(`.code-viewer-line[data-line="${lineRange.start}"]`);
      if (target) target.scrollIntoView({ block: 'center' });
    }
  }

  function highlightCode(line) {
    let comment = '';
    let code = line;
    const commentIdx = line.indexOf('//');
    if (commentIdx >= 0) {
      code = line.slice(0, commentIdx);
      comment = line.slice(commentIdx);
    }

    const stringStore = [];
    let html = escapeHtml(code).replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, (m) => {
      const key = `__STR_${stringStore.length}__`;
      stringStore.push(`<span class="code-string">${m}</span>`);
      return key;
    });

    html = html.replace(/\b(import|export|from|const|let|var|if|else|return|await|async|for|of|function|class|new|try|catch|throw|extends|type|interface)\b/g, '<span class="code-keyword">$1</span>');
    html = html.replace(/([A-Za-z_$][\w$]*)(?=\()/g, '<span class="code-function">$1</span>');
    html = html.replace(/([A-Za-z_$][\w$]*)(?=\s*:)/g, '<span class="code-property">$1</span>');
    html = html.replace(/\b(\d+(?:_\d+)*(?:\.\d+)?)\b/g, '<span class="code-number">$1</span>');
    html = html.replace(/__STR_(\d+)__/g, (_m, idx) => stringStore[Number(idx)] || '');

    if (comment) {
      html += `<span class="code-comment">${escapeHtml(comment)}</span>`;
    }

    return html;
  }

  function closeViewer() {
    if (!viewerShell) return;
    viewerShell.classList.remove('open');
    viewerShell.setAttribute('aria-hidden', 'true');
    body.classList.remove('viewer-open');
  }

  async function openViewer(pathLike, lineRange) {
    const path = normalizeSourcePath(pathLike);
    if (!path || !viewerShell || !viewerPathEl || !viewerStatusEl || !viewerCodeEl || !viewerGithubLink) return;
    viewerShell.classList.add('open');
    viewerShell.setAttribute('aria-hidden', 'false');
    body.classList.add('viewer-open');
    viewerPathEl.textContent = path;
    viewerStatusEl.textContent = I18N.viewerLoading;
    viewerCodeEl.innerHTML = '';
    viewerGithubLink.textContent = I18N.viewerGithub;
    viewerGithubLink.href = toBlobUrl(path, 'main');

    try {
      const { text, source } = await fetchSource(path);
      renderCodeLines(text, lineRange);
      viewerStatusEl.textContent = `${source} · ${text.length.toLocaleString()} bytes`;
      viewerGithubLink.href = toBlobUrl(path, source === 'local' ? 'main' : source);
    } catch (err) {
      viewerStatusEl.textContent = `${I18N.viewerLoadFailed}${err instanceof Error ? err.message : 'unknown'}`;
    }
  }

  function mountSnippetButtons() {
    const refs = $$('.module-content p, .module-content li, .module-content span, .module-content h3');
    const matcher = /`([^`]+)`/g;

    refs.forEach(node => {
      if (!node || node.dataset.viewerBound === '1') return;
      if (node.closest('.translation-code, .translation-english, .chat-window, .code-viewer-shell')) return;

      const html = node.innerHTML;
      const lineRange = parseLineRange(node.textContent || '');
      if (!html.includes('`')) return;

      const nextHtml = html.replace(matcher, (_m, rawPath) => {
        const path = normalizeSourcePath(rawPath);
        if (!path) return _m;
        const attrs = lineRange ? ` data-line-start="${lineRange.start}" data-line-end="${lineRange.end}"` : '';
        return `<span class="snippet-open-btn" role="button" tabindex="0" data-open-file="${path}"${attrs} title="${path}">${path}</span>`;
      });

      if (nextHtml !== html) {
        node.innerHTML = nextHtml;
        node.dataset.viewerBound = '1';
      }
    });
  }

  function bindViewerTriggers() {
    if (heroOpenViewer) {
      const p = heroOpenViewer.dataset.openFile;
      if (p) heroOpenViewer.addEventListener('click', () => openViewer(p));
    }
    $$('[data-open-file]').forEach(el => {
      if (el === heroOpenViewer) return;
      if (el.dataset.viewerClickBound === '1') return;
      const p = el.dataset.openFile;
      if (!p) return;
      const lineStart = Number(el.dataset.lineStart || '');
      const lineEnd = Number(el.dataset.lineEnd || '');
      const lineRange = Number.isFinite(lineStart) && lineStart > 0
        ? { start: lineStart, end: Number.isFinite(lineEnd) && lineEnd >= lineStart ? lineEnd : lineStart }
        : null;
      el.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        openViewer(p, lineRange);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          openViewer(p, lineRange);
        }
      });
      el.dataset.viewerClickBound = '1';
    });
    if (viewerBackdrop) viewerBackdrop.addEventListener('click', closeViewer);
    if (viewerClose) viewerClose.addEventListener('click', closeViewer);
  }

  function setMode(mode) {
    if (!body) return;
    const next = mode === 'audit' ? 'audit' : 'story';
    body.setAttribute('data-mode', next);
    try { localStorage.setItem('ccstudy.mode', next); } catch {}
    modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === next));
  }

  function initMode() {
    let saved = 'story';
    try { saved = localStorage.getItem('ccstudy.mode') || 'story'; } catch {}
    setMode(saved);
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => setMode(btn.dataset.mode || 'story'));
    });
  }

  function toggleRail(forceOpen) {
    if (!body || !chapterRail) return;
    const willOpen = typeof forceOpen === 'boolean' ? forceOpen : !body.classList.contains('rail-open');
    body.classList.toggle('rail-open', willOpen);
    if (contentsBtn) contentsBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  }

  function initRail() {
    if (contentsBtn) contentsBtn.addEventListener('click', () => toggleRail());
    if (contentsCloseBtn) contentsCloseBtn.addEventListener('click', () => toggleRail(false));
    if (railScrim) railScrim.addEventListener('click', () => toggleRail(false));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeViewer();
        toggleRail(false);
      }
    });
  }

  /* ── NAVIGATION & PROGRESS BAR ────────────────────────────── */
  const progressBar = $('#progress-bar');
  let navDots       = [];
  const modules     = $$('.module');

  function decorateModules() {
    const themes = ['ember', 'sand', 'copper', 'clay'];
    modules.forEach((mod, i) => {
      mod.dataset.chapter = String(i + 1).padStart(2, '0');
      mod.dataset.theme = themes[i % themes.length];
    });
  }

  function updateNavState() {
    if (!body) return;
    body.classList.toggle('nav-scrolled', window.scrollY > 18);
  }

  function buildNavDots() {
    const navDotsEl = $('#nav-dots');
    if (!navDotsEl) return;
    navDotsEl.innerHTML = '';

    navDots = modules.map((mod, i) => {
      if (!mod.id) mod.id = `module-${i + 1}`;
      const title = $('.module-title', mod)?.textContent?.trim() || `${I18N.moduleFallback} ${i + 1}`;
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'nav-dot';
      dot.dataset.target = mod.id;
      dot.dataset.tooltip = title;
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', I18N.navDotAria(i + 1, title));
      dot.addEventListener('click', () => {
        mod.scrollIntoView({ behavior: 'smooth' });
        toggleRail(false);
      });
      navDotsEl.appendChild(dot);
      return dot;
    });
  }

  function updateProgress() {
    if (!progressBar) return;
    const scrollTop    = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct          = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow', Math.round(pct));
    updateNavState();
    updateNavDots();
  }

  function updateNavDots() {
    if (modules.length === 0) return;
    const scrollMid = window.scrollY + window.innerHeight / 2;
    if (scrollMid < modules[0].offsetTop) {
      navDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === 0);
        dot.classList.remove('visited');
      });
      updateChapterActive(0);
      return;
    }
    let activeIndex = 0;
    modules.forEach((mod, i) => {
      const dot = navDots[i];
      if (!dot) return;
      const top    = mod.offsetTop;
      const bottom = top + mod.offsetHeight;
      if (scrollMid >= top && scrollMid < bottom) {
        activeIndex = i;
        dot.classList.add('active');
        dot.classList.remove('visited');
      } else if (window.scrollY + window.innerHeight > top) {
        dot.classList.remove('active');
        dot.classList.add('visited');
      } else {
        dot.classList.remove('active', 'visited');
      }
    });
    updateChapterActive(activeIndex);
  }

  decorateModules();
  buildNavDots();
  window.addEventListener('scroll', () => requestAnimationFrame(updateProgress), { passive: true });
  updateProgress();

  function buildChapterList() {
    if (!chapterList) return;
    chapterList.innerHTML = '';
    modules.forEach((mod, i) => {
      const id = mod.id;
      if (!id) return;
      const title = $('.module-title', mod)?.textContent?.trim() || I18N.moduleFallback;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${id}`;
      a.dataset.target = id;
      a.innerHTML = `<span class="idx">${String(i + 1).padStart(2, '0')}</span><span class="title">${title}</span>`;
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = $('#' + id);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
        toggleRail(false);
      });
      li.appendChild(a);
      chapterList.appendChild(li);
    });
  }

  function updateChapterActive(index) {
    if (!chapterList) return;
    const links = $$('a[data-target]', chapterList);
    links.forEach((link, i) => link.classList.toggle('active', i === index));
  }

  function initHeroMetrics() {
    const mModules = $('#metric-modules');
    const mQuizzes = $('#metric-quizzes');
    const mSnippets = $('#metric-snippets');
    const mTerms = $('#metric-terms');
    if (!mModules || !mQuizzes || !mSnippets || !mTerms) return;

    const moduleCount = modules.length;
    const quizCount = $$('.quiz-container').length;
    const snippetCount = $$('.translation-block').length;
    const termCount = $$('.term').length;

    function renderMetric(el, value) {
      if (!el) return;
      if (!Number.isFinite(value) || value <= 0) {
        el.textContent = I18N.metricNA;
        return;
      }
      if (prefersReducedMotion) {
        el.textContent = String(value);
        return;
      }
      const start = performance.now();
      const duration = 520 + (Math.min(value, 60) * 8);
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const next = Math.max(1, Math.round(eased * value));
        el.textContent = String(next);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    renderMetric(mModules, moduleCount);
    renderMetric(mQuizzes, quizCount);
    renderMetric(mSnippets, snippetCount);
    renderMetric(mTerms, termCount);
  }

  function initHeroActions() {
    if (!heroStartReading) return;
    heroStartReading.addEventListener('click', () => {
      const firstModule = modules[0];
      if (!firstModule) return;
      firstModule.scrollIntoView({ behavior: 'smooth' });
      toggleRail(false);
    });
  }

  function initHeroParallax() {
    if (!heroDossier || prefersReducedMotion) return;
    heroDossier.addEventListener('pointermove', (e) => {
      const rect = heroDossier.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((e.clientX - rect.left) / rect.width) - 0.5;
      const y = ((e.clientY - rect.top) / rect.height) - 0.5;
      heroDossier.style.setProperty('--hero-shift-x', (x * 16).toFixed(2));
      heroDossier.style.setProperty('--hero-shift-y', (y * 11).toFixed(2));
    });
    heroDossier.addEventListener('pointerleave', () => {
      heroDossier.style.setProperty('--hero-shift-x', '0');
      heroDossier.style.setProperty('--hero-shift-y', '0');
    });
  }

  initMode();
  initRail();
  buildChapterList();
  initHeroMetrics();
  initHeroActions();
  initHeroParallax();
  mountSnippetButtons();
  bindViewerTriggers();
  if (viewerStatusEl) viewerStatusEl.textContent = I18N.viewerIdle;

  /* ── KEYBOARD NAVIGATION ───────────────────────────────────── */
  function currentModuleIndex() {
    const scrollMid = window.scrollY + window.innerHeight / 2;
    for (let i = 0; i < modules.length; i++) {
      const top    = modules[i].offsetTop;
      const bottom = top + modules[i].offsetHeight;
      if (scrollMid >= top && scrollMid < bottom) return i;
    }
    return 0;
  }

  document.addEventListener('keydown', e => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      const next = modules[currentModuleIndex() + 1];
      if (next) { next.scrollIntoView({ behavior: 'smooth' }); e.preventDefault(); }
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      const prev = modules[currentModuleIndex() - 1];
      if (prev) { prev.scrollIntoView({ behavior: 'smooth' }); e.preventDefault(); }
    }
  });

  /* ── SCROLL-TRIGGERED REVEAL ───────────────────────────────── */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  $$('.animate-in').forEach(el => revealObserver.observe(el));

  // Stagger children
  $$('.stagger-children').forEach(parent => {
    Array.from(parent.children).forEach((child, i) => {
      child.style.setProperty('--stagger-index', i);
    });
  });

  /* ── GLOSSARY TOOLTIPS ─────────────────────────────────────── */
  let activeTooltip = null;

  function positionTooltip(term, tip) {
    const rect     = term.getBoundingClientRect();
    const tipWidth = Math.min(320, Math.max(200, window.innerWidth * 0.8));
    let left = rect.left + rect.width / 2 - tipWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipWidth - 8));
    tip.style.left  = left + 'px';
    tip.style.width = tipWidth + 'px';
    document.body.appendChild(tip);
    const tipHeight = tip.offsetHeight;
    if (rect.top - tipHeight - 12 < 0) {
      tip.style.top = (rect.bottom + 8) + 'px';
      tip.classList.add('flip');
    } else {
      tip.style.top = (rect.top - tipHeight - 8) + 'px';
      tip.classList.remove('flip');
    }
  }

  function showTooltip(term, tip) {
    if (activeTooltip && activeTooltip !== tip) {
      activeTooltip.classList.remove('visible');
      activeTooltip.remove();
    }
    positionTooltip(term, tip);
    requestAnimationFrame(() => tip.classList.add('visible'));
    activeTooltip = tip;
  }

  function hideTooltip(tip) {
    tip.classList.remove('visible');
    setTimeout(() => { if (!tip.classList.contains('visible')) tip.remove(); }, 150);
    if (activeTooltip === tip) activeTooltip = null;
  }

  $$('.term').forEach(term => {
    const tip = document.createElement('span');
    tip.className = 'term-tooltip';
    tip.textContent = term.dataset.definition;

    term.addEventListener('mouseenter', () => showTooltip(term, tip));
    term.addEventListener('mouseleave', () => hideTooltip(tip));
    term.addEventListener('click', e => {
      e.stopPropagation();
      tip.classList.contains('visible') ? hideTooltip(tip) : showTooltip(term, tip);
    });
  });

  document.addEventListener('click', () => {
    if (activeTooltip) { activeTooltip.classList.remove('visible'); activeTooltip.remove(); activeTooltip = null; }
  });

  /* ── QUIZ ENGINE ───────────────────────────────────────────── */
  window.selectOption = function (btn) {
    const block = btn.closest('.quiz-question-block');
    $$('.quiz-option', block).forEach(o => o.classList.remove('selected'));
    btn.classList.add('selected');
  };

  window.checkQuiz = function (containerId) {
    const container = $('#' + containerId);
    if (!container) return;
    $$('.quiz-question-block', container).forEach(q => {
      const selected  = $('.quiz-option.selected', q);
      const feedback  = $('.quiz-feedback', q);
      const correct   = q.dataset.correct;
      const rightExp  = q.dataset.explanationRight  || '';
      const wrongExp  = q.dataset.explanationWrong  || '';

      if (!selected) {
        feedback.textContent = I18N.quizPickFirst;
        feedback.className = 'quiz-feedback show warning';
        return;
      }
      $$('.quiz-option', q).forEach(o => o.disabled = true);

      if (selected.dataset.value === correct) {
        selected.classList.add('correct');
        feedback.innerHTML = I18N.quizCorrectPrefix + rightExp;
        feedback.className = 'quiz-feedback show success';
      } else {
        selected.classList.add('incorrect');
        const correctBtn = $(`.quiz-option[data-value="${correct}"]`, q);
        if (correctBtn) correctBtn.classList.add('correct');
        feedback.innerHTML = I18N.quizWrongPrefix + wrongExp;
        feedback.className = 'quiz-feedback show error';
      }
    });
  };

  window.resetQuiz = function (containerId) {
    const container = $('#' + containerId);
    if (!container) return;
    $$('.quiz-option', container).forEach(o => {
      o.classList.remove('selected', 'correct', 'incorrect');
      o.disabled = false;
    });
    $$('.quiz-feedback', container).forEach(f => { f.className = 'quiz-feedback'; f.textContent = ''; });
  };

  /* ── DRAG-AND-DROP ENGINE ──────────────────────────────────── */
  function initDnD(containerEl) {
    if (!containerEl) return;
    const chips = $$('.dnd-chip', containerEl);
    const zones = $$('.dnd-zone', containerEl);

    // Mouse (HTML5 Drag API)
    chips.forEach(chip => {
      chip.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', chip.dataset.answer);
        chip.classList.add('dragging');
      });
      chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
    });

    zones.forEach(zone => {
      const target = $('.dnd-zone-target', zone);
      if (!target) return;
      target.addEventListener('dragover',  e => { e.preventDefault(); target.classList.add('drag-over'); });
      target.addEventListener('dragleave', ()  => target.classList.remove('drag-over'));
      target.addEventListener('drop', e => {
        e.preventDefault();
        target.classList.remove('drag-over');
        const answer = e.dataTransfer.getData('text/plain');
        const chip   = $(`.dnd-chip[data-answer="${answer}"]`, containerEl);
        if (!chip) return;
        target.textContent    = chip.textContent;
        target.dataset.placed = answer;
        chip.classList.add('placed');
      });
    });

    // Touch
    chips.forEach(chip => {
      chip.addEventListener('touchstart', e => {
        e.preventDefault();
        const touch = e.touches[0];
        const ghost = chip.cloneNode(true);
        ghost.classList.add('touch-ghost');
        ghost.style.cssText = `position:fixed;z-index:9999;pointer-events:none;left:${touch.clientX - 40}px;top:${touch.clientY - 20}px;`;
        document.body.appendChild(ghost);
        chip._ghost  = ghost;
        chip._answer = chip.dataset.answer;
      }, { passive: false });

      chip.addEventListener('touchmove', e => {
        e.preventDefault();
        const touch = e.touches[0];
        if (chip._ghost) {
          chip._ghost.style.left = (touch.clientX - 40) + 'px';
          chip._ghost.style.top  = (touch.clientY - 20) + 'px';
        }
        zones.forEach(z => { const t = $('.dnd-zone-target', z); if (t) t.classList.remove('drag-over'); });
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const zt = el && el.closest('.dnd-zone-target');
        if (zt) zt.classList.add('drag-over');
      }, { passive: false });

      chip.addEventListener('touchend', e => {
        if (chip._ghost) { chip._ghost.remove(); chip._ghost = null; }
        const touch = e.changedTouches[0];
        const el    = document.elementFromPoint(touch.clientX, touch.clientY);
        const zt    = el && el.closest('.dnd-zone-target');
        if (zt) {
          zt.textContent    = chip.textContent;
          zt.dataset.placed = chip._answer;
          chip.classList.add('placed');
        }
        zones.forEach(z => { const t = $('.dnd-zone-target', z); if (t) t.classList.remove('drag-over'); });
      });
    });
  }

  window.checkDnD = function (containerId) {
    const container = $('#' + containerId);
    if (!container) return;
    $$('.dnd-zone', container).forEach(zone => {
      const target  = $('.dnd-zone-target', zone);
      if (!target || !target.dataset.placed) return;
      if (target.dataset.placed === zone.dataset.correct) {
        target.classList.add('correct-placed');
      } else {
        target.classList.add('incorrect-placed');
      }
    });
  };

  window.resetDnD = function (containerId) {
    const container = $('#' + containerId);
    if (!container) return;
    $$('.dnd-zone-target', container).forEach(t => {
      t.textContent = I18N.dndDropHere;
      delete t.dataset.placed;
      t.classList.remove('correct-placed', 'incorrect-placed');
    });
    $$('.dnd-chip', container).forEach(c => c.classList.remove('placed', 'dragging'));
  };

  // Auto-init all dnd containers
  $$('.dnd-container').forEach(el => initDnD(el));

  /* ── GROUP CHAT ENGINE ─────────────────────────────────────── */
  function initChat(containerEl) {
    if (!containerEl) return;
    const messages    = $$('.chat-message', containerEl);
    const typingEl    = $('.chat-typing', containerEl);
    const typingAvEl  = $('#' + containerEl.id + '-typing-avatar') || $('.chat-avatar', typingEl);
    const progressEl  = $('.chat-progress', containerEl);
    let index = 0;

    // Build actor map from messages
    const actors = {};
    messages.forEach(msg => {
      const sender = msg.dataset.sender;
      const avatar = $('.chat-avatar', msg);
      if (avatar && !actors[sender]) {
        actors[sender] = { initial: avatar.textContent.trim(), style: avatar.style.background };
      }
    });

    function updateProgress() {
      if (progressEl) progressEl.textContent = I18N.chatProgress(index, messages.length);
    }

    function showNext() {
      if (index >= messages.length) return;
      const msg    = messages[index];
      const sender = msg.dataset.sender;

      if (typingEl && actors[sender]) {
        if (typingAvEl) {
          typingAvEl.textContent       = actors[sender].initial;
          typingAvEl.style.background  = actors[sender].style;
        }
        typingEl.style.display = 'flex';
      }

      setTimeout(() => {
        if (typingEl) typingEl.style.display = 'none';
        msg.style.display = 'flex';
        msg.style.animation = 'fadeSlideUp 0.3s var(--ease-out)';
        index++;
        updateProgress();
      }, 800);
    }

    function showAll() {
      const iv = setInterval(() => {
        if (index >= messages.length) { clearInterval(iv); return; }
        showNext();
      }, 1200);
    }

    function reset() {
      index = 0;
      messages.forEach(m => { m.style.display = 'none'; m.style.animation = ''; });
      if (typingEl) typingEl.style.display = 'none';
      updateProgress();
    }

    // Bind controls
    const nextBtn  = $('.chat-next-btn',  containerEl);
    const allBtn   = $('.chat-all-btn',   containerEl);
    const resetBtn = $('.chat-reset-btn', containerEl);
    if (nextBtn)  nextBtn.addEventListener('click',  showNext);
    if (allBtn)   allBtn.addEventListener('click',   showAll);
    if (resetBtn) resetBtn.addEventListener('click', reset);

    updateProgress();
  }

  $$('.chat-window').forEach(el => initChat(el));

  /* ── FLOW ANIMATION ENGINE ─────────────────────────────────── */
  function initFlow(containerEl) {
    if (!containerEl) return;
    const stepsData  = JSON.parse(containerEl.dataset.steps || '[]');
    const labelEl    = $('.flow-step-label', containerEl);
    const progressEl = $('.flow-progress',   containerEl);
    const packet     = $('.flow-packet',     containerEl);
    let step = 0;

    function updateProgress() {
      if (progressEl) progressEl.textContent = I18N.flowProgress(step, stepsData.length);
    }

    function animatePacket(fromId, toId) {
      if (!packet) return;
      const fromEl = $('#' + fromId, containerEl) || $('#' + fromId);
      const toEl   = $('#' + toId, containerEl) || $('#' + toId);
      if (!fromEl || !toEl) return;
      const fromR = fromEl.getBoundingClientRect();
      const toR   = toEl.getBoundingClientRect();
      const contR = containerEl.getBoundingClientRect();
      const fx = fromR.left + fromR.width / 2  - contR.left;
      const fy = fromR.top  + fromR.height / 2 - contR.top;
      const tx = toR.left   + toR.width / 2    - contR.left;
      const ty = toR.top    + toR.height / 2   - contR.top;
      packet.style.setProperty('--packet-from-x', fx + 'px');
      packet.style.setProperty('--packet-from-y', fy + 'px');
      packet.style.setProperty('--packet-to-x',   tx + 'px');
      packet.style.setProperty('--packet-to-y',   ty + 'px');
      packet.style.display    = 'block';
      packet.style.animation  = 'none';
      packet.offsetHeight; // reflow
      packet.style.animation  = 'packetMove 0.8s var(--ease-in-out) forwards';
      setTimeout(() => { packet.style.display = 'none'; }, 850);
    }

    function next() {
      if (step >= stepsData.length) return;
      const s = stepsData[step];
      $$('.flow-actor', containerEl).forEach(a => a.classList.remove('active'));
      if (s.highlight) {
        const hEl = $('#' + s.highlight, containerEl) || $('#flow-' + s.highlight, containerEl) || $('#flow-' + s.highlight);
        if (hEl) hEl.classList.add('active');
      }
      if (s.packet && s.from && s.to) animatePacket('flow-' + s.from, 'flow-' + s.to);
      if (labelEl) labelEl.textContent = s.label || '';
      step++;
      updateProgress();
    }

    function reset() {
      step = 0;
      $$('.flow-actor', containerEl).forEach(a => a.classList.remove('active'));
      if (labelEl) labelEl.textContent = containerEl.dataset.initialLabel || I18N.flowInitial;
      if (packet)  packet.style.display = 'none';
      updateProgress();
    }

    const nextBtn  = $('.flow-next-btn',  containerEl);
    const resetBtn = $('.flow-reset-btn', containerEl);
    if (nextBtn)  nextBtn.addEventListener('click',  next);
    if (resetBtn) resetBtn.addEventListener('click', reset);

    updateProgress();
  }

  $$('.flow-animation').forEach(el => initFlow(el));

  /* ── ARCHITECTURE DIAGRAM ──────────────────────────────────── */
  $$('.arch-component').forEach(comp => {
    comp.addEventListener('click', function () {
      const diagram = this.closest('.arch-diagram');
      $$('.arch-component', diagram).forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const descEl = $('.arch-description', diagram);
      if (descEl) descEl.textContent = this.dataset.desc || '';
      if (this.dataset.openFile) {
        const start = Number(this.dataset.lineStart || '');
        const end = Number(this.dataset.lineEnd || '');
        const range = Number.isFinite(start) && start > 0
          ? { start, end: Number.isFinite(end) && end >= start ? end : start }
          : null;
        openViewer(this.dataset.openFile, range);
      }
    });
  });

  /* ── BUG CHALLENGE ─────────────────────────────────────────── */
  window.checkBugLine = function (el, isCorrect) {
    const challenge = el.closest('.bug-challenge');
    const feedback  = $('.bug-feedback', challenge);
    if (isCorrect) {
      el.classList.add('correct');
      feedback.innerHTML  = I18N.bugFoundPrefix + (el.dataset.explanation || '');
      feedback.className  = 'bug-feedback show success';
      $$('.bug-line', challenge).forEach(l => l.style.pointerEvents = 'none');
    } else {
      el.classList.add('incorrect');
      feedback.innerHTML  = (el.dataset.hint || I18N.bugFallback);
      feedback.className  = 'bug-feedback show error';
      setTimeout(() => {
        el.classList.remove('incorrect');
        feedback.className = 'bug-feedback';
      }, 1800);
    }
  };

  /* ── LAYER TOGGLE ──────────────────────────────────────────── */
  window.showLayer = function (layerId, btn) {
    const demo = btn ? btn.closest('.layer-demo') : null;
    if (!demo) return;
    $$('.layer', demo).forEach(l => l.style.display = 'none');
    $$('.layer-tab', demo).forEach(t => t.classList.remove('active'));
    const layer = $('#' + layerId);
    if (layer) layer.style.display = 'block';
    btn.classList.add('active');
  };

})();
