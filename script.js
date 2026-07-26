(() => {
  'use strict';

  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile navigation.
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const closeMenu = () => {
    if (!toggle || !links) return;
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
  };
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    links.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('click', event => {
      if (links.classList.contains('open') && !event.target.closest('.site-header')) closeMenu();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); }, { passive: true });
  }

  // Active navigation state.
  const page = body.dataset.page || location.pathname.split('/').pop() || 'index.html';
  const activeMap = {
    'educationtraining.html': 'education.html',
    'certificate-program.html': 'education.html',
    'team.html': 'about.html',
    'partners.html': 'about.html'
  };
  const active = activeMap[page] || page;
  document.querySelectorAll('.nav-links a[href], .footer-grid a[href]').forEach(link => {
    if (link.getAttribute('href') === active || link.getAttribute('href') === page) link.setAttribute('aria-current', 'page');
  });

  // Course detail disclosure.
  document.querySelectorAll('.course-toggle').forEach(button => {
    button.dataset.closedLabel = button.textContent.trim();
    button.addEventListener('click', () => {
      const detail = button.nextElementSibling;
      if (!detail) return;
      const open = detail.classList.toggle('open');
      button.setAttribute('aria-expanded', String(open));
      button.textContent = open ? 'Hide details' : button.dataset.closedLabel;
    });
  });

  // Exhibition music. Browsers may block autoplay; retry on the first permitted interaction.
  const audio = document.querySelector('#room-audio');
  const music = document.querySelector('.music-control');
  if (audio && music) {
    const key = 'stopaz-exhibition-music';
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) {}
    audio.volume = 0.55;
    if (Number.isFinite(saved.time)) audio.currentTime = Math.max(0, saved.time);

    const persist = () => {
      try { localStorage.setItem(key, JSON.stringify({ playing: !audio.paused, time: audio.currentTime || 0 })); } catch (_) {}
    };
    const sync = () => {
      const playing = !audio.paused;
      music.classList.toggle('playing', playing);
      music.setAttribute('aria-pressed', String(playing));
      music.setAttribute('aria-label', playing ? 'Pause exhibition music' : 'Play exhibition music');
      persist();
    };
    const tryPlay = async () => {
      try { await audio.play(); sync(); return true; }
      catch (_) { music.classList.remove('playing'); return false; }
    };

    music.addEventListener('click', async event => {
      event.stopPropagation();
      if (audio.paused) await tryPlay(); else audio.pause();
    });
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    audio.addEventListener('timeupdate', () => { if (!audio.paused) persist(); });
    window.addEventListener('pagehide', persist);
    window.addEventListener('pageshow', () => { if (saved.playing !== false) tryPlay(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && saved.playing !== false) tryPlay(); });

    let started = false;
    const interactionTypes = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll', 'mousemove', 'mouseenter'];
    const removeAttempts = () => interactionTypes.forEach(type => window.removeEventListener(type, attempt));
    const attempt = async event => {
      const target = event?.target instanceof Element ? event.target : null;
      if (started || target?.closest('.music-control')) return;
      started = await tryPlay();
      if (started) removeAttempts();
    };
    tryPlay();
    interactionTypes.forEach(type => window.addEventListener(type, attempt, { passive: type !== 'keydown' }));
  }

  // Cinematic camera transition into the Exhibition.
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const arrivalKey = 'stopaz-exhibition-camera-arrival';
  if (currentPage === 'exhibition.html') {
    let arriving = false;
    try {
      arriving = sessionStorage.getItem(arrivalKey) === '1';
      sessionStorage.removeItem(arrivalKey);
    } catch (_) {}
    if (arriving && !reducedMotion) {
      body.classList.add('camera-arrival');
      requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('camera-arrival-ready')));
      window.setTimeout(() => body.classList.remove('camera-arrival', 'camera-arrival-ready'), 1200);
    }
  } else {
    document.querySelectorAll('a[href="exhibition.html"], a[href$="/exhibition.html"]').forEach(link => {
      link.addEventListener('click', event => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const destination = link.href;
        try { sessionStorage.setItem(arrivalKey, '1'); } catch (_) {}
        if (reducedMotion) {
          body.classList.add('page-leaving');
          window.setTimeout(() => { location.href = destination; }, 120);
          return;
        }
        const overlay = document.createElement('div');
        overlay.className = 'exhibition-camera-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        const image = document.createElement('img');
        image.src = 'campus_encampment.webp';
        image.alt = '';
        overlay.appendChild(image);
        body.appendChild(overlay);
        body.classList.add('exhibition-transitioning');
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('active')));
        window.setTimeout(() => { location.href = destination; }, 1120);
      }, true);
    });
  }

  // Exhibition archive modal.
  const bays = [...document.querySelectorAll('.room-bay')];
  const modal = document.querySelector('.room-modal');
  if (bays.length && modal) {
    const image = modal.querySelector('img');
    const caption = modal.querySelector('figcaption');
    const count = modal.querySelector('figure span');
    const close = modal.querySelector('.modal-close');
    const prev = modal.querySelector('.modal-prev');
    const next = modal.querySelector('.modal-next');
    let images = [];
    let index = 0;
    let label = '';
    let lastFocus = null;

    const render = () => {
      image.src = images[index];
      image.alt = `${label} exhibition image ${index + 1} of ${images.length}`;
      caption.textContent = `${label} archive`;
      count.textContent = `${index + 1} / ${images.length}`;
    };
    const step = amount => { index = (index + amount + images.length) % images.length; render(); };
    const open = bay => {
      images = (bay.dataset.images || '').split(',').map(value => value.trim()).filter(Boolean);
      if (!images.length) return;
      label = bay.dataset.label || 'Exhibition';
      index = 0;
      lastFocus = bay;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      body.style.overflow = 'hidden';
      render();
      close.focus();
    };
    const shut = () => {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
      body.style.overflow = '';
      image.removeAttribute('src');
      lastFocus?.focus();
    };
    bays.forEach(bay => bay.addEventListener('click', () => open(bay)));
    close.addEventListener('click', shut);
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    image.addEventListener('click', () => step(1));
    modal.addEventListener('click', event => { if (event.target === modal) shut(); });
    document.addEventListener('keydown', event => {
      if (modal.hidden) return;
      if (event.key === 'Escape') shut();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    });
  }

  // Restrained transition for internal pages.
  document.querySelectorAll('a[href]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href') || '';
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank' || href.startsWith('#') || href.startsWith('mailto:') || /^https?:/i.test(href)) return;
      body.classList.add('page-leaving');
    });
  });
})();
