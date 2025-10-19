import html2canvas from 'html2canvas';

export interface ExportOptions {
  filename?: string;
  quality?: number;
  showLabels?: boolean;
}

/**
 * Export canvas as JPEG image
 * This function temporarily resets zoom/pan transforms to ensure accurate export
 */
export async function exportAsJPEG(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = `floor-plan-${Date.now()}.jpg`, quality = 0.95 } = options;

  try {
    // Find the canvas container by ID - we'll capture this directly, not the parent
    const canvasContainer = document.getElementById('floor-plan-canvas-inner');

    if (!canvasContainer) {
      console.error('Canvas container not found');
      return;
    }

    // Store original styles
    const originalTransform = canvasContainer.style.transform;
    const originalTransition = canvasContainer.style.transition;

    // Reset transform for accurate capture
    canvasContainer.style.transform = 'scale(1) translate(0px, 0px)';
    canvasContainer.style.transition = 'none';

    // Wait for DOM to update and browser to paint
    await new Promise(resolve => setTimeout(resolve, 200));

    // Capture the inner canvas directly, not the parent container
    const canvas = await html2canvas(canvasContainer as HTMLElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      ignoreElements: (elem) => {
        // Ignore zoom controls and mode indicators
        return elem.classList?.contains('zoom-controls') ||
               elem.classList?.contains('mode-indicator') ||
               (elem.tagName === 'BUTTON' && elem.closest('.zoom-controls'));
      },
    });

    // Restore original styles
    canvasContainer.style.transform = originalTransform;
    canvasContainer.style.transition = originalTransition;

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.click();
          URL.revokeObjectURL(url);
        }
      },
      'image/jpeg',
      quality
    );
  } catch (error) {
    console.error('Failed to export image:', error);
    throw error;
  }
}
