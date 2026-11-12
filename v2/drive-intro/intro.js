/* GCA Drive Intro: home-page-only progressive enhancement; no audio without a click. */
(() => {
  'use strict';
  const scriptUrl = document.currentScript?.src || location.href;
  const base = new URL('.', scriptUrl);
  const resource = (path) => new URL(path, base).href;
  const mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dataSaver = !!navigator.connection?.saveData;
  const slowConnection = /^(slow-2g|2g)$/.test(navigator.connection?.effectiveType || '');
  const seenKey = 'gca-intro-v1-seen';
  let timeoutId = 0;
  let overlay = null;
  let activeAudio = null;
  let done = false;
  let changedInert = [];

  const getSeen = () => { try { return sessionStorage.getItem(seenKey) === '1'; } catch { return false; } };
  const setSeen = () => { try { sessionStorage.setItem(seenKey, '1'); } catch {} };
  const stopAudio = () => { if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null; } };
  const restorePage = () => {
    for (const [node, previous] of changedInert) node.inert = previous;
    changedInert = [];
  };
  const finish = () => {
    if (done || !overlay) return;
    done = true;
    clearTimeout(timeoutId);
    stopAudio();
    restorePage();
    overlay.classList.add('is-exiting');
    const target = overlay;
    setTimeout(() => {
      target.remove();
      if (overlay === target) overlay = null;
    }, 520);
  };

  function playRev() {
    // Audible playback is attempted only inside this explicit user gesture.
    if (done || !overlay) return;
    clearTimeout(timeoutId);
    overlay.classList.add('is-revving');
    const audio = new Audio(resource('assets/engine-rev.mp3'));
    audio.preload = 'none';
    audio.volume = .48;
    activeAudio = audio;
    audio.play().catch(() => { /* The visual intro remains usable if audio is blocked. */ });
    timeoutId = setTimeout(finish, 1600);
  }

  function show({ force = false } = {}) {
    if (overlay || (getSeen() && !force) || (mediaReduced && !force) || (dataSaver && !force)) return;
    done = false;
    setSeen();
    overlay = document.createElement('section');
    overlay.className = 'gca-intro';
    overlay.lang = 'fa';
    overlay.dir = 'rtl';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'gca-intro-title');
    overlay.innerHTML = `
      <div class="gca-intro__top">
        <div class="gca-intro__brand"><img src="${resource('assets/gca-badge.webp')}" alt="" width="35" height="35">GIRL CAR ACCESSORY</div>
        <div class="gca-intro__topnote">PINK DRIVE CLUB / 01</div>
      </div>
      <div class="gca-intro__layout">
        <div class="gca-intro__content">
          <div class="gca-intro__eyebrow">خوش اومدی به دنیای Girl Car</div>
          <h1 id="gca-intro-title">این مسیر،<span>مال توئه.</span></h1>
          <p class="gca-intro__description">یه دنیا رنگ، ظرافت و اکسسوری های خاص برای ماشینی که امضای توئه.</p>
          <div class="gca-intro__actions">
            <button type="button" class="gca-intro__btn gca-intro__btn--sound" data-gca-sound>↗ &nbsp; ورود با صدای موتور</button>
            <button type="button" class="gca-intro__btn gca-intro__btn--skip" data-gca-skip>ورود بی صدا ←</button>
          </div>
          <div class="gca-intro__meta">نمایش خودکار یک بار در هر نشست · صدا فقط با انتخاب شما</div>
        </div>
        <div class="gca-intro__visual">
          <div class="gca-intro__streak gca-intro__streak--one" aria-hidden="true"></div><div class="gca-intro__streak gca-intro__streak--two" aria-hidden="true"></div>
          <div class="gca-intro__art-frame"><img src="${resource('assets/mascot-drive.webp')}" alt="دختر با عینک بنفش در کنار خودروی اسپرت بنفش، تصویر برند Girl Car Accessory" width="1070" height="610" decoding="async" fetchpriority="low"></div>
          <div class="gca-intro__star" aria-hidden="true">✦</div>
          <div class="gca-intro__tag" aria-hidden="true">YOUR DRIVE · YOUR STYLE</div>
        </div>
      </div>
      <div class="gca-intro__bottom"><span>GIRL CAR / START YOUR ENGINE</span><span class="gca-intro__progress" aria-hidden="true"></span><span>GCA. 2026</span></div>`;
    document.body.appendChild(overlay);
    changedInert = [...document.body.children]
      .filter((node) => node !== overlay && !node.matches('script, style'))
      .map((node) => [node, node.inert]);
    for (const [node] of changedInert) node.inert = true;
    const skip = overlay.querySelector('[data-gca-skip]');
    overlay.querySelector('[data-gca-sound]').addEventListener('click', playRev);
    skip.addEventListener('click', finish);
    overlay.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); finish(); }
      if (event.key === 'Tab') {
        const controls = [...overlay.querySelectorAll('button:not([disabled])')];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    skip.focus({preventScroll:true});
    timeoutId = setTimeout(finish, 2350);
  }

  // Respect motion, data-saving, slow-network and repeat-visit preferences before loading optional assets.
  if (mediaReduced || dataSaver || slowConnection || getSeen()) return;

  // Wait until the store's load event, then add the optional stylesheet in idle time.
  // This keeps the intro's CSS and artwork out of the initial render path.
  const loadIntroStyle = () => {
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = resource('intro.css');
    style.onload = () => requestAnimationFrame(() => requestAnimationFrame(() => show()));
    document.head.appendChild(style);
  };
  const scheduleIntro = () => {
    if (window.requestIdleCallback) window.requestIdleCallback(loadIntroStyle, {timeout:500});
    else setTimeout(loadIntroStyle, 50);
  };
  if (document.readyState === 'complete') scheduleIntro();
  else window.addEventListener('load', scheduleIntro, {once:true});
})();

