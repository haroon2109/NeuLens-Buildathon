import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Moves focus to the new page's main landmark after a client-side navigation
 * and announces the page to screen readers.
 *
 * In a single-page app a route change replaces the DOM without a document
 * load, so neither of the things a browser normally does happens: focus stays
 * on <body>, and a screen reader says nothing about having arrived somewhere
 * new. Keyboard users consequently start tabbing from the top of the document
 * again, and non-visual users get no confirmation that the step changed.
 *
 * The announcement comes from the destination page's own <h1>, so it describes
 * where the user actually is instead of repeating the URL.
 */
export const RouteAnnouncer: React.FC = () => {
  const location = useLocation();
  const lastPath = useRef(location.pathname);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Compare against the previous path so the initial page load is untouched:
    // on first paint the browser has already done the right thing.
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;

    // Wait for the destination route to render before reading its heading.
    const frame = requestAnimationFrame(() => {
      const main = document.querySelector('main');

      if (main) {
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
        main.focus();
      }

      const heading = main?.querySelector('h1')?.textContent?.trim();
      setAnnouncement(heading || document.title || 'Page loaded');
    });

    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
};
