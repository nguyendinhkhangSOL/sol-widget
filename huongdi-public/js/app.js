/* ═══════════════════════════════════════════════════════════════════════
   Đi Cùng Sol — Landing JS
   - Smooth scroll
   - Intersection Observer for fade-in animations
   - FAQ accordion
   - Sticky header shrink
   ═══════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ── Smooth scroll cho anchor links ───────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId.length <= 1) return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const headerOffset = 80;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });

  // ── Intersection Observer — fade-in on scroll ────────────────────────
  if ('IntersectionObserver' in window) {
    const elementsToFade = document.querySelectorAll(
      '.hd-pain__card, .hd-step, .hd-db__category, .hd-how__step, .hd-pricing__card, .hd-story'
    );

    elementsToFade.forEach((el, i) => {
      el.classList.add('hd-fade-in');
      el.style.transitionDelay = `${(i % 4) * 80}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elementsToFade.forEach(el => observer.observe(el));
  }

  // ── Header shadow khi scroll ────────────────────────────────────────
  const header = document.querySelector('.hd-header');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)';
      } else {
        header.style.boxShadow = 'none';
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // ── Track outbound clicks (lightweight analytics) ───────────────────
  document.querySelectorAll('a[href^="/kham-pha-ban-than"], a[href^="/kiem-ke-nguon-luc"], a[href^="/la-ban-huong-di"]').forEach(link => {
    link.addEventListener('click', function() {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'landing_cta_click', {
          destination: this.href,
          location: this.closest('section')?.id || 'unknown',
          text: this.textContent.trim().substring(0, 50)
        });
      }
    });
  });

  // ── FAQ — closing siblings on open (single open at a time) ──────────
  const faqItems = document.querySelectorAll('.hd-faq__item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', function() {
      if (this.open) {
        faqItems.forEach(other => {
          if (other !== this && other.open) other.open = false;
        });
      }
    });
  });

  // ── Number count-up animation cho Trust bar ─────────────────────────
  if ('IntersectionObserver' in window) {
    const trustNums = document.querySelectorAll('.hd-trust__num');
    const trustObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const text = el.textContent.trim();
          const num = parseInt(text);
          if (!isNaN(num) && num > 0) {
            animateCount(el, num, text);
          }
          trustObserver.unobserve(el);
        }
      });
    }, { threshold: 0.3 });

    trustNums.forEach(el => trustObserver.observe(el));
  }

  function animateCount(el, target, originalText) {
    const duration = 1200;
    const start = performance.now();
    const startVal = 0;
    const suffix = originalText.replace(/[0-9]/g, '');

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startVal + (target - startVal) * eased);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = originalText;
      }
    }
    requestAnimationFrame(step);
  }

})();
