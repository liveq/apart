'use client';

import { useState } from 'react';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface CustomFurnitureDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CustomFurnitureDialog({ open, onClose }: CustomFurnitureDialogProps) {
  const { t } = useTranslation();
  const { addFurniture } = useFurnitureStore();

  const [nameKo, setNameKo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [width, setWidth] = useState('100');
  const [depth, setDepth] = useState('100');
  const [height, setHeight] = useState('75');
  const [color, setColor] = useState('#8B7355');

  if (!open) return null;

  const handleCreate = () => {
    if (!nameKo.trim() || !nameEn.trim()) {
      alert('Please enter both Korean and English names');
      return;
    }

    const widthMm = parseFloat(width) * 10; // cm to mm
    const depthMm = parseFloat(depth) * 10; // cm to mm
    const heightMm = parseFloat(height) * 10; // cm to mm

    if (widthMm <= 0 || depthMm <= 0 || heightMm <= 0 || isNaN(widthMm) || isNaN(depthMm) || isNaN(heightMm)) {
      alert('Please enter valid dimensions');
      return;
    }

    addFurniture({
      templateId: 'custom',
      name: {
        ko: nameKo,
        en: nameEn,
      },
      x: 1000,
      y: 1000,
      width: widthMm,
      depth: depthMm,
      height: heightMm,
      rotation: 0,
      color: color,
      category: 'custom',
    });

    // Reset form
    setNameKo('');
    setNameEn('');
    setWidth('100');
    setDepth('100');
    setHeight('75');
    setColor('#8B7355');
    onClose();
  };

  const handleCancel = () => {
    setNameKo('');
    setNameEn('');
    setWidth('100');
    setDepth('100');
    setHeight('75');
    setColor('#8B7355');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
      <div
        className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">{t('createCustomFurniture')}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('nameKorean')}
            </label>
            <input
              type="text"
              value={nameKo}
              onChange={(e) => setNameKo(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예: 책상"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('nameEnglish')}
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. Desk"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                가로 ({t('cm')})
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                min="1"
                step="1"
                className="w-full px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                깊이 ({t('cm')})
              </label>
              <input
                type="number"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                min="1"
                step="1"
                className="w-full px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                높이 ({t('cm')})
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min="1"
                step="1"
                className="w-full px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('color')}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-secondary hover:bg-accent rounded transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded transition-opacity"
          >
            {t('create')}
          </button>
        </div>
      </div>
    </div>
  );
}
