'use client';

import { forwardRef, useEffect, useState, useRef } from 'react';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useAppStore } from '@/lib/stores/app-store';
import { floorPlan112 } from '@/data/floor-plan-112';
import FurnitureItem from '@/components/ui/FurnitureItem';
import MeasurementTool from '@/components/ui/MeasurementTool';
import ScaleCalibrationDialog from '@/components/ui/ScaleCalibrationDialog';
import Image from 'next/image';

interface FloorPlanCanvasProps {
  measurementMode: boolean;
  calibrationMode: boolean;
  eraserMode: boolean;
  onCalibrationComplete: () => void;
}

const FloorPlanCanvas = forwardRef<HTMLDivElement, FloorPlanCanvasProps>(({ measurementMode, calibrationMode, eraserMode, onCalibrationComplete }, ref) => {
  const { furniture, setSelectedId, addMeasurement } = useFurnitureStore();
  const { setViewport, calibratedScale, setCalibratedScale, uploadedImageUrl } = useAppStore();
  const [displayScale, setDisplayScale] = useState(0.05); // 캔버스 표시용 scale (항상 자동 계산)
  const [measurementStart, setMeasurementStart] = useState<{ x: number; y: number } | null>(null);
  const [measurementMousePos, setMeasurementMousePos] = useState<{ x: number; y: number } | null>(null);
  const [uploadedImageDimensions, setUploadedImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // 가구 크기 계산용 scale: calibratedScale이 있으면 사용, 없으면 displayScale 사용
  const furnitureScale = calibratedScale || displayScale;

  // Calibration state
  const [calibrationStart, setCalibrationStart] = useState<{ x: number; y: number } | null>(null);
  const [calibrationEnd, setCalibrationEnd] = useState<{ x: number; y: number } | null>(null);
  const [calibrationMousePos, setCalibrationMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);

  // Touch zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);

  // Mouse pan state
  const [isMousePanning, setIsMousePanning] = useState(false);
  const [mouseStartPoint, setMouseStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Load uploaded image dimensions when uploadedImageUrl changes
  useEffect(() => {
    if (uploadedImageUrl) {
      const img = new window.Image();
      img.onload = () => {
        setUploadedImageDimensions({ width: img.width, height: img.height });
      };
      img.src = uploadedImageUrl;
    } else {
      setUploadedImageDimensions(null);
    }
  }, [uploadedImageUrl]);

  useEffect(() => {
    const updateSize = () => {
      const container = (ref as React.RefObject<HTMLDivElement>)?.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      let imageWidth, imageHeight;

      if (uploadedImageDimensions) {
        // For uploaded images: assume they represent the same physical space as default floor plan
        // Map pixel dimensions to mm space
        imageWidth = floorPlan112.width;  // Assume same physical width in mm
        imageHeight = floorPlan112.height; // Assume same physical height in mm
      } else {
        // Use default floor plan dimensions (in mm)
        imageWidth = floorPlan112.width;
        imageHeight = floorPlan112.height;
      }

      const scaleX = (containerWidth - 40) / imageWidth;
      const scaleY = (containerHeight - 40) / imageHeight;
      const newScale = Math.min(scaleX, scaleY);
      setDisplayScale(newScale);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [ref, uploadedImageDimensions]);

  // Sync viewport state to app store
  useEffect(() => {
    const container = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!container) return;

    setViewport({
      zoom,
      panX,
      panY,
      scale: furnitureScale,
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight,
    });
  }, [zoom, panX, panY, furnitureScale, setViewport, ref]);

  // Always use floor plan dimensions in mm for canvas size calculation
  // Uploaded images are mapped to the same physical space
  const imageWidth = floorPlan112.width;
  const imageHeight = floorPlan112.height;
  const canvasWidth = imageWidth * displayScale;
  const canvasHeight = imageHeight * displayScale;

  useEffect(() => {
    if (!measurementMode) {
      setMeasurementStart(null);
      setMeasurementMousePos(null);
    }
  }, [measurementMode]);

  // Calculate touch distance for pinch zoom
  const getTouchDistance = (touches: TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Limit pan to prevent canvas from going too far off screen
  const limitPan = (panValue: number, canvasSize: number, containerSize: number, currentZoom: number): number => {
    // Calculate how much the canvas extends beyond container when zoomed
    const scaledCanvasSize = canvasSize * currentZoom;
    const maxPan = (scaledCanvasSize - containerSize) / 2 + containerSize * 0.3; // Allow 30% overflow
    return Math.max(-maxPan, Math.min(maxPan, panValue));
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartTimeRef.current = Date.now();

    if (e.touches.length === 2) {
      // Two finger touch - start pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      // Single finger - could be tap or pan
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance !== null) {
      // Pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const delta = distance / lastTouchDistance;
      setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)));
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && lastPanPoint && zoom > 1) {
      // Pan when zoomed in
      const touchDuration = Date.now() - touchStartTimeRef.current;
      if (touchDuration > 100) {
        // Only pan if touch held for 100ms (not a quick tap)
        e.preventDefault();
        setIsPanning(true);
        const dx = e.touches[0].clientX - lastPanPoint.x;
        const dy = e.touches[0].clientY - lastPanPoint.y;

        const container = (ref as React.RefObject<HTMLDivElement>)?.current;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          setPanX((prev) => limitPan(prev + dx, canvasWidth, containerWidth, zoom));
          setPanY((prev) => limitPan(prev + dy, canvasHeight, containerHeight, zoom));
        }
        setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTimeRef.current;
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    // Double tap to toggle zoom
    if (e.touches.length === 0 && touchDuration < 200 && timeSinceLastTap < 300 && !isPanning) {
      if (zoom > 1) {
        setZoom(1);
        setPanX(0);
        setPanY(0);
      } else {
        setZoom(2);
      }
      lastTapTimeRef.current = now;
    } else if (touchDuration < 200 && !isPanning) {
      lastTapTimeRef.current = now;
    }

    setLastTouchDistance(null);
    setLastPanPoint(null);
    setIsPanning(false);
  };

  // Mouse wheel zoom and pan (will be added via useEffect)
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    // 가로 휠 (Shift + 휠 또는 가로 휠) → 좌우 팬
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      setPanX((prev) => prev - e.deltaX);
      return;
    }

    // 세로 휠 → 줌
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)));
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1 && e.button === 0 && !measurementMode) {
      setIsMousePanning(true);
      setMouseStartPoint({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isMousePanning && mouseStartPoint) {
      const dx = e.clientX - mouseStartPoint.x;
      const dy = e.clientY - mouseStartPoint.y;

      const container = (ref as React.RefObject<HTMLDivElement>)?.current;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        setPanX((prev) => limitPan(prev + dx, canvasWidth, containerWidth, zoom));
        setPanY((prev) => limitPan(prev + dy, canvasHeight, containerHeight, zoom));
      }
      setMouseStartPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsMousePanning(false);
    setMouseStartPoint(null);
  };

  // Add mouse event listeners
  useEffect(() => {
    if (isMousePanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isMousePanning, mouseStartPoint]);

  // Add wheel event listener with passive: false
  useEffect(() => {
    const container = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [ref]);

  // Add touch event listeners with passive: false
  useEffect(() => {
    const container = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!container) return;

    const handleTouchMovePassive = (e: TouchEvent) => handleTouchMove(e);

    container.addEventListener('touchmove', handleTouchMovePassive, { passive: false });
    return () => {
      container.removeEventListener('touchmove', handleTouchMovePassive);
    };
  }, [lastTouchDistance, lastPanPoint, zoom, isPanning]);

  // Reset calibration state when mode is turned off
  useEffect(() => {
    if (!calibrationMode) {
      setCalibrationStart(null);
      setCalibrationEnd(null);
      setCalibrationMousePos(null);
    }
  }, [calibrationMode]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Don't handle click if we were panning
    if (isMousePanning) return;

    if (calibrationMode) {
      // 컨테이너의 중심점 기준으로 계산
      const container = (ref as React.RefObject<HTMLDivElement>)?.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      // 컨테이너 중심으로부터의 상대 좌표
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const containerCenterY = containerRect.top + containerRect.height / 2;

      const clickX = e.clientX - containerCenterX;
      const clickY = e.clientY - containerCenterY;

      // zoom과 pan을 역으로 적용하여 실제 캔버스 픽셀 좌표 계산
      const canvasCenterX = canvasWidth / 2;
      const canvasCenterY = canvasHeight / 2;

      const x = canvasCenterX + (clickX / zoom - panX / zoom);
      const y = canvasCenterY + (clickY / zoom - panY / zoom);

      console.log('📍 Click:', { clickX, clickY, zoom, panX, panY, x, y });

      if (!calibrationStart) {
        setCalibrationStart({ x, y });
      } else {
        // Use the snapped position from calibrationMousePos if available
        const endPoint = calibrationMousePos || { x, y };
        setCalibrationEnd(endPoint);
        setShowCalibrationDialog(true);
      }
      return;
    }

    if (measurementMode) {
      // 컨테이너의 중심점 기준으로 계산 (calibrationMode와 동일)
      const container = (ref as React.RefObject<HTMLDivElement>)?.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();

      // 컨테이너 중심으로부터의 상대 좌표
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const containerCenterY = containerRect.top + containerRect.height / 2;

      const clickX = e.clientX - containerCenterX;
      const clickY = e.clientY - containerCenterY;

      // zoom과 pan을 역으로 적용하여 실제 캔버스 픽셀 좌표 계산
      const canvasCenterX = canvasWidth / 2;
      const canvasCenterY = canvasHeight / 2;

      const canvasX = canvasCenterX + (clickX / zoom - panX / zoom);
      const canvasY = canvasCenterY + (clickY / zoom - panY / zoom);

      // 캔버스 픽셀 좌표를 mm 좌표로 변환
      const x = canvasX / displayScale;
      const y = canvasY / displayScale;

      if (!measurementStart) {
        setMeasurementStart({ x, y });
      } else {
        addMeasurement({
          startX: measurementStart.x,
          startY: measurementStart.y,
          endX: x,
          endY: y,
        });
        setMeasurementStart(null);
      }
      return;
    }

    // Deselect furniture when clicking on empty area
    // FurnitureItem calls e.stopPropagation(), so if we reach here, it's not a furniture click
    setSelectedId(null);
  };

  const handleCalibrationConfirm = (calculatedScale: number) => {
    console.log('🔍 Calibration:', {
      calculatedScale,
      displayScale,
      furnitureScale,
      calibrationStart,
      calibrationEnd,
      pixelDistance: calibrationStart && calibrationEnd ? Math.sqrt(
        Math.pow(calibrationEnd.x - calibrationStart.x, 2) +
        Math.pow(calibrationEnd.y - calibrationStart.y, 2)
      ) : 0
    });
    setCalibratedScale(calculatedScale);
    setCalibrationStart(null);
    setCalibrationEnd(null);
    setCalibrationMousePos(null);
    setShowCalibrationDialog(false);
    onCalibrationComplete();
  };

  const handleCalibrationCancel = () => {
    setCalibrationStart(null);
    setCalibrationEnd(null);
    setCalibrationMousePos(null);
    setShowCalibrationDialog(false);
  };

  // Zoom control functions
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(5, prev * 1.2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, prev / 1.2));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const container = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    // 컨테이너 중심으로부터의 상대 좌표
    const containerCenterX = containerRect.left + containerRect.width / 2;
    const containerCenterY = containerRect.top + containerRect.height / 2;

    const clickX = e.clientX - containerCenterX;
    const clickY = e.clientY - containerCenterY;

    // zoom과 pan을 역으로 적용하여 실제 캔버스 픽셀 좌표 계산
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;

    const x = canvasCenterX + (clickX / zoom - panX / zoom);
    const y = canvasCenterY + (clickY / zoom - panY / zoom);

    // Track mouse position in calibration mode when first point is set
    if (calibrationMode && calibrationStart) {
      // Snap to orthogonal lines (horizontal or vertical from start point)
      let snappedX = x;
      let snappedY = y;

      const dx = Math.abs(x - calibrationStart.x);
      const dy = Math.abs(y - calibrationStart.y);

      if (dx > dy) {
        // Snap to horizontal
        snappedY = calibrationStart.y;
      } else {
        // Snap to vertical
        snappedX = calibrationStart.x;
      }

      setCalibrationMousePos({ x: snappedX, y: snappedY });
    }

    // Track mouse position in measurement mode
    if (measurementMode) {
      setMeasurementMousePos({ x, y });
    }
  };

  return (
    <div
      ref={ref}
      className="relative w-full h-full overflow-hidden bg-muted flex items-center justify-center p-4"
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: 'none',
        cursor: eraserMode
          ? 'not-allowed'
          : calibrationMode
          ? 'crosshair'
          : isMousePanning
          ? 'grabbing'
          : (zoom > 1 && !measurementMode ? 'grab' : 'default')
      }}
    >
      {/* Mode indicators */}
      {calibrationMode && (
        <div
          className="mode-indicator"
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            backgroundColor: '#FF6600',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(255, 102, 0, 0.3)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        >
          {calibrationStart
            ? '📏 두 번째 점을 클릭하세요'
            : '📏 첫 번째 점을 클릭하세요'}
        </div>
      )}

      {eraserMode && (
        <div
          className="mode-indicator"
          style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            backgroundColor: '#ef4444',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          }}
        >
          🗑️ 삭제할 가구 또는 측정선을 클릭하세요
        </div>
      )}

      {/* Zoom controls */}
      <div
        className="zoom-controls"
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-xl font-bold transition-colors border border-border"
          title="확대 (Zoom In)"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-xl font-bold transition-colors border border-border"
          title="축소 (Zoom Out)"
        >
          −
        </button>
        <button
          onClick={handleZoomReset}
          className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-xs font-medium transition-colors border border-border"
          title="초기화 (Reset)"
        >
          1:1
        </button>
        <div className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-xs font-bold border border-border">
          {Math.round(zoom * 100)}%
        </div>
      </div>
      <div
        id="floor-plan-canvas-inner"
        data-zoom={zoom}
        data-pan-x={panX}
        data-pan-y={panY}
        style={{
          position: 'relative',
          width: canvasWidth + 'px',
          height: canvasHeight + 'px',
          backgroundColor: '#fff',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {/* Background image layer */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        >
          {uploadedImageUrl ? (
            <img
              src={uploadedImageUrl}
              alt="Uploaded Floor Plan"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          ) : (
            <Image
              src={floorPlan112.imagePath}
              alt="Floor Plan"
              fill
              style={{
                objectFit: 'contain',
                objectPosition: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
              priority
            />
          )}
        </div>

        {/* Furniture layer - higher z-index */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {furniture.map((item) => (
            <FurnitureItem
              key={item.id}
              item={item}
              scale={furnitureScale}
              canvasZoom={zoom}
              canvasPanX={panX}
              canvasPanY={panY}
              eraserMode={eraserMode}
            />
          ))}
        </div>

        {/* SVG overlay for measurements and calibration */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 200,
            pointerEvents: measurementMode || calibrationMode ? 'auto' : 'none',
          }}
        >
          <MeasurementTool
            isActive={measurementMode}
            scale={displayScale}
            calibratedScale={calibratedScale}
            displayScale={displayScale}
            eraserMode={eraserMode}
          />

          {/* Show temporary measurement line while clicking */}
          {measurementMode && measurementStart && (
            <circle
              cx={measurementStart.x * displayScale}
              cy={measurementStart.y * displayScale}
              r="6"
              fill="#FF0000"
              stroke="white"
              strokeWidth="2"
            />
          )}

          {/* Show measurement step indicator near cursor */}
          {measurementMode && measurementMousePos && (
            <g>
              <rect
                x={measurementMousePos.x + 15}
                y={measurementMousePos.y - 25}
                width="45"
                height="30"
                fill="rgba(255, 0, 0, 0.9)"
                stroke="white"
                strokeWidth="2"
                rx="4"
              />
              <text
                x={measurementMousePos.x + 37.5}
                y={measurementMousePos.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="16"
                fontWeight="bold"
              >
                {measurementStart ? '2/2' : '1/2'}
              </text>
            </g>
          )}

          {/* Show calibration line */}
          {calibrationMode && calibrationStart && (
            <>
              <circle
                cx={calibrationStart.x}
                cy={calibrationStart.y}
                r="8"
                fill="#FF6600"
                stroke="white"
                strokeWidth="3"
              />

              {/* Orthogonal guide lines */}
              {calibrationMousePos && (
                <>
                  {/* Horizontal guide line */}
                  <line
                    x1="0"
                    y1={calibrationStart.y}
                    x2={canvasWidth}
                    y2={calibrationStart.y}
                    stroke="#FF6600"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                    opacity="0.5"
                  />
                  {/* Vertical guide line */}
                  <line
                    x1={calibrationStart.x}
                    y1="0"
                    x2={calibrationStart.x}
                    y2={canvasHeight}
                    stroke="#FF6600"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                    opacity="0.5"
                  />
                  {/* Guide line from start to current position */}
                  <line
                    x1={calibrationStart.x}
                    y1={calibrationStart.y}
                    x2={calibrationMousePos.x}
                    y2={calibrationMousePos.y}
                    stroke="#FF6600"
                    strokeWidth="3"
                  />
                  {/* Current mouse position circle */}
                  <circle
                    cx={calibrationMousePos.x}
                    cy={calibrationMousePos.y}
                    r="8"
                    fill="#FF6600"
                    stroke="white"
                    strokeWidth="3"
                    opacity="0.7"
                  />
                </>
              )}
            </>
          )}
          {calibrationMode && calibrationStart && calibrationEnd && (
            <>
              <line
                x1={calibrationStart.x}
                y1={calibrationStart.y}
                x2={calibrationEnd.x}
                y2={calibrationEnd.y}
                stroke="#FF6600"
                strokeWidth="4"
                strokeDasharray="8,4"
              />
              <circle
                cx={calibrationEnd.x}
                cy={calibrationEnd.y}
                r="8"
                fill="#FF6600"
                stroke="white"
                strokeWidth="3"
              />
            </>
          )}
        </svg>

        {furnitureScale > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            Scale: 1:{Math.round(1 / furnitureScale)}
            {calibratedScale && <span style={{ color: '#0066FF', marginLeft: '8px' }}>✓ 보정됨</span>}
          </div>
        )}
      </div>

      {/* Calibration Dialog */}
      {calibrationStart && calibrationEnd && (
        <ScaleCalibrationDialog
          open={showCalibrationDialog}
          pixelDistance={Math.sqrt(
            Math.pow(calibrationEnd.x - calibrationStart.x, 2) +
            Math.pow(calibrationEnd.y - calibrationStart.y, 2)
          )}
          onClose={handleCalibrationCancel}
          onConfirm={handleCalibrationConfirm}
        />
      )}
    </div>
  );
});

FloorPlanCanvas.displayName = 'FloorPlanCanvas';

export default FloorPlanCanvas;
