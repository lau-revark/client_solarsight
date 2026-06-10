/**
 * SolarSight Tracking Management
 *
 * Architecture (see docs/meta-capi-spec.md and Jira SS-641 / SS-642):
 *
 *   • GOAL STATE — a single Google Tag Manager (GTM) container, installed on
 *     this property by the marketing team, owns the Meta Pixel + GA4. This file
 *     then only pushes well-named events to `dataLayer` and lets GTM fire the
 *     tags. That keeps pixel IDs and tag config in the GTM UI (not the repo)
 *     and is the single source of truth, so events never double-fire.
 *
 *   • BRIDGE STATE — until the GTM container has its Meta + conversion tags
 *     configured and PUBLISHED, this file fires the Meta Pixel directly so
 *     tracking never goes dark. At cutover, flip `GTM_OWNS_META` to true (once
 *     the GTM tags are live): the hardcoded pixel then stands down and events
 *     flow only through the dataLayer, so the two never double-fire. The flag
 *     plus the GTM-present check make the switch atomic in both directions.
 *
 *   • Every Lead carries an `event_id` so the browser event can be
 *     deduplicated against the server-side Meta Conversions API Lead that
 *     app.solarsight.io fires. Advanced Matching uses email + name only —
 *     never phone (privacy.html §4.5).
 */

export const PIXEL_IDS = {
  meta: '1196291579054067',
  google: null,    // Configured inside GTM, not here (SS-641).
  tiktok: null,    // Added in GTM by marketing post-Consent-Mode (SS-642).
  pinterest: null  // Added in GTM by marketing post-Consent-Mode (SS-642).
};

/**
 * CUTOVER SWITCH. Leave false until the GTM container (GTM-PLRZ3T8Q) has the
 * Meta Pixel base tag AND the conversion tags (prequal_submitted, etc.)
 * configured and PUBLISHED. Set to true at that moment to hand Meta + GA4 over
 * to GTM. While false, the Meta Pixel fires directly from this file so tracking
 * never goes dark; flipping it before GTM is on the page is also safe (the
 * hardcoded pixel only stands down when GTM is actually present — see gtmActive).
 */
const GTM_OWNS_META = false;

// ─── Helpers ────────────────────────────────────────────

/**
 * Has the GTM container snippet been installed on the page? The GTM snippet
 * synchronously creates `window.dataLayer` and pushes a `gtm.start` marker
 * before our module runs, so this is a reliable, synchronous check that
 * distinguishes "marketing installed GTM" from "we created a dataLayer array".
 * @returns {boolean}
 */
function gtmInstalled() {
  return typeof window !== 'undefined'
    && Array.isArray(window.dataLayer)
    && window.dataLayer.some((entry) => entry && entry['gtm.start']);
}

/**
 * True only when we've cut Meta over to GTM (`GTM_OWNS_META`) AND the GTM
 * container is actually present on the page. This is the single gate that
 * decides whether the hardcoded Meta Pixel fires (bridge) or stands down so
 * GTM owns the tags — guaranteeing the two never both fire.
 * @returns {boolean}
 */
function gtmActive() {
  return GTM_OWNS_META && gtmInstalled();
}

/**
 * Generate a unique event ID used to deduplicate a browser event against its
 * server-side Conversions API counterpart. The SAME id must be sent by the
 * browser (Pixel `eventID` / dataLayer `event_id`) and by the server (`event_id`).
 * @returns {string}
 */
export function generateEventID() {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'ss-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

/**
 * Read a cookie value by name.
 * @param {string} name
 * @returns {string|null}
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? decodeURIComponent(match.pop()) : null;
}

/**
 * Collect the Meta matching signals the server needs for the Conversions API:
 * the `_fbp` / `_fbc` cookies (synthesising `fbc` from `fbclid` when the Pixel
 * hasn't written it yet) and the page URL. Forwarded to /api/intake so the
 * server CAPI Lead can match and dedupe against the browser event.
 * @returns {{fbp: string|null, fbc: string|null, fbclid: string|null, eventSourceUrl: string}}
 */
export function getMetaSignals() {
  const fbp = getCookie('_fbp');
  let fbc = getCookie('_fbc');
  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  if (!fbc && fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }
  return { fbp, fbc, fbclid, eventSourceUrl: window.location.href };
}

/**
 * Initialize tracking.
 *  - If GTM is installed, it owns page views + all pixels. Do nothing here.
 *  - Otherwise, load the Meta Pixel directly as a bridge so we don't lose
 *    tracking before the GTM container ships.
 */
export function initTracking() {
  window.dataLayer = window.dataLayer || [];

  if (gtmActive()) {
    console.log('[SolarSight] GTM owns Meta + GA4; hardcoded pixel standing down.');
    return; // GTM fires PageView and owns the tags.
  }

  console.log('[SolarSight] Bridge mode — loading Meta Pixel directly (GTM_OWNS_META is false or GTM not yet on page).');

  // ─── Meta Pixel (bridge, until GTM is installed) ────────
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
    console.log('[SolarSight] Meta Pixel initialized (bridge mode).');
  }
}

/**
 * Track a Lead (pre-qual or contact submission).
 *
 * Pushes a GTM-native event to the dataLayer so that, once GTM owns the pixels,
 * its Meta + GA4 tags fire — using the `user_data` here for Advanced Matching
 * (email + name only). In bridge mode (no GTM), also fires the Meta Pixel
 * directly so the conversion isn't lost. Either way exactly one Meta event
 * fires, carrying the shared `event_id` for server-side dedup.
 *
 * @param {{email?: string, firstName?: string, lastName?: string}} [user]
 * @param {{eventID?: string, dataLayerEvent?: string}} [options]
 * @returns {string} the eventID used — forward this to the server for dedup.
 */
export function trackLead(user = {}, options = {}) {
  const eventID = options.eventID || generateEventID();
  const dataLayerEvent = options.dataLayerEvent || 'prequal_submitted';
  console.log('[SolarSight] Tracking Lead event...', { event: dataLayerEvent, eventID });

  if (gtmActive()) {
    // GTM owns the tags. Push the event + matching data; marketing maps this
    // dataLayer event to Meta `Lead` (+ GA4 `generate_lead`) in the GTM UI,
    // reading user_data for Advanced Matching. Phone is intentionally never
    // included (privacy.html §4.5).
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: dataLayerEvent,
      event_id: eventID,
      user_data: {
        email:      user.email || undefined,
        first_name: user.firstName || undefined,
        last_name:  user.lastName || undefined
      }
    });
  } else if (window.fbq && PIXEL_IDS.meta) {
    // Bridge: fire the Meta Pixel directly. The Pixel normalises + hashes the
    // Advanced Matching fields (email + name only) in-browser.
    const matching = {};
    if (user.email)     matching.em = user.email;
    if (user.firstName) matching.fn = user.firstName;
    if (user.lastName)  matching.ln = user.lastName;
    if (Object.keys(matching).length) {
      fbq('init', PIXEL_IDS.meta, matching);
    }
    fbq('track', 'Lead', {}, { eventID });
  }

  return eventID;
}
