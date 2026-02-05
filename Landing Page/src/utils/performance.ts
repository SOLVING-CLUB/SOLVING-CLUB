// Performance optimization utilities

/**
 * Preload critical resources
 */
export function preloadResources() {
  // Preload critical CSS
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = '/src/styles/index.css';
  document.head.appendChild(link);
}

/**
 * Lazy load images when they enter viewport
 */
export function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Prefetch next likely pages
 */
export function prefetchPages() {
  const prefetchLinks = ['#services', '#work', '#about', '#contact'];
  
  prefetchLinks.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  });
}

/**
 * Initialize all performance optimizations
 */
export function initPerformanceOptimizations() {
  // Preload critical resources
  preloadResources();
  
  // Setup lazy loading
  setupLazyLoading();
  
  // Prefetch likely pages
  prefetchPages();
  
  // Register service worker if available
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed:', err));
    });
  }
}
