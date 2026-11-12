/* Automatic, home-page-only cinematic reveal. Audio is attempted silently if policy permits. */
(() => {
  'use strict';
  const stage = document.getElementById('gca-cinematic');
  if (!stage || !window.__gcaIntroEligible || document.documentElement.classList.contains('gca-intro-skipped')) return;

  const scriptUrl = document.currentScript?.src || location.href;
  const base = new URL('.', scriptUrl);
  const resource = (path) => new URL(path, base).href;
  let activeAudio = null;
  let finishTimer = 0;
  let removalTimer = 0;
  let finished = false;

  const finish = (fallback = false) => {
    if (finished) return;
    finished = true;
    clearTimeout(finishTimer);
    clearTimeout(window.__gcaIntroFallback);
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    document.removeEventListener('keydown', onKeyDown);
    if (fallback) {
      document.documentElement.classList.add('gca-intro-skipped');
      return;
    }
    stage.classList.add('is-exiting');
    removalTimer = setTimeout(() => stage.remove(), 470);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') finish();
  };
  window.__gcaCinematicSkip = () => finish();
  stage.querySelector('[data-gca-skip]')?.addEventListener('click', () => finish());
  document.addEventListener('keydown', onKeyDown);

  const start = () => {
    if (finished || document.documentElement.classList.contains('gca-intro-skipped')) return;
    clearTimeout(window.__gcaIntroFallback);
    window.__gcaIntroStartTime = performance.now();
    stage.classList.add('is-running');

    // Attempt a short engine cue; browsers that deny autoplay continue silently.
    try {
      activeAudio = new Audio(resource('assets/engine-rev.mp3'));
      activeAudio.preload = 'none';
      activeAudio.volume = .26;
      activeAudio.play().catch(() => { activeAudio = null; });
    } catch { activeAudio = null; }

    finishTimer = setTimeout(() => finish(), 1900);
  };

  const art = stage.querySelector('.gca-cinematic__plate');
  art?.addEventListener('error', () => finish(true), {once:true});
  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = resource('intro.css');
  style.onload = start;
  style.onerror = () => finish(true);
  document.head.appendChild(style);
})();
