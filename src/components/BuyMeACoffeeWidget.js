import { useEffect } from 'react';

import { useScript } from '../hooks/useScript';
import './BuyMeACoffeeWidget.css';

/**
 * Buy Me a Coffee floating widget component
 * Only loads the widget when component is mounted
 */
export function BuyMeACoffeeWidget() {
  const scriptStatus = useScript('https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js', {
    'data-cfasync': 'false',
    'data-name': 'BMC-Widget',
  });

  useEffect(() => {
    // Initialize widget configuration after script loads
    if (scriptStatus === 'ready' && window.BMC) {
      // Widget automatically initializes from data attributes in script tag
      // The CSS file (BuyMeACoffeeWidget.css) handles theme-based color changes

      // Listen for theme changes to trigger any necessary updates
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

  useEffect(() => {
    // Add data attributes to the script element for widget configuration
    const script = document.querySelector('script[data-name="BMC-Widget"]');
    if (script && !script.hasAttribute('data-id')) {
      script.setAttribute('data-id', 'HarrisonNef');
      script.setAttribute('data-description', 'Support me on Buy me a coffee!');
      script.setAttribute('data-message', "Support NutriNote's development!");
      script.setAttribute('data-color', '#1a73e8');
      script.setAttribute('data-position', 'Right');
      script.setAttribute('data-x_margin', '18');
      script.setAttribute('data-y_margin', '18');
    }
  }, [scriptStatus]);

  // Component doesn't render anything visible - widget is injected by script
  return null;
}

export default BuyMeACoffeeWidget;
