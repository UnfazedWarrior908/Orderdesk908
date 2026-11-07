/**
 * Light haptic feedback helper
 * Triggers a short vibration if supported by device/browser
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'success' | 'error' = 'light') => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(22);
        break;
      case 'success':
        navigator.vibrate([15, 30, 25]);
        break;
      case 'error':
        navigator.vibrate([30, 40, 30]);
        break;
    }
  } catch {
    // Ignore unsupported/blocked vibration
  }
};
