/*
 * rihm.io — Site Logic
 * Rebuilt 2026-03 — vanilla JS (no jQuery)
 *
 * Features:
 *   - Mobile menu toggle
 *   - Scroll-to-top button
 *   - Text rotation (subtitle cycling)
 *   - Nav active highlighting (Intersection Observer)
 *   - Copyright year
 */

(function () {
  'use strict';

  // ── Helpers ──

  var header = document.getElementById('site_header');
  var scrollTopBtn = document.querySelector('.lmpixels-scroll-to-top');

  // ── Mobile Menu ──

  function mobileMenuHide() {
    if (window.innerWidth < 992) {
      header.classList.add('mobile-menu-hide');
      setTimeout(function () {
        header.classList.add('animate');
      }, 500);
    } else {
      header.classList.remove('animate');
    }
  }

  // ── Scroll-to-Top Visibility ──

  function updateScrollTopBtn() {
    if (window.scrollY > 150) {
      scrollTopBtn.classList.remove('hidden');
    } else {
      scrollTopBtn.classList.add('hidden');
    }
  }

  // ── Text Rotation ──

  function initTextRotation() {
    var items = document.querySelectorAll('.text-rotation .text-rotation-item');
    if (items.length <= 1) return;

    var currentIndex = 0;
    setInterval(function () {
      items[currentIndex].classList.remove('active');
      currentIndex = (currentIndex + 1) % items.length;
      items[currentIndex].classList.add('active');
    }, 3800);
  }

  // ── Nav Active Highlighting ──

  function initNavHighlighting() {
    var sections = document.querySelectorAll('.pt-page[id]');
    var navLinks = document.querySelectorAll('.site-main-menu a');

    if (!sections.length) return;

    function setActiveLink(id) {
      navLinks.forEach(function (link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + id) {
          link.classList.add('active');
        }
      });
    }

    // Intersection Observer for mid-page sections
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.getAttribute('id'));
          }
        });
      }, {
        rootMargin: '-20% 0px -60% 0px'
      });

      sections.forEach(function (section) {
        observer.observe(section);
      });
    }

    // Activate last section when scrolled near the bottom
    var lastSection = sections[sections.length - 1];
    window.addEventListener('scroll', function () {
      var scrollBottom = window.scrollY + window.innerHeight;
      if (scrollBottom >= document.documentElement.scrollHeight - 50) {
        setActiveLink(lastSection.getAttribute('id'));
      }
    });
  }

  // ── Copyright Year ──

  function setYear() {
    var el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  // ── Init ──

  // Window events
  window.addEventListener('resize', mobileMenuHide);
  window.addEventListener('scroll', updateScrollTopBtn);

  // DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu toggle
    var menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
      menuToggle.addEventListener('click', function () {
        header.classList.add('animate');
        header.classList.toggle('mobile-menu-hide');
      });
    }

    // Close mobile menu when a nav link is clicked
    var mainMenu = document.querySelector('.site-main-menu');
    if (mainMenu) {
      mainMenu.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          mobileMenuHide();
        }
      });
    }

    // Scroll-to-top button
    if (scrollTopBtn) {
      scrollTopBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Start features
    initTextRotation();
    initNavHighlighting();
    updateScrollTopBtn();
    setYear();
  });
})();
