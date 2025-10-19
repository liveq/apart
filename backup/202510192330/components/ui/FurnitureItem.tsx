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
  const itemRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedId === item.id;

  const handleMouseDown = (e: React.MouseEvent) => {
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

  // Debug log for bed items
  useEffect(() => {
    if (item.name.ko?.includes('침대')) {
      console.log('🪑 Furniture rendering:', {
        itemName: item.name.ko,
        itemWidthMm: item.width,
        itemDepthMm: item.depth,
        itemHeightMm: item.height,
        scale,
        widthPx: width,
        depthPx: depth
      });
    }
  }, [scale, item, width, depth]);

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
        border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.2)',
        borderRadius: '4px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: `rotate(${item.rotation}deg)`,
        transformOrigin: 'center',
        opacity: 0.8,
        transition: isDragging ? 'none' : 'all 0.1s ease',
        boxShadow: isSelected
          ? '0 4px 12px rgba(59, 130, 246, 0.3)'
          : '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: isSelected ? 100 : 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Delete button - only show when hovered */}
      {isHovered && (
        <button
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '-16px',
            right: '-16px',
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
            zIndex: 101,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          ×
        </button>
      )}

      <div
        style={{
          color: 'white',
          fontSize: `${Math.max(10, Math.min(width, depth) / 8)}px`,
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          textAlign: 'center',
          padding: '4px',
          transform: `rotate(-${item.rotation}deg)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
        }}
      >
        <div style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        }}>
          {item.name[language]}
        </div>
        <div style={{
          fontSize: `${Math.max(8, Math.min(width, depth) / 12)}px`,
          opacity: 0.9,
          fontWeight: 'normal',
        }}>
          {Math.round(item.width / 10)}×{Math.round(item.depth / 10)}cm
        </div>
      </div>
    </div>
  );
}
