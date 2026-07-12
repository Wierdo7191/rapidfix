// Shared header mobile menu toggle for all RapidFix Kenya pages
document.addEventListener('DOMContentLoaded', function () {
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const menuIconOpen = document.getElementById('menuIconOpen');
  const menuIconClose = document.getElementById('menuIconClose');
  if (!menuToggle || !mobileMenu) return;

  function openMobileMenu() {
    mobileMenu.classList.remove('hidden');
    if (menuIconOpen) menuIconOpen.classList.add('hidden');
    if (menuIconClose) menuIconClose.classList.remove('hidden');
    menuToggle.setAttribute('aria-expanded', 'true');
  }
  function closeMobileMenu() {
    mobileMenu.classList.add('hidden');
    if (menuIconOpen) menuIconOpen.classList.remove('hidden');
    if (menuIconClose) menuIconClose.classList.add('hidden');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleMobileMenu() {
    if (mobileMenu.classList.contains('hidden')) {
      openMobileMenu();
    } else {
      closeMobileMenu();
    }
  }

  menuToggle.addEventListener('click', function (event) {
    event.stopPropagation();
    toggleMobileMenu();
  });
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMobileMenu);
  });
  document.addEventListener('click', function (event) {
    if (
      !mobileMenu.classList.contains('hidden') &&
      !mobileMenu.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMobileMenu();
  });
});
