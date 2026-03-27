/**
 * SolarSight Tracking Management
 * Centralized initialization and event tracking for Meta, Google, TikTok, and Pinterest.
 */

export const PIXEL_IDS = {
  meta: '1196291579054067',
  google: null,    // Placeholder for future Google Tag (G-XXXXXXXXXX)
  tiktok: null,    // Placeholder for future TikTok Pixel
  pinterest: null  // Placeholder for future Pinterest Pixel
};

/**
 * Initialize all active tracking pixels.
 */
export function initTracking() {
  console.log('[SolarSight] Initializing tracking pixels...');

  // ─── Meta Pixel ─────────────────────────────────────────
  if (PIXEL_IDS.meta) {
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    fbq('init', PIXEL_IDS.meta);
    fbq('track', 'PageView');
    console.log('[SolarSight] Meta Pixel initialized.');
  }

  // ─── Google Tag (Placeholder) ───────────────────────────
  if (PIXEL_IDS.google) {
    // Standard Google Tag Snippet
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){dataLayer.push(arguments);}
    // gtag('js', new Date());
    // gtag('config', PIXEL_IDS.google);
  }

  // ─── TikTok Pixel (Placeholder) ──────────────────────────
  if (PIXEL_IDS.tiktok) {
    // Standard TikTok Pixel Snippet
  }

  // ─── Pinterest Pixel (Placeholder) ───────────────────────
  if (PIXEL_IDS.pinterest) {
    // Standard Pinterest Pixel Snippet
  }
}

/**
 * Track a successful Lead (Pre-Qual form submission).
 */
export function trackLead() {
  console.log('[SolarSight] Tracking Lead event...');

  // Meta
  if (window.fbq && PIXEL_IDS.meta) {
    fbq('track', 'Lead');
  }

  // Google (Planned)
  if (window.gtag && PIXEL_IDS.google) {
    // gtag('event', 'generate_lead', { 'currency': 'USD', 'value': 0.00 });
  }

  // TikTok (Planned)
  if (window.ttq && PIXEL_IDS.tiktok) {
    // ttq.track('CompleteRegistration');
  }

  // Pinterest (Planned)
  if (window.pintrk && PIXEL_IDS.pinterest) {
    // pintrk('track', 'lead');
  }
}
