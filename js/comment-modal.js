// Comment Modal for RapidFix Kenya Blog Posts
// Submits reviews to FormSubmit.co; business manually features approved reviews on /reviews
(function () {
  'use strict';

  function getArticleContext(trigger) {
    var title = '';
    var url = '';
    if (trigger && trigger.dataset) {
      title = trigger.dataset.articleTitle || '';
      url = trigger.dataset.articleUrl || '';
    }
    if (!title) {
      title = document.title.replace(/\s*\|.*$/, '').trim();
    }
    if (!url) {
      url = window.location.href;
    }
    return { title: title, url: url };
  }

  function openModal(trigger) {
    var overlay = document.getElementById('commentModalOverlay');
    var modal = document.getElementById('commentModal');
    var articleTitleInput = document.getElementById('commentArticleTitle');
    var articleUrlInput = document.getElementById('commentArticleUrl');
    var form = document.getElementById('commentReviewForm');
    var successMsg = document.getElementById('commentSuccess');
    var errorMsg = document.getElementById('commentError');

    if (!overlay || !modal) return;

    var context = getArticleContext(trigger);
    if (articleTitleInput) articleTitleInput.value = context.title;
    if (articleUrlInput) articleUrlInput.value = context.url;

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
    var overlay = document.getElementById('commentModalOverlay');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function handleStarClick(e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var stars = btn.parentElement.querySelectorAll('button');
    var index = Array.prototype.indexOf.call(stars, btn);
    if (index < 0) return;
    var value = index + 1;
    var input = document.getElementById('commentRating');
    if (input) input.value = value;
    stars.forEach(function (star, i) {
      if (i < value) {
        star.classList.add('is-active');
        star.setAttribute('aria-pressed', 'true');
      } else {
        star.classList.remove('is-active');
        star.setAttribute('aria-pressed', 'false');
      }
    });
  }

  function handleSubmit(e) {
    var form = e.target;
    if (!form) return;
    var modal = document.getElementById('commentModal');
    if (modal) modal.classList.add('is-submitting');
    var errorEl = document.getElementById('commentError');
    if (errorEl) errorEl.style.display = 'none';
  }

  function setup() {
    var triggers = document.querySelectorAll('[data-comment-modal]');
    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        openModal(trigger);
      });
    });

    var overlay = document.getElementById('commentModalOverlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });
    }

    var closeBtn = document.getElementById('commentModalClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    var starContainer = document.getElementById('commentStarRating');
    if (starContainer) {
      starContainer.addEventListener('click', handleStarClick);
    }

    var form = document.getElementById('commentReviewForm');
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
