// Comment Modal for RapidFix Kenya Blog Posts
// Submits reviews to FormSubmit.co and saves to localStorage for display on /reviews
(function () {
  'use strict';

  var STORAGE_KEY = 'rapidfix_reviews';

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

  function getStoredReviews() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveReview(review) {
    var reviews = getStoredReviews();
    review.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    review.createdAt = new Date().toISOString();
    reviews.unshift(review);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    } catch (e) {
      // localStorage full or unavailable
    }
    return review;
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

    var nameEl = document.getElementById('commentName');
    var reviewEl = document.getElementById('commentReview');
    var ratingEl = document.getElementById('commentRating');
    var articleTitleEl = document.getElementById('commentArticleTitle');
    var articleUrlEl = document.getElementById('commentArticleUrl');

    var review = {
      name: nameEl ? nameEl.value.trim() : '',
      review: reviewEl ? reviewEl.value.trim() : '',
      rating: ratingEl ? parseInt(ratingEl.value, 10) || 0 : 0,
      article: articleTitleEl ? articleTitleEl.value.trim() : '',
      articleUrl: articleUrlEl ? articleUrlEl.value.trim() : ''
    };

    if (!review.name || !review.review) {
      e.preventDefault();
      if (modal) modal.classList.remove('is-submitting');
      var errorEl = document.getElementById('commentError');
      if (errorEl) {
        errorEl.textContent = 'Please fill in your name and comment.';
        errorEl.style.display = 'block';
      }
      return;
    }

    saveReview(review);
    sessionStorage.setItem('rapidfix_review_submitted', '1');
  }

  function showReturnMessage() {
    if (sessionStorage.getItem('rapidfix_review_submitted') === '1') {
      sessionStorage.removeItem('rapidfix_review_submitted');
      var banner = document.createElement('div');
      banner.className = 'bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 mb-6 rounded';
      banner.innerHTML = '<strong>Thank you!</strong> Your comment has been submitted and will be reviewed by our team.';
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
