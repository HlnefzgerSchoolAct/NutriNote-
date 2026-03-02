import { useState, useEffect } from 'react';

/**
 * Custom hook to dynamically load external scripts
 * @param {string} src - The script URL to load
 * @param {Object} attributes - Additional attributes to set on the script element
 * @returns {string} status - 'idle' | 'loading' | 'ready' | 'error'
 */
export function useScript(src, attributes = {}) {
  const [status, setStatus] = useState(src ? 'loading' : 'idle');

  useEffect(() => {
    if (!src) {
      setStatus('idle');
      return;
    }

    // Check if script is already loaded
    let script = document.querySelector(`script[src="${src}"]`);

    if (script) {
      // Script already exists, set status based on its readiness
      setStatus(script.getAttribute('data-status') || 'ready');
    } else {
      // Create script element
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.setAttribute('data-status', 'loading');

      // Set additional attributes
      Object.keys(attributes).forEach((key) => {
        script.setAttribute(key, attributes[key]);
      });

      // Event handlers
      const handleLoad = () => {
        script.setAttribute('data-status', 'ready');
        setStatus('ready');
      };

      const handleError = () => {
        script.setAttribute('data-status', 'error');
        setStatus('error');
      };

      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);

      // Append to document
      document.body.appendChild(script);

      // Cleanup function
      return () => {
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
      };
    }
  }, [src, attributes]);

  return status;
}

export default useScript;
