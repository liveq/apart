'use client';

import { useState, useEffect } from 'react';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { mmToCm } from '@/lib/utils/canvas';
import { furnitureTemplates } from '@/data/furniture-templates';

interface PropertiesPanelProps {
  isMobile?: boolean;
}

export default function PropertiesPanel({ isMobile = false }: PropertiesPanelProps) {
  const { t, language } = useTranslation();
  const { furniture, selectedId, updateFurniture, deleteFurniture, duplicateFurniture, rotateFurniture } = useFurnitureStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedItem = furniture.find((item) => item.id === selectedId);

  // Local state for dimension editing
  const [editWidth, setEditWidth] = useState('');
  const [editDepth, setEditDepth] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editName, setEditName] = useState('');

  // Update local state when selection changes or dimensions change
  useEffect(() => {
    if (selectedItem) {
      setEditWidth(mmToCm(selectedItem.width).toString());
      setEditDepth(mmToCm(selectedItem.depth).toString());
      setEditHeight(mmToCm(selectedItem.height).toString());
      setEditName(selectedItem.customName || '');
    }
  }, [selectedItem?.id, selectedItem?.width, selectedItem?.depth, selectedItem?.height]);

  const handleColorChange = (color: string) => {
    if (selectedId) {
      updateFurniture(selectedId, { color });
    }
  };

  const handleDimensionChange = (dimension: 'width' | 'depth' | 'height', value: string) => {
    if (!selectedId) return;

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const mmValue = numValue * 10; // cm to mm
      updateFurniture(selectedId, { [dimension]: mmValue });
    }
  };

  const handleNameChange = (value: string) => {
    if (!selectedId) return;
    // 빈 문자열이면 customName을 삭제 (기본 이름으로 돌아감)
    updateFurniture(selectedId, { customName: value || undefined });
  };

  const handleResetToDefault = () => {
    if (!selectedId || !selectedItem) return;

    const template = furnitureTemplates.find(t => t.id === selectedItem.templateId);
    if (template) {
      updateFurniture(selectedId, {
        width: template.width,
        depth: template.depth,
        height: template.height,
      });
      setEditWidth(mmToCm(template.width).toString());
      setEditDepth(mmToCm(template.depth).toString());
      setEditHeight(mmToCm(template.height).toString());
    }
  };

  const predefinedColors = [
    '#8B4513', '#A0522D', '#CD853F', '#D2691E',
    '#4682B4', '#5F9EA0', '#6495ED', '#87CEEB',
    '#228B22', '#32CD32', '#90EE90', '#98FB98',
    '#DC143C', '#FF6347', '#FFA07A', '#FF8C00',
    '#696969', '#808080', '#A9A9A9', '#C0C0C0',
  ];

  // Mobile layout
  if (isMobile) {
    if (!selectedItem) {
      return (
        <div className="flex items-center justify-center p-8 text-center text-muted-foreground">
          {t('noSelection')}
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Header with editable name */}
        <div className="px-4 pt-3 pb-2">
          <input
            type="text"
            value={editName}
            placeholder={selectedItem.name[language]}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={(e) => handleNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="font-bold text-lg w-full bg-transparent border-b border-border focus:border-primary outline-none px-1 py-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t('defaultName')}: {selectedItem.name[language]}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Editable Dimensions */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">가로(cm)</label>
              <input
                type="number"
                value={editWidth}
                onChange={(e) => {
                  setEditWidth(e.target.value);
                  handleDimensionChange('width', e.target.value);
                }}
                min="1"
                step="0.1"
                className="w-full px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">깊이(cm)</label>
              <input
                type="number"
                value={editDepth}
                onChange={(e) => {
                  setEditDepth(e.target.value);
                  handleDimensionChange('depth', e.target.value);
                }}
                min="1"
                step="0.1"
                className="w-full px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">높이(cm)</label>
              <input
                type="number"
                value={editHeight}
                onChange={(e) => {
                  setEditHeight(e.target.value);
                  handleDimensionChange('height', e.target.value);
                }}
                min="1"
                step="0.1"
                className="w-full px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <button
            onClick={handleResetToDefault}
            className="w-full px-3 py-2 bg-secondary hover:bg-accent rounded text-sm font-medium transition-colors"
          >
            디폴트로 복원
          </button>
          {/* Quick actions - Grid layout */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => selectedId && rotateFurniture(selectedId)}
              className="px-3 py-3 bg-secondary hover:bg-accent rounded-lg text-sm font-medium transition-colors active:scale-95"
            >
              🔄 {t('rotate')}
            </button>

            <button
              onClick={() => selectedId && duplicateFurniture(selectedId)}
              className="px-3 py-3 bg-secondary hover:bg-accent rounded-lg text-sm font-medium transition-colors active:scale-95"
            >
              📋 {t('duplicate')}
            </button>

            <button
              onClick={() => selectedId && deleteFurniture(selectedId)}
              className="px-3 py-3 bg-destructive text-destructive-foreground hover:opacity-90 rounded-lg text-sm font-medium transition-opacity active:scale-95"
            >
              🗑️ {t('delete')}
            </button>
          </div>

          {/* Color picker */}
          <div>
            <h4 className="font-medium mb-3 text-sm">{t('changeColor')}</h4>
            <div className="grid grid-cols-7 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={"aspect-square rounded-lg border-3 transition-all active:scale-90 " + (
                    selectedItem.color === color
                      ? 'border-primary shadow-lg scale-110'
                      : 'border-border'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Position info - Compact */}
          <div className="bg-secondary/30 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>X: {mmToCm(selectedItem.x).toFixed(1)} cm</div>
              <div>Y: {mmToCm(selectedItem.y).toFixed(1)} cm</div>
              <div className="col-span-2">회전: {selectedItem.rotation}°</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  if (isCollapsed) {
    return (
      <div className="w-12 bg-card border-l border-border flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-accent rounded"
          title={t('selectedItem')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 3L5 10l10 7V3z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 md:w-72 bg-card border-l border-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-lg">{t('selectedItem')}</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-accent rounded"
          title="Collapse"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3l10 7-10 7V3z" />
          </svg>
        </button>
      </div>

      {!selectedItem ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center text-muted-foreground">
          {t('noSelection')}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="mb-3">
              <label className="text-xs font-medium text-muted-foreground block mb-1">{t('furnitureName')}</label>
              <input
                type="text"
                value={editName}
                placeholder={selectedItem.name[language]}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={(e) => handleNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="w-full px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('defaultName')}: {selectedItem.name[language]}
              </p>
            </div>

            {/* Editable Dimensions */}
            <div className="space-y-2 mb-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">가로 (cm)</label>
                <input
                  type="number"
                  value={editWidth}
                  onChange={(e) => {
                    setEditWidth(e.target.value);
                    handleDimensionChange('width', e.target.value);
                  }}
                  min="1"
                  step="0.1"
                  className="w-full px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">깊이 (cm)</label>
                <input
                  type="number"
                  value={editDepth}
                  onChange={(e) => {
                    setEditDepth(e.target.value);
                    handleDimensionChange('depth', e.target.value);
                  }}
                  min="1"
                  step="0.1"
                  className="w-full px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">높이 (cm)</label>
                <input
                  type="number"
                  value={editHeight}
                  onChange={(e) => {
                    setEditHeight(e.target.value);
                    handleDimensionChange('height', e.target.value);
                  }}
                  min="1"
                  step="0.1"
                  className="w-full px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleResetToDefault}
                className="w-full px-3 py-1.5 bg-secondary hover:bg-accent rounded text-xs font-medium transition-colors mt-1"
              >
                디폴트로 복원
              </button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
              <div>
                X: {mmToCm(selectedItem.x).toFixed(1)} cm
              </div>
              <div>
                Y: {mmToCm(selectedItem.y).toFixed(1)} cm
              </div>
              <div>
                회전: {selectedItem.rotation}°
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-medium mb-2">{t('changeColor')}</h4>
            <div className="grid grid-cols-5 gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={"w-10 h-10 rounded border-2 transition-transform hover:scale-110 " + (
                    selectedItem.color === color
                      ? 'border-primary'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <button
              onClick={() => selectedId && rotateFurniture(selectedId)}
              className="w-full px-4 py-2 bg-secondary hover:bg-accent rounded text-sm transition-colors"
            >
              {t('rotate')} (R)
            </button>

            <button
              onClick={() => selectedId && duplicateFurniture(selectedId)}
              className="w-full px-4 py-2 bg-secondary hover:bg-accent rounded text-sm transition-colors"
            >
              {t('duplicate')}
            </button>

            <button
              onClick={() => selectedId && deleteFurniture(selectedId)}
              className="w-full px-4 py-2 bg-destructive text-destructive-foreground hover:opacity-90 rounded text-sm transition-opacity"
            >
              {t('delete')} (Del)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
