'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useDrawingStore } from '@/lib/stores/drawing-store';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface LayoutsDialogProps {
  open: boolean;
  onClose: () => void;
  mode?: 'save' | 'load';
}

export default function LayoutsDialog({ open, onClose, mode = 'save' }: LayoutsDialogProps) {
  const { t } = useTranslation();
  const { savedLayouts, saveLayout, loadLayout, deleteLayout } = useAppStore();
  const { furniture } = useFurnitureStore();
  const {
    saveCurrentWork: saveDrawingWork,
    drawingMode,
    getSavedWorks,
    loadWork: loadDrawingWork,
    deleteWork: deleteDrawingWork
  } = useDrawingStore();

  // 디폴트 이름: 년월일시분초
  const getDefaultName = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  };

  const [layoutName, setLayoutName] = useState(getDefaultName());
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteIsDrawingWork, setDeleteIsDrawingWork] = useState(false);
  const [savedDrawingWorks, setSavedDrawingWorks] = useState<any[]>([]);

  // Reset state and load saved works when dialog opens
  useEffect(() => {
    if (open) {
      setLayoutName(getDefaultName());
      setShowSaveForm(mode === 'save');
      setShowNameError(false);
      // Load drawing works from localStorage
      setSavedDrawingWorks(getSavedWorks());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  if (!open) return null;

  const handleSave = () => {
    if (!layoutName.trim()) {
      setShowNameError(true);
      setTimeout(() => setShowNameError(false), 3000);
      return;
    }

    if (drawingMode) {
      // Save drawing work with custom name
      saveDrawingWork(layoutName.trim());
      // Reload drawing works list
      setSavedDrawingWorks(getSavedWorks());
    } else {
      // Save furniture layout
      saveLayout(layoutName.trim(), furniture);
    }

    setLayoutName(getDefaultName());
    setShowSaveForm(false);
    onClose();
  };

  const handleLoad = (id: string, isDrawingWork: boolean = false) => {
    if (isDrawingWork) {
      // Load drawing work
      loadDrawingWork(id);
      onClose();
    } else {
      // Load furniture layout
      const loadedFurniture = loadLayout(id);
      if (loadedFurniture) {
        // Replace current furniture with loaded layout
        const furnitureStore = useFurnitureStore.getState();
        furnitureStore.furniture.forEach((item) => {
          furnitureStore.deleteFurniture(item.id);
        });

        loadedFurniture.forEach((item) => {
          furnitureStore.addFurniture({
            templateId: item.templateId,
            name: item.name,
            x: item.x,
            y: item.y,
            width: item.width,
            depth: item.depth || item.height, // fallback for old layouts
            height: item.height,
            rotation: item.rotation,
            color: item.color,
            category: item.category,
          });
        });

        onClose();
      }
    }
  };

  const handleDelete = (id: string, isDrawingWork: boolean = false) => {
    setDeleteConfirmId(id);
    setDeleteIsDrawingWork(isDrawingWork);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      if (deleteIsDrawingWork) {
        deleteDrawingWork(deleteConfirmId);
        // Reload drawing works list
        setSavedDrawingWorks(getSavedWorks());
      } else {
        deleteLayout(deleteConfirmId);
      }
      setDeleteConfirmId(null);
      setDeleteIsDrawingWork(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-2xl m-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('layouts')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded transition-colors"
            title={t('close')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Save Layout Section - only show in save mode */}
        {mode === 'save' && (
          <div className="mb-4 pb-4 border-b border-border">
            {!showSaveForm ? (
              <button
                onClick={() => setShowSaveForm(true)}
                className="w-full px-4 py-3 bg-primary text-primary-foreground hover:opacity-90 rounded transition-opacity"
              >
                {t('saveLayout')}
              </button>
            ) : (
              <div className="space-y-2">
                <div>
                  <input
                    type="text"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder={t('layoutName')}
                    className={`w-full px-3 py-2 bg-secondary border rounded focus:outline-none focus:ring-2 transition-colors ${
                      showNameError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-border focus:ring-primary'
                    }`}
                    autoFocus
                  />
                  {showNameError && (
                    <p className="text-sm text-red-500 mt-1 animate-pulse">
                      ⚠️ 배치안 이름을 입력해주세요
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowSaveForm(false);
                      setLayoutName('');
                      onClose();
                    }}
                    className="flex-1 px-4 py-2 bg-secondary hover:bg-accent rounded transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded transition-opacity"
                  >
                    {t('save')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Layouts List */}
        <div className="flex-1 overflow-y-auto">
          {drawingMode ? (
            // Show Drawing Works
            savedDrawingWorks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('newLayout')}
              </div>
            ) : (
              <div className="space-y-2">
                {savedDrawingWorks.map((work) => (
                  <div
                    key={work.id}
                    className="p-4 bg-secondary hover:bg-accent rounded border border-border transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg truncate">
                          {work.name || formatDate(work.timestamp)}
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <div>
                            {formatDate(work.timestamp)}
                          </div>
                          <div>
                            {work.canvasWidth} × {work.canvasHeight} {work.canvasUnit}
                          </div>
                          <div>
                            {work.elements.length} elements
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleLoad(work.id, true)}
                          className="px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded text-sm transition-opacity"
                        >
                          {t('load')}
                        </button>
                        <button
                          onClick={() => handleDelete(work.id, true)}
                          className="px-3 py-2 bg-destructive text-destructive-foreground hover:opacity-90 rounded text-sm transition-opacity"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Show Furniture Layouts
            savedLayouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('newLayout')}
              </div>
            ) : (
              <div className="space-y-2">
                {savedLayouts.map((layout) => (
                  <div
                    key={layout.id}
                    className="p-4 bg-secondary hover:bg-accent rounded border border-border transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg truncate">{layout.name}</h3>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <div>
                            {t('createdAt')}: {formatDate(layout.createdAt)}
                          </div>
                          <div>
                            {t('updatedAt')}: {formatDate(layout.updatedAt)}
                          </div>
                          <div>
                            {layout.furniture.length} items
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleLoad(layout.id, false)}
                          className="px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded text-sm transition-opacity"
                        >
                          {t('load')}
                        </button>
                        <button
                          onClick={() => handleDelete(layout.id, false)}
                          className="px-3 py-2 bg-destructive text-destructive-foreground hover:opacity-90 rounded text-sm transition-opacity"
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Custom Delete Confirmation Dialog */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteConfirmId(null)}>
            <div
              className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-md m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">⚠️ 배치안 삭제</h3>
              <p className="text-muted-foreground mb-6">
                이 배치안을 삭제하시겠습니까?<br />
                삭제된 배치안은 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2 bg-secondary hover:bg-accent rounded transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
