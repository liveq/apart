'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ToastDismissListener() {
  useEffect(() => {
    const handleClick = () => {
      // Dismiss all toasts on any click
      toast.dismiss();
    };

    const handleTouchStart = () => {
      // Dismiss all toasts on any touch
      toast.dismiss();
    };

    // Add event listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('touchstart', handleTouchStart);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return null; // This component doesn't render anything
}
