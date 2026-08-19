// Admin Shell for RapidFix Kenya
// Reusable across /admin/* pages
// Handles mobile sidebar, active navigation, and auth checks

(function () {
  'use strict';

  function getCurrentPath() {
    return window.location.pathname;
  }

  function setActiveNav() {
    var path = getCurrentPath();
    var links = document.querySelectorAll('.admin-sidebar-nav a');
    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      if (path === href || (href !== '/admin/index.html' && path.startsWith(href))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function toggleMobileSidebar() {
    var sidebar = document.getElementById('adminSidebar');
    var overlay = document.getElementById('adminSidebarOverlay');
    if (!sidebar || !overlay) return;

    var isOpen = sidebar.classList.contains('open');
    if (isOpen) {
      sidebar.classList.remove('open');
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    } else {
      sidebar.classList.add('open');
      overlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileSidebar() {
    var sidebar = document.getElementById('adminSidebar');
    var overlay = document.getElementById('adminSidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  function setupMobileSidebar() {
    var toggle = document.getElementById('adminMobileToggle');
    var overlay = document.getElementById('adminSidebarOverlay');
    var closeBtn = document.getElementById('adminSidebarClose');

    if (toggle) {
      toggle.addEventListener('click', toggleMobileSidebar);
    }

    if (overlay) {
      overlay.addEventListener('click', closeMobileSidebar);
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', closeMobileSidebar);
    }

    // Close sidebar when clicking a nav link on mobile
    var navLinks = document.querySelectorAll('.admin-sidebar-nav a');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 768) {
          closeMobileSidebar();
        }
      });
    });
  }

  function setupLogout() {
    var logoutBtn = document.getElementById('adminLogoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async function () {
      var result = await window.RapidFixAdmin.logout();
      if (result.success) {
        window.location.href = '/admin/login.html';
      } else {
        alert('Logout failed. Please try again.');
      }
    });
  }

  async function enforceAdminAuth() {
    var user = await window.RapidFixAdmin.requireAdmin({
      redirectTo: '/admin/login.html',
      onUnauthorized: function (error) {
        console.warn('[Admin] Access denied:', error);
      }
    });

    if (!user) return;

    var emailEl = document.getElementById('adminEmail');
    if (emailEl) {
      emailEl.textContent = user.email || '';
    }
  }

  function init() {
    setActiveNav();
    setupMobileSidebar();
    setupLogout();
    enforceAdminAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
