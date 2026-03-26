/* ============================================================
   SHIEH — components.js
   Product page, Cart, Collapsible, Variant selection
   ============================================================ */

(function () {
  'use strict';

  /* ── Collapsible Rows ─────────────────────────────────────── */
  function initCollapsibleRows() {
    document.querySelectorAll('.collapsible-row--toggle').forEach(function (toggle) {
      // Skip already initialized
      if (toggle.dataset.initialized) return;
      toggle.dataset.initialized = 'true';

      toggle.addEventListener('click', function () {
        var row = this.closest('.collapsible-row--root');
        var wrapper = row.querySelector('.collapsible-row--wrapper');
        var content = row.querySelector('.collapsible-row--content');
        var isOpen = row.classList.contains('is-open');

        if (isOpen) {
          wrapper.style.height = wrapper.scrollHeight + 'px';
          requestAnimationFrame(function () {
            wrapper.style.height = '0';
          });
          row.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        } else {
          var targetHeight = content.scrollHeight;
          wrapper.style.height = targetHeight + 'px';
          row.classList.add('is-open');
          toggle.setAttribute('aria-expanded', 'true');
          wrapper.addEventListener('transitionend', function onEnd() {
            wrapper.style.height = 'auto';
            wrapper.removeEventListener('transitionend', onEnd);
          });
        }
      });
    });
  }

  /* ── Product Gallery Mobile Carousel ─────────────────────── */
  function initProductGallery() {
    var carousel = document.querySelector('.product-mobile-carousel');
    if (!carousel) return;

    var container = carousel.querySelector('.carousel--container');
    var slides = carousel.querySelectorAll('.carousel--slide');
    var prevBtn = carousel.nextElementSibling && carousel.nextElementSibling.querySelector('[data-gallery-prev]');
    var nextBtn = carousel.nextElementSibling && carousel.nextElementSibling.querySelector('[data-gallery-next]');
    var currentEl = carousel.nextElementSibling && carousel.nextElementSibling.querySelector('.product-mobile-carousel--current');

    if (!container || slides.length === 0) return;

    var current = 0;
    var total = slides.length;

    function goTo(index) {
      current = Math.max(0, Math.min(index, total - 1));
      container.style.transform = 'translateX(-' + (current * 100) + '%)';
      if (currentEl) currentEl.textContent = current + 1;
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });

    // Touch swipe
    var touchStartX = 0;
    carousel.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carousel.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 40) {
        goTo(diff > 0 ? current + 1 : current - 1);
      }
    }, { passive: true });
  }

  /* ── Variant Selection ────────────────────────────────────── */
  function initVariantSelection() {
    var productForms = document.querySelectorAll('[data-product-form]');

    productForms.forEach(function (form) {
      var variantButtons = form.querySelectorAll('.radios--value-button');
      var variantInput = form.querySelector('[name="id"]');
      var priceEl = form.querySelector('.product-price--current');
      var compareEl = form.querySelector('.product-price--was');
      var addToCartBtn = form.querySelector('.product-buy-buttons--primary');

      // Get variants data from data attribute
      var variantsData = [];
      try {
        variantsData = JSON.parse(form.dataset.variants || '[]');
      } catch (e) {}

      variantButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          // Deselect siblings with same option
          var optionIndex = this.dataset.optionIndex;
          form.querySelectorAll('.radios--value-button[data-option-index="' + optionIndex + '"]').forEach(function (b) {
            b.classList.remove('is-selected');
          });
          this.classList.add('is-selected');

          // Update selected value display
          var optionContainer = this.closest('.product-options--option');
          var selectedValueEl = optionContainer && optionContainer.querySelector('.radios--selected-value');
          if (selectedValueEl) selectedValueEl.textContent = this.dataset.value;

          // Find matching variant
          var selectedOptions = {};
          form.querySelectorAll('.radios--value-button.is-selected').forEach(function (b) {
            selectedOptions[b.dataset.optionIndex] = b.dataset.value;
          });

          var matchedVariant = findVariant(variantsData, selectedOptions);

          if (matchedVariant) {
            // Update hidden input
            if (variantInput) variantInput.value = matchedVariant.id;

            // Update URL
            var url = new URL(window.location.href);
            url.searchParams.set('variant', matchedVariant.id);
            window.history.replaceState({}, '', url.toString());

            // Update price
            if (priceEl) {
              priceEl.textContent = formatMoney(matchedVariant.price);
            }

            if (compareEl) {
              if (matchedVariant.compare_at_price > matchedVariant.price) {
                compareEl.textContent = formatMoney(matchedVariant.compare_at_price);
                compareEl.style.display = '';
              } else {
                compareEl.style.display = 'none';
              }
            }

            // Update availability
            if (addToCartBtn) {
              var ctaText = addToCartBtn.querySelector('.product-buy-buttons--cta-text');
              if (!matchedVariant.available) {
                addToCartBtn.disabled = true;
                if (ctaText) ctaText.textContent = 'SOLD OUT';
              } else {
                addToCartBtn.disabled = false;
                if (ctaText) ctaText.textContent = 'ADD TO CART';
              }
            }
          }
        });
      });
    });
  }

  function findVariant(variants, selectedOptions) {
    return variants.find(function (variant) {
      return Object.keys(selectedOptions).every(function (index) {
        var optionKey = 'option' + (parseInt(index) + 1);
        return variant[optionKey] === selectedOptions[index];
      });
    });
  }

  function formatMoney(cents) {
    var amount = (cents / 100).toFixed(2);
    return '£' + amount;
  }

  /* ── Add to Cart (Product Form) ───────────────────────────── */
  function initProductForm() {
    document.querySelectorAll('[data-product-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var btn = form.querySelector('.product-buy-buttons--primary');
        var ctaText = btn && btn.querySelector('.product-buy-buttons--cta-text');
        var variantId = form.querySelector('[name="id"]');
        var qty = form.querySelector('[name="quantity"]');

        if (!variantId || !variantId.value) return;

        if (btn) btn.disabled = true;
        if (ctaText) ctaText.textContent = 'ADDING...';

        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: parseInt(variantId.value),
            quantity: qty ? parseInt(qty.value) || 1 : 1
          })
        })
          .then(function (res) { return res.json(); })
          .then(function () {
            if (ctaText) ctaText.textContent = 'ADDED!';
            updateCartCountAll();
            setTimeout(function () {
              if (btn) btn.disabled = false;
              if (ctaText) ctaText.textContent = 'ADD TO CART';
            }, 1800);
          })
          .catch(function () {
            if (btn) btn.disabled = false;
            if (ctaText) ctaText.textContent = 'ADD TO CART';
          });
      });
    });
  }

  /* ── Cart Page ────────────────────────────────────────────── */
  function initCartPage() {
    var cartForm = document.querySelector('[data-cart-form]');
    if (!cartForm) return;

    // Quantity change
    cartForm.addEventListener('click', function (e) {
      var btn = e.target.closest('.cart-qty--btn');
      if (!btn) return;

      var input = btn.closest('.cart-item--qty').querySelector('.cart-qty--input');
      if (!input) return;

      var current = parseInt(input.value) || 1;
      var delta = btn.dataset.delta === '-1' ? -1 : 1;
      var newVal = Math.max(0, current + delta);
      input.value = newVal;

      updateCartItem(input);
    });

    cartForm.addEventListener('change', function (e) {
      if (e.target.classList.contains('cart-qty--input')) {
        updateCartItem(e.target);
      }
    });

    // Remove item
    cartForm.addEventListener('click', function (e) {
      var removeBtn = e.target.closest('.cart-item--remove');
      if (!removeBtn) return;

      var input = removeBtn.closest('.cart-item--root').querySelector('.cart-qty--input');
      if (!input) return;

      input.value = 0;
      updateCartItem(input);
    });
  }

  function updateCartItem(input) {
    var lineIndex = parseInt(input.dataset.line) || 1;
    var quantity = parseInt(input.value) || 0;

    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: lineIndex, quantity: quantity })
    })
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        // Reload to reflect changes (simplest approach for Liquid templates)
        window.location.reload();
      })
      .catch(function (err) { console.error('Cart update failed', err); });
  }

  /* ── Update all cart count badges ────────────────────────── */
  function updateCartCountAll() {
    fetch('/cart.js')
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        var count = cart.item_count;
        document.querySelectorAll('.cart-count, .cart-count-badge').forEach(function (el) {
          el.textContent = count;
          el.style.display = count > 0 ? 'flex' : 'none';
        });
      });
  }

  /* ── Related Products (Shopify Recs API) ──────────────────── */
  function initRelatedProducts() {
    var el = document.querySelector('[data-related-products]');
    if (!el) return;

    var productId = el.dataset.productId;
    var limit = el.dataset.limit || 4;
    if (!productId) return;

    fetch('/recommendations/products.json?product_id=' + productId + '&limit=' + limit)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.products || data.products.length === 0) {
          el.closest('.related-products--root') && el.closest('.related-products--root').remove();
          return;
        }
        renderRelatedProducts(el, data.products);
      })
      .catch(function () {});
  }

  function renderRelatedProducts(container, products) {
    var html = products.map(function (product) {
      var variant = product.variants && product.variants[0];
      var price = variant ? formatMoney(variant.price) : '';
      var image = product.featured_image ? product.featured_image.src : '';
      var imgTag = image
        ? '<img src="' + image + '" alt="' + escapeHtml(product.title) + '" loading="lazy">'
        : '';

      return '<div class="product-card--root">' +
        '<a class="product-card--image-wrapper" href="' + product.url + '">' +
        imgTag +
        (variant ? '<div class="product-quick-add">' +
          '<button class="product-quick-add--button" data-variant-id="' + variant.id + '">' +
          '<div class="product-quick-add--text">' + (variant.available ? 'Choose options' : 'Sold out') + '</div>' +
          '</button></div>' : '') +
        '</a>' +
        '<div class="product-card--details">' +
        '<a href="' + product.url + '"><p class="product-card--title">' + escapeHtml(product.title) + '</p></a>' +
        '<div class="product--price-container">' +
        '<span class="product--price">' + price + '</span>' +
        '</div></div></div>';
    }).join('');

    container.innerHTML = html;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Collection Sidebar Toggle (mobile) ───────────────────── */
  function initSidebarToggle() {
    var btn = document.getElementById('sidebar-toggle');
    var content = document.getElementById('collection-sidebar-content');
    if (!btn || !content) return;

    btn.addEventListener('click', function () {
      var isOpen = content.classList.contains('is-open');
      content.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  /* ── Init ─────────────────────────────────────────────────── */
  function init() {
    initCollapsibleRows();
    initProductGallery();
    initVariantSelection();
    initProductForm();
    initCartPage();
    initRelatedProducts();
    initSidebarToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
