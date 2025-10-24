/**
 * Calculate real-world distance from pixel distance
 */
export function pixelsToMM(pixels: number, scale: number): number {
  return pixels / scale;
}

/**
 * Calculate pixel distance from real-world distance
 */
export function mmToPixels(mm: number, scale: number): number {
  return mm * scale;
}

/**
 * Convert mm to cm for display
 */
export function mmToCm(mm: number): number {
  return mm / 10;
}

/**
 * Convert cm to mm
 */
export function cmToMm(cm: number): number {
  return cm * 10;
}

/**
 * Format distance for display
 */
export function formatDistance(mm: number, locale: 'ko' | 'en' = 'ko'): string {
  const cm = mmToCm(mm);
  if (locale === 'ko') {
    if (cm >= 100) {
      return `${(cm / 100).toFixed(2)}m`;
    }
    return `${cm.toFixed(1)}cm`;
  } else {
    if (cm >= 100) {
      return `${(cm / 100).toFixed(2)}m`;
    }
    return `${cm.toFixed(1)}cm`;
  }
}
