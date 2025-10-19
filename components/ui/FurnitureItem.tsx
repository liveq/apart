'use client';

import { useRef, useState, useEffect } from 'react';
import { useFurnitureStore, FurnitureItem as FurnitureItemType } from '@/lib/stores/furniture-store';
import { snapCoordinates } from '@/lib/utils/snap';
import { mmToPixels } from '@/lib/utils/canvas';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface FurnitureItemProps {
  item: FurnitureItemType;
  scale: number;
  canvasZoom?: number;
  canvasPanX?: number;
  canvasPanY?: number;
  eraserMode?: boolean;
}

export default function FurnitureItem({ item, scale, canvasZoom = 1, canvasPanX = 0, canvasPanY = 0, eraserMode = false }: FurnitureItemProps) {
  const { language } = useTranslation();
  const { selectedId, setSelectedId, updateFurniture, snapEnabled, snapSize, deleteFurniture } = useFurnitureStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleteButtonHovered, setIsDeleteButtonHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, depth: 0, itemX: 0, itemY: 0 });
  const itemRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedId === item.id;
  const showDeleteButton = (isSelected || isHovered || isDeleteButtonHovered) && !eraserMode;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return; // Don't drag while resizing

    e.preventDefault();
    e.stopPropagation();

    setSelectedId(item.id);
    setIsDragging(true);

    const canvas = itemRef.current?.parentElement;
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      // 현재 마우스 위치를 mm 좌표로 변환
      const mouseXmm = ((e.clientX - canvasRect.left) / canvasZoom) / scale;
      const mouseYmm = ((e.clientY - canvasRect.top) / canvasZoom) / scale;

      // dragOffset = 가구의 현재 위치 - 마우스 위치 (mm 단위)
      setDragOffset({
        x: item.x - mouseXmm,
        y: item.y - mouseYmm,
      });
    }

    document.body.classList.add('dragging');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();

    setSelectedId(item.id);
    setIsDragging(true);

    const canvas = itemRef.current?.parentElement;
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      // 현재 터치 위치를 mm 좌표로 변환
      const touchXmm = ((e.touches[0].clientX - canvasRect.left) / canvasZoom) / scale;
      const touchYmm = ((e.touches[0].clientY - canvasRect.top) / canvasZoom) / scale;

      // dragOffset = 가구의 현재 위치 - 터치 위치 (mm 단위)
      setDragOffset({
        x: item.x - touchXmm,
        y: item.y - touchYmm,
      });
    }

    document.body.classList.add('dragging');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !itemRef.current) return;

    const canvas = itemRef.current.parentElement;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();

    // 현재 마우스 위치를 mm 좌표로 변환
    const mouseXmm = ((e.clientX - canvasRect.left) / canvasZoom) / scale;
    const mouseYmm = ((e.clientY - canvasRect.top) / canvasZoom) / scale;

    // 새 위치 = 마우스 위치 + dragOffset
    const newX = mouseXmm + dragOffset.x;
    const newY = mouseYmm + dragOffset.y;

    // Snap to grid
    const { x: snappedX, y: snappedY } = snapCoordinates(
      newX,
      newY,
      snapSize,
      snapEnabled
    );

    updateFurniture(item.id, {
      x: snappedX,
      y: snappedY,
    });
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !itemRef.current) return;

    e.preventDefault();

    const canvas = itemRef.current.parentElement;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();

    // 현재 터치 위치를 mm 좌표로 변환
    const touchXmm = ((e.touches[0].clientX - canvasRect.left) / canvasZoom) / scale;
    const touchYmm = ((e.touches[0].clientY - canvasRect.top) / canvasZoom) / scale;

    // 새 위치 = 터치 위치 + dragOffset
    const newX = touchXmm + dragOffset.x;
    const newY = touchYmm + dragOffset.y;

    // Snap to grid
    const { x: snappedX, y: snappedY } = snapCoordinates(
      newX,
      newY,
      snapSize,
      snapEnabled
    );

    updateFurniture(item.id, {
      x: snappedX,
      y: snappedY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.classList.remove('dragging');
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    document.body.classList.remove('dragging');
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click event from bubbling to canvas
    e.stopPropagation();

    // If eraser mode is active, delete the furniture
    if (eraserMode) {
      deleteFurniture(item.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    deleteFurniture(item.id);
  };

  // Resize handlers
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedId(item.id);
    setIsResizing(true);
    setResizeHandle(handle);

    const canvas = itemRef.current?.parentElement;
    if (canvas) {
      const canvasRect = canvas.getBoundingClientRect();
      const mouseXmm = ((e.clientX - canvasRect.left) / canvasZoom) / scale;
      const mouseYmm = ((e.clientY - canvasRect.top) / canvasZoom) / scale;

      setResizeStart({
        x: mouseXmm,
        y: mouseYmm,
        width: item.width,
        depth: item.depth,
        itemX: item.x,
        itemY: item.y,
      });
    }

    document.body.classList.add('resizing');
  };

  // Resize effect
  useEffect(() => {
    if (!isResizing || !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = itemRef.current?.parentElement;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const mouseXmm = ((e.clientX - canvasRect.left) / canvasZoom) / scale;
      const mouseYmm = ((e.clientY - canvasRect.top) / canvasZoom) / scale;

      const deltaX = mouseXmm - resizeStart.x;
      const deltaY = mouseYmm - resizeStart.y;

      // Convert delta based on rotation
      const rad = (item.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const rotatedDeltaX = deltaX * cos + deltaY * sin;
      const rotatedDeltaY = -deltaX * sin + deltaY * cos;

      let newWidth = resizeStart.width;
      let newDepth = resizeStart.depth;
      let newX = resizeStart.itemX;
      let newY = resizeStart.itemY;

      // Apply resize based on handle
      switch (resizeHandle) {
        case 'e': // Right edge
          newWidth = Math.max(100, resizeStart.width + rotatedDeltaX);
          break;
        case 'w': // Left edge
          newWidth = Math.max(100, resizeStart.width - rotatedDeltaX);
          if (newWidth !== resizeStart.width) {
            const widthDiff = newWidth - resizeStart.width;
            newX = resizeStart.itemX - widthDiff * cos;
            newY = resizeStart.itemY - widthDiff * sin;
          }
          break;
        case 's': // Bottom edge
          newDepth = Math.max(100, resizeStart.depth + rotatedDeltaY);
          break;
        case 'n': // Top edge
          newDepth = Math.max(100, resizeStart.depth - rotatedDeltaY);
          if (newDepth !== resizeStart.depth) {
            const depthDiff = newDepth - resizeStart.depth;
            newX = resizeStart.itemX + depthDiff * sin;
            newY = resizeStart.itemY - depthDiff * cos;
          }
          break;
        case 'se': // Bottom-right corner
          newWidth = Math.max(100, resizeStart.width + rotatedDeltaX);
          newDepth = Math.max(100, resizeStart.depth + rotatedDeltaY);
          break;
        case 'sw': // Bottom-left corner
          newWidth = Math.max(100, resizeStart.width - rotatedDeltaX);
          newDepth = Math.max(100, resizeStart.depth + rotatedDeltaY);
          if (newWidth !== resizeStart.width) {
            const widthDiff = newWidth - resizeStart.width;
            newX = resizeStart.itemX - widthDiff * cos;
            newY = resizeStart.itemY - widthDiff * sin;
          }
          break;
        case 'ne': // Top-right corner
          newWidth = Math.max(100, resizeStart.width + rotatedDeltaX);
          newDepth = Math.max(100, resizeStart.depth - rotatedDeltaY);
          if (newDepth !== resizeStart.depth) {
            const depthDiff = newDepth - resizeStart.depth;
            newX = resizeStart.itemX + depthDiff * sin;
            newY = resizeStart.itemY - depthDiff * cos;
          }
          break;
        case 'nw': // Top-left corner
          newWidth = Math.max(100, resizeStart.width - rotatedDeltaX);
          newDepth = Math.max(100, resizeStart.depth - rotatedDeltaY);
          if (newWidth !== resizeStart.width || newDepth !== resizeStart.depth) {
            const widthDiff = newWidth - resizeStart.width;
            const depthDiff = newDepth - resizeStart.depth;
            newX = resizeStart.itemX - widthDiff * cos + depthDiff * sin;
            newY = resizeStart.itemY - widthDiff * sin - depthDiff * cos;
          }
          break;
      }

      updateFurniture(item.id, {
        width: newWidth,
        depth: newDepth,
        x: newX,
        y: newY,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      document.body.classList.remove('resizing');
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStart, item.id, item.rotation, canvasZoom, scale, updateFurniture]);

  // Add event listeners with useEffect
  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset, snapEnabled, snapSize, scale]);

  const width = mmToPixels(item.width, scale);
  const depth = mmToPixels(item.depth, scale);
  const x = mmToPixels(item.x, scale);
  const y = mmToPixels(item.y, scale);

  return (
    <div
      ref={itemRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${depth}px`,
        backgroundColor: item.color,
        border: isSelected ? '3px solid #3b82f6' : '2px solid rgba(0,0,0,0.5)',
        borderRadius: '4px',
        cursor: isResizing ? 'default' : (isDragging ? 'grabbing' : 'grab'),
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center',
        opacity: 0.8,
        transition: (isDragging || isResizing) ? 'none' : 'all 0.1s ease',
        boxShadow: isSelected
          ? '0 4px 12px rgba(59, 130, 246, 0.3)'
          : '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: isSelected ? 10 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        touchAction: 'none',
        pointerEvents: 'auto',
      }}
    >
      {/* Delete button - show when selected, hovered, or button itself is hovered */}
      {showDeleteButton && (
        <button
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseEnter={(e) => {
            setIsDeleteButtonHovered(true);
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            setIsDeleteButtonHovered(false);
            e.currentTarget.style.transform = 'scale(1)';
          }}
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            color: 'white',
            border: '2px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 3,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transition: 'transform 0.1s ease',
          }}
        >
          ×
        </button>
      )}

      {/* Resize handles - only show when selected */}
      {isSelected && !eraserMode && (
        <>
          {/* Top edge - full width */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            style={{
              position: 'absolute',
              top: '-4px',
              left: '8px',
              right: '8px',
              height: '8px',
              cursor: 'n-resize',
              zIndex: 2,
            }}
          />
          {/* Right edge - full height */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            style={{
              position: 'absolute',
              top: '8px',
              right: '-4px',
              bottom: '8px',
              width: '8px',
              cursor: 'e-resize',
              zIndex: 2,
            }}
          />
          {/* Bottom edge - full width */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '8px',
              right: '8px',
              height: '8px',
              cursor: 's-resize',
              zIndex: 2,
            }}
          />
          {/* Left edge - full height */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            style={{
              position: 'absolute',
              top: '8px',
              left: '-4px',
              bottom: '8px',
              width: '8px',
              cursor: 'w-resize',
              zIndex: 2,
            }}
          />

          {/* Corner handles - higher z-index */}
          {/* Top-left */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              width: '8px',
              height: '8px',
              backgroundColor: 'white',
              border: '1px solid #3b82f6',
              cursor: 'nw-resize',
              zIndex: 3,
            }}
          />
          {/* Top-right */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '8px',
              height: '8px',
              backgroundColor: 'white',
              border: '1px solid #3b82f6',
              cursor: 'ne-resize',
              zIndex: 3,
            }}
          />
          {/* Bottom-right */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '8px',
              height: '8px',
              backgroundColor: 'white',
              border: '1px solid #3b82f6',
              cursor: 'se-resize',
              zIndex: 3,
            }}
          />
          {/* Bottom-left */}
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '-4px',
              width: '8px',
              height: '8px',
              backgroundColor: 'white',
              border: '1px solid #3b82f6',
              cursor: 'sw-resize',
              zIndex: 3,
            }}
          />
        </>
      )}

      <div
        style={{
          color: 'white',
          fontSize: `${Math.max(10, Math.min(width, depth) / 8)}px`,
          fontWeight: 'bold',
          textShadow: '0 0 4px rgba(0,0,0,0.9), 1px 1px 3px rgba(0,0,0,0.8), -1px -1px 3px rgba(0,0,0,0.8)',
          textAlign: 'center',
          padding: '4px',
          transform: `rotate(-${item.rotation}deg)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <div style={{
          overflow: 'visible',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
          lineHeight: '1.4',
          paddingBottom: '2px',
        }}>
          {item.name[language]}
        </div>
        <div style={{
          fontSize: `${Math.max(8, Math.min(width, depth) / 12)}px`,
          opacity: 1,
          fontWeight: 'bold',
          textShadow: '0 0 4px rgba(0,0,0,0.9), 1px 1px 3px rgba(0,0,0,0.8), -1px -1px 3px rgba(0,0,0,0.8)',
          lineHeight: '1.4',
          paddingBottom: '2px',
        }}>
          {Math.round(item.width / 10)}×{Math.round(item.depth / 10)}cm
        </div>
      </div>
    </div>
  );
}
