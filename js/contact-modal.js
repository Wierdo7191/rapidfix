// Contact Modal for RapidFix Kenya
// Injects a floating Contact button and modal on all pages
(function () {
  'use strict';

  function injectStyles() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/contact-modal.css';
    document.head.appendChild(link);
  }

  function injectFab() {
    var fab = document.createElement('button');
    fab.className = 'contact-fab';
    fab.setAttribute('data-contact-modal', '');
    fab.innerHTML = '<i class="fas fa-envelope"></i> Contact Us';
    fab.setAttribute('aria-label', 'Open contact form');
    document.body.appendChild(fab);
  }

  function injectModal() {
    var currentUrl = encodeURIComponent(window.location.href);
    var modal = document.createElement('div');
    modal.id = 'contactModalOverlay';
    modal.className = 'contact-modal-overlay';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = '\
      <div id="contactModal" class="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contactModalTitle">\
        <div class="contact-modal-header">\
          <h2 id="contactModalTitle">Contact RapidFix Kenya</h2>\
          <button id="contactModalClose" class="contact-modal-close" aria-label="Close contact modal">&times;</button>\
        </div>\
        <div class="contact-modal-body">\
          <form id="contactReviewForm" action="https://formsubmit.co/gotjames199@gmail.com" method="POST" class="contact-form">\
            <input type="hidden" name="_subject" value="New Contact Form Submission from RapidFix Kenya">\
            <input type="hidden" name="_captcha" value="false">\
            <input type="hidden" name="_redirect" value="' + currentUrl + '">\
            <div class="contact-form-group">\
              <label for="contactName">Full Name *</label>\
              <input type="text" name="name" id="contactName" placeholder="Your full name" required>\
            </div>\
            <div class="contact-form-group">\
              <label for="contactPhone">Phone Number *</label>\
              <input type="tel" name="phone" id="contactPhone" placeholder="07XX XXX XXX" required>\
            </div>\
            <div class="contact-form-group">\
              <label for="contactEmail">Email Address</label>\
              <input type="email" name="email" id="contactEmail" placeholder="your@email.com">\
            </div>\
            <div class="contact-form-group">\
              <label for="contactAppliance">Appliance Type *</label>\
              <select name="appliance" id="contactAppliance" required>\
                <option value="">Select Appliance...</option>\
                <option>TV</option>\
                <option>Washing Machine</option>\
                <option>Fridge</option>\
                <option>Microwave</option>\
                <option>Oven</option>\
                <option>AC</option>\
                <option>Other</option>\
              </select>\
            </div>\
            <div class="contact-form-group">\
              <label for="contactMessage">Brief Description of Issue *</label>\
              <textarea name="description" id="contactMessage" placeholder="Describe the issue with your appliance..." required></textarea>\
            </div>\
            <button type="submit" class="contact-submit-btn">\
              <i class="fas fa-paper-plane"></i> Send Message\
            </button>\
            <div id="contactSuccess" class="contact-success">Thank you! Your message has been sent. We will get back to you within 24 hours.</div>\
            <div id="contactError" class="contact-error">Something went wrong. Please try again or call us directly.</div>\
          </form>\
        </div>\
      </div>';
    document.body.appendChild(modal);
  }

  function openModal() {
    var overlay = document.getElementById('contactModalOverlay');
    var modal = document.getElementById('contactModal');
    var form = document.getElementById('contactReviewForm');
    var successMsg = document.getElementById('contactSuccess');
    var errorMsg = document.getElementById('contactError');

    if (!overlay || !modal) return;

    if (form) {
      form.reset();
      form.style.display = '';
    }
    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
    modal.classList.remove('is-submitting');

    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    var firstInput = modal.querySelector('input, textarea');
    if (firstInput) {
      setTimeout(function () { firstInput.focus(); }, 100);
    }
  }

  function closeModal() {
    var overlay = document.getElementById('contactModalOverlay');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function handleSubmit(e) {
    var form = e.target;
    if (!form) return;
    var modal = document.getElementById('contactModal');
    if (modal) modal.classList.add('is-submitting');

    var nameEl = document.getElementById('contactName');
    var phoneEl = document.getElementById('contactPhone');
    var applianceEl = document.getElementById('contactAppliance');
    var messageEl = document.getElementById('contactMessage');

    if (!nameEl || !phoneEl || !applianceEl || !messageEl) return;
    if (!nameEl.value.trim() || !phoneEl.value.trim() || !applianceEl.value || !messageEl.value.trim()) {
      e.preventDefault();
      if (modal) modal.classList.remove('is-submitting');
      var errorEl = document.getElementById('contactError');
      if (errorEl) {
        errorEl.textContent = 'Please fill in all required fields.';
        errorEl.style.display = 'block';
      }
      return;
    }

    sessionStorage.setItem('rapidfix_contact_submitted', '1');
  }

  function showReturnMessage() {
    if (sessionStorage.getItem('rapidfix_contact_submitted') === '1') {
      sessionStorage.removeItem('rapidfix_contact_submitted');
      var banner = document.createElement('div');
      banner.className = 'bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 mb-6 rounded';
      banner.innerHTML = '<strong>Thank you!</strong> Your message has been sent. We will get back to you within 24 hours.';
      var main = document.querySelector('main');
      if (main) {
        var first = main.querySelector('div');
        if (first) {
          main.insertBefore(banner, first);
        }
      }
    }
  }

  function setup() {
    showReturnMessage();

    injectStyles();
    injectFab();
    injectModal();

    var fab = document.querySelector('[data-contact-modal]');
    if (fab) {
      fab.addEventListener('click', function (event) {
        event.preventDefault();
        openModal();
      });
    }

    var overlay = document.getElementById('contactModalOverlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });
    }

    var closeBtn = document.getElementById('contactModalClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    var form = document.getElementById('contactReviewForm');
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
