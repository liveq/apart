'use client';

import { useAppStore } from '@/lib/stores/app-store';
import { X } from 'lucide-react';

export default function PageTabs() {
  const { pages, currentPageIndex, setCurrentPageIndex, removePage, updatePageName } = useAppStore();

  if (pages.length === 0) {
    return null; // 페이지가 없으면 표시 안 함
  }

  return (
    <div className="h-16 bg-card border-b border-border flex items-center px-2 gap-2 overflow-x-auto shrink-0">
      {pages.map((page, index) => (
        <div
          key={page.id}
          className={`
            relative flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
            ${index === currentPageIndex
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary hover:bg-accent'
            }
          `}
          onClick={() => setCurrentPageIndex(index)}
        >
          {/* 썸네일 */}
          <img
            src={page.imageUrl}
            alt={page.name}
            className="w-8 h-8 object-cover rounded"
          />

          {/* 페이지 이름 */}
          <span className="text-sm font-medium whitespace-nowrap">
            {page.name}
          </span>

          {/* 삭제 버튼 (현재 페이지에만 표시) */}
          {index === currentPageIndex && pages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`"${page.name}"를 삭제하시겠습니까?`)) {
                  removePage(index);
                }
              }}
              className="ml-1 p-1 hover:bg-destructive/10 rounded"
              title="페이지 삭제"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
