/**
 * ThemedLogo - Renders IconTBB (black text) in light mode and
 * IconTBW (white text) in dark mode automatically.
 *
 * The images show "NutriNote+" with a minimal icon to their left.
 */

import React, { useState, useEffect } from 'react';

function isDarkMode() {
  const theme = document.documentElement.getAttribute('data-theme');
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {object} [props.style]
 * @param {string} [props.alt='NutriNote+']
 * @param {number|string} [props.width]
 * @param {number|string} [props.height]
 * @param {boolean} [props.ariaHidden]
 */
function ThemedLogo({ className, style, alt = 'NutriNote+', width, height, ariaHidden }) {
  const [dark, setDark] = useState(isDarkMode);

  useEffect(() => {
    // Watch for explicit data-theme attribute changes
    const observer = new MutationObserver(() => setDark(isDarkMode()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Watch for system color-scheme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMQ = () => setDark(isDarkMode());
    mq.addEventListener('change', handleMQ);

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', handleMQ);
    };
  }, []);

  return (
    <img
      src={dark ? '/IconTBW.png' : '/IconTBB.png'}
      alt={ariaHidden ? '' : alt}
      aria-hidden={ariaHidden ? true : undefined}
      className={className}
      style={style}
      width={width}
      height={height}
    />
  );
}

export default ThemedLogo;
