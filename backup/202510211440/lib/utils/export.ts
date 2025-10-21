import html2canvas from 'html2canvas';

export interface ExportOptions {
  filename?: string;
  quality?: number;
  showLabels?: boolean;
}

export async function exportAsJPEG(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { filename = `floor-plan-${Date.now()}.jpg`, quality = 0.95 } = options;

  const canvasContainer = document.getElementById('floor-plan-canvas-inner');
  if (!canvasContainer) {
    console.error('Canvas container not found');
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'export-overlay';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:bold';
  overlay.innerHTML = '이미지 생성 중...';
  document.body.appendChild(overlay);

  try {
    // Find the floor plan image - try multiple methods
    let originalImg = canvasContainer.querySelector('img') as HTMLImageElement;

    // If not found, try finding in the first child div
    if (!originalImg) {
      const firstDiv = canvasContainer.querySelector(':scope > div');
      if (firstDiv) {
        originalImg = firstDiv.querySelector('img') as HTMLImageElement;
      }
    }

    if (!originalImg) {
      console.error('Floor plan image not found');
      alert('도면 이미지를 찾을 수 없습니다.');
      return;
    }

    console.log('✅ Found image:', originalImg.src);

    const containerRect = canvasContainer.getBoundingClientRect();

    // Get natural dimensions
    let naturalWidth = originalImg.naturalWidth;
    let naturalHeight = originalImg.naturalHeight;

    // Fallback if naturalWidth/Height not available (e.g., Next.js Image)
    if (!naturalWidth || !naturalHeight) {
      const computedStyle = window.getComputedStyle(originalImg);
      naturalWidth = parseInt(computedStyle.width) || containerRect.width;
      naturalHeight = parseInt(computedStyle.height) || containerRect.height;
    }

    console.log(`📐 Container: ${containerRect.width.toFixed(2)} x ${containerRect.height.toFixed(2)}`);
    console.log(`📐 Image natural: ${naturalWidth} x ${naturalHeight}`);

    // Calculate actual displayed image size with objectFit: contain
    const imageRatio = naturalWidth / naturalHeight;
    const containerRatio = containerRect.width / containerRect.height;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageRatio > containerRatio) {
      // Image is wider - fit by width
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / imageRatio;
      offsetX = 0;
      offsetY = (containerRect.height - displayHeight) / 2;
    } else {
      // Image is taller - fit by height
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * imageRatio;
      offsetX = (containerRect.width - displayWidth) / 2;
      offsetY = 0;
    }

    console.log(`📐 Image display size: ${displayWidth.toFixed(2)} x ${displayHeight.toFixed(2)}`);
    console.log(`📐 Image offset: ${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}`);

    // Create a temporary export container
    const exportContainer = document.createElement('div');
    exportContainer.id = 'export-temp-container';
    exportContainer.style.cssText = 'position:fixed;top:-10000px;left:-10000px;background:#fff;';
    document.body.appendChild(exportContainer);

    // Clone the canvas container
    const clonedContainer = canvasContainer.cloneNode(true) as HTMLElement;

    // Set container size to actual image display size
    clonedContainer.style.transform = 'none';
    clonedContainer.style.position = 'relative';
    clonedContainer.style.width = displayWidth + 'px';
    clonedContainer.style.height = displayHeight + 'px';

    // Fix the floor plan image - find it with multiple methods
    let clonedImg = clonedContainer.querySelector('img') as HTMLImageElement;

    // If not found, try finding in the first child div
    if (!clonedImg) {
      const firstDiv = clonedContainer.querySelector(':scope > div');
      if (firstDiv) {
        clonedImg = firstDiv.querySelector('img') as HTMLImageElement;
      }
    }

    if (clonedImg) {
      clonedImg.style.objectFit = 'fill';
      clonedImg.style.width = '100%';
      clonedImg.style.height = '100%';
      console.log('✅ Fixed cloned image');
    } else {
      console.warn('⚠️ Cloned image not found');
    }

    // Adjust all furniture positions
    const furnitureElements = clonedContainer.querySelectorAll('[style*="position: absolute"]');
    furnitureElements.forEach((el) => {
      const elem = el as HTMLElement;
      if (elem.tagName !== 'DIV' || !elem.style.left || elem.style.left === '0px') return;
      if (!elem.style.width || elem.style.width.includes('%')) return;

      const currentLeft = parseFloat(elem.style.left);
      const currentTop = parseFloat(elem.style.top);

      // Adjust for image offset
      elem.style.left = (currentLeft - offsetX) + 'px';
      elem.style.top = (currentTop - offsetY) + 'px';
    });

    exportContainer.appendChild(clonedContainer);

    // Wait for DOM to update
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('📸 Capturing cloned container...');
    const canvas = await html2canvas(clonedContainer, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: true,
      useCORS: true,
      allowTaint: true,
      ignoreElements: (elem) => {
        return elem.classList?.contains('zoom-controls') ||
               elem.classList?.contains('mode-indicator') ||
               elem.id === 'export-overlay';
      },
    });

    // Remove temporary container
    exportContainer.remove();

    console.log('✅ Captured:', canvas.width, 'x', canvas.height);

    // Convert toBlob to Promise to ensure overlay is removed after download
    await new Promise<void>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
            resolve();
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        quality
      );
    });

    console.log('✅ Download started');
  } catch (error) {
    console.error('❌ Export failed:', error);
    alert('이미지 저장 중 오류가 발생했습니다.');
  } finally {
    overlay.remove();
    document.getElementById('export-temp-container')?.remove();
  }
}
