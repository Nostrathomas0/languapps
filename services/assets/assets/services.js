// services/assets/js/services.js
// Page scripts for /services (moved out of index.html). Needs jQuery loaded first.

// Fade in the promo block when it scrolls into view
$(function () {
    var $block = $('#promo-block');

    function checkVisible() {
        if ($block.length === 0) return;
        var top = $block[0].getBoundingClientRect().top;
        var winH = window.innerHeight || document.documentElement.clientHeight;
        if (top < winH * 0.88) {
            $block.addClass('is-visible');
            $(window).off('scroll.promo resize.promo');
        }
    }

    $(window).on('scroll.promo resize.promo', checkVisible);
    checkVisible(); // fire immediately if already in view
});

// Rotate images in the profile section
$(document).ready(function () {
    var images = $('.profile-images img').not('.main-image');
    var index = 0;

    function rotateImages() {
        images.css('opacity', '0');
        images.eq(index).css('opacity', '1');
        index = (index + 1) % images.length;
    }

    setInterval(rotateImages, 3000); // every 3 seconds
});

// Facebook Pixel
!function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
}(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '348427750356175'); fbq('track', 'PageView');