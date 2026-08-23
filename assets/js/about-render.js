(function () {
  var lang = window.STEPUP_LANG || 'en';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderStats(stats) {
    if (!stats || !stats.length) return '';
    return stats.map(function (s) {
      return '<div class="stat-box"><div class="num">' + esc(s.num) + '</div><div class="label">' + esc(s.label) + '</div></div>';
    }).join('');
  }

  function renderCards(cards) {
    if (!cards || !cards.length) return '';
    return cards.map(function (c) {
      return '<div class="card"><h4>' + esc(c.title) + '</h4><p class="desc">' + c.desc + '</p></div>';
    }).join('');
  }

  fetch('/content/about-' + lang + '.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var statsEl = document.getElementById('about-stats');
      if (statsEl) statsEl.innerHTML = renderStats(data.stats);

      var proseEl = document.getElementById('about-prose');
      if (proseEl && data.prose) proseEl.innerHTML = data.prose;

      var quoteEl = document.getElementById('about-quote');
      if (quoteEl && data.quote) quoteEl.innerHTML = '<p>' + data.quote + '</p>';

      var cardsEl = document.getElementById('about-cards');
      if (cardsEl) cardsEl.innerHTML = renderCards(data.cards);
    })
    .catch(function (err) { console.error('about-render.js:', err); });
})();
