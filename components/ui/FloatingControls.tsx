'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Grid3x3 } from 'lucide-react';

export default function FloatingControls() {
  const { pages, currentPageIndex, setCurrentPageIndex, viewport, setViewport } = useAppStore();
  const [showPagePanel, setShowPagePanel] = useState(false);

  const hasPages = pages.length > 0;

  // Zoom functions
  const handleZoomIn = () => {
    setViewport({ zoom: Math.min(viewport.zoom * 1.2, 5) });
  };

  const handleZoomOut = () => {
    setViewport({ zoom: Math.max(viewport.zoom / 1.2, 0.1) });
  };

  const handleFitScreen = () => {
    setViewport({ zoom: 1, panX: 0, panY: 0 });
  };

  // Page navigation
  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  return (
    <>
      {/* 우측 상단 플로팅 버튼 */}
      <div className="fixed top-20 right-4 z-40 flex flex-col gap-2">
        {/* 뷰 컨트롤 */}
        <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors border-b border-border"
            title="확대"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors border-b border-border"
            title="축소"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={handleFitScreen}
            className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors"
            title="화면 맞춤"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {/* 페이지 네비게이션 버튼 (페이지가 있을 때만) */}
        {hasPages && (
          <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            <button
              onClick={() => setShowPagePanel(!showPagePanel)}
              className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors relative"
              title="페이지 네비게이션"
            >
              <Grid3x3 size={18} />
              {hasPages && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pages.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 페이지 네비게이션 패널 */}
      {hasPages && showPagePanel && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/20 z-45"
            onClick={() => setShowPagePanel(false)}
          />

          {/* 페이지 패널 */}
          <div className="fixed top-20 right-16 z-50 bg-card border border-border rounded-lg shadow-2xl p-4 max-w-md w-80 max-h-[calc(100vh-6rem)] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="font-bold text-lg">페이지</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPageIndex === 0}
                  className="p-1 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="이전 페이지"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-medium">
                  {currentPageIndex + 1} / {pages.length}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPageIndex === pages.length - 1}
                  className="p-1 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="다음 페이지"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* 페이지 목록 (썸네일 그리드) */}
            <div className="grid grid-cols-2 gap-3">
              {pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => {
                    setCurrentPageIndex(index);
                    setShowPagePanel(false);
                  }}
                  className={`
                    relative rounded-lg overflow-hidden border-2 transition-all
                    ${index === currentPageIndex
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-accent'
                    }
                  `}
                >
                  {/* 썸네일 이미지 */}
                  <div className="aspect-[4/3] bg-secondary">
                    <img
                      src={page.imageUrl}
                      alt={page.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 페이지 정보 */}
                  <div className="p-2 bg-card/95 text-left">
                    <p className="text-xs font-medium truncate">
                      {page.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {index + 1} / {pages.length}
                    </p>
                  </div>

                  {/* 현재 페이지 표시 */}
                  {index === currentPageIndex && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                      현재
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
