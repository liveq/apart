'use client';

import { useState, useEffect } from 'react';
import {
  getPDFPageCount,
  generatePDFThumbnails,
  convertPDFPageToImage,
  convertPDFPagesToImages,
  blobToFile,
  type PDFPageInfo,
} from '@/lib/utils/pdf-converter';

interface PDFConversionModalProps {
  file: File;
  onConvert: (imageFiles: { pageNumber: number; blob: Blob }[]) => void;
  onCancel: () => void;
}

type ModalStep = 'loading' | 'choice' | 'page-selection' | 'converting';

export default function PDFConversionModal({ file, onConvert, onCancel }: PDFConversionModalProps) {
  const [step, setStep] = useState<ModalStep>('loading');
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<PDFPageInfo[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [convertProgress, setConvertProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  // 초기 로딩: 페이지 수 확인
  useEffect(() => {
    const loadPDF = async () => {
      try {
        const count = await getPDFPageCount(file);
        setPageCount(count);
        setStep('choice');
      } catch (err) {
        console.error('PDF 로딩 실패:', err);
        setError('PDF 파일을 읽을 수 없습니다.');
      }
    };

    loadPDF();
  }, [file]);

  // 페이지 수에 따른 권장 타입
  const getRecommendationType = () => {
    if (pageCount <= 3) return 'normal';
    if (pageCount <= 10) return 'warning';
    return 'danger';
  };

  // 자동 변환 (전체 또는 선택된 페이지)
  const handleAutoConvert = async (pages?: number[]) => {
    try {
      setStep('converting');

      const pagesToConvert = pages || [1]; // 기본값: 첫 페이지
      setConvertProgress({ current: 0, total: pagesToConvert.length });

      // 모든 선택된 페이지 변환
      const blobs = await convertPDFPagesToImages(file, pagesToConvert, (current, total) => {
        setConvertProgress({ current, total });
      });

      // 페이지 번호와 blob을 함께 전달
      const convertedPages = pagesToConvert.map((pageNum, index) => ({
        pageNumber: pageNum,
        blob: blobs[index],
      }));

      onConvert(convertedPages);
    } catch (err) {
      console.error('변환 실패:', err);
      setError('이미지 변환에 실패했습니다.');
      setStep('choice');
    }
  };

  // 페이지 선택 UI 열기
  const handleOpenPageSelection = async () => {
    try {
      setStep('loading');
      const thumbs = await generatePDFThumbnails(file);
      setThumbnails(thumbs);
      setStep('page-selection');
    } catch (err) {
      console.error('썸네일 생성 실패:', err);
      setError('썸네일 생성에 실패했습니다.');
      setStep('choice');
    }
  };

  // 페이지 선택 토글
  const togglePageSelection = (pageNum: number) => {
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageNum)) {
      newSelection.delete(pageNum);
    } else {
      newSelection.add(pageNum);
    }
    setSelectedPages(newSelection);
  };

  // 수동 변환 사이트로 이동
  const handleManualConversion = () => {
    window.open('https://pdf.baal.co.kr', '_blank');
    onCancel();
  };

  const recommendationType = getRecommendationType();

  // 로딩 중
  if (step === 'loading') {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
        onClick={onCancel}
      >
        <div
          className="bg-card rounded-lg p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-lg">PDF 분석 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 변환 중
  if (step === 'converting') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
        <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-bold mb-4">PDF 변환 중... {pageCount}페이지</h3>
          {convertProgress.total > 0 && (
            <div className="mb-4">
              <div className="w-full bg-secondary rounded-full h-4 mb-2">
                <div
                  className="bg-primary h-4 rounded-full transition-all duration-300"
                  style={{ width: `${(convertProgress.current / convertProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {convertProgress.current}/{convertProgress.total} 페이지 변환 중...
                {convertProgress.total > 5 && <span> (예상 남은 시간: 약 {Math.ceil((convertProgress.total - convertProgress.current) * 3)}초)</span>}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 페이지 선택 UI
  if (step === 'page-selection') {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
        onClick={onCancel}
      >
        <div
          className="bg-card rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 첫 줄: 제목 + 뒤로 버튼 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">페이지 선택 ({pageCount}페이지 중)</h3>
            <button
              onClick={() => setStep('choice')}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-accent"
            >
              뒤로
            </button>
          </div>

          {/* 둘째 줄: 변환 버튼(좌측) + 전체 선택/해제(우측) */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => handleAutoConvert(Array.from(selectedPages))}
              disabled={selectedPages.size === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              변환 ({selectedPages.size}개)
            </button>
            <button
              onClick={() => {
                if (selectedPages.size === pageCount) {
                  setSelectedPages(new Set());
                } else {
                  setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
                }
              }}
              className="text-sm text-primary hover:underline"
            >
              {selectedPages.size === pageCount ? '전체 해제' : '전체 선택'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {thumbnails.map((thumb) => (
              <div
                key={thumb.pageNumber}
                onClick={() => togglePageSelection(thumb.pageNumber)}
                className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${
                  selectedPages.has(thumb.pageNumber)
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <img src={thumb.thumbnail} alt={`Page ${thumb.pageNumber}`} className="w-full h-auto rounded" />
                <p className="text-center mt-2 text-sm font-medium">
                  {selectedPages.has(thumb.pageNumber) && '✓ '}Page {thumb.pageNumber}
                </p>
              </div>
            ))}
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex justify-between gap-3">
            <button
              onClick={() => handleAutoConvert(Array.from(selectedPages))}
              disabled={selectedPages.size === 0}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              변환 ({selectedPages.size}개)
            </button>
            <button
              onClick={() => setStep('choice')}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-accent"
            >
              뒤로
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 선택 UI (페이지 수에 따라 다른 메시지)
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-lg p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-2">
          {recommendationType === 'danger' && '🚨 '}
          {recommendationType === 'warning' && '⚠️ '}
          PDF 파일 감지됨 ({pageCount}페이지)
        </h3>

        {recommendationType === 'normal' && (
          <p className="text-sm text-muted-foreground mb-4">
            📄 총 {pageCount}페이지 도면입니다.
          </p>
        )}

        {recommendationType === 'warning' && (
          <div className="text-sm text-muted-foreground mb-4">
            <p>📄 총 {pageCount}페이지 도면입니다.</p>
            <p className="text-yellow-600 dark:text-yellow-500 mt-1">⚠️ 페이지 수가 많습니다.</p>
            <p className="mt-1">💡 권장: 필요한 페이지만 선택하세요.</p>
          </div>
        )}

        {recommendationType === 'danger' && (
          <div className="text-sm text-muted-foreground mb-4">
            <p>📄 총 {pageCount}페이지 도면집입니다.</p>
            <p className="text-red-600 dark:text-red-500 mt-1 font-medium">🚨 페이지가 너무 많습니다!</p>
            <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
              <p className="font-medium">브라우저에서 변환 시:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>변환 시간: 약 {Math.ceil(pageCount * 2)}~{Math.ceil(pageCount * 3)}초</li>
                <li>메모리 사용량 증가</li>
                <li>브라우저가 느려질 수 있음</li>
              </ul>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="space-y-3">
          {/* 1~3페이지: 전체 변환 권장 */}
          {recommendationType === 'normal' && (
            <>
              <button
                onClick={() => handleAutoConvert(Array.from({ length: pageCount }, (_, i) => i + 1))}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span>✨</span>
                <span>전체 자동 변환 ({pageCount}장 모두)</span>
              </button>
              <button
                onClick={handleOpenPageSelection}
                className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-accent"
              >
                페이지 선택하기
              </button>
              <button
                onClick={handleManualConversion}
                className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-accent"
              >
                수동 변환 사이트 이용 →
              </button>
            </>
          )}

          {/* 4~10페이지: 페이지 선택 권장 */}
          {recommendationType === 'warning' && (
            <>
              <button
                onClick={handleOpenPageSelection}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span>⭐</span>
                <span>페이지 선택하기 (권장)</span>
              </button>
              <button
                onClick={() => handleAutoConvert(Array.from({ length: pageCount }, (_, i) => i + 1))}
                className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-accent"
              >
                전체 변환 (느릴 수 있음)
              </button>
              <button
                onClick={handleManualConversion}
                className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-accent"
              >
                수동 변환 사이트 이용 →
              </button>
            </>
          )}

          {/* 11+페이지: 수동 변환 강력 권장 */}
          {recommendationType === 'danger' && (
            <>
              <button
                onClick={handleManualConversion}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 flex items-center justify-center gap-2"
              >
                <span>⭐</span>
                <span>수동 변환 사이트로 (권장)</span>
              </button>
              <button
                onClick={handleOpenPageSelection}
                className="w-full px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-accent"
              >
                페이지 선택하기
              </button>
              <button
                onClick={() => handleAutoConvert(Array.from({ length: pageCount }, (_, i) => i + 1))}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
              >
                그래도 전체 변환 (⚠️ 시간 오래 걸림)
              </button>
            </>
          )}

          <button
            onClick={onCancel}
            className="w-full px-4 py-3 border border-border rounded-lg font-medium hover:bg-accent"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
