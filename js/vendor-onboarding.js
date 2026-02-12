// Vendor onboarding client logic — wired to backend registration
document.addEventListener('DOMContentLoaded', function () {
  const marketSelect = document.getElementById('marketCluster');
  const otherGroup = document.getElementById('otherMarketGroup');
  if (marketSelect) {
    marketSelect.addEventListener('change', function () {
      if (this.value === 'Other' || this.value === 'other') otherGroup.style.display = 'block';
      else otherGroup.style.display = 'none';
    });
  }

  const regForm = document.getElementById('registrationForm');
  const successModal = document.getElementById('successModal');

  // Ensure BACKEND_URL is set (signup.html sets it or default to localhost)
  // Prefer a runtime override via window.BACKEND_URL, otherwise use deployed backend
  const BACKEND_URL = window.BACKEND_URL || 'https://qooa-865bc6c8db3f.herokuapp.com';
  const backend = BACKEND_URL;

  if (regForm) {
    regForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Collect form values
      const payload = {
        vendorName: document.getElementById('vendorName')?.value || '',
        phoneNumber: document.getElementById('phoneNumber')?.value || '',
        whatsappNumber: document.getElementById('whatsappNumber')?.value || '',
        email: document.getElementById('email')?.value || '',
        password: document.getElementById('password')?.value || '',
        marketCluster: document.getElementById('marketCluster')?.value || '',
        stallNumber: document.getElementById('stallNumber')?.value || '',
        businessType: document.getElementById('businessType')?.value || '',
        language: window.navigator.language?.startsWith('en') ? 'en' : 'en',
      };

      // Client-side validation: ensure businessType matches backend enum
      const allowedBusinessTypes = ['mama-put', 'retailer', 'wholesaler', 'restaurant', 'caterer'];
      if (!allowedBusinessTypes.includes(payload.businessType)) {
        console.error('Invalid businessType chosen', payload.businessType);
        customAlert('Please select a valid Business Type from the list.', 'Registration');
        return;
      }

      try {
          const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          // Log full response for debugging
          console.error('Registration failed', { status: res.status, body: data });
          // Prefer explicit validation errors if present
          let msg = data?.message || 'Registration failed';
          if (Array.isArray(data?.errors) && data.errors.length > 0) {
            // errors may be objects like { field, message }
            msg = data.errors.map((e) => e.message || JSON.stringify(e)).join('\n');
          } else if (data?.errors && typeof data.errors === 'object') {
            msg = JSON.stringify(data.errors);
          }
          // Show errors in a consistent custom alert
          customAlert(msg, 'Registration');
          return;
        }

        // Success — show modal using class-based toggle (CSS uses .modal.show)
        if (successModal) {
          successModal.classList.add('show');
        } else {
          // Fallback: inform user
          customAlert('Registration successful. Please check your email to verify your account.', 'Registration');
        }

        // Wire Go to Login button to login page
        const goBtn = document.getElementById('goToLoginBtn');
        if (goBtn) {
          goBtn.addEventListener('click', function () {
            window.location.href = 'login.html';
          });
        }
      } catch (err) {
        console.error('Registration error', err);
        customAlert('Network error while registering. Please try again later.', 'Registration');
      }
    });
  }
});