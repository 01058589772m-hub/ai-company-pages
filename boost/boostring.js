/*! Boostring v0.2 — app-to-app recommendations for indie apps.
 * Install: <script src="https://01058589772m-hub.github.io/ai-company-pages/boost/boostring.js" data-site="myapp" async></script>
 * No cookies, no tracking, no keys. The only network request is network.json next to this file.
 * Streak and referral code live in this visitor's localStorage only and never leave the device.
 */
(function () {
  "use strict";
  if (window.__boostring) return;
  window.__boostring = true;

  var script = document.currentScript;
  if (!script) {
    var all = document.querySelectorAll('script[src*="boostring.js"]');
    script = all[all.length - 1];
  }
  if (!script) return;

  var ds = script.dataset || {};
  var SITE = (ds.site || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32) || "unknown";
  var htmlLang = (document.documentElement.getAttribute("lang") || "").toLowerCase();
  var LANG = ds.lang === "ko" || ds.lang === "en" ? ds.lang : (htmlLang.indexOf("ko") === 0 ? "ko" : "en");
  var MODE = /^(launcher|inline|both)$/.test(ds.mode || "") ? ds.mode : "launcher";
  var ACCENT = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(ds.accent || "") ? ds.accent : "#4f46e5";
  var CATEGORY = (ds.category || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
  var BASE = script.src.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  var NETWORK_URL = BASE + "network.json";

  var T = {
    en: {
      launcher: "More apps", launcherLabel: "Open recommended apps",
      title: "Apps you might like", afterSignup: "While you wait — apps you might like",
      newWeek: "New this week", isNew: "New",
      streak: function (n) { return "Day " + n + " streak"; },
      points: function (p) { return p + (p === 1 ? " visit point" : " visit points"); },
      local: "Saved on this device only. Points can't be transferred and have no cash value.",
      share: "Share this app", copied: "Link copied", copyFail: "Copy this link:",
      join: "Get your app recommended here — free", powered: "Powered by Boostring",
      close: "Close", none: "Recommendations are unavailable right now."
    },
    ko: {
      launcher: "추천 서비스", launcherLabel: "추천 서비스 열기",
      title: "이런 서비스는 어떠세요", afterSignup: "기다리는 동안 이런 서비스는 어떠세요",
      newWeek: "이번 주 새로 합류", isNew: "NEW",
      streak: function (n) { return "연속 방문 Day " + n; },
      points: function (p) { return "방문 포인트 " + p + "점"; },
      local: "이 기기에만 저장됩니다. 포인트는 양도할 수 없고 현금 가치가 없습니다.",
      share: "이 서비스 공유하기", copied: "링크를 복사했습니다", copyFail: "아래 링크를 복사하세요:",
      join: "내 서비스도 무료로 소개받기", powered: "Powered by Boostring",
      close: "닫기", none: "지금은 추천을 불러올 수 없습니다."
    }
  };
  var t = T[LANG];

  // ---------- storage (always guarded) ----------
  function sget(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode etc. */ } }

  // ---------- dates ----------
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function dayNum(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5) : NaN;
  }
  var TODAY = ymd(new Date());
  var TODAY_N = dayNum(TODAY);

  // ---------- streak (local, per site) ----------
  function visitStats() {
    var key = "boostring:visits:" + SITE, days = [];
    try { days = JSON.parse(sget(key) || "[]"); } catch (e) { days = []; }
    if (!Array.isArray(days)) days = [];
    days = days.filter(function (d) { return !isNaN(dayNum(d)); });
    if (days.indexOf(TODAY) === -1) days.push(TODAY);
    days.sort();
    days = days.slice(-120);
    sset(key, JSON.stringify(days));
    var set = {}, streak = 0, n;
    days.forEach(function (d) { set[dayNum(d)] = true; });
    for (n = TODAY_N; set[n]; n--) streak++;
    return { streak: streak, points: days.length };
  }

  // ---------- referral code (same alphabet as assets/form.js) ----------
  function randomCode() {
    var chars = "abcdefghjkmnpqrstuvwxyz23456789", out = "", buf = new Uint8Array(6), i;
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (i = 0; i < buf.length; i++) out += chars[buf[i] % chars.length];
    return out;
  }
  function refCode() {
    var c = sget("boostring:ref");
    if (!c || !/^[a-z0-9]{6,16}$/.test(c)) { c = randomCode(); sset("boostring:ref", c); }
    return c;
  }
  function shareUrl() {
    return location.href.split("#")[0].split("?")[0] + "?ref=" + refCode();
  }

  // ---------- picking ----------
  function hash(s) { var h = 2166136261, i; for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var x = Math.imul(seed ^ seed >>> 15, 1 | seed);
      x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x;
      return ((x ^ x >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, seed) {
    var a = arr.slice(), r = rng(seed), i, j, tmp;
    for (i = a.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); tmp = a[i]; a[i] = a[j]; a[j] = tmp; }
    return a;
  }
  function safeUrl(u) {
    try {
      var x = new URL(u, NETWORK_URL);
      return /^https?:$/.test(x.protocol) ? x : null;
    } catch (e) { return null; }
  }
  function link(m) {
    var u = safeUrl(m.url);
    if (!u) return null;
    u.searchParams.set("from", SITE);
    u.searchParams.set("via", "boostring");
    return u.href;
  }
  function prepare(members) {
    return members.filter(function (m) {
      return m && typeof m.id === "string" && typeof m.name === "string" && safeUrl(m.url);
    }).map(function (m) {
      var age = TODAY_N - dayNum(m.joined);
      return {
        id: m.id, name: m.name, url: m.url, lang: m.lang, category: m.category,
        tagline: (LANG === "ko" ? m.tagline_ko : m.tagline_en) || m.tagline_en || m.tagline_ko || "",
        age: age, isNew: age >= 0 && age < 14, href: link(m)
      };
    });
  }
  function pick(list, cat) {
    var others = list.filter(function (m) { return m.id !== SITE; });
    var same = others.filter(function (m) { return m.lang === LANG; });
    var pool = same.length ? same : others;
    var mixed = shuffle(pool, hash(TODAY + "|" + SITE));
    // Stable: same-category first, otherwise the day's shuffled order (fair rotation).
    mixed = mixed.map(function (m, i) { return { m: m, i: i }; }).sort(function (a, b) {
      var ca = cat && a.m.category === cat ? 0 : 1, cb = cat && b.m.category === cat ? 0 : 1;
      return ca - cb || a.i - b.i;
    }).map(function (x) { return x.m; });
    return mixed.slice(0, 3);
  }
  function newThisWeek(list) {
    return list.filter(function (m) { return m.id !== SITE && m.lang === LANG && m.age >= 0 && m.age < 7; }).slice(0, 6);
  }

  // ---------- rendering ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var joinHref = (function () {
    var u = new URL(SITE === "boost" ? "install.html" : "./", BASE);
    u.searchParams.set("from", SITE);
    u.searchParams.set("via", "boostring");
    return u.href;
  })();

  var CSS =
    ":host{all:initial;display:block;--a:" + ACCENT + ";--bg:#fff;--fg:#1c1917;--mu:#57534e;--ln:#d6d3d1;--sf:#f5f5f4;" +
    "font:15px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif;color:var(--fg)}" +
    "@media (prefers-color-scheme:dark){:host{--bg:#1c1917;--fg:#f5f5f4;--mu:#a8a29e;--ln:#44403c;--sf:#292524}}" +
    "*{box-sizing:border-box}" +
    ".box{background:var(--bg);color:var(--fg);border:1px solid var(--ln);border-radius:14px;padding:16px;word-break:keep-all;overflow-wrap:anywhere}" +
    ".inline{margin:32px 0 8px}" +
    "h2{font-size:1.05rem;line-height:1.35;margin:0 0 12px;font-weight:700}" +
    "h3{font-size:.8rem;letter-spacing:.04em;text-transform:uppercase;color:var(--mu);margin:16px 0 8px;font-weight:700}" +
    "ul{list-style:none;margin:0;padding:0}" +
    ".recs{display:grid;gap:8px}" +
    ".card{display:block;padding:12px 14px;border:1px solid var(--ln);border-radius:10px;background:var(--sf);color:var(--fg);text-decoration:none}" +
    ".card:hover,.card:focus-visible{border-color:var(--fg)}" +
    ".name{display:block;font-weight:700}" +
    ".tag{display:block;font-size:.9rem;color:var(--mu);margin-top:2px}" +
    ".badge{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;background:var(--a);color:#fff;font-size:.7rem;font-weight:700;vertical-align:2px}" +
    ".chips{display:flex;flex-wrap:wrap;gap:6px}" +
    ".chips a{display:inline-block;padding:4px 10px;border:1px solid var(--ln);border-radius:999px;color:var(--fg);text-decoration:none;font-size:.85rem}" +
    ".chips a:hover,.chips a:focus-visible{border-color:var(--fg)}" +
    ".streak{margin:16px 0 0;padding:10px 12px;border-radius:10px;background:var(--sf)}" +
    ".streak b{display:block}.streak small{display:block;color:var(--mu);font-size:.8rem}" +
    ".share{margin-top:12px;width:100%;font:inherit;font-weight:700;padding:11px;border:0;border-radius:10px;background:var(--a);color:#fff;cursor:pointer}" +
    ".msg{margin:8px 0 0;font-size:.85rem;color:var(--mu)}" +
    ".msg input{width:100%;font:inherit;font-size:.85rem;padding:6px;margin-top:4px;border:1px solid var(--ln);border-radius:6px;background:var(--bg);color:var(--fg)}" +
    ".foot{margin:16px 0 0;padding-top:12px;border-top:1px solid var(--ln);font-size:.85rem}" +
    ".foot a{color:var(--fg);font-weight:700}" +
    ".pw{display:block;color:var(--mu);font-size:.75rem;margin-top:4px}" +
    "a:focus-visible,button:focus-visible{outline:3px solid var(--a);outline-offset:2px}" +
    ".launch{position:fixed;right:16px;bottom:16px;display:flex;align-items:center;gap:6px;font:inherit;font-weight:700;font-size:.9rem;" +
    "padding:10px 14px;border:0;border-radius:999px;background:var(--a);color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    ".launch svg{width:18px;height:18px;flex:none}" +
    ".panel{position:fixed;right:12px;bottom:72px;width:min(380px,calc(100vw - 24px));max-height:calc(100vh - 96px);overflow:auto;" +
    "box-shadow:0 10px 40px rgba(0,0,0,.3);transform:translateY(12px);opacity:0;visibility:hidden;transition:transform .2s ease,opacity .2s ease,visibility 0s linear .2s}" +
    ".panel.open{transform:none;opacity:1;visibility:visible;transition:transform .2s ease,opacity .2s ease}" +
    ".x{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;border-radius:8px;background:transparent;color:var(--fg);font-size:22px;line-height:1;cursor:pointer}" +
    ".panel h2{padding-right:36px}" +
    "@media (prefers-reduced-motion:reduce){.panel,.panel.open{transition:none;transform:none}}";

  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>';

  function body(recs, fresh, stats, headingId, heading) {
    var h = '<h2 id="' + headingId + '">' + esc(heading) + "</h2>";
    if (recs.length) {
      h += '<ul class="recs">';
      recs.forEach(function (m) {
        h += '<li><a class="card" data-rec="' + esc(m.id) + '" href="' + esc(m.href) + '"' +
          (/^https?:\/\//.test(m.url) ? ' rel="noopener"' : "") + ">" +
          '<span class="name">' + esc(m.name) + (m.isNew ? '<span class="badge">' + esc(t.isNew) + "</span>" : "") + "</span>" +
          (m.tagline ? '<span class="tag">' + esc(m.tagline) + "</span>" : "") + "</a></li>";
      });
      h += "</ul>";
    } else {
      h += '<p class="msg">' + esc(t.none) + "</p>";
    }
    if (fresh.length) {
      h += "<h3>" + esc(t.newWeek) + '</h3><ul class="chips">';
      fresh.forEach(function (m) { h += '<li><a data-new="' + esc(m.id) + '" href="' + esc(m.href) + '">' + esc(m.name) + "</a></li>"; });
      h += "</ul>";
    }
    h += '<div class="streak" data-streak><b>' + esc(t.streak(stats.streak)) + " · " + esc(t.points(stats.points)) +
      "</b><small>" + esc(t.local) + "</small></div>";
    h += '<button type="button" class="share" data-share>' + esc(t.share) + '</button><p class="msg" data-msg role="status" aria-live="polite" hidden></p>';
    h += '<p class="foot"><a data-join href="' + esc(joinHref) + '">' + esc(t.join) + '</a><span class="pw">' + esc(t.powered) + "</span></p>";
    return h;
  }

  function wireShare(root) {
    var btn = root.querySelector("[data-share]"), msg = root.querySelector("[data-msg]");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var url = shareUrl();
      function say(text, withLink) {
        msg.hidden = false;
        msg.textContent = text;
        if (withLink) {
          var inp = document.createElement("input");
          inp.readOnly = true; inp.value = url; inp.setAttribute("aria-label", t.share);
          msg.appendChild(inp); inp.focus(); inp.select();
        }
      }
      function copy() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { say(t.copied); }, function () { say(t.copyFail, true); });
        } else { say(t.copyFail, true); }
      }
      if (navigator.share) {
        navigator.share({ title: document.title, url: url }).catch(function (e) {
          if (!e || e.name !== "AbortError") copy();
        });
      } else { copy(); }
    });
  }

  function makeHost() {
    var el = document.createElement("div");
    el.setAttribute("data-boostring", "");
    return el;
  }

  function render(members) {
    var list = prepare(members);
    var me = null;
    list.forEach(function (m) { if (m.id === SITE) me = m; });
    var cat = CATEGORY || (me && me.category) || "";
    var recs = pick(list, cat), fresh = newThisWeek(list), stats = visitStats();

    if (MODE === "inline" || MODE === "both") {
      var slot = document.getElementById("boostring");
      if (slot && !slot.shadowRoot) {
        var sr = slot.attachShadow({ mode: "open" });
        sr.innerHTML = "<style>" + CSS + '</style><section class="box inline" aria-labelledby="br-ih">' +
          body(recs, fresh, stats, "br-ih", t.title) + "</section>";
        wireShare(sr);
      }
    }
    if (MODE === "launcher" || MODE === "both") launcher(recs, fresh, stats);
  }

  function launcher(recs, fresh, stats) {
    var host = makeHost();
    host.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;z-index:2147483000;";
    var sr = host.attachShadow({ mode: "open" });
    sr.innerHTML = "<style>" + CSS + "</style>" +
      '<button type="button" class="launch" aria-haspopup="dialog" aria-expanded="false" aria-controls="br-panel" aria-label="' +
      esc(t.launcherLabel) + '">' + STAR + "<span>" + esc(t.launcher) + "</span></button>" +
      '<div id="br-panel" class="box panel" role="dialog" aria-modal="false" aria-labelledby="br-ph" tabindex="-1">' +
      '<button type="button" class="x" data-close aria-label="' + esc(t.close) + '">&times;</button>' +
      body(recs, fresh, stats, "br-ph", t.title) + "</div>";
    document.body.appendChild(host);
    wireShare(sr);

    var btn = sr.querySelector(".launch"), panel = sr.getElementById("br-panel"), heading = sr.getElementById("br-ph");
    var isOpen = false;

    function focusables() {
      return Array.prototype.slice.call(panel.querySelectorAll("a[href],button,input")).filter(function (e) { return !e.closest("[hidden]"); });
    }
    function open(title) {
      if (title) heading.textContent = title;
      if (isOpen) return;
      isOpen = true;
      panel.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      var f = focusables()[0];
      (f || panel).focus();
    }
    function close(refocus) {
      if (!isOpen) return;
      isOpen = false;
      panel.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      if (refocus !== false) btn.focus();
    }
    btn.addEventListener("click", function () { isOpen ? close() : open(); });
    sr.querySelector("[data-close]").addEventListener("click", function () { close(); });
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1], cur = sr.activeElement;
      if (e.shiftKey && (cur === first || cur === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen) close(); });
    document.addEventListener("click", function (e) {
      if (!isOpen) return;
      var path = e.composedPath ? e.composedPath() : [];
      if (path.indexOf(host) === -1) close(false);
    });

    // Auto-open after a waitlist signup on the host page.
    var opened = false;
    function onSignup() { if (opened) return; opened = true; setTimeout(function () { open(t.afterSignup); }, 400); }
    document.addEventListener("boostring:signup", onSignup);
    if (window.MutationObserver) {
      Array.prototype.forEach.call(document.querySelectorAll("form[data-waitlist]"), function (form) {
        var st = form.dataset.status && document.getElementById(form.dataset.status);
        if (!st) return;
        new MutationObserver(function () {
          if (!st.hidden && /\bok\b/.test(st.className)) onSignup();
        }).observe(st, { attributes: true, attributeFilter: ["hidden", "class"] });
      });
    }
    window.Boostring = { open: function () { open(); }, close: function () { close(); } };
  }

  function start() {
    fetch(NETWORK_URL, { credentials: "omit", cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) { render((d && Array.isArray(d.members)) ? d.members : []); })
      .catch(function () { render([]); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
