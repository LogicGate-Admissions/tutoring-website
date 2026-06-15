'use client';

/**
 * File purpose: Presentation-only dimmer used during the final demo.
 *
 * Press Ctrl + Alt + G to toggle a grey overlay on the current browser window.
 * The overlay has pointer-events disabled, so the page underneath still works
 * normally while it looks visually inactive in a split-screen demo.
 */

import { useEffect, useState } from 'react';

const SHORTCUT_KEY = 'g';

function isPresentationDimmerShortcut(event: KeyboardEvent) {
  return (
    event.ctrlKey &&
    event.altKey &&
    !event.metaKey &&
    event.key.toLowerCase() === SHORTCUT_KEY
  );
}

export function PresentationDimmer() {
  const [isDimmed, setIsDimmed] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isPresentationDimmerShortcut(event) || event.repeat) {
        return;
      }

      event.preventDefault();
      setIsDimmed((currentValue) => !currentValue);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isDimmed) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[2147483647] bg-slate-900/45 backdrop-grayscale backdrop-saturate-[0.35]"
    />
  );
}
