(() => {
  'use strict';

  const body = document.body;
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Image decode/loading transitions
  document.querySelectorAll('img.site-image').forEach(img => {
    const markLoaded = () => img.classList.remove('pending-image');
    if (img.complete && img.naturalWidth) markLoaded();
    else {
      img.addEventListener('load', markLoaded, { once: true });
      img.addEventListener('error', markLoaded, { once: true });
    }
  });


  const menuItems = () => links
    ? [...links.querySelectorAll('a[href]:not([hidden])')]
    : [];

  const closeMenu = (returnFocus = false) => {
    if (!toggle || !links) return;
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    header?.classList.remove('menu-open');
    body.classList.remove('nav-open');
    const label = toggle.querySelector('span');
    if (label) label.textContent = 'Menu';
    if (returnFocus) toggle.focus();
  };

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = !links.classList.contains('open');
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      header?.classList.toggle('menu-open', open);
      body.classList.toggle('nav-open', open);
      const label = toggle.querySelector('span');
      if (label) label.textContent = open ? 'Close' : 'Menu';
      if (open) menuItems()[0]?.focus();
    });

    links.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('click', event => {
      if (links.classList.contains('open') && header && !header.contains(event.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', event => {
      if (!links.classList.contains('open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu(true);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [toggle, ...menuItems()];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1050 && links.classList.contains('open')) closeMenu();
    }, { passive: true });
  }

  const activePage = body.dataset.page === 'symposium.html'
    ? 'events.html'
    : body.dataset.page;
  if (activePage) {
    document.querySelectorAll('[data-page]').forEach(link => {
      if (link.dataset.page === activePage) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  const progress = document.querySelector('.scroll-progress');
  let ticking = false;
  const updateScroll = () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (progress) progress.style.transform = `scaleX(${Math.min(1, y / max)})`;
    if (header) {
      header.classList.toggle('scrolled', y > 24);
      header.classList.remove('hidden');
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScroll);
      ticking = true;
    }
  }, { passive: true });
  updateScroll();

  const reveals = document.querySelectorAll('.reveal');
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px' });
    reveals.forEach(element => observer.observe(element));
  } else {
    reveals.forEach(element => element.classList.add('in-view'));
  }

  const eras = document.querySelector('.ex-v3-eras');
  if (eras) {
    eras.querySelectorAll('.ex-v3-era').forEach(era => {
      const activate = () => {
        eras.classList.add('has-era-focus');
        era.classList.add('era-focus');
      };
      const deactivate = () => {
        eras.classList.remove('has-era-focus');
        era.classList.remove('era-focus');
      };
      era.addEventListener('mouseenter', activate);
      era.addEventListener('mouseleave', deactivate);
      era.addEventListener('focus', activate);
      era.addEventListener('blur', deactivate);
    });
  }

  const bays = document.querySelector('.room-bays');
  const detail = document.querySelector('.room-detail');
  const roomStage = document.querySelector('.room-stage');
  if (bays && detail) {
    const image = detail.querySelector('img');
    const label = detail.querySelector('figcaption');
    const count = detail.querySelector('.detail-count');
    const close = detail.querySelector('.detail-close');
    const prev = detail.querySelector('.detail-prev');
    const next = detail.querySelector('.detail-next');
    let images = [];
    let index = 0;
    let lastFocus = null;
    let pointerStartX = 0;
    let pointerActive = false;
    let swiped = false;

    const preloadNeighbors = () => {
      if (images.length < 2) return;
      [images[(index + 1) % images.length], images[(index - 1 + images.length) % images.length]]
        .forEach(source => {
          const preload = new Image();
          preload.src = source;
        });
    };

    const render = () => {
      if (!images.length) return;
      image.classList.add('pending-image');
      image.src = images[index];
      image.alt = `${label.dataset.galleryLabel || label.textContent} exhibition image ${index + 1} of ${images.length}`;
      label.textContent = `${label.dataset.galleryLabel || label.textContent} archive`;
      count.textContent = `${index + 1} / ${images.length}`;
      const single = images.length < 2;
      prev.hidden = single;
      next.hidden = single;
      image.setAttribute('aria-label', single ? 'Exhibition image' : 'Next image');
      preloadNeighbors();
    };

    const step = direction => {
      if (!images.length) return;
      index = (index + direction + images.length) % images.length;
      render();
    };

    const openDetail = bay => {
      lastFocus = bay;
      images = (bay.dataset.images || '')
        .split(',')
        .map(source => source.trim())
        .filter(Boolean);
      if (!images.length) return;
      index = 0;
      label.dataset.galleryLabel = bay.dataset.label || 'Exhibition';
      label.textContent = `${label.dataset.galleryLabel} archive`;
      detail.hidden = false;
      detail.setAttribute('aria-hidden', 'false');
      detail.classList.add('open');
      body.classList.add('modal-open');
      if (roomStage) roomStage.inert = true;
      render();
      close.focus();
    };

    const closeDetail = () => {
      if (!detail.classList.contains('open')) return;
      detail.classList.remove('open');
      detail.setAttribute('aria-hidden', 'true');
      detail.hidden = true;
      image.removeAttribute('src');
      image.alt = '';
      body.classList.remove('modal-open');
      if (roomStage) roomStage.inert = false;
      lastFocus?.focus();
    };

    bays.querySelectorAll('.room-bay').forEach(bay => {
      const activate = () => {
        bays.classList.add('has-active');
        bay.classList.add('active');
      };
      const deactivate = () => {
        bays.classList.remove('has-active');
        bay.classList.remove('active');
      };
      bay.addEventListener('mouseenter', activate);
      bay.addEventListener('mouseleave', deactivate);
      bay.addEventListener('focus', activate);
      bay.addEventListener('blur', deactivate);
      bay.addEventListener('click', () => openDetail(bay));
    });

    close.addEventListener('click', closeDetail);
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    image.addEventListener('click', () => {
      if (!swiped) step(1);
    });
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        step(1);
      }
    });
    detail.addEventListener('click', event => {
      if (event.target === detail) closeDetail();
    });

    if ('PointerEvent' in window) {
      detail.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse') return;
        pointerStartX = event.clientX;
        pointerActive = true;
        swiped = false;
      }, { passive: true });
      detail.addEventListener('pointerup', event => {
        if (!pointerActive || event.pointerType === 'mouse') return;
        pointerActive = false;
        const distance = event.clientX - pointerStartX;
        if (Math.abs(distance) > 48) {
          swiped = true;
          step(distance > 0 ? -1 : 1);
          window.setTimeout(() => { swiped = false; }, 0);
        }
      }, { passive: true });
      detail.addEventListener('pointercancel', () => { pointerActive = false; }, { passive: true });
    } else {
      let touchStartX = 0;
      detail.addEventListener('touchstart', event => {
        touchStartX = event.changedTouches[0]?.clientX ?? 0;
      }, { passive: true });
      detail.addEventListener('touchend', event => {
        const endX = event.changedTouches[0]?.clientX ?? touchStartX;
        const distance = endX - touchStartX;
        if (Math.abs(distance) > 48) step(distance > 0 ? -1 : 1);
      }, { passive: true });
    }

    document.addEventListener('keydown', event => {
      if (!detail.classList.contains('open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDetail();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        index = 0;
        render();
      } else if (event.key === 'End') {
        event.preventDefault();
        index = images.length - 1;
        render();
      } else if (event.key === 'Tab') {
        const controls = [close, prev, image, next].filter(control => !control.hidden);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  const audio = document.querySelector('#room-audio');
  const music = document.querySelector('.music-control');
  if (audio && music) {
    const stateKey = 'stopaz-exhibition-music';
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(stateKey) || '{}'); } catch (_) {}
    if (Number.isFinite(saved.time)) audio.currentTime = Math.max(0, saved.time);
    audio.autoplay = true;

    const persist = playing => {
      try { localStorage.setItem(stateKey, JSON.stringify({ playing, time: audio.currentTime || 0 })); } catch (_) {}
    };
    const syncMusic = playing => {
      music.classList.toggle('playing', playing);
      music.setAttribute('aria-pressed', String(playing));
      music.setAttribute('aria-label', playing ? 'Pause exhibition music' : 'Play exhibition music');
      persist(playing);
    };
    const play = async () => {
      try { await audio.play(); syncMusic(true); return true; }
      catch (_) { syncMusic(false); return false; }
    };
    music.addEventListener('click', async event => {
      event.stopPropagation();
      if (audio.paused) await play(); else audio.pause();
    });
    audio.addEventListener('play', () => syncMusic(true));
    audio.addEventListener('pause', () => syncMusic(false));
    audio.addEventListener('timeupdate', () => { if (!audio.paused) persist(true); });
    window.addEventListener('pagehide', () => persist(!audio.paused));

    if (body.dataset.musicOnInteraction === 'true') {
      let started = false;
      const shouldResume = saved.playing === true;
      const interactionTypes = ['pointerdown', 'touchstart', 'wheel', 'keydown'];
      const removeAttempts = () => interactionTypes.forEach(type => window.removeEventListener(type, attempt));
      const attempt = async event => {
        const target = event && event.target instanceof Element ? event.target : null;
        if (started || target?.closest('.music-control')) return;
        if (!shouldResume && event?.type === 'wheel') return;
        started = await play();
        if (started) removeAttempts();
      };
      if (shouldResume) { window.setTimeout(() => { play(); }, 80); }
      window.addEventListener('pageshow', () => { if (saved.playing === true) play(); });
      document.addEventListener('visibilitychange', () => { if (!document.hidden && saved.playing === true) play(); });
      interactionTypes.forEach(type => window.addEventListener(type, attempt, { passive: type !== 'keydown' }));
    }
  }
})();


// Exhibition entrance and page transition
(() => {
  const body = document.body;
  const overlay = document.createElement('div');
  overlay.className = 'exhibition-transition';
  overlay.setAttribute('aria-hidden', 'true');
  body.appendChild(overlay);

  document.querySelectorAll('a[href="exhibition.html"], a[href$="/exhibition.html"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === '_blank') return;
      const destination = link.href;
      if (!destination) return;
      event.preventDefault();
      body.classList.add('exhibition-departing');
      window.setTimeout(() => { window.location.href = destination; }, 180);
    });
  });

  const enter = document.querySelector('.ex-v3-enter[href="#eras"]');
  if (enter) {
    enter.addEventListener('click', event => {
      const eras = document.getElementById('eras');
      if (!eras) return;
      event.preventDefault();
      eras.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#eras');
    });
  }
})();
