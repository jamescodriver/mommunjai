/**
 * Mommunjai widget embed helper.
 * Usage on the brand site:
 *   <iframe data-mmj src="https://<app>/tools/ovulation?embed=1" style="width:100%;border:0" scrolling="no"></iframe>
 *   <script src="https://<app>/embed.js" async></script>
 * The iframe auto-resizes to its content height (no nested scrollbars).
 */
(function () {
  function ready() {
    window.addEventListener("message", function (e) {
      var d = e.data;
      if (!d || d.type !== "mmj:height") return;
      var frames = document.querySelectorAll("iframe[data-mmj]");
      for (var i = 0; i < frames.length; i++) {
        if (frames[i].contentWindow === e.source) {
          frames[i].style.height = d.height + "px";
        }
      }
    });
  }
  if (document.readyState !== "loading") ready();
  else document.addEventListener("DOMContentLoaded", ready);
})();
