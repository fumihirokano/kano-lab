const menu = document.querySelector('.menu');
const nav = document.querySelector('#navigation');
if (menu && nav) {
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    nav.classList.toggle('open', expanded);
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.focus();
    }
  });
}

// Load the research film only after an explicit request. No third-party player
// or thumbnail requests are made when the page initially opens.
document.querySelectorAll('[data-research-film]').forEach(film => {
  const stage = film.querySelector('.film-stage');
  const starter = film.querySelector('.film-starter');
  const stop = film.querySelector('.film-stop');
  const status = film.querySelector('.film-status');
  const videoId = film.dataset.videoId;
  if (!stage || !starter || !stop || !status || !/^[\w-]{11}$/.test(videoId || '')) return;
  let player = null;
  const reset = () => {
    if (player) player.remove();
    player = null;
    starter.hidden = false;
    stop.hidden = true;
    status.textContent = film.dataset.closedText;
    starter.focus();
  };
  const load = (start = 0) => {
    if (player) player.remove();
    const language = document.documentElement.lang === 'ja' ? 'ja' : 'en';
    const parameters = new URLSearchParams({autoplay: '0', controls: '1',
      playsinline: '1', rel: '0', hl: language, cc_load_policy: '1', cc_lang_pref: language});
    if (start > 0) parameters.set('start', String(Math.floor(start)));
    player = document.createElement('iframe');
    player.src = `https://www.youtube-nocookie.com/embed/${videoId}?${parameters}`;
    player.title = film.dataset.videoTitle;
    player.allow = 'encrypted-media; fullscreen; picture-in-picture';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    player.setAttribute('tabindex', '0');
    starter.hidden = true;
    stage.append(player);
    stop.hidden = false;
    status.textContent = film.dataset.loadedText;
    player.focus();
  };
  starter.addEventListener('click', () => load());
  stop.addEventListener('click', reset);
  film.querySelectorAll('[data-film-start]').forEach(button => {
    button.addEventListener('click', () => {
      const start = Number(button.dataset.filmStart);
      if (Number.isFinite(start) && start >= 0) load(start);
    });
  });
});

// A silent, original field clip. Respect motion/data preferences and stop
// off-screen, in background tabs, or whenever the visitor presses Pause.
document.querySelectorAll('[data-field-motion]').forEach(video => {
  const figure = video.closest('.motion-figure');
  const button = figure?.querySelector('.motion-toggle');
  if (!button) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection?.saveData);
  let inView = false;
  let userPaused = false;
  let userStarted = false;
  video.muted = true;
  video.defaultMuted = true;
  button.hidden = false;
  const updateButton = () => {
    button.textContent = video.paused ? button.dataset.playText : button.dataset.pauseText;
    button.setAttribute('aria-label', button.textContent);
  };
  const syncPlayback = () => {
    if (inView && !document.hidden && !userPaused &&
        (userStarted || (!reduced.matches && !saveData))) {
      video.play().catch(updateButton);
    } else {
      video.pause();
    }
    updateButton();
  };
  video.addEventListener('play', updateButton);
  video.addEventListener('pause', updateButton);
  button.addEventListener('click', () => {
    if (video.paused) { userStarted = true; userPaused = false; inView = true; }
    else { userPaused = true; }
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  reduced.addEventListener('change', () => {
    if (reduced.matches) userStarted = false;
    syncPlayback();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.25;
      syncPlayback();
    }, {threshold: [0, 0.25]});
    observer.observe(video);
  } else {
    inView = true;
    syncPlayback();
  }
  updateButton();
});
