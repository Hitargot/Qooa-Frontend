// verify-email.js
(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const email = params.get('email');
  const status = params.get('status');
  const message = params.get('message');

  const statusTitle = document.getElementById('statusTitle');
  const statusMessage = document.getElementById('statusMessage');
  const actions = document.getElementById('actions');

  // Helper to show results
  function show(title, msg) {
    statusTitle.textContent = title;
    statusMessage.textContent = msg;
    actions.style.display = 'block';
  }

  // If backend redirected to this page with a status, respect it and do not re-call verify API
  if (status) {
    if (status === 'success') {
      show('Email verified!', message || 'Your email has been verified. You can now log in.');
    } else {
      show('Verification failed', message || 'Unable to verify your email. The token may be expired or invalid.');
    }
    return;
  }

  // If token+email present on frontend URL, call backend verify endpoint directly
  if (!token || !email) {
    show('Invalid verification link', 'The verification link is missing required information.');
    return;
  }

  async function verify() {
    try {
      const backend = window.BACKEND_URL || '';
      const url = `${backend.replace(/\/$/, '')}/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const body = await res.json().catch(() => ({}));

      if (res.ok && body.success) {
        show('Email verified!', body.message || 'Your email has been verified. You can now log in.');
      } else {
        show('Verification failed', body.message || 'Unable to verify your email. The token may be expired or invalid.');
      }
    } catch (err) {
      console.error('Verify request failed', err);
      show('Network error', 'Could not reach the server. Please try again later.');
    }
  }

  // Start verification
  verify();
})();
