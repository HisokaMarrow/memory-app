import { useEffect, useState } from "react";

export function useInViewOnce(elementId: string, threshold = 0.3) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (inView || typeof document === "undefined" || typeof IntersectionObserver === "undefined") {
      return;
    }

    const element = document.getElementById(elementId);
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { threshold });

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementId, inView, threshold]);

  return inView;
}
