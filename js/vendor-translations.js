// Simple translation toggle for demo

const translations = {
  pidgin: {
    'vendor-registration': 'Regista Vendor',
    'join-qooa': 'Join QOOA today (Pidgin demo)'
  }
};

document.addEventListener('DOMContentLoaded', function(){
  const toggle = document.getElementById('langToggle');
  const currentLang = document.getElementById('currentLang');
  if(!toggle) return;

  let lang = 'English';
  toggle.addEventListener('click', function(){
    lang = (lang === 'English') ? 'Pidgin' : 'English';
    currentLang.textContent = lang;

    // Very small demo: swap a couple of text nodes
    if(lang === 'Pidgin'){
      document.querySelectorAll('[data-lang="vendor-registration"]').forEach(el => el.textContent = translations.pidgin['vendor-registration']);
      document.querySelectorAll('[data-lang="join-qooa"]').forEach(el => el.textContent = translations.pidgin['join-qooa']);
    } else {
      // Reload page to restore original set in this simple demo
      window.location.reload();
    }
  });
});