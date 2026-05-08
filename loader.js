(function () {
  'use strict';

  const CDN = 'https://cdn.jsdelivr.net/gh/ai-agentix/coda-tools@main';
  const LS_PREFIX = 'coda_tools_';

  function getDocId() {
    let m = window.location.pathname.match(/_d([A-Za-z0-9]+)/);
    return m ? m[1] : 'default';
  }

  function getCreds() {
    let raw = localStorage.getItem(LS_PREFIX + getDocId());
    return raw ? JSON.parse(raw) : null;
  }

  function saveCreds(hook, key) {
    localStorage.setItem(LS_PREFIX + getDocId(), JSON.stringify({ hook: hook, key: key }));
  }

  function installCODA(hook, key) {
    window.CODA = function (data) {
      let xhr = new XMLHttpRequest();
      xhr.open('POST', hook, false);
      xhr.setRequestHeader('Authorization', 'Bearer ' + key);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
    };
  }

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      let s = document.createElement('script');
      s.src = url + '?t=' + Date.now();
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function removeMenu() {
    let el = document.getElementById('coda-tools-menu');
    if (el) el.remove();
  }

  function btnStyle(base) {
    return 'display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;' +
      'margin-bottom:6px;border-radius:8px;border:none;cursor:pointer;text-align:left;' +
      'background:' + (base || '#2a2a4a') + ';color:#eee;font-size:13px;';
  }

  function showConfig(onSave) {
    removeMenu();
    let creds = getCreds() || { hook: '', key: '' };

    let el = document.createElement('div');
    el.id = 'coda-tools-menu';
    el.style.cssText = panelStyle();
    el.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<strong style="font-size:14px">Coda Tools &mdash; Config</strong>' +
        '<span id="ct-close" style="cursor:pointer;font-size:18px;color:#aaa">&#x2715;</span>' +
      '</div>' +
      '<div style="font-size:11px;color:#888;margin-bottom:12px">Doc: ' + getDocId() + '</div>' +
      '<label style="font-size:12px;display:block;margin-bottom:4px">Webhook URL</label>' +
      '<input id="ct-hook" type="text" value="' + escHtml(creds.hook) + '"' +
        ' style="width:100%;box-sizing:border-box;padding:7px;border-radius:6px;' +
        'border:1px solid #444;background:#111;color:#eee;font-size:12px;margin-bottom:10px" />' +
      '<label style="font-size:12px;display:block;margin-bottom:4px">API Key</label>' +
      '<input id="ct-key" type="password" value="' + escHtml(creds.key) + '"' +
        ' style="width:100%;box-sizing:border-box;padding:7px;border-radius:6px;' +
        'border:1px solid #444;background:#111;color:#eee;font-size:12px;margin-bottom:14px" />' +
      '<button id="ct-save" style="width:100%;padding:9px;border-radius:6px;border:none;' +
        'background:#4f8ef7;color:#fff;font-size:13px;cursor:pointer">Save</button>';

    document.body.appendChild(el);

    document.getElementById('ct-close').onclick = removeMenu;
    document.getElementById('ct-save').onclick = function () {
      let hook = document.getElementById('ct-hook').value.trim();
      let key = document.getElementById('ct-key').value.trim();
      if (!hook || !key) return;
      saveCreds(hook, key);
      installCODA(hook, key);
      removeMenu();
      if (onSave) onSave();
    };
  }

  function showMenu(tools) {
    removeMenu();

    let el = document.createElement('div');
    el.id = 'coda-tools-menu';
    el.style.cssText = panelStyle();

    let html =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
        '<strong style="font-size:13px">Coda Tools</strong>' +
        '<div>' +
          '<span id="ct-config" style="cursor:pointer;font-size:15px;margin-right:10px;color:#aaa" title="Settings">&#9881;</span>' +
          '<span id="ct-close" style="cursor:pointer;font-size:18px;color:#aaa">&#x2715;</span>' +
        '</div>' +
      '</div>';

    tools.forEach(function (t) {
      html +=
        '<button class="ct-tool" data-script="' + escHtml(t.script) + '" style="' + btnStyle() + '">' +
          '<span style="font-size:20px;min-width:24px;text-align:center">' + escHtml(t.icon) + '</span>' +
          '<div>' +
            '<div style="font-weight:600">' + escHtml(t.name) + '</div>' +
            '<div style="font-size:10px;color:#aaa">' + escHtml(t.description) + '</div>' +
          '</div>' +
        '</button>';
    });

    el.innerHTML = html;
    document.body.appendChild(el);

    document.getElementById('ct-close').onclick = removeMenu;
    document.getElementById('ct-config').onclick = function () {
      showConfig(function () { showMenu(tools); });
    };

    el.querySelectorAll('.ct-tool').forEach(function (btn) {
      btn.onmouseenter = function () { this.style.background = '#3a3a6a'; };
      btn.onmouseleave = function () { this.style.background = '#2a2a4a'; };
      btn.onclick = function () {
        let script = this.getAttribute('data-script');
        removeMenu();
        loadScript(CDN + '/tools/' + script)
          .catch(function () { alert('Coda Tools: failed to load ' + script); });
      };
    });
  }

  function panelStyle() {
    return 'position:fixed;bottom:20px;right:20px;z-index:999999;' +
      'background:#1a1a2e;color:#eee;border-radius:12px;' +
      'padding:16px;min-width:220px;font-family:sans-serif;' +
      'box-shadow:0 8px 32px rgba(0,0,0,0.5);';
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function init() {
    removeMenu();
    let creds = getCreds();

    if (!creds) {
      showConfig(function () { init(); });
      return;
    }

    installCODA(creds.hook, creds.key);

    fetch(CDN + '/manifest.json?t=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (manifest) { showMenu(manifest.tools); })
      .catch(function () { alert('Coda Tools: could not load manifest.json'); });
  }

  init();
})();
