import { initTracking, trackLead } from './assets/js/tracking.js';

// Mapbox SDK is only used on the DCPQ page. Lazy-load it from Mapbox's
// official CDN so we don't pay the ~140KB cost on every other page, and
// so it works in both bundled (Vite) and raw (GitHub Pages) deployments.
const MAPBOX_SEARCH_JS_URL = 'https://api.mapbox.com/search-js/v1.0.0-beta.21/web.js';
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

// ─── Pre-Qual Form Handler ────────────────────────────
function initPreQualForm() {
  const form        = document.getElementById('prequal-form');
  if (!form) return;

  const addressInput   = form.querySelector('#address');
  const emailInput     = form.querySelector('#email');
  const firstNameInput = form.querySelector('#firstName');
  const lastNameInput  = form.querySelector('#lastName');
  const submitBtn      = form.querySelector('#prequal-submit');
  const loadingEl    = document.getElementById('prequal-loading');
  const successEl    = document.getElementById('prequal-success');
  const errorEl      = document.getElementById('prequal-error');

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
      proximity: '-77.0369,38.9072'
    };

    searchBox.addEventListener('retrieve', (e) => {
      const [feature] = e.detail.features;
      if (!feature) return;

      const [lng, lat] = feature.geometry.coordinates;
      const address = feature.properties.full_address;
      const state = feature.properties.context.region.region_code;
      
      if (addressInput) addressInput.value = address;
      const stateInput = document.getElementById('state');
      if (stateInput) stateInput.value = state;
    });
  }

  function showError(msg) {
    if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
  }
  function hideError() {
    if (errorEl) errorEl.style.display = 'none';
  }
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  const INTAKE_ENDPOINT = 'https://dev-app.solarsight.io/api/intake';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const address   = addressInput?.value.trim() || '';
    const email     = emailInput?.value.trim() || '';
    const firstName = firstNameInput?.value.trim() || '';
    const lastName  = lastNameInput?.value.trim() || '';
    const state     = document.getElementById('state')?.value.trim() || '';

    // Validation
    if (!address) { showError('Please select a valid property address.'); if (searchBox) searchBox.focus(); return; }
    if (!email)   { showError('Please enter your email address.'); emailInput?.focus(); return; }
    if (!isValidEmail(email)) { showError('Please enter a valid email address.'); emailInput?.focus(); return; }

    // Loading state
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Analysing your roof data…';
    form.style.opacity = '0.7';

    try {
      const response = await fetch(INTAKE_ENDPOINT, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ address, email, firstName, lastName, state, source: 'dcpq' })
      });

      if (!response.ok) {
        throw new Error(`Intake request failed with status ${response.status}`);
      }

      // Success state
      form.style.display = 'none';
      if (loadingEl) loadingEl.style.display = 'none';
      if (successEl) successEl.style.display = 'block';

      // ─── Tracking ─────────────────────────────────────
      trackLead();
    } catch (err) {
      console.error('[SolarSight] Pre-Qual intake failed:', err);
      showError('Something went wrong submitting your details. Please try again, or contact us if the issue persists.');
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      form.style.opacity = '1';
    }
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
