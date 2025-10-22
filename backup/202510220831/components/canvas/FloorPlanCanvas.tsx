'use client';

import { forwardRef, useEffect, useState, useRef } from 'react';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useAppStore } from '@/lib/stores/app-store';
import { useDrawingStore } from '@/lib/stores/drawing-store';
import { floorPlan112 } from '@/data/floor-plan-112';
import FurnitureItem from '@/components/ui/FurnitureItem';
import MeasurementTool from '@/components/ui/MeasurementTool';
import ScaleCalibrationDialog from '@/components/ui/ScaleCalibrationDialog';
import DrawingLayer from '@/components/canvas/DrawingLayer';
import DrawingToolbar from '@/components/ui/DrawingToolbar';
import Image from 'next/image';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface FloorPlanCanvasProps {
  measurementMode: boolean;
  calibrationMode: boolean;
  eraserMode: boolean;
  onCalibrationComplete: () => void;
}

const FloorPlanCanvas = forwardRef<HTMLDivElement, FloorPlanCanvasProps>(({ measurementMode, calibrationMode, eraserMode, onCalibrationComplete }, ref) => {
  const { t } = useTranslation();
  const { furniture, setSelectedId, addMeasurement, recalibrateMeasurements, clearAll } = useFurnitureStore();
  const { setViewport, calibratedScale, setCalibratedScale, uploadedImageUrl, showSampleFloorPlan, setShowSampleFloorPlan, setUploadedImageUrl, setShowCanvasSizeDialog } = useAppStore();
  const { drawingMode, setDrawingMode, canvasWidth: drawingCanvasWidth, canvasHeight: drawingCanvasHeight, currentTool, eraserMode: drawingEraserMode, clearAllElements } = useDrawingStore();
  const [displayScale, setDisplayScale] = useState(0.05); // 캔버스 표시용 scale (항상 자동 계산)
  const [measurementStart, setMeasurementStart] = useState<{ x: number; y: number } | null>(null);
  const [measurementMousePos, setMeasurementMousePos] = useState<{ x: number; y: number } | null>(null);
  const [uploadedImageDimensions, setUploadedImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const centerFileInputRef = useRef<HTMLInputElement>(null);

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
  const mouseStartPointRef = useRef<{ x: number; y: number } | null>(null);

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

  // Canvas size calculation
  // If in drawing mode with custom canvas, use drawing canvas size
  // Otherwise use floor plan dimensions
  const imageWidth = drawingMode ? drawingCanvasWidth : floorPlan112.width;
  const imageHeight = drawingMode ? drawingCanvasHeight : floorPlan112.height;
  const canvasWidth = imageWidth * displayScale;
  const canvasHeight = imageHeight * displayScale;

  useEffect(() => {
    if (!measurementMode) {
      setMeasurementStart(null);
      setMeasurementMousePos(null);
    }
  }, [measurementMode]);

  // Recalibrate all existing measurements when calibration changes
  useEffect(() => {
    recalibrateMeasurements(calibratedScale);
  }, [calibratedScale, recalibrateMeasurements]);

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

    // 세로 휠 → 줌 (마우스 커서 위치 기준)
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const container = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 현재 값들을 미리 계산
    setZoom((prevZoom) => {
      const newZoom = Math.max(0.5, Math.min(5, prevZoom * delta));
      const zoomRatio = newZoom / prevZoom;

      // transformOrigin: 'center center'를 고려한 계산
      // 컨테이너 중심 기준으로 마우스 상대 위치 계산
      const containerCenterX = rect.width / 2;
      const containerCenterY = rect.height / 2;
      const relMouseX = mouseX - containerCenterX;
      const relMouseY = mouseY - containerCenterY;

      // Pan 조정: 마우스 위치가 줌 전후로 같은 곳을 가리키도록
      setPanX((prevPanX) => prevPanX - relMouseX * (zoomRatio - 1));
      setPanY((prevPanY) => prevPanY - relMouseY * (zoomRatio - 1));

      return newZoom;
    });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Enable panning: left mouse button, not in measurement/calibration mode
    if (e.button === 0 && !measurementMode && !calibrationMode) {
      setIsMousePanning(true);
      mouseStartPointRef.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };

  // Add mouse event listeners
  useEffect(() => {
    if (!isMousePanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseStartPointRef.current) return;

      const dx = e.clientX - mouseStartPointRef.current.x;
      const dy = e.clientY - mouseStartPointRef.current.y;

      setPanX((prev) => prev + dx);
      setPanY((prev) => prev + dy);

      mouseStartPointRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      setIsMousePanning(false);
      mouseStartPointRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMousePanning]);

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
          calibratedScale: calibratedScale, // Store current calibration
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

  const handleCenterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다');
      return;
    }

    // Create object URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);

    // Clear calibration when uploading new image
    setCalibratedScale(null);
    clearAll();
    clearAllElements(); // Clear drawing elements too

    // Disable sample floor plan and set uploaded image
    setShowSampleFloorPlan(false);
    setUploadedImageUrl(imageUrl);

    // Enable drawing mode automatically when image is uploaded
    setDrawingMode(true);

    // Reset file input
    if (centerFileInputRef.current) {
      centerFileInputRef.current.value = '';
    }
  };

  const handleCenterUploadClick = () => {
    centerFileInputRef.current?.click();
  };

  const handleLoadSample = () => {
    setUploadedImageUrl(null);
    setShowSampleFloorPlan(true);
    clearAllElements(); // Clear drawing elements when loading sample
    // Enable drawing mode automatically when sample floor plan is loaded
    setDrawingMode(true);
  };

  const handleDirectDraw = () => {
    clearAllElements(); // Clear drawing elements when starting direct draw
    setShowCanvasSizeDialog(true);
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

    // Track mouse position in calibration mode
    if (calibrationMode) {
      if (calibrationStart) {
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
      } else {
        // Before first click, just track mouse position
        setCalibrationMousePos({ x, y });
      }
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
          : (!measurementMode ? 'grab' : 'default')
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

      {/* Drawing Toolbar - Always visible */}
      <DrawingToolbar />

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
          ) : showSampleFloorPlan ? (
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
          ) : !drawingMode ? (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: '#666',
                fontSize: '18px',
                pointerEvents: 'auto',
                userSelect: 'none',
                zIndex: 2,
              }}
            >
              <input
                ref={centerFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCenterImageUpload}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>📁</div>
              <div style={{ fontWeight: 'bold', marginBottom: '24px', fontSize: '20px' }}>{t('uploadFloorPlanImage')}</div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDirectDraw}
                  style={{
                    padding: '16px 28px',
                    backgroundColor: '#9333ea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#7e22ce';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#9333ea';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                >
                  ✏️ {t('createFloorPlan')}
                </button>
                <button
                  onClick={handleCenterUploadClick}
                  style={{
                    padding: '16px 28px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#16a34a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#22c55e';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                >
                  📁 {t('uploadFloorPlan')}
                </button>
                <button
                  onClick={handleLoadSample}
                  style={{
                    padding: '16px 28px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  }}
                >
                  {t('viewSample')}
                </button>
              </div>
              <div style={{ fontSize: '14px', color: '#999' }}>
                {t('orUseToolbarButtons')}
              </div>
            </div>
          ) : null}
        </div>

        {/* Drawing layer - between floor plan and furniture */}
        {(uploadedImageUrl || showSampleFloorPlan || drawingMode) && (
          <DrawingLayer
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            scale={furnitureScale}
            calibratedScale={calibratedScale}
            canvasZoom={zoom}
            canvasPanX={panX}
            canvasPanY={panY}
            realWidth={imageWidth}
            realHeight={imageHeight}
          />
        )}

        {/* Furniture layer - higher z-index */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 200,
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
              drawingEraserActive={currentTool === 'eraser' && (drawingEraserMode === 'universal' || drawingEraserMode === 'furniture')}
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
            zIndex: 250,
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

          {/* Show calibration crosshair and counter */}
          {calibrationMode && calibrationMousePos && (
            <g>
              {/* 십자 가이드라인 (항상 표시) */}
              {!calibrationStart && (
                <>
                  {/* Horizontal guide line */}
                  <line
                    x1="0"
                    y1={calibrationMousePos.y}
                    x2={canvasWidth}
                    y2={calibrationMousePos.y}
                    stroke="#FF6600"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.6"
                  />
                  {/* Vertical guide line */}
                  <line
                    x1={calibrationMousePos.x}
                    y1="0"
                    x2={calibrationMousePos.x}
                    y2={canvasHeight}
                    stroke="#FF6600"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.6"
                  />
                </>
              )}

              {/* 클릭 횟수 표시 */}
              <rect
                x={calibrationMousePos.x + 15}
                y={calibrationMousePos.y - 25}
                width="45"
                height="30"
                fill="rgba(255, 102, 0, 0.9)"
                stroke="white"
                strokeWidth="2"
                rx="4"
              />
              <text
                x={calibrationMousePos.x + 37.5}
                y={calibrationMousePos.y - 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="16"
                fontWeight="bold"
              >
                {calibrationStart ? '2/2' : '1/2'}
              </text>
            </g>
          )}

          {/* 첫 점 찍은 후: 시작점 표시와 연결선 */}
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
                </>
              )}
            </>
          )}
          {calibrationMode && calibrationStart && calibrationEnd && (() => {
            const dx = calibrationEnd.x - calibrationStart.x;
            const dy = calibrationEnd.y - calibrationStart.y;
            const pixelDistance = Math.sqrt(dx * dx + dy * dy);
            const midX = (calibrationStart.x + calibrationEnd.x) / 2;
            const midY = (calibrationStart.y + calibrationEnd.y) / 2;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            // Calculate display distance
            let displayText = `${Math.round(pixelDistance)}px`;
            if (calibratedScale) {
              const mmDistance = pixelDistance / calibratedScale;
              const cmDistance = mmDistance / 10;
              displayText = `${cmDistance.toFixed(1)}cm`;
            }

            return (
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
                {/* Distance label */}
                <g transform={`translate(${midX},${midY}) rotate(${angle})`}>
                  <rect
                    x="-35"
                    y="-15"
                    width="70"
                    height="30"
                    fill="rgba(255, 102, 0, 0.95)"
                    stroke="white"
                    strokeWidth="2"
                    rx="4"
                  />
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {displayText}
                  </text>
                </g>
              </>
            );
          })()}
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
