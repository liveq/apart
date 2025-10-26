'use client';

import { useState, useEffect } from 'react';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useDrawingStore } from '@/lib/stores/drawing-store';
import { useLayerStore } from '@/lib/stores/layer-store';
import { useSelectionStore } from '@/lib/stores/selection-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { mmToCm } from '@/lib/utils/canvas';
import { furnitureTemplates } from '@/data/furniture-templates';

interface PropertiesPanelProps {
  isMobile?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function PropertiesPanel({ isMobile = false, onCollapseChange }: PropertiesPanelProps) {
  const { t, language } = useTranslation();
  const { furniture, selectedId: furnitureSelectedId, updateFurniture, deleteFurniture, duplicateFurniture, rotateFurniture } = useFurnitureStore();
  const { elements, selectedElementId, updateElement, deleteElement, showDimensionLabels, setShowDimensionLabels, rotateElement, duplicateElement } = useDrawingStore();
  const { layers, getSortedLayers } = useLayerStore();
  const { selectedItems, getSelectedCount, getSelectedFurnitureIds, getSelectedDrawingIds } = useSelectionStore();
  const selectedCount = getSelectedCount();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle collapse toggle
  const handleCollapseToggle = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    if (onCollapseChange) {
      onCollapseChange(collapsed);
    }
  };

  const [showAllFurnitureColors, setShowAllFurnitureColors] = useState(false);
  const [showAllTextColors, setShowAllTextColors] = useState(false);
  const [showAllStrokeColors, setShowAllStrokeColors] = useState(false);
  const [showAllFillColors, setShowAllFillColors] = useState(false);

  // Determine what's selected
  const selectedFurniture = furniture.find((item) => item.id === furnitureSelectedId);
  const selectedDrawing = elements.find((el) => el.id === selectedElementId);

  // Local state for furniture editing
  const [editWidth, setEditWidth] = useState('');
  const [editDepth, setEditDepth] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editName, setEditName] = useState('');

  // Local state for drawing editing
  const [editDrawingWidth, setEditDrawingWidth] = useState('');
  const [editDrawingHeight, setEditDrawingHeight] = useState('');
  const [editStrokeColor, setEditStrokeColor] = useState('');
  const [editFillColor, setEditFillColor] = useState('');
  const [editThickness, setEditThickness] = useState('');
  const [editLineLength, setEditLineLength] = useState('');
  const [editTextContent, setEditTextContent] = useState('');
  const [editTextColor, setEditTextColor] = useState('');
  const [editFontSize, setEditFontSize] = useState('');

  // Update local state when furniture selection changes
  useEffect(() => {
    if (selectedFurniture) {
      setEditWidth(mmToCm(selectedFurniture.width).toString());
      setEditDepth(mmToCm(selectedFurniture.depth).toString());
      setEditHeight(mmToCm(selectedFurniture.height).toString());
      setEditName(selectedFurniture.customName || '');
    }
  }, [selectedFurniture?.id, selectedFurniture?.width, selectedFurniture?.depth, selectedFurniture?.height]);

  // Update local state when drawing selection changes
  useEffect(() => {
    if (selectedDrawing) {
      if (selectedDrawing.type === 'rectangle') {
        setEditDrawingWidth((selectedDrawing.width).toString());
        setEditDrawingHeight((selectedDrawing.height).toString());
        setEditStrokeColor(selectedDrawing.strokeColor);
        setEditFillColor(selectedDrawing.fillColor);
        setEditThickness(selectedDrawing.thickness.toString());
      } else if (selectedDrawing.type === 'circle') {
        setEditDrawingWidth((selectedDrawing.rx * 2).toString());
        setEditDrawingHeight((selectedDrawing.ry * 2).toString());
        setEditStrokeColor(selectedDrawing.strokeColor);
        setEditFillColor(selectedDrawing.fillColor);
        setEditThickness(selectedDrawing.thickness.toString());
      } else if (selectedDrawing.type === 'line') {
        const dx = selectedDrawing.endX - selectedDrawing.startX;
        const dy = selectedDrawing.endY - selectedDrawing.startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        setEditLineLength(length.toFixed(1));
        setEditStrokeColor(selectedDrawing.color);
        setEditThickness(selectedDrawing.thickness.toString());
      } else if (selectedDrawing.type === 'path') {
        setEditStrokeColor(selectedDrawing.color);
        setEditThickness(selectedDrawing.thickness.toString());
      } else if (selectedDrawing.type === 'text') {
        setEditTextContent(selectedDrawing.text);
        setEditTextColor(selectedDrawing.color);
        setEditFontSize(selectedDrawing.fontSize.toString());
      }
    }
  }, [selectedDrawing?.id]);

  const handleColorChange = (color: string) => {
    if (furnitureSelectedId) {
      updateFurniture(furnitureSelectedId, { color });
    }
  };

  const handleDimensionChange = (dimension: 'width' | 'depth' | 'height', value: string) => {
    if (!furnitureSelectedId) return;

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const mmValue = numValue * 10; // cm to mm
      updateFurniture(furnitureSelectedId, { [dimension]: mmValue });
    }
  };

  const handleNameChange = (value: string) => {
    if (!furnitureSelectedId) return;
    updateFurniture(furnitureSelectedId, { customName: value || undefined });
  };

  const handleResetToDefault = () => {
    if (!furnitureSelectedId || !selectedFurniture) return;

    const template = furnitureTemplates.find(t => t.id === selectedFurniture.templateId);
    if (template) {
      updateFurniture(furnitureSelectedId, {
        width: template.width,
        depth: template.depth,
        height: template.height,
      });
      setEditWidth(mmToCm(template.width).toString());
      setEditDepth(mmToCm(template.depth).toString());
      setEditHeight(mmToCm(template.height).toString());
    }
  };

  // Drawing element editing handlers
  const handleDrawingSizeChange = (dimension: 'width' | 'height', value: string) => {
    if (!selectedElementId || !selectedDrawing) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    if (selectedDrawing.type === 'rectangle') {
      if (dimension === 'width') {
        updateElement(selectedElementId, { width: numValue });
      } else {
        updateElement(selectedElementId, { height: numValue });
      }
    } else if (selectedDrawing.type === 'circle') {
      if (dimension === 'width') {
        updateElement(selectedElementId, { rx: numValue / 2 });
      } else {
        updateElement(selectedElementId, { ry: numValue / 2 });
      }
    }
  };

  const handleDrawingColorChange = (type: 'stroke' | 'fill', color: string) => {
    if (!selectedElementId || !selectedDrawing) return;

    if (type === 'stroke') {
      if (selectedDrawing.type === 'line' || selectedDrawing.type === 'path') {
        updateElement(selectedElementId, { color });
      } else if (selectedDrawing.type === 'rectangle' || selectedDrawing.type === 'circle') {
        updateElement(selectedElementId, { strokeColor: color });
      }
    } else {
      if (selectedDrawing.type === 'rectangle' || selectedDrawing.type === 'circle') {
        // Extract RGB and keep alpha
        const rgb = color.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const currentOpacity = selectedDrawing.opacity || 0.3;
          updateElement(selectedElementId, {
            fillColor: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${currentOpacity})`
          });
        }
      }
    }
  };

  const handleDrawingThicknessChange = (value: string) => {
    if (!selectedElementId) return;

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateElement(selectedElementId, { thickness: numValue });
    }
  };

  const handleLineLengthChange = (value: string) => {
    if (!selectedElementId || !selectedDrawing || selectedDrawing.type !== 'line') return;

    const newLength = parseFloat(value);
    if (isNaN(newLength) || newLength <= 0) return;

    // Calculate current direction
    const dx = selectedDrawing.endX - selectedDrawing.startX;
    const dy = selectedDrawing.endY - selectedDrawing.startY;
    const currentLength = Math.sqrt(dx * dx + dy * dy);

    if (currentLength === 0) return;

    // Calculate unit direction
    const unitDx = dx / currentLength;
    const unitDy = dy / currentLength;

    // Calculate new end point
    const newEndX = selectedDrawing.startX + unitDx * newLength;
    const newEndY = selectedDrawing.startY + unitDy * newLength;

    updateElement(selectedElementId, { endX: newEndX, endY: newEndY });
  };

  const handleTextContentChange = (value: string) => {
    if (!selectedElementId) return;
    updateElement(selectedElementId, { text: value });
  };

  const handleTextColorChange = (color: string) => {
    if (!selectedElementId) return;
    updateElement(selectedElementId, { color });
  };

  const handleFontSizeChange = (value: string) => {
    if (!selectedElementId) return;

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      updateElement(selectedElementId, { fontSize: numValue });
    }
  };

  const predefinedColors = [
    '#8B4513', '#A0522D', '#CD853F', '#D2691E',
    '#4682B4', '#5F9EA0', '#6495ED', '#87CEEB',
    '#228B22', '#32CD32', '#90EE90', '#98FB98',
    '#DC143C', '#FF6347', '#FFA07A', '#FF8C00',
    '#696969', '#808080', '#A9A9A9', '#C0C0C0',
    '#000000', '#FFFFFF'
  ];

  // Default 4 colors (diverse hues)
  const defaultColors = ['#8B4513', '#4682B4', '#DC143C', '#228B22'];

  // Remaining colors (excluding default 4)
  const remainingColors = predefinedColors.filter(color => !defaultColors.includes(color));


  // Desktop layout - Collapsed
  if (isCollapsed) {
    return (
      <div className="w-full h-full bg-card flex flex-col items-center justify-center py-4">
        <button
          onClick={() => handleCollapseToggle(false)}
          className="p-2 hover:bg-accent rounded"
          title={t('propertiesPanel')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 3L5 10l10 7V3z" />
          </svg>
        </button>
      </div>
    );
  }

  // Desktop layout - Content
  return (
    <div className="w-full h-full bg-card flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-lg">{t('propertiesPanel')}</h2>
        <button
          onClick={() => handleCollapseToggle(true)}
          className="p-1 hover:bg-accent rounded"
          title={t('close')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3l10 7-10 7V3z" />
          </svg>
        </button>
      </div>

      {selectedCount === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4 text-center text-muted-foreground">
          {t('noItemSelected')}
        </div>
      ) : selectedCount > 1 ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">{selectedCount}개 선택됨</h3>
            <p className="text-xs text-muted-foreground mb-3">
              가구 {getSelectedFurnitureIds().length}개, 도형 {getSelectedDrawingIds().length}개
            </p>
          </div>

          {/* Layer batch move */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium mb-2">레이어 일괄 이동</h3>
            <select
              onChange={(e) => {
                const targetLayerId = e.target.value;
                const { moveFurnitureToLayer } = useFurnitureStore.getState();
                const { moveElementToLayer } = useDrawingStore.getState();

                // Move all selected furniture
                getSelectedFurnitureIds().forEach(id => {
                  moveFurnitureToLayer(id, targetLayerId);
                });

                // Move all selected drawings
                getSelectedDrawingIds().forEach(id => {
                  moveElementToLayer(id, targetLayerId);
                });
              }}
              className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
              defaultValue=""
            >
              <option value="" disabled>레이어 선택...</option>
              {getSortedLayers().map(layer => (
                <option key={layer.id} value={layer.id}>
                  {layer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch delete */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => {
                if (!window.confirm(`선택된 ${selectedCount}개의 항목을 삭제하시겠습니까?`)) return;

                const { deleteFurniture } = useFurnitureStore.getState();
                const { deleteElement } = useDrawingStore.getState();
                const { clearSelection } = useSelectionStore.getState();

                // Delete all selected furniture
                getSelectedFurnitureIds().forEach(id => {
                  deleteFurniture(id);
                });

                // Delete all selected drawings
                getSelectedDrawingIds().forEach(id => {
                  deleteElement(id);
                });

                clearSelection();
              }}
              className="w-full px-3 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded transition-colors"
            >
              선택 항목 삭제
            </button>
          </div>

          {/* Selection info */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Ctrl을 누른 채로 클릭하여 선택을 추가하거나 제거할 수 있습니다.
            </p>
          </div>
        </div>
      ) : selectedFurniture ? (
        // Furniture properties
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            {/* Compact layout */}
            <div className="space-y-2 mb-3">
              {/* Furniture Name */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '60px' }}>가구이름</label>
                <input
                  type="text"
                  value={editName}
                  placeholder={`${selectedFurniture.name[language]} (기본)`}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={(e) => handleNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  className="flex-1 px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Width */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '60px' }}>가로(cm)</label>
                <input
                  type="number"
                  value={editWidth}
                  onChange={(e) => {
                    setEditWidth(e.target.value);
                    handleDimensionChange('width', e.target.value);
                  }}
                  min="1"
                  step="0.1"
                  className="flex-1 px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Depth */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '60px' }}>깊이(cm)</label>
                <input
                  type="number"
                  value={editDepth}
                  onChange={(e) => {
                    setEditDepth(e.target.value);
                    handleDimensionChange('depth', e.target.value);
                  }}
                  min="1"
                  step="0.1"
                  className="flex-1 px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Height */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '60px' }}>높이(cm)</label>
                <input
                  type="number"
                  value={editHeight}
                  onChange={(e) => {
                    setEditHeight(e.target.value);
                    handleDimensionChange('height', e.target.value);
                  }}
                  min="1"
                  step="0.1"
                  className="flex-1 px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleResetToDefault}
                className="w-full px-3 py-1.5 bg-secondary hover:bg-accent rounded text-xs font-medium transition-colors"
              >
                디폴트로 복원
              </button>
            </div>

            {/* Position info and action buttons */}
            <div className="pt-2 border-t border-border space-y-2">
              <div className="text-xs text-muted-foreground">
                위치-x:{mmToCm(selectedFurniture.x).toFixed(1)}cm / y:{mmToCm(selectedFurniture.y).toFixed(1)}cm / 회전:{selectedFurniture.rotation}°
              </div>

              {/* Action buttons in one row */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => furnitureSelectedId && rotateFurniture(furnitureSelectedId)}
                  className="px-2 py-1.5 bg-secondary hover:bg-accent rounded text-xs transition-colors"
                >
                  회전
                </button>
                <button
                  onClick={() => furnitureSelectedId && duplicateFurniture(furnitureSelectedId)}
                  className="px-2 py-1.5 bg-secondary hover:bg-accent rounded text-xs transition-colors"
                >
                  복제
                </button>
                <button
                  onClick={() => furnitureSelectedId && deleteFurniture(furnitureSelectedId)}
                  className="px-2 py-1.5 bg-destructive text-destructive-foreground hover:opacity-90 rounded text-xs transition-opacity"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">채우기</h4>
              <div className="flex items-center gap-1">
                {/* Default 4 colors */}
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={"w-8 h-8 rounded border-2 transition-transform hover:scale-110 " + (
                      selectedFurniture.color === color
                        ? 'border-primary'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {/* Expand button */}
                <button
                  onClick={() => setShowAllFurnitureColors(!showAllFurnitureColors)}
                  className="w-8 h-8 rounded border-2 border-border hover:bg-accent transition-colors flex items-center justify-center text-xs"
                  title={showAllFurnitureColors ? '접기' : '펼치기'}
                >
                  {showAllFurnitureColors ? '▲' : '▼'}
                </button>
              </div>
            </div>
            {/* Expanded colors */}
            {showAllFurnitureColors && (
              <div className="grid grid-cols-6 gap-1.5">
                {remainingColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={"w-8 h-8 rounded border-2 transition-transform hover:scale-110 " + (
                      selectedFurniture.color === color
                        ? 'border-primary'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {/* Custom color picker button */}
                <input
                  type="color"
                  value={selectedFurniture.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded border-2 border-dashed border-border cursor-pointer"
                  title="커스텀 색상"
                />
              </div>
            )}
          </div>

          {/* Layer Controls */}
          <div className="border-t border-border pt-4">
            <div className="space-y-2">
              {/* Layer dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '60px' }}>레이어</label>
                <select
                  value={selectedFurniture.layerId}
                  onChange={(e) => {
                    const { moveFurnitureToLayer } = useFurnitureStore.getState();
                    moveFurnitureToLayer(selectedFurniture.id, e.target.value);
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background"
                >
                  {getSortedLayers().map(layer => (
                    <option key={layer.id} value={layer.id}>
                      {layer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Element order controls */}
              <div className="text-xs text-muted-foreground mb-1">요소 순서</div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    const { moveElementUp } = useFurnitureStore.getState();
                    moveElementUp(selectedFurniture.id);
                  }}
                  className="px-2 py-1 text-xs border border-border rounded hover:bg-accent"
                >
                  ↑ 한칸 위
                </button>
                <button
                  onClick={() => {
                    const { moveElementDown } = useFurnitureStore.getState();
                    moveElementDown(selectedFurniture.id);
                  }}
                  className="px-2 py-1 text-xs border border-border rounded hover:bg-accent"
                >
                  ↓ 한칸 아래
                </button>
                <button
                  onClick={() => {
                    const { moveElementToTop } = useFurnitureStore.getState();
                    moveElementToTop(selectedFurniture.id);
                  }}
                  className="px-2 py-1 text-xs border border-border rounded hover:bg-accent"
                >
                  ⇈ 맨 위
                </button>
                <button
                  onClick={() => {
                    const { moveElementToBottom } = useFurnitureStore.getState();
                    moveElementToBottom(selectedFurniture.id);
                  }}
                  className="px-2 py-1 text-xs border border-border rounded hover:bg-accent"
                >
                  ⇊ 맨 아래
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : selectedDrawing ? (
        // Drawing element properties
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="font-medium mb-3">
              {selectedDrawing.type === 'line' && t('line')}
              {selectedDrawing.type === 'rectangle' && t('rectangle')}
              {selectedDrawing.type === 'circle' && t('circleEllipse')}
              {selectedDrawing.type === 'text' && t('text')}
              {selectedDrawing.type === 'path' && t('freehand')}
            </h3>

            {/* Compact layout for drawing properties */}
            <div className="space-y-2 mb-3">
              {/* Text content editing */}
              {selectedDrawing.type === 'text' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">내용</label>
                    <textarea
                      value={editTextContent}
                      onChange={(e) => {
                        setEditTextContent(e.target.value);
                        handleTextContentChange(e.target.value);
                      }}
                      className="w-full px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={3}
                      placeholder={t('textInput')}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '80px' }}>글꼴크기(px)</label>
                    <input
                      type="number"
                      value={editFontSize}
                      onChange={(e) => {
                        setEditFontSize(e.target.value);
                        handleFontSizeChange(e.target.value);
                      }}
                      min="8"
                      step="1"
                      className="flex-1 px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {/* Length editing for lines */}
              {selectedDrawing.type === 'line' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '60px' }}>길이(px)</label>
                  <input
                    type="number"
                    value={editLineLength}
                    onChange={(e) => {
                      setEditLineLength(e.target.value);
                      handleLineLengthChange(e.target.value);
                    }}
                    min="1"
                    step="0.1"
                    className="flex-1 px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Size editing for shapes */}
              {(selectedDrawing.type === 'rectangle' || selectedDrawing.type === 'circle') && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '60px' }}>가로(px)</label>
                    <input
                      type="number"
                      value={editDrawingWidth}
                      onChange={(e) => {
                        setEditDrawingWidth(e.target.value);
                        handleDrawingSizeChange('width', e.target.value);
                      }}
                      min="1"
                      step="1"
                      className="flex-1 px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '60px' }}>세로(px)</label>
                    <input
                      type="number"
                      value={editDrawingHeight}
                      onChange={(e) => {
                        setEditDrawingHeight(e.target.value);
                        handleDrawingSizeChange('height', e.target.value);
                      }}
                      min="1"
                      step="1"
                      className="flex-1 px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {/* Thickness for all except text */}
              {selectedDrawing.type !== 'text' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '60px' }}>선두께(px)</label>
                  <input
                    type="number"
                    value={editThickness}
                    onChange={(e) => {
                      setEditThickness(e.target.value);
                      handleDrawingThicknessChange(e.target.value);
                    }}
                    min="1"
                    step="1"
                    className="flex-1 px-2 py-1.5 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {/* Action buttons in one row */}
              <div className="grid grid-cols-3 gap-1.5 pt-2">
                <button
                  onClick={() => selectedElementId && rotateElement(selectedElementId)}
                  className="px-2 py-1.5 bg-secondary hover:bg-accent rounded text-xs transition-colors"
                >
                  회전
                </button>
                <button
                  onClick={() => selectedElementId && duplicateElement(selectedElementId)}
                  className="px-2 py-1.5 bg-secondary hover:bg-accent rounded text-xs transition-colors"
                >
                  복제
                </button>
                <button
                  onClick={() => selectedElementId && deleteElement(selectedElementId)}
                  className="px-2 py-1.5 bg-destructive text-destructive-foreground hover:opacity-90 rounded text-xs transition-opacity"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>

          {/* Text color */}
          {selectedDrawing.type === 'text' && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">텍스트</h4>
                <div className="flex items-center gap-1">
                  {/* Default 4 colors */}
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        handleTextColorChange(color);
                        setEditTextColor(color);
                      }}
                      className={"w-8 h-8 rounded border-2 transition-transform hover:scale-110 " + (
                        editTextColor === color
                          ? 'border-primary'
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  {/* Expand button */}
                  <button
                    onClick={() => setShowAllTextColors(!showAllTextColors)}
                    className="w-8 h-8 rounded border-2 border-border hover:bg-accent transition-colors flex items-center justify-center text-xs"
                    title={showAllTextColors ? '접기' : '펼치기'}
                  >
                    {showAllTextColors ? '▲' : '▼'}
                  </button>
                </div>
              </div>
              {/* Expanded colors */}
              {showAllTextColors && (
                <div className="grid grid-cols-6 gap-1.5">
                  {remainingColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        handleTextColorChange(color);
                        setEditTextColor(color);
                      }}
                      className={"w-8 h-8 rounded border-2 transition-transform hover:scale-110 " + (
                        editTextColor === color
                          ? 'border-primary'
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  {/* Custom color picker */}
                  <input
                    type="color"
                    value={editTextColor}
                    onChange={(e) => {
                      handleTextColorChange(e.target.value);
                      setEditTextColor(e.target.value);
                    }}
                    className="w-8 h-8 rounded border-2 border-dashed border-border cursor-pointer"
                    title="커스텀 색상"
                  />
                </div>
              )}
            </div>
          )}

          {/* Stroke color */}
          {selectedDrawing.type !== 'text' && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">테두리</h4>
                <div className="flex items-center gap-1">
                  {/* Default 4 colors */}
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleDrawingColorChange('stroke', color)}
                      className={"w-8 h-8 rounded border-2 transition-transform hover:scale-110 " + (
                        editStrokeColor === color
                          ? 'border-primary'
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  {/* Expand button */}
                  <button
                    onClick={() => setShowAllStrokeColors(!showAllStrokeColors)}
                    className="w-8 h-8 rounded border-2 border-border hover:bg-accent transition-colors flex items-center justify-center text-xs"
                    title={showAllStrokeColors ? '접기' : '펼치기'}
                  >
                    {showAllStrokeColors ? '▲' : '▼'}
                  </button>
                </div>
              </div>
              {/* Expanded colors */}
              {showAllStrokeColors && (
                <div className="grid grid-cols-6 gap-1.5">
                  {remainingColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleDrawingColorChange('stroke', color)}
                      className={"w-8 h-8 rounded border-2 transition-transform hover:scale-110 " + (
                        editStrokeColor === color
                          ? 'border-primary'
                          : 'border-gray-300 dark:border-gray-600'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  {/* Custom color picker */}
                  <input
                    type="color"
                    value={editStrokeColor}
                    onChange={(e) => {
                      handleDrawingColorChange('stroke', e.target.value);
                      setEditStrokeColor(e.target.value);
                    }}
                    className="w-8 h-8 rounded border-2 border-dashed border-border cursor-pointer"
                    title="커스텀 색상"
                  />
                </div>
              )}
            </div>
          )}

          {/* Fill color for shapes */}
          {(selectedDrawing.type === 'rectangle' || selectedDrawing.type === 'circle') && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">채우기</h4>
                <div className="flex items-center gap-1">
                  {/* Default 4 colors */}
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleDrawingColorChange('fill', color)}
                      className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  {/* Expand button */}
                  <button
                    onClick={() => setShowAllFillColors(!showAllFillColors)}
                    className="w-8 h-8 rounded border-2 border-border hover:bg-accent transition-colors flex items-center justify-center text-xs"
                    title={showAllFillColors ? '접기' : '펼치기'}
                  >
                    {showAllFillColors ? '▲' : '▼'}
                  </button>
                </div>
              </div>
              {/* Expanded colors */}
              {showAllFillColors && (
                <div className="grid grid-cols-6 gap-1.5">
                  {remainingColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleDrawingColorChange('fill', color)}
                      className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  {/* Custom color picker */}
                  <input
                    type="color"
                    value={editFillColor.match(/#[0-9A-Fa-f]{6}/) ? editFillColor : '#000000'}
                    onChange={(e) => {
                      handleDrawingColorChange('fill', e.target.value);
                      const rgb = e.target.value.match(/\d+/g);
                      if (rgb && rgb.length >= 3) {
                        const currentOpacity = selectedDrawing.opacity || 0.3;
                        setEditFillColor(`rgba(${parseInt(e.target.value.slice(1, 3), 16)}, ${parseInt(e.target.value.slice(3, 5), 16)}, ${parseInt(e.target.value.slice(5, 7), 16)}, ${currentOpacity})`);
                      }
                    }}
                    className="w-8 h-8 rounded border-2 border-dashed border-border cursor-pointer"
                    title="커스텀 색상"
                  />
                </div>
              )}
            </div>
          )}

          {/* Layer Controls for Drawing Elements */}
          <div className="border-t border-border pt-4">
            <div className="space-y-2">
              {/* Layer dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" style={{ minWidth: '60px' }}>레이어</label>
                <select
                  value={selectedDrawing.layerId}
                  onChange={(e) => {
                    const { moveElementToLayer } = useDrawingStore.getState();
                    moveElementToLayer(selectedDrawing.id, e.target.value);
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background"
                >
                  {getSortedLayers().map(layer => (
                    <option key={layer.id} value={layer.id}>
                      {layer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Element order controls */}
              <div className="text-xs text-muted-foreground mb-1">요소 순서</div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    const { moveElementUp } = useDrawingStore.getState();
                    moveElementUp(selectedDrawing.id);
                  }}
                  className="px-2 py-1 text-xs border border-border rounded hover:bg-accent"
                >
                  ↑ 한칸 위
                </button>
                <button
                  onClick={() => {
                    const { moveElementDown } = useDrawingStore.getState();
                    moveElementDown(selectedDrawing.id);
                  }}
                  className="px-2 py-1 text-xs border border-border rounded hover:bg-accent"
                >
                  ↓ 한칸 아래
                </button>
                <button
                  onClick={() => {
                    const { moveElementToTop } = useDrawingStore.getState();
                    moveElementToTop(selectedDrawing.id);
                  }}
                  className="px-2 py-1 text-xs border border-border rounded hover:bg-accent"
                >
                  ⇈ 맨 위
                </button>
                <button
                  onClick={() => {
                    const { moveElementToBottom } = useDrawingStore.getState();
                    moveElementToBottom(selectedDrawing.id);
                  }}
                  className="px-2 py-1 text-xs border border-border rounded hover:bg-accent"
                >
                  ⇊ 맨 아래
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h4 className="font-medium mb-2">표시 옵션</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDimensionLabels}
                onChange={(e) => setShowDimensionLabels(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm">치수 표시</span>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
