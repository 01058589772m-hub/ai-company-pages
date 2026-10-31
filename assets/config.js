// ---- Site config (edit these two lines only) ----
window.FORM_ENDPOINT = "https://formsubmit.co/ajax/01058589772m@gmail.com"; // e.g. a Formspree/Getform endpoint. Empty = waitlist not open yet.
window.GA_ID = "";         // e.g. "G-XXXXXXX". Empty = no analytics loaded.
// --------------------------------------------------

(function () {
  if (!window.GA_ID) return; // no tracker, no cookies unless GA_ID is set
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(window.GA_ID);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", window.GA_ID);
})();
