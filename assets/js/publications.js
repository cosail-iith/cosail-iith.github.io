/* Renders the publication list from publications-data.js. No editing needed here. */
(function () {
  var PUBS = (window.PUBLICATIONS || []).map(function (p, i) { p._i = i; return p; });
  var TYPE_LABEL = { journal: "Journal", conference: "Conference", preprint: "Preprint", thesis: "Thesis" };
  var GROUP_ORDER = { preprint: 0, journal: 1, conference: 2, thesis: 3 };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function authors(a) {
    return esc(a).replace(/Ankit Gupta(\*?)/g, '<span class="me">Ankit Gupta$1</span>');
  }
  function item(p) {
    var t = p.url
      ? '<a class="pub-title" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + "</a>"
      : '<span class="pub-title">' + esc(p.title) + "</span>";
    var extra = (p.links || []).map(function (l) {
      return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + "</a>";
    }).join("");
    var topics = (p.topics || []).map(function (x) { return '<span class="pill">' + esc(x) + "</span>"; }).join("");
    return "<li>" + t +
      '<div class="pub-authors">' + authors(p.authors) + "</div>" +
      '<div class="pub-venue">' + esc(p.venue) + "</div>" +
      '<div class="pub-meta"><span class="pill type-' + esc(p.type) + '">' + esc(TYPE_LABEL[p.type] || p.type) + "</span>" +
      topics + extra + (p.note ? '<span class="pub-note">' + esc(p.note) + "</span>" : "") + "</div></li>";
  }
  function list(arr) { return '<ol class="pubs">' + arr.map(item).join("") + "</ol>"; }
  function byNewest(a, b) { return (b.year || 0) - (a.year || 0) || a._i - b._i; }

  /* Selected publications (PI page) */
  var sel = document.getElementById("selected-pubs");
  if (sel) {
    var s = PUBS.filter(function (p) { return p.selected; }).sort(byNewest);
    sel.innerHTML = list(s);
  }

  /* Full list with filters (publications page) */
  var root = document.getElementById("pub-list");
  if (!root) return;
  var q = document.getElementById("pub-search");
  var topicSel = document.getElementById("pub-topic");
  var count = document.getElementById("pub-count");
  var state = { type: "all", group: "year" };

  var topics = {};
  PUBS.forEach(function (p) { (p.topics || []).forEach(function (t) { topics[t] = (topics[t] || 0) + 1; }); });
  Object.keys(topics).sort(function (a, b) {
    if (a === "Miscellaneous") return 1; if (b === "Miscellaneous") return -1; return a.localeCompare(b);
  }).forEach(function (t) {
    var o = document.createElement("option"); o.value = t; o.textContent = t + " (" + topics[t] + ")"; topicSel.appendChild(o);
  });

  function bindSeg(id, key) {
    var btns = document.querySelectorAll("#" + id + " button");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        state[key] = b.getAttribute("data-v");
        render();
      });
    });
  }
  bindSeg("pub-type", "type");
  bindSeg("pub-group", "group");
  q.addEventListener("input", render);
  topicSel.addEventListener("change", render);

  function render() {
    var term = q.value.trim().toLowerCase();
    var topic = topicSel.value;
    var arr = PUBS.filter(function (p) {
      if (state.type !== "all" && p.type !== state.type) return false;
      if (topic && (p.topics || []).indexOf(topic) < 0) return false;
      if (term) {
        var hay = (p.title + " " + p.authors + " " + p.venue + " " + p.year).toLowerCase();
        if (hay.indexOf(term) < 0) return false;
      }
      return true;
    }).sort(byNewest);

    count.textContent = arr.length + (arr.length === 1 ? " publication" : " publications");
    if (!arr.length) { root.innerHTML = '<p class="empty">No publications match these filters.</p>'; return; }

    var groups = {}, order = [];
    function add(k, p) { if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(p); }
    if (state.group === "year") {
      arr.forEach(function (p) { add(String(p.year), p); });
      order.sort(function (a, b) { return b - a; });
    } else if (state.group === "type") {
      arr.slice().sort(function (a, b) { return GROUP_ORDER[a.type] - GROUP_ORDER[b.type] || byNewest(a, b); })
        .forEach(function (p) { add({ journal: "Journal articles", conference: "Conference papers", preprint: "Preprints", thesis: "Ph.D. thesis" }[p.type], p); });
    } else {
      arr.forEach(function (p) { (p.topics || ["Miscellaneous"]).forEach(function (t) { if (!topic || t === topic) add(t, p); }); });
      order.sort(function (a, b) {
        if (a === "Miscellaneous") return 1; if (b === "Miscellaneous") return -1; return a.localeCompare(b);
      });
    }
    root.innerHTML = order.map(function (k) {
      return '<div class="pub-group"><h3>' + esc(k) + "</h3>" + list(groups[k]) + "</div>";
    }).join("");
  }
  render();
})();
