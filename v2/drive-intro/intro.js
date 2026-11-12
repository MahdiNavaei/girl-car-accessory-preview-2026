/* Owner-supplied Film V4 player. Automatic visual playback; sound falls back to muted. */
(() => {
  'use strict';
  const root=document.documentElement;
  const overlay=document.getElementById('gca-film-overlay');
  if(!overlay||!root.classList.contains('gca-film-enabled')||root.classList.contains('gca-film-disabled')) return;

  const video=overlay.querySelector('video');
  const skip=overlay.querySelector('.gca-film__skip');
  if(!video||!video.querySelector('source[src]')) { root.classList.add('gca-film-disabled'); overlay.remove(); return; }

  const css=document.createElement('link');
  css.rel='stylesheet'; css.href='drive-intro/intro.css';
  document.head.appendChild(css);

  let finished=false,started=false,fallback=0,removeTimer=0;
  const finish=()=>{
    if(finished) return;
    finished=true; clearTimeout(fallback); clearTimeout(removeTimer);
    video.pause(); video.removeAttribute('autoplay');
    document.removeEventListener('keydown',onKey);
    overlay.classList.add('is-exiting');
    removeTimer=setTimeout(()=>overlay.remove(),460);
  };
  const onKey=e=>{if(e.key==='Escape') finish();};
  const start=()=>{
    if(started||finished) return;
    started=true; overlay.classList.add('is-playing');
    // Attempt the supplied engine audio; browser policy may require silent playback.
    video.muted=false;
    video.play().catch(()=>{
      video.muted=true;
      video.play().catch(finish);
    });
  };
  skip?.addEventListener('click',finish,{once:true});
  document.addEventListener('keydown',onKey);
  video.addEventListener('ended',finish,{once:true});
  video.addEventListener('error',finish,{once:true});
  video.addEventListener('canplay',start,{once:true});
  fallback=setTimeout(finish,4700);
  if(video.readyState>=3) start();
})();
