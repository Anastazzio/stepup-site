/* STEP UP: Basic Consent Mode v2. No Google tag is loaded before analytics consent. */
(function () {
  'use strict';
  if (window.STEPUPConsent) return;
  var ID = 'G-HRGJSC53VL';
  var KEY = 'stepup_consent_v1';
  var AGE = 180 * 24 * 60 * 60 * 1000;
  var allowedHost = location.hostname === 'www.stepupdancegr.com' || location.hostname === 'stepupdancegr.com';
  var isGreek = document.documentElement.lang === 'el';
  var isBlog = /^\/(el\/)?blog\/post\/?$/.test(location.pathname);
  var ready = !isBlog || document.documentElement.dataset.stepupPageReady === 'true';
  var initialized = false;
  var pageSent = false;
  var consent = null;
  var expiryTimer;
  var banner;
  var dialog;
  var checkbox;
  var status;
  var text = isGreek ? {
    title: 'Η επιλογή σου για τα cookies',
    description: 'Το STEP UP Dance Studio χρησιμοποιεί Google Analytics μόνο με την άδειά σου, για στατιστικά επισκεψιμότητας και βελτίωση του website. Η επιλογή σου δεν επηρεάζει την πρόσβαση στις σελίδες.',
    accept: 'Αποδοχή analytics', reject: 'Απόρριψη analytics', settings: 'Ρυθμίσεις cookies',
    details: 'Cookies & απόρρητο', necessary: 'Απαραίτητη αποθήκευση',
    necessaryText: 'Θυμόμαστε την επιλογή σου για 180 ημέρες σε αυτόν τον browser.',
    analytics: 'Στατιστικά Google Analytics',
    analyticsText: 'Σελίδες που βλέπεις, διάρκεια επίσκεψης, πηγή επισκεψιμότητας και πληροφορίες συσκευής. Χωρίς διαφημιστική εξατομίκευση. Μπορείς να ανακαλέσεις την άδεια οποιαδήποτε στιγμή.',
    save: 'Αποθήκευση επιλογής', close: 'Κλείσιμο',
    enabled: 'Τα analytics είναι ενεργοποιημένα.', disabled: 'Τα analytics είναι απενεργοποιημένα.'
  } : {
    title: 'Your cookie choice',
    description: 'STEP UP Dance Studio uses Google Analytics only with your permission, to understand visits and improve this website. Your choice does not affect access to any page.',
    accept: 'Accept analytics', reject: 'Reject analytics', settings: 'Cookie settings',
    details: 'Cookies & privacy', necessary: 'Necessary storage',
    necessaryText: 'We remember your choice for 180 days in this browser.',
    analytics: 'Google Analytics statistics',
    analyticsText: 'Pages you view, visit duration, traffic source and device information. No advertising personalization. You can withdraw your permission at any time.',
    save: 'Save choice', close: 'Close',
    enabled: 'Analytics are enabled.', disabled: 'Analytics are disabled.'
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  var denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  window.gtag('consent', 'default', denied);
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);

  function readChoice() {
    try {
      var saved = JSON.parse(localStorage.getItem(KEY));
      if (saved && saved.version === 1 && typeof saved.analytics === 'boolean' &&
          Number.isFinite(saved.timestamp) && saved.timestamp <= Date.now() && Date.now() - saved.timestamp < AGE) return saved;
    } catch (_) { /* Missing or inaccessible storage never implies consent. */ }
    return null;
  }

  function cleanLocation() {
    var url = new URL(location.href);
    var originalParams = new URLSearchParams(url.search);
    var id = isBlog ? url.searchParams.get('id') : null;
    url.search = '';
    url.hash = '';
    if (id && /^[a-z0-9-]{1,100}$/.test(id)) url.searchParams.set('id', id);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_id', 'utm_content', 'utm_term'].forEach(function (key) {
      var value = originalParams.get(key);
      if (value && /^[\p{L}\p{N}_. -]{1,100}$/u.test(value)) url.searchParams.set(key, value);
    });
    return url.href;
  }

  function cleanReferrer() {
    try {
      var url = new URL(document.referrer);
      return url.origin + url.pathname;
    } catch (_) { return ''; }
  }

  function sendPage() {
    if (!initialized || pageSent || !ready || !consent || !consent.analytics) return;
    pageSent = true;
    window.gtag('event', 'page_view', {
      send_to: ID, page_location: cleanLocation(), page_referrer: cleanReferrer(),
      page_title: document.title, language: isGreek ? 'el' : 'en'
    });
  }

  function startAnalytics() {
    if (!allowedHost || initialized || !consent || !consent.analytics) return;
    initialized = true;
    window['ga-disable-' + ID] = false;
    window.gtag('consent', 'update', {
      analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: location.hostname,
      cookie_expires: AGE / 1000,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure',
      page_location: cleanLocation(), page_referrer: cleanReferrer()
    });
    var script = document.createElement('script');
    script.id = 'stepup-google-analytics';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(script);
    sendPage();
  }

  function clearAnalyticsCookies() {
    ['_ga', '_ga_HRGJSC53VL'].forEach(function (name) {
      ['', location.hostname, '.' + location.hostname, 'stepupdancegr.com', '.stepupdancegr.com'].forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax; Secure' + (domain ? '; Domain=' + domain : '');
      });
    });
  }

  function applyChoice() {
    clearTimeout(expiryTimer);
    if (checkbox) checkbox.checked = !!(consent && consent.analytics);
    if (banner) banner.hidden = !!consent;
    if (status) status.textContent = consent && consent.analytics ? text.enabled : text.disabled;
    if (consent) expiryTimer = setTimeout(expireChoice, Math.min(2147483647, Math.max(1, consent.timestamp + AGE - Date.now())));
    if (consent && consent.analytics) {
      startAnalytics();
    } else {
      window['ga-disable-' + ID] = true;
      window.gtag('consent', 'update', denied);
      clearAnalyticsCookies();
      // Unload the already running library so it cannot send later cookieless events.
      if (initialized) location.reload();
    }
  }

  function expireChoice() {
    if (consent && Date.now() - consent.timestamp >= AGE) consent = null;
    applyChoice();
  }

  function choose(analytics) {
    consent = { version: 1, analytics: analytics, timestamp: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(consent)); } catch (_) { /* Current page choice only. */ }
    if (dialog && dialog.open) dialog.close();
    applyChoice();
    sendPage();
  }

  function el(tag, label, className) {
    var node = document.createElement(tag);
    if (label) node.textContent = label;
    if (className) node.className = className;
    return node;
  }
  function button(label, action) {
    var node = el('button', label, 'stepup-consent-button');
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }
  function openSettings() {
    if (!dialog) return;
    checkbox.checked = !!(consent && consent.analytics);
    dialog.showModal();
  }

  function render() {
    banner = el('section', '', 'stepup-consent-banner');
    banner.id = 'stepup-consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', text.title);
    banner.appendChild(el('h2', text.title));
    banner.appendChild(el('p', text.description));
    var details = el('a', text.details);
    details.href = isGreek ? '/el/privacy/' : '/privacy/';
    banner.appendChild(details);
    var actions = el('div', '', 'stepup-consent-actions');
    actions.appendChild(button(text.reject, function () { choose(false); }));
    actions.appendChild(button(text.accept, function () { choose(true); }));
    actions.appendChild(button(text.settings, openSettings));
    banner.appendChild(actions);
    document.body.appendChild(banner);

    dialog = el('dialog', '', 'stepup-consent-dialog');
    dialog.setAttribute('aria-labelledby', 'stepup-consent-title');
    var title = el('h2', text.settings);
    title.id = 'stepup-consent-title';
    dialog.appendChild(title);
    dialog.appendChild(el('h3', text.necessary));
    dialog.appendChild(el('p', text.necessaryText));
    var label = el('label', '', 'stepup-consent-label');
    checkbox = el('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'stepup-analytics-choice';
    label.appendChild(checkbox);
    label.appendChild(el('span', text.analytics));
    dialog.appendChild(label);
    dialog.appendChild(el('p', text.analyticsText));
    status = el('p', '', 'stepup-consent-status');
    status.setAttribute('role', 'status');
    dialog.appendChild(status);
    var more = el('a', text.details);
    more.href = details.href;
    dialog.appendChild(more);
    var choices = el('div', '', 'stepup-consent-actions');
    choices.appendChild(button(text.reject, function () { choose(false); }));
    choices.appendChild(button(text.save, function () { choose(checkbox.checked); }));
    choices.appendChild(button(text.close, function () { dialog.close(); }));
    dialog.appendChild(choices);
    document.body.appendChild(dialog);
    document.querySelectorAll('[data-cookie-settings]').forEach(function (node) { node.addEventListener('click', openSettings); });
    consent = readChoice();
    applyChoice();
  }

  window.STEPUPConsent = { open: openSettings };
  window.addEventListener('stepup:page-ready', function () { ready = true; sendPage(); });
  window.addEventListener('storage', function (event) {
    if (event.key === KEY || event.key === null) { consent = readChoice(); applyChoice(); }
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      consent = readChoice();
      pageSent = false;
      applyChoice();
      sendPage();
    }
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) expireChoice(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
})();
