// Reviews Page - renders user-submitted reviews from localStorage
(function () {
  'use strict';

  var STORAGE_KEY = 'rapidfix_reviews';

  function getStoredReviews() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function renderStars(rating) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
      if (i <= rating) {
        html += '<i class="fas fa-star"></i>';
      } else if (i - 0.5 <= rating) {
        html += '<i class="fas fa-star-half-alt"></i>';
      } else {
        html += '<i class="far fa-star"></i>';
      }
    }
    return html;
  }

  function renderReviews() {
    var container = document.getElementById('user-reviews');
    if (!container) return;

    var reviews = getStoredReviews();
    if (!reviews.length) {
      container.innerHTML = '<p class="text-gray-500 text-center mt-8">No user reviews yet. Be the first to leave a review!</p>';
      return;
    }

    var html = '<h2 class="text-2xl font-bold text-gray-800 mt-12 mb-6">Community Reviews</h2>';
    html += '<div class="space-y-6">';

    reviews.forEach(function (review) {
      var stars = renderStars(review.rating || 5);
      var date = review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
      html += '<div class="bg-white p-6 rounded-xl border border-gray-200">';
      html += '  <div class="flex items-start justify-between mb-3">';
      html += '    <div>';
      html += '      <h3 class="font-bold text-gray-800">' + (review.name || 'Anonymous') + '</h3>';
      if (review.article) {
        html += '      <p class="text-xs text-gray-400 mt-1">Reviewed: ' + review.article + '</p>';
      }
      if (date) {
        html += '      <p class="text-xs text-gray-400">' + date + '</p>';
      }
      html += '    </div>';
      html += '    <div class="star-rating">' + stars + '</div>';
      html += '  </div>';
      html += '  <p class="text-gray-600">"' + (review.review || '').replace(/"/g, '&quot;') + '"</p>';
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderReviews);
  } else {
    renderReviews();
  }
})();
