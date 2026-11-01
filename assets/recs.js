// Recommended apps slot ("추천 앱" 칸). Shows up to 3 other apps from our own network.
// Links carry ?from=<this page id> so a signup on the target page records where the visitor came from.
(function () {
  var script = document.currentScript;
  var self = script && script.dataset.item;
  if (!self) return;

  var base = script.src.replace(/assets\/recs\.js.*$/, "");

  var CATALOG = [
    { id: "espresso", lang: "en", path: "espresso/", title: "Espresso dial-in helper",
      desc: "Set up once. Every bean keeps the setting that worked." },
    { id: "espresso-calc", lang: "en", path: "espresso/calculator.html", title: "Free espresso shot checker",
      desc: "Ratio and shot time in seconds, plus one thing to try next." },
    { id: "boost", lang: "en", path: "boost/", title: "Boostring",
      desc: "Free waitlist, referrals and app-to-app recommendations for apps built with AI." },
    { id: "driver", lang: "ko", path: "driver/", title: "배달·대리 기사 실수입 계산기",
      desc: "수수료·기름값·세금 빼고 진짜 시급을 계산합니다." },
    { id: "pet", lang: "ko", path: "pet/", title: "노견·노묘 투약 기록 앱",
      desc: "약 먹일 시간 알림과 상태 기록. 기록 내보내기는 언제나 무료." },
    { id: "jiwon", lang: "ko", path: "jiwon/", title: "지원사업 공고 알림",
      desc: "우리 가게가 받을 수 있는 지원사업만, 마감 전에." },
    { id: "silsuryeong", lang: "ko", url: "https://실수령.com/", title: "실수령닷컴",
      desc: "연봉·시급 실수령액, 4대보험·주휴수당·퇴직금 계산기." }
  ];

  var me = null;
  for (var i = 0; i < CATALOG.length; i++) if (CATALOG[i].id === self) me = CATALOG[i];
  var lang = (me && me.lang) || (document.documentElement.lang === "ko" ? "ko" : "en");
  var group = { espresso: "espresso", "espresso-calc": "espresso" };

  var picks = CATALOG.filter(function (a) {
    if (a.id === self) return false;
    if (group[a.id] && group[a.id] === group[self] && self !== "boost") {
      // Same product family: show the sibling page, but only once.
      return true;
    }
    return a.lang === lang;
  }).slice(0, 3);
  if (!picks.length) return;

  function href(a) {
    var u = a.url || (base + a.path);
    return u + (u.indexOf("?") === -1 ? "?" : "&") + "from=" + encodeURIComponent(self);
  }

  var t = lang === "ko"
    ? { h: "함께 보면 좋은 서비스", note: "내 서비스도 여기 소개하고 싶다면", cta: "Boostring 알아보기" }
    : { h: "More from indie makers", note: "Want your app recommended here?", cta: "See Boostring" };

  var sec = document.createElement("section");
  sec.className = "recs";
  sec.setAttribute("aria-label", t.h);
  var html = '<h2 class="recs-h">' + t.h + "</h2><ul class=\"recs-list\">";
  picks.forEach(function (a) {
    html += '<li><a class="recs-card" href="' + href(a) + '"' + (a.url ? ' rel="noopener"' : "") + ">" +
      '<span class="recs-title">' + a.title + "</span>" +
      '<span class="recs-desc">' + a.desc + "</span></a></li>";
  });
  html += "</ul>";
  if (self !== "boost") {
    html += '<p class="recs-note">' + t.note + ' → <a href="' + base + "boost/?from=" + encodeURIComponent(self) + '">' + t.cta + "</a></p>";
  }
  sec.innerHTML = html;

  var css = document.createElement("style");
  css.textContent =
    ".recs{margin:32px 0 8px}" +
    ".recs-h{font-size:1.05rem;margin:0 0 12px}" +
    ".recs-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}" +
    ".recs-card{display:block;padding:14px 16px;border:1px solid rgba(127,127,127,.28);border-radius:12px;text-decoration:none;color:inherit;background:rgba(127,127,127,.06)}" +
    ".recs-card:hover,.recs-card:focus-visible{border-color:currentColor}" +
    ".recs-title{display:block;font-weight:700;margin-bottom:4px}" +
    ".recs-desc{display:block;font-size:.92rem;opacity:.8;line-height:1.45}" +
    ".recs-note{font-size:.9rem;opacity:.85;margin:12px 0 0}";
  document.head.appendChild(css);

  var main = document.querySelector("main") || document.body;
  main.appendChild(sec);
})();
