// ------------------------------------------------
// /utils/useKeyPress.js
// ------------------------------------------------
import { useEffect } from 'react';

/**
 * Custom hook for handling keyboard events
 * @param {string} targetKey - The key to listen for
 * @param {function} onKeyDown - Function to execute on keydown
 * @param {object} options - Additional options
 */
export default function useKeyPress(targetKey, onKeyDown, options = {}) {
  const { dependencies = [] } = options;
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === targetKey) {
        onKeyDown(e);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetKey, onKeyDown, ...dependencies]);
}
