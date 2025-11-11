// Design System JavaScript - Interactions & Theme Management
// Minimal implementation following the premium design system specifications

class DesignSystemManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupScrollEffects();
    this.setupRevealAnimations();
    this.setupAccessibility();
  }

  // Theme Management
  setupTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    document.documentElement.classList.toggle('dark', isDark);

    // Theme toggle handlers
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-theme-toggle]')) {
        this.toggleTheme();
      }
    });
  }

  toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  }

  // Navigation Management
  setupNavigation() {
    let isNavOpen = false;

    document.addEventListener('click', (e) => {
      // Toggle navigation
      if (e.target.matches('[data-nav-toggle]')) {
        isNavOpen = !isNavOpen;
        this.toggleNav(isNavOpen);
      }

      // Close navigation
      if (e.target.matches('[data-nav-close]') || 
          e.target.closest('[data-nav-drawer]') === e.target) {
        isNavOpen = false;
        this.toggleNav(false);
      }

      // Close nav on link click
      if (e.target.matches('.mobile-nav__link')) {
        isNavOpen = false;
        this.toggleNav(false);
      }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isNavOpen) {
        isNavOpen = false;
        this.toggleNav(false);
      }
    });

    // Close on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100 && isNavOpen) {
        isNavOpen = false;
        this.toggleNav(false);
      }
    });
  }

  toggleNav(isOpen) {
    const drawer = document.querySelector('[data-nav-drawer]');
    const toggle = document.querySelector('[data-nav-toggle]');
    
    if (drawer) {
      drawer.classList.toggle('is-open', isOpen);
    }
    
    if (toggle) {
      toggle.setAttribute('aria-expanded', isOpen);
    }
    
    document.body.setAttribute('data-nav-open', isOpen);
    
    // Focus management
    if (isOpen) {
      const firstFocusable = drawer?.querySelector('button, a, input, [tabindex]');
      firstFocusable?.focus();
    } else {
      toggle?.focus();
    }
  }

  // Scroll Effects
  setupScrollEffects() {
    let ticking = false;

    const updateScrollEffects = () => {
      const header = document.querySelector('.site-header');
      if (header) {
        header.classList.toggle('is-scrolled', window.scrollY > 24);
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollEffects);
        ticking = true;
      }
    });
  }

  // Reveal Animations
  setupRevealAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements with data-reveal attribute
    document.querySelectorAll('[data-reveal]').forEach(el => {
      observer.observe(el);
    });
  }

  // Accessibility Enhancements
  setupAccessibility() {
    // Focus trap for mobile navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const drawer = document.querySelector('[data-nav-drawer].is-open');
        if (drawer) {
          this.trapFocus(e, drawer);
        }
      }
    });

    // Announce theme changes to screen readers
    const themeToggle = document.querySelector('[data-theme-toggle]');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.contains('dark');
        const message = `Switched to ${isDark ? 'dark' : 'light'} theme`;
        this.announceToScreenReader(message);
      });
    }
  }

  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new DesignSystemManager());
} else {
  new DesignSystemManager();
}

// Export for module usage
export default DesignSystemManager;