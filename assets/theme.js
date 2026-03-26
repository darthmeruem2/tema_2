/* ============================================================
   SHIEH — theme.js (horizontal nav layout)
   ============================================================ */
(function () {
  'use strict';

  /* ── Mobile Menu ───────────────────────────────────────────── */
  const toggle = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  toggle && toggle.addEventListener('click', function () {
    const isOpen = mobileNav && mobileNav.classList.contains('is-open');
    if (isOpen) {
      mobileNav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
    } else {
      mobileNav && mobileNav.classList.add('is-open');
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      mobileNav && mobileNav.setAttribute('aria-hidden', 'false');
    }
  });

  /* ── Desktop Dropdown Nav ─────────────────────────────────── */
  document.querySelectorAll('.dropdown-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = this.closest('.has-dropdown');
      if (!item) return;
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.has-dropdown.is-open').forEach(function (el) { el.classList.remove('is-open'); });
      if (!isOpen) item.classList.add('is-open');
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-dropdown')) {
      document.querySelectorAll('.has-dropdown.is-open').forEach(function (el) { el.classList.remove('is-open'); });
    }
  });

  /* ── Quick Add to Cart ────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.product-card--quick-add');
    if (!btn) return;
    const variantId = btn.getAttribute('data-variant-id');
    if (!variantId) return;
    const original = btn.textContent;
    btn.textContent = '...';
    btn.style.pointerEvents = 'none';
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: 1 }),
    })
      .then(function (r) { return r.json(); })
      .then(function () { btn.textContent = 'Added!'; updateCartCount(); setTimeout(function () { btn.textContent = original; btn.style.pointerEvents = ''; }, 1500); })
      .catch(function () { btn.textContent = original; btn.style.pointerEvents = ''; });
  });

  /* ── Update Cart Count ────────────────────────────────────── */
  function updateCartCount() {
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        document.querySelectorAll('.cart-count-badge, .site-header--cart-count').forEach(function (el) {
          el.textContent = cart.item_count;
          el.style.display = cart.item_count > 0 ? '' : 'none';
        });
      });
  }
  window.updateCartCountAll = updateCartCount;

  /* ── Collapsible Rows ─────────────────────────────────────── */
  document.querySelectorAll('.collapsible-row--toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const content = this.nextElementSibling;
      if (!content) return;
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!expanded));
      if (expanded) {
        content.style.height = content.scrollHeight + 'px';
        requestAnimationFrame(function () { content.style.height = '0'; });
      } else {
        content.style.height = content.scrollHeight + 'px';
        content.addEventListener('transitionend', function handler() {
          content.style.height = 'auto';
          content.removeEventListener('transitionend', handler);
        });
      }
    });
  });

  /* ── Newsletter Form ─────────────────────────────────────── */
  document.querySelectorAll('.site-footer--newsletter-form, .subscribe-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const btn = form.querySelector('button');
      if (!input || !input.value) return;
      const orig = btn.textContent;
      btn.textContent = '...';
      fetch('/contact#contact_form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'form_type=customer&utf8=%E2%9C%93&contact%5Bemail%5D=' + encodeURIComponent(input.value),
      }).then(function () {
        btn.textContent = 'Done!';
        input.value = '';
        setTimeout(function () { btn.textContent = orig; }, 3000);
      }).catch(function () { btn.textContent = orig; });
    });
  });

  /* ── Utility ─────────────────────────────────────────────── */
  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  window._debounce = debounce;
})();
