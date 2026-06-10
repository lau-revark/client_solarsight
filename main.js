import { initTracking, trackLead, generateEventID, getMetaSignals } from './assets/js/tracking.js';

// Expose trackLead for non-module inline page scripts (e.g. the contact form,
// which fires a Lead from its own <script> block rather than importing here).
window.trackLead = trackLead;

// Mapbox SDK is only used on the DCPQ page. Lazy-load it from Mapbox's
// official CDN so we don't pay the ~140KB cost on every other page, and
// so it works in both bundled (Vite) and raw (GitHub Pages) deployments.
const MAPBOX_SEARCH_JS_URL = 'https://api.mapbox.com/search-js/v1.0.0-beta.22/web.js';
let mapboxLoaderPromise = null;
function loadMapboxIfNeeded() {
  if (!document.querySelector('mapbox-search-box')) return Promise.resolve();
  if (window.customElements && window.customElements.get('mapbox-search-box')) {
    return Promise.resolve();
  }
  if (mapboxLoaderPromise) return mapboxLoaderPromise;
  mapboxLoaderPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = MAPBOX_SEARCH_JS_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Mapbox search-js'));
    document.head.appendChild(s);
  }).then(() => customElements.whenDefined('mapbox-search-box'));
  return mapboxLoaderPromise;
}

// ─── Sticky Header ────────────────────────────────────
function initStickyHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ─── Mobile Nav Toggle ────────────────────────────────
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav    = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close on link click
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ─── Smooth Scroll Pre-Qual CTAs ─────────────────────
function initSmoothScrollCTAs() {
  document.querySelectorAll('a[href*="#prequal"], a[href*="#how-it-works"]').forEach(a => {
    a.addEventListener('click', (e) => {
      // Only handle same-page anchors
      const url = new URL(a.href, window.location.href);
      if (url.pathname !== window.location.pathname) return;

      const target = document.getElementById(url.hash.slice(1));
      if (!target) return;
      e.preventDefault();

      const headerH = document.getElementById('site-header')?.offsetHeight || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// Set a hidden input's value if the field exists. Used to forward the Meta
// match signals (eventID, _fbp, _fbc, fbclid, source URL) on the native POST.
function setHiddenValue(form, selector, value) {
  const el = form.querySelector(selector);
  if (el) el.value = value || '';
}

// ─── Pre-Qual Form Handler ────────────────────────────
// The form does a native HTML POST to https://app.solarsight.io/api/intake.
// The intake endpoint creates the HubSpot contact and 302-redirects the
// browser to app.solarsight.io. This file only handles:
//   1. Mapbox autocomplete → write address + state into hidden inputs
//   2. Enable the submit button once a valid address is selected
//   3. On submit, guard against an unselected address and fire tracking
function initPreQualForm() {
  const form = document.getElementById('landing-form');
  if (!form) return;

  const addressHidden = form.querySelector('#address-value');
  const submitBtn     = form.querySelector('#submit-button');
  const errorEl       = document.getElementById('prequal-error');

  const searchBox = document.querySelector('mapbox-search-box');
  if (searchBox) {
    // Resolve the Mapbox token. We try, in order:
    //   1. <meta name="mapbox-token" content="pk..."> on the page
    //   2. window.MAPBOX_TOKEN (set by an inline script if you prefer)
    //   3. Vite's import.meta.env.VITE_MAPBOX_TOKEN (for `vite dev` / build)
    // Mapbox public (pk.) tokens are designed for client-side use; protect
    // them with URL restrictions in the Mapbox dashboard, not by hiding.
    const meta = document.querySelector('meta[name="mapbox-token"]');
    const token =
      (meta && meta.getAttribute('content')) ||
      (typeof window !== 'undefined' && window.MAPBOX_TOKEN) ||
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MAPBOX_TOKEN);
    if (token) searchBox.accessToken = token;
    else console.warn('[SolarSight] No Mapbox access token found — address autocomplete disabled.');

    searchBox.options = {
      country: 'US',
      types: 'address',
      language: 'en',
      limit: 5,
      // DC proximity bias — kept by product decision (not in spec doc).
      // SolarSight currently targets Washington DC homeowners only;
      // strict USA-wide search would surface confusing out-of-area hits.
      proximity: '-77.0369,38.9072'
    };

    // When user selects a suggestion → store full address and unlock submit.
    searchBox.addEventListener('retrieve', (e) => {
      const [feature] = e.detail.features;
      if (!feature) return;

      const fullAddress = feature.properties.full_address || feature.properties.place_name;
      if (addressHidden) addressHidden.value = fullAddress;
      if (submitBtn)    submitBtn.disabled = false;
    });

    // If user clears or edits the text after selecting, require a new
    // selection by clearing the hidden value and re-disabling submit.
    searchBox.addEventListener('input', () => {
      if (addressHidden) addressHidden.value = '';
      if (submitBtn)    submitBtn.disabled = true;
    });
  }

  function showError(msg) {
    if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
  }
  function hideError() {
    if (errorEl) errorEl.style.display = 'none';
  }

  form.addEventListener('submit', (e) => {
    hideError();

    // Double-check that an address was actually selected from Mapbox
    // suggestions (rather than just typed). If not, block the submit.
    if (!addressHidden?.value) {
      e.preventDefault();
      showError('Please select an address from the suggestions.');
      if (searchBox) searchBox.focus();
      return;
    }

    // Generate one eventID shared by the browser Pixel (below) and the
    // server-side CAPI Lead that /api/intake fires, so Meta deduplicates the
    // two and counts the lead once. Forward the Meta match signals
    // (_fbp / _fbc / fbclid) and source URL via hidden inputs on the native
    // POST so the server can attach them to the CAPI event. See
    // docs/meta-capi-spec.md.
    const eventID = generateEventID();
    const { fbp, fbc, fbclid, eventSourceUrl } = getMetaSignals();
    setHiddenValue(form, '#fb-event-id', eventID);
    setHiddenValue(form, '#fb-event-source-url', eventSourceUrl);
    setHiddenValue(form, '#fb-fbp', fbp);
    setHiddenValue(form, '#fb-fbc', fbc);
    setHiddenValue(form, '#fb-fbclid', fbclid);

    // Collect details for Meta Advanced Matching (hashed in-browser by the Pixel).
    const user = {
      email:     form.querySelector('#email')?.value.trim(),
      firstName: form.querySelector('#firstName')?.value.trim(),
      lastName:  form.querySelector('#lastName')?.value.trim()
    };

    // Show loading state while the browser POSTs and follows the 302
    // from /api/intake to app.solarsight.io.
    submitBtn.disabled = true;
    submitBtn.textContent = 'Analysing your roof data…';
    form.style.opacity = '0.7';

    // Fire Meta Pixel Lead event just before native form submission, using the
    // shared eventID. fbq queues the beacon; the browser lets it complete in
    // most cases — and the server CAPI Lead is the guaranteed-delivery backstop.
    trackLead(user, { eventID });

    // Form submits natively — browser navigates to /api/intake which
    // returns a 302 to app.solarsight.io.
  });
}

// ─── Reveal on Scroll ─────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

// ─── Active Nav Highlight ─────────────────────────────
function initActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('#site-nav a').forEach(a => {
    const href = new URL(a.href, window.location.href).pathname;
    if (href === path || (path === '/' && href === '/')) {
      a.classList.add('active');
    }
  });
}

// ─── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initTracking();
  initStickyHeader();
  initMobileNav();
  initSmoothScrollCTAs();
  initReveal();
  initActiveNav();
  // Pre-qual form depends on the Mapbox custom element being defined.
  await loadMapboxIfNeeded();
  initPreQualForm();
});
