import './style.css'
import './assets/css/home.css'
import './assets/css/pages.css'

// ─── Component Loader ─────────────────────────────────
async function loadComponent(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error(err);
  }
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
  document.querySelectorAll('a[href*="#prequal-form"], a[href*="#how-it-works"]').forEach(a => {
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

  const addressInput = form.querySelector('#address');
  const emailInput   = form.querySelector('#email');
  const submitBtn    = form.querySelector('#prequal-submit');
  const loadingEl    = document.getElementById('prequal-loading');
  const successEl    = document.getElementById('prequal-success');
  const errorEl      = document.getElementById('prequal-error');

  function showError(msg) {
    if (errorEl) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
  }
  function hideError() {
    if (errorEl) errorEl.style.display = 'none';
  }
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const address = addressInput?.value.trim() || '';
    const email   = emailInput?.value.trim() || '';

    // Validation
    if (!address) { showError('Please enter your property address.'); addressInput?.focus(); return; }
    if (!email)   { showError('Please enter your email address.'); emailInput?.focus(); return; }
    if (!isValidEmail(email)) { showError('Please enter a valid email address.'); emailInput?.focus(); return; }

    // Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Analysing your roof data…';
    form.style.opacity = '0.7';

    // ─── HubSpot Integration ──────────────────────────
    // TODO: Replace this stub with the real HubSpot form endpoint once supplied by Don.
    console.log('[SolarSight] Pre-Qual submission (HubSpot stub):', { address, email });

    // Simulate async (remove once real endpoint is live)
    await new Promise(r => setTimeout(r, 1800));

    // Success state
    form.style.display = 'none';
    if (loadingEl) loadingEl.style.display = 'none';
    if (successEl) successEl.style.display = 'block';
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
  await Promise.all([
    loadComponent('header', '/components/header.html'),
    loadComponent('footer', '/components/footer.html'),
  ]);

  initStickyHeader();
  initMobileNav();
  initSmoothScrollCTAs();
  initPreQualForm();
  initReveal();
  initActiveNav();
});
