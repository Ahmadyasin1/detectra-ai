import { useEffect } from 'react';
import { registerDeployServiceWorker, registerDeployWatcher } from '../lib/deployVersion';

export default function PerformanceOptimizer() {
  useEffect(() => {
    const preloadCriticalResources = () => {
      const criticalImages = [
        '/usman-aamer.jpg',
        '/ahmad-yasin.jpg',
        '/eman-sarfraz.jpg',
        '/abdul-rehman.jpg',
      ];

      criticalImages.forEach((src) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      });

      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
      fontLink.as = 'style';
      document.head.appendChild(fontLink);
    };

    const optimizeAnimations = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
        document.documentElement.style.setProperty('--animation-iteration-count', '1');
      }

      const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
      if (isLowEndDevice) {
        document.documentElement.classList.add('low-end-device');
      }
    };

    const optimizeScroll = () => {
      let ticking = false;
      const updateScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            ticking = false;
          });
          ticking = true;
        }
      };
      window.addEventListener('scroll', updateScroll, { passive: true });
    };

    const optimizeResize = () => {
      let resizeTimeout: ReturnType<typeof setTimeout>;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {}, 100);
      };
      window.addEventListener('resize', handleResize, { passive: true });
    };

    const setupIntersectionObserver = () => {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
            }
          }
        });
      }, { rootMargin: '50px' });

      document.querySelectorAll('img[data-src]').forEach((img) => imageObserver.observe(img));
    };

    preloadCriticalResources();
    optimizeAnimations();
    void registerDeployServiceWorker();
    const stopDeployWatch = registerDeployWatcher();
    optimizeScroll();
    optimizeResize();
    setupIntersectionObserver();

    return () => {
      stopDeployWatch();
    };
  }, []);

  return null;
}
