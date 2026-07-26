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
    'partners.html': 'about.html',
    'donate-1.html': 'support.html'
  };
  const active = activeMap[page] || page;
  document.querySelectorAll('.nav-links a[href], .footer-grid a[href]').forEach(link => {
    if (link.getAttribute('href') === active || link.getAttribute('href') === page) link.setAttribute('aria-current', 'page');
  });

  // Contact form: prepares an email locally. No data is transmitted by the website.
  const inquiryForm = document.querySelector('#inquiry-form');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(inquiryForm);
      const subject = String(data.get('subject') || 'General inquiry');
      const name = String(data.get('name') || '').trim();
      const organization = String(data.get('organization') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();
      const bodyText = [
        `Name: ${name}`,
        organization ? `Organization: ${organization}` : '',
        `Email: ${email}`,
        '',
        message
      ].filter(Boolean).join('\n');
      const href = `mailto:info@stopaz.org?subject=${encodeURIComponent(`STOPAZ: ${subject}`)}&body=${encodeURIComponent(bodyText)}`;
      window.location.href = href;
    });
  }

  // Exhibition music. Attempt once, then retry only after a purposeful interaction.
  const audio = document.querySelector('#room-audio');
  const music = document.querySelector('.music-control');
  if (audio && music) {
    const key = 'stopaz-exhibition-music';
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) {}
    let enabled = saved.enabled !== false;
    audio.volume = 0.48;
    if (Number.isFinite(saved.time)) audio.currentTime = Math.max(0, saved.time);

    const persist = () => {
      try { localStorage.setItem(key, JSON.stringify({ enabled, time: audio.currentTime || 0 })); } catch (_) {}
    };
    const sync = () => {
      const playing = !audio.paused;
      music.classList.toggle('playing', playing);
      music.setAttribute('aria-pressed', String(playing));
      music.setAttribute('aria-label', playing ? 'Pause exhibition music' : 'Play exhibition music');
      persist();
    };
    const tryPlay = async () => {
      if (!enabled) return false;
      try { await audio.play(); sync(); return true; }
      catch (_) { music.classList.remove('playing'); return false; }
    };

    music.addEventListener('click', async event => {
      event.stopPropagation();
      if (audio.paused) {
        enabled = true;
        await tryPlay();
      } else {
        enabled = false;
        audio.pause();
        sync();
      }
    });
    audio.addEventListener('play', sync);
    audio.addEventListener('pause', sync);
    audio.addEventListener('timeupdate', () => { if (!audio.paused) persist(); });
    window.addEventListener('pagehide', persist);
    window.addEventListener('pageshow', () => { if (enabled) tryPlay(); });

    let started = false;
    const interactionTypes = ['pointerdown', 'touchstart', 'keydown'];
    const removeAttempts = () => interactionTypes.forEach(type => window.removeEventListener(type, attempt));
    const attempt = async event => {
      const target = event?.target instanceof Element ? event.target : null;
      if (started || !enabled || target?.closest('.music-control')) return;
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
        const media = document.createElement('div');
        media.className = 'exhibition-camera-media';
        ['soviet_archive_devil.webp', 'soviet_archive_flags.webp', 'soviet_archive_worker.webp'].forEach(src => {
          const image = document.createElement('img');
          image.src = src;
          image.alt = '';
          media.appendChild(image);
        });
        overlay.appendChild(media);
        body.appendChild(overlay);
        body.classList.add('exhibition-transitioning');
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('active')));
        window.setTimeout(() => { location.href = destination; }, 1120);
      }, true);
    });
  }

  const archiveMetadata = {
    'soviet_archive_devil.webp': ['Soviet antizionist propaganda image', 'Archival reproduction supplied by STOPAZ. Original date, publisher, language, and collection metadata have not yet been provided.'],
    'soviet_archive_flags.webp': ['Antizionist propaganda between national flags', 'Archival reproduction supplied by STOPAZ. Original date, publisher, language, and collection metadata have not yet been provided.'],
    'soviet_archive_worker.webp': ['Soviet worker propaganda image', 'Archival reproduction supplied by STOPAZ. Original date, publisher, language, and collection metadata have not yet been provided.'],
    'soviet_horses.webp': ['Soviet antizionist illustration', 'Archival image supplied by STOPAZ. Full catalog metadata has not yet been provided.'],
    'soviet.webp': ['Soviet antizionist visual material', 'Archival image supplied by STOPAZ. Full catalog metadata has not yet been provided.'],
    'soviet_boot.webp': ['Soviet antizionist visual material', 'Archival image supplied by STOPAZ. Full catalog metadata has not yet been provided.'],
    'soviet_constitution.webp': ['Soviet-era printed material', 'Archival image supplied by STOPAZ. Full catalog metadata has not yet been provided.'],
    'soviet_red_hands.webp': ['Soviet antizionist visual material', 'Archival image supplied by STOPAZ. Full catalog metadata has not yet been provided.'],
    'protocols.webp': ['The Protocols of the Elders of Zion', 'Historical antisemitic publication. Image supplied by STOPAZ; edition and collection metadata have not yet been provided.'],
    'arab.webp': ['Arab antizionist visual material', 'Image supplied by STOPAZ. Date, creator, location, and collection metadata have not yet been provided.'],
    'arab_red_hands.webp': ['Arab antizionist visual material', 'Image supplied by STOPAZ. Date, creator, location, and collection metadata have not yet been provided.'],
    'hamas_monument.webp': ['Antizionist monument or display', 'Image supplied by STOPAZ. Date, location, and source metadata have not yet been provided.'],
    'devil_mural.webp': ['Demonizing mural imagery', 'Image supplied by STOPAZ. Date, location, and source metadata have not yet been provided.'],
    'red_paint_door.webp': ['Antisemitic or antizionist vandalism', 'Image supplied by STOPAZ. Date and location metadata have not yet been provided.'],
    'campus_encampment.webp': ['Contemporary campus encampment', 'Contemporary protest image supplied by STOPAZ. Date and location metadata have not yet been provided.'],
    'gays_for_gaza.webp': ['Contemporary protest messaging', 'Image supplied by STOPAZ. Date and location metadata have not yet been provided.'],
    'sweden_protest.webp': ['Contemporary public demonstration', 'Image supplied by STOPAZ. Date and precise location metadata have not yet been provided.'],
    'subway_graffiti.webp': ['Antizionist graffiti', 'Image supplied by STOPAZ. Date and location metadata have not yet been provided.'],
    'river_to_sea_mural.webp': ['Contemporary antizionist mural', 'Image supplied by STOPAZ. Date, location, and creator metadata have not yet been provided.'],
    'western.webp': ['Western antizionist visual material', 'Image supplied by STOPAZ. Date and source metadata have not yet been provided.'],
    'western_rope.webp': ['Contemporary antizionist visual material', 'Image supplied by STOPAZ. Date and source metadata have not yet been provided.']
  };

  // Exhibition archive modal.
  const bays = [...document.querySelectorAll('.room-bay')];
  const modal = document.querySelector('.room-modal');
  if (bays.length && modal) {
    const image = modal.querySelector('img');
    const caption = modal.querySelector('figcaption');
    const record = modal.querySelector('.modal-record');
    const source = modal.querySelector('.modal-source');
    const count = modal.querySelector('.modal-count');
    const close = modal.querySelector('.modal-close');
    const prev = modal.querySelector('.modal-prev');
    const next = modal.querySelector('.modal-next');
    let images = [];
    let index = 0;
    let label = '';
    let lastFocus = null;
    let pointerStartX = null;

    const render = () => {
      const file = images[index];
      const metadata = archiveMetadata[file] || [`${label} archive image`, 'Image supplied by STOPAZ. Catalog metadata has not yet been provided.'];
      image.src = file;
      image.alt = metadata[0];
      caption.textContent = metadata[0];
      record.textContent = metadata[1];
      source.textContent = `${label} archive · Image ${index + 1} of ${images.length}`;
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
    modal.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') pointerStartX = event.clientX; });
    modal.addEventListener('pointerup', event => {
      if (pointerStartX === null) return;
      const delta = event.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(delta) > 55) step(delta < 0 ? 1 : -1);
    });
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
