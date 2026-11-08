// A Party Please — home page behavior
(function () {
  const nav = document.getElementById('main-nav');
  const cake = document.getElementById('cake-toggle');
  const mobile = window.matchMedia('(max-width: 960px)');

  // Cake menu (mobile)
  function setNav(open) {
    cake.setAttribute('aria-expanded', String(open));
    cake.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.hidden = mobile.matches && !open;
  }
  cake.addEventListener('click', () => setNav(cake.getAttribute('aria-expanded') !== 'true'));
  mobile.addEventListener('change', () => setNav(false));
  setNav(false);

  // Dropdowns (click/tap + keyboard)
  const triggers = document.querySelectorAll('.menu-trigger');
  function closeMenus(except) {
    triggers.forEach(t => {
      if (t === except) return;
      t.setAttribute('aria-expanded', 'false');
      t.parentElement.classList.remove('open');
    });
  }
  triggers.forEach(t => {
    t.addEventListener('click', e => {
      e.stopPropagation();
      const open = t.getAttribute('aria-expanded') !== 'true';
      closeMenus(t);
      t.setAttribute('aria-expanded', String(open));
      t.parentElement.classList.toggle('open', open);
    });
  });
  document.addEventListener('click', () => closeMenus());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenus(); if (mobile.matches) setNav(false); } });

  // Close the mobile menu after choosing a link
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) { closeMenus(); if (mobile.matches) setNav(false); }
  });

  // Pre-fill the quote form (home page only)
  const eventSelect = document.getElementById('f-event');
  if (eventSelect) {
    const charRow = document.getElementById('row-character');
    const charBox = document.getElementById('s-characters');
    const notes = document.getElementById('f-notes');

    function syncCharacter() { charRow.hidden = !charBox.checked; }
    charBox.addEventListener('change', syncCharacter);

    document.querySelectorAll('[data-service]').forEach(a => a.addEventListener('click', () => {
      const box = document.getElementById('s-' + a.dataset.service);
      if (box) box.checked = true;
      syncCharacter();
    }));
    document.querySelectorAll('[data-event]').forEach(a => a.addEventListener('click', () => {
      eventSelect.value = a.dataset.event;
      if (a.dataset.event === 'kids' || a.dataset.event === 'holiday') { charBox.checked = true; syncCharacter(); }
    }));
    document.querySelectorAll('[data-bundle="princess"]').forEach(a => a.addEventListener('click', () => {
      eventSelect.value = 'kids';
      ['characters', 'decor'].forEach(s => { document.getElementById('s-' + s).checked = true; });
      syncCharacter();
      if (!notes.value) notes.value = 'Interested in the Pretty as a Princess bundle.';
    }));

    // Earliest selectable date = today
    const date = document.getElementById('f-date');
    date.min = new Date().toISOString().slice(0, 10);

    // Arriving from the Characters page: index.html?character=Name#build
    const wanted = new URLSearchParams(location.search).get('character');
    if (wanted) {
      const sel = document.getElementById('f-character');
      const opt = [...sel.options].find(o => o.text.toLowerCase() === wanted.toLowerCase());
      if (opt) sel.value = opt.text;
      eventSelect.value = eventSelect.value || 'kids';
      charBox.checked = true; syncCharacter();
    }
  }

  // Characters page filter
  const filterBtns = document.querySelectorAll('[data-filter]');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filterBtns.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    document.querySelectorAll('.char-card').forEach(card => { card.hidden = f !== 'all' && card.dataset.cat !== f; });
  }));

  // Mini carousels (event cards): auto-fade, pause on hover, still for reduced motion
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.mini-carousel').forEach(box => {
    const imgs = [...box.querySelectorAll('img')];
    const dotsWrap = box.querySelector('.mini-dots');
    const dots = imgs.map(() => dotsWrap.appendChild(document.createElement('i')));
    let i = 0, hover = false;
    const show = n => {
      i = n % imgs.length;
      imgs.forEach((img, k) => { img.classList.toggle('is-active', k === i); img.setAttribute('aria-hidden', String(k !== i)); });
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
      imgs[(i + 1) % imgs.length].loading = 'eager';
    };
    show(0);
    if (still || imgs.length < 2) return;
    box.addEventListener('mouseenter', () => { hover = true; });
    box.addEventListener('mouseleave', () => { hover = false; });
    setInterval(() => { if (!hover && !document.hidden) show(i + 1); }, +box.dataset.interval || 3500);
  });

  // Image protection: block right-click/long-press menus, dragging, and copying of images
  const onImg = e => e.target instanceof Element && e.target.closest('img, .char-photo, .service-img');
  document.addEventListener('contextmenu', e => { if (onImg(e)) e.preventDefault(); });
  document.addEventListener('dragstart', e => { if (onImg(e)) e.preventDefault(); });
  document.addEventListener('copy', e => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && sel.getRangeAt(0).cloneContents().querySelector('img')) e.preventDefault();
  });
  document.querySelectorAll('img').forEach(img => img.setAttribute('draggable', 'false'));

  document.getElementById('year').textContent = new Date().getFullYear();
})();

// Booking form: send to Web3Forms without leaving the page
(function () {
  const form = document.getElementById('quote-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const status = document.getElementById('form-status');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    try {
      const r = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      const d = await r.json();
      if (!d.success) throw new Error(d.message);
      form.innerHTML = '<p class="form-thanks" role="status"><strong>Thank you!</strong> Your party request is on its way. We\u2019ll be in touch soon.</p>';
    } catch (err) {
      btn.disabled = false;
      btn.textContent = label;
      status.textContent = 'Sorry, something went wrong. Please call or text 707-395-8395 or email apartyplease@gmail.com.';
    }
  });
})();
