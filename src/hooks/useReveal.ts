import { useEffect, useRef } from 'react';

/**
 * Reveals children tagged with the `.reveal` class as they scroll into view.
 * Attach the returned ref to a container; every `.reveal` descendant gets
 * a `data-revealed` attribute once it crosses the viewport threshold (one-shot).
 *
 * A data attribute is used instead of a class on purpose: React re-renders
 * rewrite the entire `class` attribute for elements with dynamic classNames,
 * which would strip a class added here via classList.
 */
const useReveal = <T extends HTMLElement>() => {
  const containerRef = useRef<T | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targets = container.querySelectorAll<HTMLElement>('.reveal');
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-revealed', '');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return containerRef;
};

export default useReveal;
