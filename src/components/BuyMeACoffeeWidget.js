import { useEffect, useMemo } from 'react';

import { useScript } from '../hooks/useScript';
import './BuyMeACoffeeWidget.css';

/**
 * Buy Me a Coffee floating widget component
 * Only loads the widget when component is mounted
 */
export function BuyMeACoffeeWidget() {
  // Memoize attributes to prevent recreating object on every render
  const scriptAttributes = useMemo(
    () => ({
      'data-cfasync': 'false',
      'data-name': 'BMC-Widget',
      'data-id': 'HarrisonNef',
      'data-description': 'Support me on Buy me a coffee!',
      'data-message': "Support NutriNote's development!",
      'data-color': '#1a73e8',
      'data-position': 'Right',
      'data-x_margin': '18',
      'data-y_margin': '18',
    }),
    []
  );

  // Load script with all configuration attributes upfront
  // The widget reads these when it first loads
  const scriptStatus = useScript(
    'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js',
    scriptAttributes
  );

  useEffect(() => {
    // Listen for theme changes
    if (scriptStatus === 'ready') {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-theme') {
            // Theme change detected - CSS will handle color updates
          }
        });
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });

      return () => observer.disconnect();
    }
  }, [scriptStatus]);

  // Component doesn't render anything visible - widget is injected by script
  return null;
}

export default BuyMeACoffeeWidget;
