'use client';

import { useEffect } from 'react';

export default function ToastDismissListener() {
  // This component is now disabled to allow toasts to display for their full duration
  // Toasts can only be dismissed by clicking directly on them (built-in react-hot-toast feature)
  // This prevents toasts from being dismissed when clicking elsewhere on the page

  useEffect(() => {
    // No global event listeners
    // react-hot-toast handles click-to-dismiss on the toast itself
  }, []);

  return null;
}
