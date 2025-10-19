'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface LayoutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function LayoutsDialog({ open, onClose }: LayoutsDialogProps) {
  const { t } = useTranslation();
  const { savedLayouts, saveLayout, loadLayout, deleteLayout } = useAppStore();
  const { furniture } = useFurnitureStore();
  const [layoutName, setLayoutName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  if (!open) return null;

  const handleSave = () => {
    if (!layoutName.trim()) {
      alert('Please enter a layout name');
      return;
    }

    saveLayout(layoutName, furniture);
    setLayoutName('');
    setShowSaveForm(false);
  };

  const handleLoad = (id: string) => {
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
  };

  const handleDelete = (id: string) => {
    if (confirm(t('confirmDeleteLayout'))) {
      deleteLayout(id);
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

        {/* Save Layout Section */}
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
              <input
                type="text"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                placeholder={t('layoutName')}
                className="w-full px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSaveForm(false);
                    setLayoutName('');
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

        {/* Saved Layouts List */}
        <div className="flex-1 overflow-y-auto">
          {savedLayouts.length === 0 ? (
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
                        onClick={() => handleLoad(layout.id)}
                        className="px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded text-sm transition-opacity"
                      >
                        {t('load')}
                      </button>
                      <button
                        onClick={() => handleDelete(layout.id)}
                        className="px-3 py-2 bg-destructive text-destructive-foreground hover:opacity-90 rounded text-sm transition-opacity"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
