// Solar Sight – Home Page JavaScript
// Handles: scroll animations, stat counters, sticky header, scroll-to-top

document.addEventListener('DOMContentLoaded', () => {

  // ─── Animate hero background on load ───
  const hero = document.getElementById('home-hero');
  if (hero) {
    requestAnimationFrame(() => hero.classList.add('is-loaded'));
  }

  // ─── Sticky header ───
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('ss-header--scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // ─── Scroll-to-top button ───
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ─── Reveal on scroll ───
  const reveals = document.querySelectorAll('.ss-reveal');
  if (reveals.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => revealObserver.observe(el));
  }

  // ─── Animated stat counters ───
  function animateCounter(el, target, duration = 1800) {
    const start = performance.now();
    const isLarge = target >= 1000;
    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = isLarge ? current.toLocaleString() : current;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const statNumbers = document.querySelectorAll('.ss-stat-number[data-target]');
  if (statNumbers.length) {
    const statObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10);
          animateCounter(el, target);
          statObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => statObserver.observe(el));
  }

  // ─── Add reveal classes to sections ───
  const revealTargets = [
    '#home-spotlight .ss-spotlight__inner',
    '#home-stats .ss-stats__title',
    '#home-stats .ss-stats__desc',
    '#home-stats .ss-stats__grid',
    '#home-segments .ss-segments__title',
    '#home-segments .ss-segments__grid',
    '#home-innovation .ss-innovation__title',
    '#home-innovation .ss-innovation__grid',
    '#home-sustain .ss-sustain__content',
    '#home-news .ss-news__header',
    '#home-news .ss-news__grid',
    '#home-cta .ss-container',
  ];

  revealTargets.forEach((selector, i) => {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add('ss-reveal');
      el.style.transitionDelay = `${(i % 3) * 0.08}s`;
    }
  });

  // Re-run observer on newly classed elements
  const reveals2 = document.querySelectorAll('.ss-reveal:not(.is-visible)');
  if (reveals2.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals2.forEach(el => obs.observe(el));
  }

});
