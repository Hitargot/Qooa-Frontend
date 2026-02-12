(function () {
  // Lightweight global alert and toast helpers. Use the app's reusable modal if available,
  // otherwise show a simple modal built on the page. Toast is always available.

  function ensureToastContainer() {
    if (document.getElementById('global-toast')) return;
    const el = document.createElement('div');
    el.id = 'global-toast';
    el.style.position = 'fixed';
    el.style.right = '20px';
    el.style.bottom = '20px';
    el.style.zIndex = 99999;
    el.style.display = 'none';
    el.style.padding = '12px 18px';
    el.style.borderRadius = '8px';
    el.style.background = 'rgba(17,17,17,0.95)';
    el.style.color = '#fff';
    el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.2)';
    document.body.appendChild(el);
  }

  window.showToast = function (message, duration = 3000) {
    try {
      ensureToastContainer();
      const el = document.getElementById('global-toast');
      if (!el) return;
      el.innerHTML = message;
      el.style.display = 'block';
      el.style.opacity = '1';
      setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => { el.style.display = 'none'; }, 300);
      }, duration);
    } catch (e) {
      try { alert(message); } catch (e) { /* swallow */ }
    }
  };

  // Simple modal builder used as fallback when the app's reusable modal isn't present
  function buildSimpleModal(title, htmlMessage) {
    // if already exists, reuse
    let m = document.getElementById('simple-alert-modal');
    if (m) {
      m.parentNode.removeChild(m);
    }

    m = document.createElement('div');
    m.id = 'simple-alert-modal';
    m.setAttribute('role', 'dialog');
    m.style.position = 'fixed';
    m.style.left = '0';
    m.style.top = '0';
    m.style.right = '0';
    m.style.bottom = '0';
    m.style.display = 'flex';
    m.style.alignItems = 'center';
    m.style.justifyContent = 'center';
    m.style.zIndex = 100000;
    m.style.background = 'rgba(0,0,0,0.45)';

    const box = document.createElement('div');
    box.style.maxWidth = '520px';
    box.style.width = '90%';
    box.style.background = '#fff';
    box.style.borderRadius = '10px';
    box.style.padding = '18px';
    box.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';

    const h = document.createElement('h3');
    h.style.margin = '0 0 8px 0';
    h.style.fontSize = '1.1rem';
    h.textContent = title || 'Alert';

    const body = document.createElement('div');
    body.style.marginBottom = '12px';
    body.innerHTML = htmlMessage || '';

    const footer = document.createElement('div');
    footer.style.textAlign = 'right';

    const ok = document.createElement('button');
    ok.className = 'btn-primary';
    ok.style.padding = '8px 12px';
    ok.style.border = 'none';
    ok.style.borderRadius = '8px';
    ok.style.background = '#10b981';
    ok.style.color = '#fff';
    ok.style.cursor = 'pointer';
    ok.textContent = 'OK';
    ok.addEventListener('click', () => { m.parentNode && m.parentNode.removeChild(m); });

    footer.appendChild(ok);
    box.appendChild(h);
    box.appendChild(body);
    box.appendChild(footer);
    m.appendChild(box);
    document.body.appendChild(m);
  }

  window.customAlert = function (message, title = 'Alert') {
    try {
      const html = ('' + message).replace(/\n/g, '<br>');
      // Use reusable modal if available (in dashboard). openReusableModal is defined there.
      if (typeof openReusableModal === 'function') {
        openReusableModal({ title: title, body: `<div style="padding:8px 0;">${html}</div>`, footer: `<button class="btn-primary" onclick="closeReusableModal()">OK</button>`, size: 'small' });
        return;
      }

      // Fallback: use simple modal builder
      buildSimpleModal(title, html);
    } catch (e) {
      try { alert(message); } catch (e) { /* swallow */ }
    }
  };

})();
