export interface PDFPageInfo {
  pageNumber: number;
  thumbnail: string;
}

// PDF.js를 동적으로 로드하여 SSR 문제 방지
let pdfjsLib: any = null;

async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  if (typeof window === 'undefined') {
    throw new Error('PDF.js는 브라우저 환경에서만 사용할 수 있습니다.');
  }

  pdfjsLib = await import('pdfjs-dist');

  // PDF.js worker 설정 (pdf.baal.co.kr과 동일한 방식)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

  return pdfjsLib;
}

/**
 * PDF 파일의 페이지 수를 확인합니다.
 */
export async function getPDFPageCount(file: File): Promise<number> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  return pdf.numPages;
}

/**
 * PDF의 모든 페이지 썸네일을 생성합니다.
 */
export async function generatePDFThumbnails(file: File): Promise<PDFPageInfo[]> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const thumbnails: PDFPageInfo[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 0.5 }); // 썸네일용 작은 스케일

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    thumbnails.push({
      pageNumber: i,
      thumbnail: canvas.toDataURL('image/jpeg', 0.7),
    });
  }

  return thumbnails;
}

/**
 * PDF의 특정 페이지를 JPEG 이미지로 변환합니다.
 * pdf.baal.co.kr과 동일한 방식: DPI 300 (고품질)
 */
export async function convertPDFPageToImage(
  file: File,
  pageNumber: number,
  quality: number = 0.95
): Promise<Blob> {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);

  // 고해상도로 렌더링 (DPI 300 = scale 4.166, pdf.baal.co.kr과 동일)
  const DPI = 300;
  const scale = DPI / 72;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context를 생성할 수 없습니다.');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('이미지 변환에 실패했습니다.'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * PDF의 여러 페이지를 배치로 변환합니다 (메모리 효율적).
 */
export async function convertPDFPagesToImages(
  file: File,
  pageNumbers: number[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> {
  const results: Blob[] = [];
  const batchSize = 3; // 한 번에 3페이지씩 처리

  for (let i = 0; i < pageNumbers.length; i += batchSize) {
    const batch = pageNumbers.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((pageNum) => convertPDFPageToImage(file, pageNum))
    );
    results.push(...batchResults);

    if (onProgress) {
      onProgress(i + batch.length, pageNumbers.length);
    }
  }

  return results;
}

/**
 * Blob을 File 객체로 변환합니다.
 */
export function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type });
}
