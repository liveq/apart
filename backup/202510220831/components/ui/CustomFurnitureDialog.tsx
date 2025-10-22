'use client';

import { useState } from 'react';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import toast from 'react-hot-toast';

interface CustomFurnitureDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function CustomFurnitureDialog({ open, onClose }: CustomFurnitureDialogProps) {
  const { t } = useTranslation();
  const { addFurniture } = useFurnitureStore();

  const [nameKo, setNameKo] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [shapeType, setShapeType] = useState<'rectangle' | 'circle'>('rectangle');
  const [width, setWidth] = useState('100');
  const [depth, setDepth] = useState('100');
  const [height, setHeight] = useState('');
  const [diameter, setDiameter] = useState('100');
  const [color, setColor] = useState('#8B7355');

  if (!open) return null;

  const handleCreate = () => {
    // 사각형: 가로, 세로 필수
    // 원형: 지름 필수
    if (shapeType === 'rectangle') {
      if (!width || !depth || parseFloat(width) <= 0 || parseFloat(depth) <= 0) {
        toast.error(t('inputWidthHeightError'));
        return;
      }
    } else if (shapeType === 'circle') {
      if (!diameter || parseFloat(diameter) <= 0) {
        toast.error(t('inputDiameterError'));
        return;
      }
    }

    // 이름 없으면 기본값
    const finalNameKo = nameKo.trim() || t('unnamed');
    const finalNameEn = nameEn.trim() || 'noname';

    let widthMm, depthMm;
    if (shapeType === 'circle') {
      // 원형: 지름을 width, depth 모두에 적용
      widthMm = parseFloat(diameter) * 10; // cm to mm
      depthMm = parseFloat(diameter) * 10;
    } else {
      // 사각형
      widthMm = parseFloat(width) * 10;
      depthMm = parseFloat(depth) * 10;
    }

    // 높이는 선택사항
    const heightMm = height && parseFloat(height) > 0 ? parseFloat(height) * 10 : 100; // 기본값 100mm

    addFurniture({
      templateId: 'custom',
      name: {
        ko: finalNameKo,
        en: finalNameEn,
      },
      x: 1000,
      y: 1000,
      width: widthMm,
      depth: depthMm,
      height: heightMm,
      rotation: 0,
      color: color,
      category: 'custom',
      shape: shapeType,
    });

    // Reset form
    setNameKo('');
    setNameEn('');
    setShapeType('rectangle');
    setWidth('100');
    setDepth('100');
    setHeight('');
    setDiameter('100');
    setColor('#8B7355');
    onClose();
  };

  const handleCancel = () => {
    setNameKo('');
    setNameEn('');
    setShapeType('rectangle');
    setWidth('100');
    setDepth('100');
    setHeight('');
    setDiameter('100');
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
          {/* 이름 (한글 / 영문) - 같은 행 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('nameKorean')}
              </label>
              <input
                type="text"
                value={nameKo}
                onChange={(e) => setNameKo(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('exampleDesk')}
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
                placeholder={t('optional')}
              />
            </div>
          </div>

          {/* 도형 유형 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              도형 유형
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setShapeType('rectangle')}
                className={`flex-1 px-4 py-2 rounded border-2 transition-all ${
                  shapeType === 'rectangle'
                    ? 'border-primary bg-primary/10 font-semibold'
                    : 'border-border bg-secondary'
                }`}
              >
                사각형
              </button>
              <button
                onClick={() => setShapeType('circle')}
                className={`flex-1 px-4 py-2 rounded border-2 transition-all ${
                  shapeType === 'circle'
                    ? 'border-primary bg-primary/10 font-semibold'
                    : 'border-border bg-secondary'
                }`}
              >
                원형
              </button>
            </div>
          </div>

          {/* 사각형 치수 */}
          {shapeType === 'rectangle' && (
            <div className="border border-border/50 rounded-lg p-3 bg-secondary/30">
              <div className="text-xs font-medium text-muted-foreground mb-2">사각형 가구 (단위:cm)</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    가로
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    min="1"
                    step="1"
                    className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    세로(깊이)
                  </label>
                  <input
                    type="number"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    min="1"
                    step="1"
                    className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    높이 ({t('optional')})
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    min="0"
                    step="1"
                    className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('optional')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 원형 가구 치수 */}
          {shapeType === 'circle' && (
            <div className="border border-border/50 rounded-lg p-3 bg-secondary/30">
              <div className="text-xs font-medium text-muted-foreground mb-2">원형 가구 (단위:cm)</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    지름
                  </label>
                  <input
                    type="number"
                    value={diameter}
                    onChange={(e) => setDiameter(e.target.value)}
                    min="1"
                    step="1"
                    className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    높이 ({t('optional')})
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    min="0"
                    step="1"
                    className="w-full px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('optional')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 색상 */}
          <div className="border border-border/50 rounded-lg p-3 bg-secondary/30">
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
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
                className="flex-1 px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
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
