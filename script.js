(()=>{'use strict';const toggle=document.querySelector('.nav-toggle'),links=document.querySelector('.nav-links');if(toggle&&links){toggle.addEventListener('click',()=>{const open=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});links.addEventListener('click',()=>{links.classList.remove('open');toggle.setAttribute('aria-expanded','false')});}document.querySelectorAll('.course-toggle').forEach(btn=>btn.addEventListener('click',()=>{const d=btn.nextElementSibling;const open=d.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));btn.textContent=open?'Hide enrollment details':'View enrollment details';}));const audio=document.querySelector('#room-audio'),music=document.querySelector('.music-control');if(audio&&music){const key='stopaz-music';let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}audio.volume=.55;if(Number.isFinite(saved.time))audio.currentTime=Math.max(0,saved.time);const persist=()=>{try{localStorage.setItem(key,JSON.stringify({playing:!audio.paused,time:audio.currentTime||0}))}catch(e){}};const sync=()=>{const playing=!audio.paused;music.classList.toggle('playing',playing);music.setAttribute('aria-pressed',String(playing));music.setAttribute('aria-label',playing?'Pause exhibition music':'Play exhibition music');persist()};const play=async()=>{try{await audio.play();sync();return true}catch(e){return false}};music.addEventListener('click',async e=>{e.stopPropagation();if(audio.paused)await play();else audio.pause()});audio.addEventListener('play',sync);audio.addEventListener('pause',sync);audio.addEventListener('timeupdate',()=>{if(!audio.paused)persist()});window.addEventListener('pagehide',persist);window.addEventListener('pageshow',()=>{if(saved.playing!==false)play()});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&saved.playing!==false)play()});let started=false;const types=['pointerdown','touchstart','keydown','wheel','mousemove','scroll'];const remove=()=>types.forEach(t=>window.removeEventListener(t,attempt));const attempt=async e=>{if(started||e?.target?.closest?.('.music-control'))return;started=await play();if(started)remove()};play();types.forEach(t=>window.addEventListener(t,attempt,{passive:t!=='keydown'}));}

// Cinematic transition into The Exhibition
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const arrivalKey = 'stopaz-exhibition-camera-arrival';

  if (currentPage === 'exhibition.html') {
    let arriving = false;
    try {
      arriving = sessionStorage.getItem(arrivalKey) === '1';
      sessionStorage.removeItem(arrivalKey);
    } catch (_) {}
    if (arriving && !reducedMotion) {
      document.body.classList.add('camera-arrival');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        document.body.classList.add('camera-arrival-ready');
      }));
      window.setTimeout(() => {
        document.body.classList.remove('camera-arrival', 'camera-arrival-ready');
      }, 1250);
    }
    return;
  }

  document.querySelectorAll('a[href="exhibition.html"], a[href$="/exhibition.html"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const destination = link.href;
      try { sessionStorage.setItem(arrivalKey, '1'); } catch (_) {}

      if (reducedMotion) {
        document.body.classList.add('page-leaving');
        window.setTimeout(() => { location.href = destination; }, 120);
        return;
      }

      const overlay = document.createElement('div');
      overlay.className = 'exhibition-camera-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img');
      image.src = 'soviet_horses.webp';
      image.alt = '';
      overlay.appendChild(image);
      document.body.appendChild(overlay);
      document.body.classList.add('exhibition-transitioning');

      requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('active')));
      window.setTimeout(() => { location.href = destination; }, 1120);
    }, true);
  });
})();

// Current navigation state and restrained page transition
const current=(location.pathname.split('/').pop()||'index.html');
document.querySelectorAll('.nav-links a').forEach(a=>{if(a.getAttribute('href')===current)a.setAttribute('aria-current','page')});
document.querySelectorAll('a[href]').forEach(a=>a.addEventListener('click',e=>{const href=a.getAttribute('href')||'';if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target==='_blank'||href.startsWith('#')||href.startsWith('mailto:')||href.startsWith('http'))return;document.body.classList.add('page-leaving')}));
const bays=document.querySelectorAll('.room-bay'),modal=document.querySelector('.room-modal');if(bays.length&&modal){const img=modal.querySelector('img'),cap=modal.querySelector('figcaption'),count=modal.querySelector('figure span'),close=modal.querySelector('.modal-close'),prev=modal.querySelector('.modal-prev'),next=modal.querySelector('.modal-next');let arr=[],i=0,label='';const render=()=>{img.src=arr[i];img.alt=`${label} exhibition image ${i+1}`;cap.textContent=`${label} archive`;count.textContent=`${i+1} / ${arr.length}`};const open=b=>{arr=b.dataset.images.split(',');label=b.dataset.label;i=0;modal.hidden=false;modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';render();close.focus()};const shut=()=>{modal.hidden=true;modal.setAttribute('aria-hidden','true');document.body.style.overflow=''};const step=n=>{i=(i+n+arr.length)%arr.length;render()};bays.forEach(b=>b.addEventListener('click',()=>open(b)));close.addEventListener('click',shut);prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));img.addEventListener('click',()=>step(1));modal.addEventListener('click',e=>{if(e.target===modal)shut()});document.addEventListener('keydown',e=>{if(modal.hidden)return;if(e.key==='Escape')shut();if(e.key==='ArrowRight')step(1);if(e.key==='ArrowLeft')step(-1);});}})();