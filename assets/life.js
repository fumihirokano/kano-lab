// Official Instagram embeds load only after an explicit choice on Lab Life.
// Local photographs/video and the original-post links remain independent.
(() => {
  let libraryPromise = null;
  const ready = () => typeof window.instgrm?.Embeds?.process === 'function';
  const loadLibrary = () => {
    if (ready()) return Promise.resolve();
    if (libraryPromise) return libraryPromise;
    libraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      let settled = false;
      const finish = success => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (success && ready()) resolve();
        else { script.remove(); reject(new Error('Instagram embed unavailable')); }
      };
      const timer = setTimeout(() => finish(false), 15000);
      script.onload = () => finish(true);
      script.onerror = () => finish(false);
      document.head.append(script);
    }).catch(error => { libraryPromise = null; throw error; });
    return libraryPromise;
  };
  document.querySelectorAll('[data-instagram-post]').forEach(card => {
    const url = card.dataset.instagramPost;
    if (!/^https:\/\/www\.instagram\.com\/kano\.kyushu\.lab\/reel\/(DanSakFhqho|DY88jO-xtik)\/$/.test(url || '')) return;
    const load = card.querySelector('.instagram-load');
    const close = card.querySelector('.instagram-close');
    const host = card.querySelector('.instagram-host');
    const status = card.querySelector('.instagram-status');
    if (!load || !close || !host || !status) return;
    let active = false;
    let generation = 0;
    const reset = text => {
      active = false;
      generation += 1;
      host.replaceChildren();
      load.hidden = false;
      load.setAttribute('aria-expanded', 'false');
      close.hidden = true;
      status.textContent = text;
    };
    load.addEventListener('click', () => {
      if (active) return;
      active = true;
      const current = ++generation;
      const quote = document.createElement('blockquote');
      quote.className = 'instagram-media';
      quote.setAttribute('data-instgrm-permalink', url);
      quote.setAttribute('data-instgrm-version', '14');
      quote.setAttribute('data-instgrm-captioned', '');
      const fallback = document.createElement('a');
      fallback.href = url;
      fallback.textContent = 'Instagram';
      quote.append(fallback);
      host.append(quote);
      load.hidden = true;
      load.setAttribute('aria-expanded', 'true');
      close.hidden = false;
      close.focus();
      status.textContent = card.dataset.loadingText;
      loadLibrary().then(() => {
        if (!active || current !== generation) return;
        window.instgrm.Embeds.process();
        status.textContent = card.dataset.readyText;
      }).catch(() => {
        if (active && current === generation) {
          const restoreFocus = document.activeElement === close || host.contains(document.activeElement);
          reset(card.dataset.errorText);
          if (restoreFocus) load.focus();
        }
      });
    });
    close.addEventListener('click', () => {
      reset(card.dataset.closedText);
      load.focus();
    });
  });
})();
