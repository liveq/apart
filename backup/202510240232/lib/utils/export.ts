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
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';

  // 진행도 표시 UI 생성
  overlay.innerHTML = `
    <div style="
      background: white;
      padding: 32px 48px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      text-align: center;
      min-width: 400px;
    ">
      <div style="
        font-size: 20px;
        font-weight: bold;
        color: #333;
        margin-bottom: 24px;
      ">📸 이미지 생성 중...</div>

      <div style="
        width: 100%;
        height: 24px;
        background: #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 12px;
        position: relative;
      ">
        <div id="export-progress-bar" style="
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 12px;
          transition: width 0.3s ease;
        "></div>
      </div>

      <div id="export-progress-text" style="
        font-size: 16px;
        font-weight: 600;
        color: #3b82f6;
      ">0%</div>

      <div style="
        font-size: 14px;
        color: #999;
        margin-top: 16px;
      ">잠시만 기다려주세요...</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 진행도 업데이트 함수
  const updateProgress = (percent: number, message?: string) => {
    const progressBar = document.getElementById('export-progress-bar');
    const progressText = document.getElementById('export-progress-text');
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = message || `${percent}%`;
  };

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

    const containerRect = canvasContainer.getBoundingClientRect();
    let displayWidth, displayHeight, offsetX, offsetY;

    if (!originalImg) {
      // No floor plan image - drawing mode or blank canvas
      console.log('ℹ️ No floor plan image found - exporting canvas content only');
      displayWidth = containerRect.width;
      displayHeight = containerRect.height;
      offsetX = 0;
      offsetY = 0;
    } else {
      // Floor plan image exists
      console.log('✅ Found image:', originalImg.src);

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
    }

    console.log(`📐 Image display size: ${displayWidth.toFixed(2)} x ${displayHeight.toFixed(2)}`);
    console.log(`📐 Image offset: ${offsetX.toFixed(2)}, ${offsetY.toFixed(2)}`);

    updateProgress(10, '10% - 준비 중...');
    await new Promise(resolve => setTimeout(resolve, 100));

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

    updateProgress(30, '30% - DOM 준비 완료');
    await new Promise(resolve => setTimeout(resolve, 100));

    updateProgress(40, '40% - 캡처 중...');
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
      onclone: () => {
        updateProgress(60, '60% - 요소 복제 중...');
      },
    });

    updateProgress(80, '80% - 이미지 변환 중...');

    // Remove temporary container
    exportContainer.remove();

    console.log('✅ Captured:', canvas.width, 'x', canvas.height);

    // Convert toBlob to Promise to ensure overlay is removed after download
    await new Promise<void>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            updateProgress(95, '95% - 다운로드 준비 중...');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);

            updateProgress(100, '100% - 완료!');
            setTimeout(resolve, 300);
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

    // 에러 표시를 커스텀 UI로 변경
    const progressText = document.getElementById('export-progress-text');
    if (progressText) {
      progressText.textContent = '⚠️ 오류 발생';
      progressText.style.color = '#ef4444';
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  } finally {
    overlay.remove();
    document.getElementById('export-temp-container')?.remove();
  }
}
