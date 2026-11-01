(function () {
  function randomCode() {
    var chars = "abcdefghjkmnpqrstuvwxyz23456789", out = "";
    var buf = new Uint8Array(6);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (var i = 0; i < buf.length; i++) out += chars[buf[i] % chars.length];
    return out;
  }

  function setHidden(form, name, value) {
    var el = form.querySelector('input[name="' + name + '"]');
    if (!el) {
      el = document.createElement("input");
      el.type = "hidden";
      el.name = name;
      form.appendChild(el);
    }
    el.value = value;
  }

  function pageUrl() {
    return window.location.href.split("#")[0].split("?")[0];
  }

  function init(form) {
    var params = new URLSearchParams(window.location.search);
    var incoming = (params.get("ref") || "").replace(/[^a-z0-9]/gi, "").slice(0, 16);
    // Reuse the visitor's stored code (shared with boost/boostring.js) so one person keeps one referral link.
    var myCode = null;
    try { myCode = window.localStorage.getItem("boostring:ref"); } catch (e) { myCode = null; }
    if (!myCode || !/^[a-z0-9]{6,16}$/.test(myCode)) {
      myCode = randomCode();
      try { window.localStorage.setItem("boostring:ref", myCode); } catch (e) { /* storage blocked */ }
    }
    setHidden(form, "ref", incoming);
    setHidden(form, "my_ref", myCode);
    setHidden(form, "from", (params.get("from") || "").replace(/[^a-z0-9-]/gi, "").slice(0, 24));

    var status = document.getElementById(form.dataset.status);
    var btn = form.querySelector('button[type="submit"]');

    function show(msg, kind) {
      status.textContent = msg;
      status.className = "status " + (kind || "");
      status.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var endpoint = form.dataset.endpoint || window.FORM_ENDPOINT;
      if (!endpoint) {
        show(form.dataset.soon, "info");
        return;
      }

      btn.disabled = true;
      var ctrl = window.AbortController ? new AbortController() : null;
      if (ctrl) setTimeout(function () { ctrl.abort(); }, 20000);
      fetch(endpoint, {
        method: "POST",
        mode: "cors",
        signal: ctrl ? ctrl.signal : undefined,
        headers: { Accept: "application/json" },
        body: new FormData(form)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json().catch(function () { return {}; });
        })
        .then(function (data) {
          if (data && String(data.success) === "false") throw new Error("not accepted");
          form.hidden = true;
          show(form.dataset.thanks, "ok");
          var ref = document.getElementById(form.dataset.referral || "");
          if (ref) {
            var link = pageUrl() + "?ref=" + myCode;
            var a = ref.querySelector("[data-share-link]");
            a.href = link;
            a.textContent = link;
            ref.hidden = false;
          }
          try { document.dispatchEvent(new CustomEvent("boostring:signup")); } catch (e) { /* old browser */ }
        })
        .catch(function () {
          btn.disabled = false;
          show(form.dataset.error, "err");
        });
    });
  }

  document.querySelectorAll("form[data-waitlist]").forEach(init);
})();
