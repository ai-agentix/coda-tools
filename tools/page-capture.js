(function () {
  'use strict';

  var H2C_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';

  function showStatus(msg) {
    var el = document.getElementById('ct-status');
    if (el) { el.textContent = msg; return; }
    el = document.createElement('div');
    el.id = 'ct-status';
    el.style.cssText =
      'position:fixed;bottom:20px;right:20px;z-index:999999;' +
      'background:#1a1a2e;color:#eee;border-radius:10px;' +
      'padding:12px 18px;font-family:sans-serif;font-size:13px;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.4);';
    el.textContent = msg;
    document.body.appendChild(el);
  }

  function removeStatus() {
    var el = document.getElementById('ct-status');
    if (el) el.remove();
  }

  function capture() {
    showStatus('Capturing page...');

    var script = document.createElement('script');
    script.src = H2C_CDN;
    script.onload = function () {
      html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 1
      }).then(function (canvas) {
        var dataUrl = canvas.toDataURL('image/png');
        var w = canvas.width;
        var h = canvas.height;

        showStatus('Sending to Coda...');

        window.CODA({
          tool: 'page-capture',
          width: w,
          height: h,
          image: dataUrl
        });

        removeStatus();
      }).catch(function (err) {
        removeStatus();
        alert('Page capture failed: ' + err.message);
      });
    };
    script.onerror = function () {
      removeStatus();
      alert('Page capture: could not load html2canvas library.');
    };
    document.head.appendChild(script);
  }

  capture();
})();
