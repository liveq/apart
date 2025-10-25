'use client';

import { useState, useRef, useEffect } from 'react';
import { useLayerStore } from '@/lib/stores/layer-store';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useDrawingStore } from '@/lib/stores/drawing-store';
import toast from 'react-hot-toast';
import ConfirmDialog from './ConfirmDialog';

interface LayerPanelProps {
  isMobile?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

const COLOR_OPTIONS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#64748b', // gray
];

export default function LayerPanel({ isMobile = false, onCollapseChange }: LayerPanelProps) {
  const {
    layers,
    activeLayerId,
    addLayer,
    removeLayer,
    updateLayer,
    renameLayer,
    setActiveLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    moveLayerUp,
    moveLayerDown,
    setLayerColor,
    setLayerOpacity,
    mergeLayerDown,
    duplicateLayer,
    getSortedLayers,
  } = useLayerStore();

  const { furniture, selectedId: furnitureSelectedId } = useFurnitureStore();
  const { elements, selectedElementId } = useDrawingStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Notify parent when collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    layerId: string;
    x: number;
    y: number;
  } | null>(null);
  const [colorPickerLayerId, setColorPickerLayerId] = useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingLayerId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingLayerId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Get sorted layers (highest order first = top layer first)
  const sortedLayers = [...getSortedLayers()].reverse();

  // Get furniture and elements for a specific layer
  const getLayerElements = (layerId: string) => {
    const layerFurniture = furniture.filter((f) => f.layerId === layerId);
    const layerElements = elements.filter((e) => e.layerId === layerId);
    return { furniture: layerFurniture, elements: layerElements };
  };

  // Toggle layer expansion
  const toggleLayerExpanded = (layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  // Start editing layer name
  const startEditingName = (layerId: string, currentName: string) => {
    setEditingLayerId(layerId);
    setEditingName(currentName);
  };

  // Finish editing layer name
  const finishEditingName = () => {
    if (editingLayerId && editingName.trim()) {
      renameLayer(editingLayerId, editingName.trim());
    }
    setEditingLayerId(null);
    setEditingName('');
  };

  // Handle context menu with boundary checking
  const handleContextMenu = (e: React.MouseEvent, layerId: string) => {
    e.preventDefault();

    // Menu dimensions (approximate)
    const menuWidth = 200;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;

    // Calculate initial position
    let x = e.clientX;
    const y = e.clientY; // Keep vertical position as-is (below button)

    // Only adjust horizontal position if menu would overflow right edge
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10; // 10px margin
    }

    // Ensure menu doesn't go off left edge
    x = Math.max(10, x);

    setContextMenu({ layerId, x, y });
  };

  // Handle context menu actions
  const handleContextAction = (action: string, layerId: string) => {
    setContextMenu(null);
    const layer = layers.find((l) => l.id === layerId);

    switch (action) {
      case 'duplicate':
        duplicateLayer(layerId);
        break;
      case 'merge':
        // Check if it's the bottom layer
        const sortedIndex = sortedLayers.findIndex((l) => l.id === layerId);
        if (sortedIndex === sortedLayers.length - 1) {
          toast.error('가장 아래 레이어는 병합할 수 없습니다.');
          return;
        }

        if (layer) {
          const targetLayer = sortedLayers[sortedIndex + 1];
          setConfirmDialog({
            open: true,
            title: '레이어 병합',
            message: `"${layer.name}"을(를) "${targetLayer.name}"과(와) 병합하시겠습니까?`,
            onConfirm: () => {
              mergeLayerDown(layerId, true);
            },
          });
        }
        break;
      case 'delete':
        // Check if it's the last layer
        if (layers.length <= 1) {
          toast.error('최소 1개의 레이어가 필요합니다.');
          return;
        }

        if (layer) {
          setConfirmDialog({
            open: true,
            title: '레이어 삭제',
            message: `"${layer.name}" 레이어를 삭제하시겠습니까?\n레이어 내의 모든 요소가 함께 삭제됩니다.`,
            onConfirm: () => {
              removeLayer(layerId, true);
            },
          });
        }
        break;
      case 'color':
        setColorPickerLayerId(layerId);
        break;
      case 'rename':
        if (layer) {
          startEditingName(layerId, layer.name);
        }
        break;
    }
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    if (draggedLayerId && draggedLayerId !== layerId) {
      setDragOverLayerId(layerId);
    }
  };

  const handleDragLeave = () => {
    setDragOverLayerId(null);
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (draggedLayerId && draggedLayerId !== targetLayerId) {
      // Get both layers
      const draggedLayer = layers.find((l) => l.id === draggedLayerId);
      const targetLayer = layers.find((l) => l.id === targetLayerId);

      if (draggedLayer && targetLayer) {
        // Swap their orders
        const tempOrder = draggedLayer.order;
        updateLayer(draggedLayerId, { order: targetLayer.order });
        updateLayer(targetLayerId, { order: tempOrder });
      }
    }
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  // Get active layer
  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const canMoveUp = activeLayer && activeLayer.order < Math.max(...layers.map((l) => l.order));
  const canMoveDown = activeLayer && activeLayer.order > Math.min(...layers.map((l) => l.order));

  // Check if any element is selected
  const hasElementSelected = furnitureSelectedId !== null || selectedElementId !== null;

  // Desktop layout - Collapsed (header only)
  if (isCollapsed && !isMobile) {
    return (
      <div className="w-full bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">Layers</h2>
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 hover:bg-accent rounded"
            title="펼치기"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 7l5 5 5-5H5z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Mobile or Desktop expanded layout
  return (
    <div className={`${isMobile ? 'w-full' : 'w-64 md:w-72 border-r'} bg-card border-border flex flex-col overflow-hidden`}>
      {/* Header - only show on desktop */}
      {!isMobile && (
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">Layers</h2>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-accent rounded"
            title="접기"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 13l-5-5-5 5h10z" />
            </svg>
          </button>
        </div>
      )}

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sortedLayers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          const isExpanded = expandedLayers.has(layer.id);
          const { furniture: layerFurniture, elements: layerElements } = getLayerElements(layer.id);
          const hasContent = layerFurniture.length > 0 || layerElements.length > 0;
          const isEditing = editingLayerId === layer.id;
          const isDragging = draggedLayerId === layer.id;
          const isDragOver = dragOverLayerId === layer.id;
          const sortedIndex = sortedLayers.findIndex((l) => l.id === layer.id);
          const isBottomLayer = sortedIndex === sortedLayers.length - 1;

          return (
            <div
              key={layer.id}
              className={`mb-1 rounded transition-colors ${
                isDragging ? 'opacity-50' : ''
              } ${isDragOver ? 'border-t-2 border-primary' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={(e) => handleDragOver(e, layer.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, layer.id)}
              onDragEnd={handleDragEnd}
            >
              {/* Layer Item */}
              <div
                className={`flex items-center gap-1 p-2 rounded cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 border border-primary'
                    : 'bg-secondary hover:bg-accent border border-transparent'
                }`}
                onClick={() => setActiveLayer(layer.id)}
                onContextMenu={(e) => handleContextMenu(e, layer.id)}
              >
                {/* Expand/Collapse Button */}
                <button
                  className={`p-1 hover:bg-accent rounded transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  } ${!hasContent ? 'invisible' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerExpanded(layer.id);
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M3 2l6 4-6 4V2z" />
                  </svg>
                </button>

                {/* Visibility Toggle */}
                <button
                  className="p-1 hover:bg-accent rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>

                {/* Lock Toggle */}
                <button
                  className="p-1 hover:bg-accent rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerLock(layer.id);
                  }}
                  title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                >
                  {layer.locked ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                  )}
                </button>

                {/* Color Tag */}
                <button
                  className="w-4 h-4 rounded-full border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: layer.color || '#64748b' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setColorPickerLayerId(colorPickerLayerId === layer.id ? null : layer.id);
                  }}
                  title="Change color"
                />

                {/* Layer Name */}
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={finishEditingName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEditingName();
                      if (e.key === 'Escape') {
                        setEditingLayerId(null);
                        setEditingName('');
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                ) : (
                  <span
                    className="flex-1 text-sm truncate"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEditingName(layer.id, layer.name);
                    }}
                  >
                    {layer.name}
                  </span>
                )}

                {/* Element Count */}
                {hasContent && (
                  <span className="text-xs text-muted-foreground px-1">
                    {layerFurniture.length + layerElements.length}
                  </span>
                )}

                {/* More Options Button */}
                <button
                  className="p-1 hover:bg-accent rounded ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();

                    // If menu is already open for this layer, close it
                    if (contextMenu && contextMenu.layerId === layer.id) {
                      setContextMenu(null);
                      return;
                    }

                    // Otherwise, open menu at button position
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleContextMenu(
                      {
                        preventDefault: () => {},
                        clientX: rect.left,
                        clientY: rect.bottom + 4
                      } as React.MouseEvent,
                      layer.id
                    );
                  }}
                  title="More options"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="3" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="13" r="1.5" />
                  </svg>
                </button>
              </div>

              {/* Color Picker Dropdown */}
              {colorPickerLayerId === layer.id && (
                <div className="mt-1 p-2 bg-background border border-border rounded shadow-lg">
                  <div className="grid grid-cols-5 gap-1">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded hover:scale-110 transition-transform border border-border"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setLayerColor(layer.id, color);
                          setColorPickerLayerId(null);
                        }}
                      />
                    ))}
                    <button
                      className="w-6 h-6 rounded hover:scale-110 transition-transform border border-dashed border-border flex items-center justify-center text-xs"
                      onClick={() => {
                        setLayerColor(layer.id, undefined);
                        setColorPickerLayerId(null);
                      }}
                      title="No color"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded Layer Content */}
              {isExpanded && hasContent && (
                <div className="ml-6 mt-1 space-y-1">
                  {layerFurniture.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 p-1.5 text-xs rounded ${
                        item.id === furnitureSelectedId
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary/50 hover:bg-accent'
                      }`}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <rect x="2" y="2" width="8" height="8" rx="1" />
                      </svg>
                      <span className="truncate flex-1">
                        {item.customName || item.name.ko}
                      </span>
                    </div>
                  ))}
                  {layerElements.map((element) => (
                    <div
                      key={element.id}
                      className={`flex items-center gap-2 p-1.5 text-xs rounded ${
                        element.id === selectedElementId
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary/50 hover:bg-accent'
                      }`}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                        {element.type === 'line' && <line x1="2" y1="10" x2="10" y2="2" />}
                        {element.type === 'rectangle' && <rect x="2" y="2" width="8" height="8" />}
                        {element.type === 'circle' && <circle cx="6" cy="6" r="4" />}
                        {element.type === 'text' && <text x="2" y="8" fontSize="8">T</text>}
                        {element.type === 'path' && <path d="M2 8 Q6 2 10 8" />}
                      </svg>
                      <span className="truncate flex-1 capitalize">
                        {element.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Opacity Slider (when layer is selected and no element is selected) */}
      {activeLayer && !hasElementSelected && (
        <div className="p-4 border-t border-border">
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            Layer Opacity: {activeLayer.opacity}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={activeLayer.opacity}
            onChange={(e) => setLayerOpacity(activeLayerId, parseInt(e.target.value))}
            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${activeLayer.opacity}%, #e5e7eb ${activeLayer.opacity}%, #e5e7eb 100%)`,
            }}
          />
        </div>
      )}

      {/* Bottom Toolbar */}
      <div className="p-2 border-t border-border flex items-center justify-between gap-1">
        <button
          onClick={() => addLayer()}
          className="flex-1 px-3 py-2 bg-secondary hover:bg-accent rounded text-sm font-medium transition-colors"
          title="Add layer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="inline">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button
          onClick={() => activeLayerId && handleContextAction('delete', activeLayerId)}
          disabled={layers.length <= 1}
          className="flex-1 px-3 py-2 bg-secondary hover:bg-accent rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete layer"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="inline">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
          </svg>
        </button>

        <button
          onClick={() => activeLayerId && moveLayerUp(activeLayerId)}
          disabled={!canMoveUp}
          className="flex-1 px-3 py-2 bg-secondary hover:bg-accent rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Move layer up"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="inline">
            <path d="M8 4l4 4H4l4-4z" />
          </svg>
        </button>

        <button
          onClick={() => activeLayerId && moveLayerDown(activeLayerId)}
          disabled={!canMoveDown}
          className="flex-1 px-3 py-2 bg-secondary hover:bg-accent rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Move layer down"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="inline">
            <path d="M8 12l-4-4h8l-4 4z" />
          </svg>
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-background border border-border rounded shadow-lg py-1 z-50 overflow-y-auto"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            maxHeight: 'calc(100vh - ' + contextMenu.y + 'px - 10px)' // 10px bottom margin
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent"
            onClick={() => handleContextAction('duplicate', contextMenu.layerId)}
          >
            Duplicate Layer
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleContextAction('merge', contextMenu.layerId)}
            disabled={sortedLayers.findIndex((l) => l.id === contextMenu.layerId) === sortedLayers.length - 1}
          >
            Merge Down
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent"
            onClick={() => handleContextAction('color', contextMenu.layerId)}
          >
            Change Color
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent"
            onClick={() => handleContextAction('rename', contextMenu.layerId)}
          >
            Rename
          </button>
          <div className="border-t border-border my-1" />
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleContextAction('delete', contextMenu.layerId)}
            disabled={layers.length <= 1}
          >
            Delete Layer
          </button>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onClose={() => setConfirmDialog(null)}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog(null);
          }}
        />
      )}
    </div>
  );
}
