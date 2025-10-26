'use client';

import { forwardRef, useEffect, useState, useRef, useImperativeHandle, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useAppStore } from '@/lib/stores/app-store';
import { useDrawingStore } from '@/lib/stores/drawing-store';
import { useLayerStore } from '@/lib/stores/layer-store';
import { useSelectionStore } from '@/lib/stores/selection-store';
import { floorPlan112 } from '@/data/floor-plan-112';
import FurnitureItem from '@/components/ui/FurnitureItem';
import MeasurementTool from '@/components/ui/MeasurementTool';
import ScaleCalibrationDialog from '@/components/ui/ScaleCalibrationDialog';
import DrawingLayer from '@/components/canvas/DrawingLayer';
import DrawingToolbar from '@/components/ui/DrawingToolbar';
import Image from 'next/image';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import toast from 'react-hot-toast';

const PDFConversionModal = dynamic(() => import('@/components/ui/PDFConversionModal'), { ssr: false });

interface FloorPlanCanvasProps {
  measurementMode: boolean;
  calibrationMode: boolean;
  eraserMode: boolean;
  onCalibrationComplete: () => void;
}

const FloorPlanCanvas = forwardRef<HTMLDivElement, FloorPlanCanvasProps>(({ measurementMode, calibrationMode, eraserMode, onCalibrationComplete }, ref) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { furniture, addMeasurement, recalibrateMeasurements, clearAll } = useFurnitureStore();
  const { clearSelection } = useSelectionStore();
  const { setViewport, calibratedScale, setCalibratedScale, uploadedImageUrl, showSampleFloorPlan, setShowSampleFloorPlan, setUploadedImageUrl, setShowCanvasSizeDialog, pages, currentPageIndex, setCurrentPageIndex, getCurrentPage, triggerCalibrationPulse } = useAppStore();
  const { drawingMode, setDrawingMode, canvasWidth: drawingCanvasWidth, canvasHeight: drawingCanvasHeight, currentTool, eraserMode: drawingEraserMode, clearAllElements, toolbarCollapsed } = useDrawingStore();
  const [displayScale, setDisplayScale] = useState(0.05); // 캔버스 표시용 scale (항상 자동 계산)
  const [measurementStart, setMeasurementStart] = useState<{ x: number; y: number } | null>(null);
  const [measurementMousePos, setMeasurementMousePos] = useState<{ x: number; y: number } | null>(null);
  const [uploadedImageDimensions, setUploadedImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
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
  const [showPagePanel, setShowPagePanel] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);

  // Calibration touch state
  const [calibrationTouchStartTime, setCalibrationTouchStartTime] = useState<number>(0);
  const [calibrationTouchStartPos, setCalibrationTouchStartPos] = useState<{x: number, y: number} | null>(null);
  const [calibrationHoldProgress, setCalibrationHoldProgress] = useState<number>(0);
  const [isHoldingCalibration, setIsHoldingCalibration] = useState<boolean>(false);
  const calibrationHoldTimer = useRef<NodeJS.Timeout | null>(null);
  const calibrationProgressInterval = useRef<NodeJS.Timeout | null>(null);
  const lastMoveTime = useRef<number>(0);
  const lastFixedPos = useRef<{x: number, y: number} | null>(null); // Track last fixed position for movement detection

  // Setup keyboard shortcuts with pan callbacks
  useKeyboardShortcuts(ref as React.RefObject<HTMLElement | null>, { setPanX, setPanY });

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

  // 페이지 전환 동기화: currentPageIndex가 변경되면 해당 페이지의 데이터를 로드
  useEffect(() => {
    if (pages.length > 0 && currentPageIndex >= 0 && currentPageIndex < pages.length) {
      const currentPage = pages[currentPageIndex];
      
      // 현재 페이지의 furniture를 furniture-store에 로드
      useFurnitureStore.setState({ furniture: currentPage.furniture || [] });
      
      // 현재 페이지의 drawings를 drawing-store에 로드
      useDrawingStore.setState({ elements: currentPage.drawings || [] });
      
      // 현재 페이지의 이미지를 uploadedImageUrl로 설정
      if (currentPage.imageUrl) {
        setUploadedImageUrl(currentPage.imageUrl);
        setShowSampleFloorPlan(false);
      }
    }
  }, [currentPageIndex]);

  // 현재 작업 내용을 페이지에 자동 저장
  useEffect(() => {
    if (pages.length > 0 && currentPageIndex >= 0 && currentPageIndex < pages.length) {
      // 현재 페이지의 furniture와 drawings를 업데이트
      useAppStore.setState((state) => ({
        pages: state.pages.map((page, index) =>
          index === currentPageIndex
            ? { ...page, furniture: furniture, drawings: useDrawingStore.getState().elements }
            : page
        ),
      }));
    }
  }, [furniture, currentPageIndex]);

  // drawings 변경 감지 및 자동 저장 (subscribe 방식)
  useEffect(() => {
    const unsubscribe = useDrawingStore.subscribe((state) => {
      // 페이지가 있고 현재 페이지가 유효할 때만
      const appState = useAppStore.getState();
      if (appState.pages.length > 0 && appState.currentPageIndex >= 0 && appState.currentPageIndex < appState.pages.length) {
        // drawings 업데이트
        useAppStore.setState((appState) => ({
          pages: appState.pages.map((page, index) =>
            index === appState.currentPageIndex
              ? { ...page, drawings: state.elements }
              : page
          ),
        }));
      }
    });

    return () => unsubscribe();
  }, [currentPageIndex]);




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

  // Show calibration toast when calibration mode is active
  useEffect(() => {
    if (calibrationMode) {
      const message = calibrationStart
        ? '📏 두 번째 점을 클릭하세요'
        : '📏 첫 번째 점을 클릭하세요';

      toast(message, {
        id: 'calibration-mode-indicator',
        duration: Infinity, // Keep toast visible until mode is disabled
        style: {
          background: '#FF6600',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '14px',
          padding: '12px 24px',
        },
      });
    } else {
      // Dismiss calibration toast when mode is disabled
      toast.dismiss('calibration-mode-indicator');
    }

    // Cleanup on unmount
    return () => {
      toast.dismiss('calibration-mode-indicator');
    };
  }, [calibrationMode, calibrationStart]);

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

    // Check if touch target is a button - if so, don't handle calibration
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    // Calibration mode: handle separately
    if (calibrationMode && !showCalibrationDialog && e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      setCalibrationTouchStartTime(now);

      // Calculate canvas coordinates
      const container = (ref as React.RefObject<HTMLDivElement>)?.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const containerCenterY = containerRect.top + containerRect.height / 2;
      const clickX = touch.clientX - containerCenterX;
      const clickY = touch.clientY - containerCenterY;
      const canvasCenterX = canvasWidth / 2;
      const canvasCenterY = canvasHeight / 2;
      let x = canvasCenterX + (clickX / zoom - panX / zoom);
      let y = canvasCenterY + (clickY / zoom - panY / zoom);

      // If there's already a calibration start point (1/2 fixed), apply snap for tap-tap mode
      if (calibrationStart) {
        const startPoint = calibrationStart;
        const dx = Math.abs(x - startPoint.x);
        const dy = Math.abs(y - startPoint.y);
        if (dx > dy) {
          y = startPoint.y; // Snap to horizontal
        } else {
          x = startPoint.x; // Snap to vertical
        }
      }

      setCalibrationTouchStartPos({ x, y });
      setCalibrationMousePos({ x, y }); // 즉시 표시
      lastMoveTime.current = Date.now(); // Start tracking from now - require genuine stop
      lastFixedPos.current = { x, y }; // Track initial position for movement detection

      // Hold timer will be managed by useEffect based on lastMoveTime

      return;
    }

    if (e.touches.length === 2) {
      // Two finger touch - start pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1) {
      // Single finger - could be tap or pan
      // Note: Capture listener (Line ~518) sets this first, but we keep this for safety
      lastPanPointRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Calibration mode: handle touch move
    if (calibrationMode && !showCalibrationDialog && e.touches.length === 1 && calibrationTouchStartPos) {
      e.preventDefault();
      const touch = e.touches[0];
      const container = (ref as React.RefObject<HTMLDivElement>)?.current;
      if (!container) return;

      // Calculate canvas coordinates
      const containerRect = container.getBoundingClientRect();
      const containerCenterX = containerRect.left + containerRect.width / 2;
      const containerCenterY = containerRect.top + containerRect.height / 2;
      const clickX = touch.clientX - containerCenterX;
      const clickY = touch.clientY - containerCenterY;
      const canvasCenterX = canvasWidth / 2;
      const canvasCenterY = canvasHeight / 2;
      let x = canvasCenterX + (clickX / zoom - panX / zoom);
      let y = canvasCenterY + (clickY / zoom - panY / zoom);

      // If there's already a calibration start point (1/2 fixed), apply snap
      if (calibrationStart) {
        const startPoint = calibrationStart;
        const dx = Math.abs(x - startPoint.x);
        const dy = Math.abs(y - startPoint.y);
        if (dx > dy) {
          y = startPoint.y; // Snap to horizontal
        } else {
          x = startPoint.x; // Snap to vertical
        }
      }

      setCalibrationMousePos({ x, y });

      // Movement detected - update last move time
      lastMoveTime.current = Date.now();

      return;
    }

    // Don't pan if drawing tool is active (prevent canvas movement during drawing)
    const { currentTool } = useDrawingStore.getState();
    const isDrawingTool = currentTool !== 'select' && !calibrationMode && !measurementMode && !eraserMode;

    if (e.touches.length === 2 && lastTouchDistance !== null) {
      // Pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const delta = distance / lastTouchDistance;
      setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)));
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && lastPanPointRef.current && !isDrawingTool) {
      // Pan at any zoom level (but not during drawing)
      const touchDuration = Date.now() - touchStartTimeRef.current;

      if (touchDuration > 100) {
        // Only pan if touch held for 100ms (not a quick tap)
        e.preventDefault();
        setIsPanning(true);
        const dx = e.touches[0].clientX - lastPanPointRef.current.x;
        const dy = e.touches[0].clientY - lastPanPointRef.current.y;

        const container = (ref as React.RefObject<HTMLDivElement>)?.current;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          setPanX((prev) => limitPan(prev + dx, canvasWidth, containerWidth, zoom));
          setPanY((prev) => limitPan(prev + dy, canvasHeight, containerHeight, zoom));
        }
        lastPanPointRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  }, [calibrationMode, calibrationTouchStartPos, calibrationStart, zoom, panX, panY, canvasWidth, canvasHeight, ref, measurementMode, eraserMode, showCalibrationDialog]);

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Calibration mode: handle touch end
    if (calibrationMode && !showCalibrationDialog && calibrationTouchStartPos) {
      e.preventDefault(); // Prevent click event from firing

      // Stop hold timer (if running)
      stopCalibrationHold();

      const touchDuration = Date.now() - calibrationTouchStartTime;

      // For quick tap detection, measure from original touch position (not snapped)
      const touchStartX = calibrationTouchStartPos.x;
      const touchStartY = calibrationTouchStartPos.y;

      // If there's a calibration start, we need to "unsnap" to get original position
      let originalTouchX = touchStartX;
      let originalTouchY = touchStartY;

      // Quick tap: just check duration (movement detection is unreliable with snap)
      const isQuickTap = touchDuration < 200;

      if (isQuickTap) {
        // Tap-tap mode: quick tap without dragging
        if (!calibrationStart) {
          // First tap: immediately fix 1/2 point at touch start position
          setCalibrationStart(calibrationTouchStartPos);
          // Keep calibrationMousePos at start point to show guidelines
          setCalibrationMousePos(calibrationTouchStartPos);
        } else {
          // Second tap: calibrationMousePos already has snap applied in handleTouchStart
          const endPoint = calibrationMousePos || calibrationTouchStartPos;

          // Use the already-snapped position directly (snap was applied in handleTouchStart)
          setCalibrationEnd(endPoint);
          setShowCalibrationDialog(true);
        }
      } else {
        // Drag mode: finger lifted without hold completing
        // If hold timer completed, it already fixed the point
        // If not, treat as tap-tap mode (convert to tap-tap)
        if (!calibrationStart && calibrationMousePos) {
          // User dragged but lifted before 1 second - fix 1/2 at current position
          setCalibrationStart(calibrationMousePos);
          setCalibrationMousePos(null);
        } else if (calibrationStart && calibrationMousePos) {
          // User was dragging for 2/2 but lifted before 1 second - fix 2/2 and show dialog
          setCalibrationEnd(calibrationMousePos);
          setShowCalibrationDialog(true);
        }
      }

      // Reset touch state
      setCalibrationTouchStartPos(null);
      setCalibrationTouchStartTime(0);
      return;
    }

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
    lastPanPointRef.current = null;
    setIsPanning(false);
  };

  // Mouse wheel zoom and pan (will be added via useEffect)
  const handleWheel = (e: WheelEvent) => {
    // Check if wheel event is happening inside the page panel
    // If so, don't prevent it - allow panel scrolling
    const target = e.target as HTMLElement;
    const pagePanel = target.closest('.page-panel-scroll');
    if (pagePanel) {
      // Allow scrolling inside the panel
      return;
    }

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
    // Enable panning: left or middle mouse button, not in measurement/calibration mode
    if ((e.button === 0 || e.button === 1) && !measurementMode && !calibrationMode) {
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

  // Add touch event listener with passive: false to allow preventDefault
  useEffect(() => {
    const container = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!container) return;

    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchMove, ref]);

  // Capture phase listener for touchstart to ensure touchStartTimeRef is set
  // even when child elements handle the touch event
  useEffect(() => {
    const container = (ref as React.RefObject<HTMLDivElement>)?.current;
    if (!container) return;

    const handleTouchStartCapture = (e: TouchEvent) => {
      touchStartTimeRef.current = Date.now();
      const target = e.target as HTMLElement;

      // Don't handle touches inside modals/dialogs
      const isInsideModal = target.closest('[role="dialog"]') ||
                           target.closest('[data-modal="true"]');

      if (isInsideModal) return;

      const targetTag = target.tagName?.toLowerCase();

      // Don't set lastPanPoint if touching SVG elements (furniture/drawing shapes)
      // This allows element dragging instead of background panning
      const isSVGElement = ['rect', 'circle', 'ellipse', 'line', 'path', 'text', 'polyline', 'polygon'].includes(targetTag);
      const isFurnitureDiv = target.classList?.contains('furniture-item');

      if (e.touches.length === 1 && !isSVGElement && !isFurnitureDiv) {
        lastPanPointRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    container.addEventListener('touchstart', handleTouchStartCapture, { capture: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStartCapture, { capture: true });
    };
  }, [ref]);

  // Monitor movement and start hold timer when user stops moving
  useEffect(() => {
    if (!calibrationMode || !calibrationTouchStartPos || !calibrationMousePos) return;

    const MOVEMENT_THRESHOLD = 5; // pixels - minimum movement to be considered "moving"
    const STOP_DETECTION_MS = 500; // ms - how long user must stop before timer starts

    const checkInterval = setInterval(() => {
      const timeSinceLastMove = Date.now() - lastMoveTime.current;

      // Calculate distance moved from last fixed position
      let hasMoved = false;
      if (lastFixedPos.current) {
        const dx = Math.abs(calibrationMousePos.x - lastFixedPos.current.x);
        const dy = Math.abs(calibrationMousePos.y - lastFixedPos.current.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        hasMoved = distance > MOVEMENT_THRESHOLD;
      }

      // If user is actively moving (within last 500ms), stop any timer
      if (timeSinceLastMove < STOP_DETECTION_MS) {
        if (isHoldingCalibration) {
          stopCalibrationHold();
        }
      }
      // User stopped moving for 500ms - start timer ONLY if:
      // 1. No calibration start (waiting for 1/2) OR
      // 2. Calibration start exists AND user has moved
      else if (timeSinceLastMove >= STOP_DETECTION_MS && !isHoldingCalibration) {
        // If 1/2 is already fixed, only start timer if user has moved
        if (calibrationStart && !hasMoved) {
          // Don't start timer - user hasn't moved after 1/2 was fixed
          return;
        }

        // Update last fixed position to current position before starting timer
        lastFixedPos.current = { ...calibrationMousePos };
        startCalibrationHold();
      }
    }, 50); // Check every 50ms

    return () => clearInterval(checkInterval);
  }, [calibrationMode, calibrationTouchStartPos, calibrationMousePos, isHoldingCalibration, calibrationStart, showCalibrationDialog]);

  // Reset calibration state when mode is turned off
  useEffect(() => {
    if (!calibrationMode) {
      setCalibrationStart(null);
      setCalibrationEnd(null);
      setCalibrationMousePos(null);
      setCalibrationHoldProgress(0);
      setIsHoldingCalibration(false);
      lastFixedPos.current = null;
      // Clear timers
      if (calibrationHoldTimer.current) clearTimeout(calibrationHoldTimer.current);
      if (calibrationProgressInterval.current) clearInterval(calibrationProgressInterval.current);
    } else {
      // When calibration mode is enabled, switch to select tool
      const { setCurrentTool } = useDrawingStore.getState();
      setCurrentTool('select');
    }
  }, [calibrationMode]);

  // Helper: Start hold timer for calibration
  const startCalibrationHold = () => {
    // Clear existing timers
    if (calibrationHoldTimer.current) clearTimeout(calibrationHoldTimer.current);
    if (calibrationProgressInterval.current) clearInterval(calibrationProgressInterval.current);

    setIsHoldingCalibration(true);
    setCalibrationHoldProgress(0);

    // Progress animation (0 to 100 over 1 second)
    const startTime = Date.now();
    calibrationProgressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 1000) * 100, 100);
      setCalibrationHoldProgress(progress);
    }, 16); // ~60fps

    // Complete after 1 second
    calibrationHoldTimer.current = setTimeout(() => {
      setIsHoldingCalibration(false);
      setCalibrationHoldProgress(0);
      if (calibrationProgressInterval.current) clearInterval(calibrationProgressInterval.current);

      // Lock the point using current mouse position
      if (!calibrationStart) {
        // Lock first point (use calibrationMousePos which is the current position)
        if (calibrationMousePos) {
          setCalibrationStart(calibrationMousePos);
          // Update lastFixedPos after locking 1/2
          lastFixedPos.current = { ...calibrationMousePos };
          // CRITICAL: Reset lastMoveTime so 2/2 timer doesn't start immediately
          lastMoveTime.current = Date.now();
        }
      } else if (calibrationMousePos) {
        // Lock second point and show dialog
        setCalibrationEnd(calibrationMousePos);
        setShowCalibrationDialog(true);
      }
    }, 1000);
  };

  // Helper: Stop hold timer
  const stopCalibrationHold = () => {
    if (calibrationHoldTimer.current) clearTimeout(calibrationHoldTimer.current);
    if (calibrationProgressInterval.current) clearInterval(calibrationProgressInterval.current);
    setIsHoldingCalibration(false);
    setCalibrationHoldProgress(0);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Don't handle click if we were panning
    if (isMousePanning) return;

    // Check if click target is a button - if so, don't handle calibration
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }

    if (calibrationMode && !showCalibrationDialog) {
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
    clearSelection();
  };

  const handleCalibrationConfirm = (calculatedScale: number) => {
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
    // 배율 모드는 유지 (calibrationMode는 그대로)
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

    // Check if file is a PDF
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      // PDF 파일 - 모달 표시
      setPdfFile(file);
      // Reset file input
      if (centerFileInputRef.current) {
        centerFileInputRef.current.value = '';
      }
      return;
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 또는 PDF 파일만 업로드 가능합니다');
      return;
    }

    // 이미지 파일 처리 (기존 로직 그대로)
    processCenterImageFile(file);
  };

  const processCenterImageFile = (file: File) => {
    // Convert image to base64 for localStorage persistence
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;

      // Clear calibration when uploading new image
      setCalibratedScale(null);
      clearAll();
      clearAllElements(); // Clear drawing elements too

      // Disable sample floor plan and set uploaded image as base64
      setShowSampleFloorPlan(false);
      setUploadedImageUrl(base64String);

      // Enable drawing mode automatically when image is uploaded
      setDrawingMode(true);
    };

    reader.onerror = () => {
      toast.error('이미지 업로드 중 오류가 발생했습니다');
    };

    reader.readAsDataURL(file);

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

    // Show calibration toast message
    toast('⚠️ 정확한 치수를 위해 배율적용을 설정해주세요', {
      duration: 5000,
      position: 'top-center',
      icon: '📐',
    });

    // Trigger calibration button pulse
    triggerCalibrationPulse();
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
    if (calibrationMode && !showCalibrationDialog) {
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
          top: toolbarCollapsed ? '16px' : '110px',
          right: '16px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          transition: 'top 0.3s ease',
        }}
      >
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-xl font-bold text-gray-900 transition-colors border border-border"
          title="확대 (Zoom In)"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-xl font-bold text-gray-900 transition-colors border border-border"
          title="축소 (Zoom Out)"
        >
          −
        </button>
        <button
          onClick={handleZoomReset}
          className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-xs font-medium text-gray-900 transition-colors border border-border"
          title="초기화 (Reset)"
        >
          1:1
        </button>
        <div className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center text-xs font-bold text-gray-900 border border-border">
          {Math.round(zoom * 100)}%
        </div>

        {/* 페이지 네비게이션 (페이지가 있을 때만) */}
        {pages.length > 0 && (
          <>
            <div className="w-10 h-1 border-t border-gray-300 my-1" />
            <button
              onClick={() => {
                if (currentPageIndex > 0) {
                  setCurrentPageIndex(currentPageIndex - 1);
                }
              }}
              disabled={currentPageIndex === 0}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-gray-900 transition-colors border border-border disabled:opacity-30 disabled:cursor-not-allowed"
              title="이전 페이지"
            >
              ◀
            </button>
            <button
              onClick={() => setShowPagePanel(!showPagePanel)}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-gray-900 transition-colors border border-border group relative"
              title="페이지 미리보기"
            >
              <span className="group-hover:hidden flex flex-col items-center justify-center text-[10px] font-medium leading-tight">
                <span>{currentPageIndex + 1}</span>
                <span className="text-gray-400">/</span>
                <span>{pages.length}</span>
              </span>
              <span className="hidden group-hover:flex text-xl">⊞</span>
            </button>
            <button
              onClick={() => {
                if (currentPageIndex < pages.length - 1) {
                  setCurrentPageIndex(currentPageIndex + 1);
                }
              }}
              disabled={currentPageIndex === pages.length - 1}
              className="w-10 h-10 bg-white hover:bg-gray-100 rounded-lg shadow-md flex items-center justify-center text-gray-900 transition-colors border border-border disabled:opacity-30 disabled:cursor-not-allowed"
              title="다음 페이지"
            >
              ▶
            </button>
          </>
        )}
      </div>

      {/* 썸네일 미리보기 패널 */}
      {pages.length > 0 && showPagePanel && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/20"
            style={{ zIndex: 9998, pointerEvents: 'auto' }}
            onClick={() => setShowPagePanel(false)}
          />

          {/* 패널 - 우측 버튼 왼쪽에 표시 */}
          <div
            className="page-panel-scroll fixed bg-card border border-border rounded-lg shadow-2xl p-4 max-w-md w-80 max-h-[calc(100vh-6rem)] overflow-y-auto"
            style={{
              top: toolbarCollapsed ? '16px' : '110px',
              right: '72px', // 버튼 너비(40px) + 버튼과 패널 간격(32px)
              transition: 'top 0.3s ease',
              zIndex: 9999,
            }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <h3 className="font-bold text-lg">페이지</h3>
              <span className="text-sm font-medium">
                {currentPageIndex + 1} / {pages.length}
              </span>
            </div>

            {/* 페이지 목록 (썸네일 그리드) */}
            <div className="grid grid-cols-2 gap-3">
              {pages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => {
                    setCurrentPageIndex(index);
                    setShowPagePanel(false);
                  }}
                  className={`
                    relative rounded-lg overflow-hidden border-2 transition-all
                    ${index === currentPageIndex
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-accent'
                    }
                  `}
                >
                  {/* 썸네일 이미지 */}
                  <div className="aspect-[4/3] bg-secondary">
                    <img
                      src={page.imageUrl}
                      alt={page.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 페이지 정보 */}
                  <div className="p-2 bg-card/95 text-left">
                    <p className="text-xs font-medium truncate">
                      {page.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {index + 1} / {pages.length}
                    </p>
                  </div>

                  {/* 현재 페이지 표시 */}
                  {index === currentPageIndex && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold">
                      현재
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

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
            pointerEvents: 'none', // Allow touches to pass through to FloorPlanCanvas for panning
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
                width: isMobile ? '90%' : 'auto',
                maxWidth: isMobile ? '340px' : 'none',
              }}
            >
              <input
                ref={centerFileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleCenterImageUpload}
                style={{ display: 'none' }}
              />
              <div style={{ fontWeight: isMobile ? '600' : 'bold', marginBottom: isMobile ? '12px' : '24px', fontSize: isMobile ? '14px' : '20px', color: '#555' }}>{t('uploadFloorPlanImage')}</div>
              <div style={{ display: 'flex', gap: isMobile ? '6px' : '12px', justifyContent: 'center', marginBottom: isMobile ? '12px' : '16px', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'stretch' }}>
                <button
                  onClick={handleDirectDraw}
                  style={{
                    padding: isMobile ? '10px 12px' : '16px 28px',
                    backgroundColor: 'white',
                    color: '#b45309',
                    border: '2px solid #fbbf24',
                    borderRadius: isMobile ? '6px' : '8px',
                    fontSize: isMobile ? '13px' : '16px',
                    fontWeight: isMobile ? '600' : 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(251,191,36,0.2)',
                    transition: 'all 0.2s',
                    width: isMobile ? '160px' : 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef3c7';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(251,191,36,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(251,191,36,0.2)';
                  }}
                >
                  ✏️ {t('createFloorPlan')}
                </button>
                <button
                  onClick={handleCenterUploadClick}
                  style={{
                    padding: isMobile ? '10px 12px' : '16px 28px',
                    backgroundColor: '#d97706',
                    color: 'white',
                    border: 'none',
                    borderRadius: isMobile ? '6px' : '8px',
                    fontSize: isMobile ? '13px' : '16px',
                    fontWeight: isMobile ? '600' : 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(217,119,6,0.3)',
                    transition: 'all 0.2s',
                    width: isMobile ? '160px' : 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#b45309';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(217,119,6,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#d97706';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(217,119,6,0.3)';
                  }}
                >
                  📤 {t('uploadFloorPlan')}
                </button>
                <button
                  onClick={handleLoadSample}
                  style={{
                    padding: isMobile ? '10px 12px' : '16px 28px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    border: '2px solid #e5e7eb',
                    borderRadius: isMobile ? '6px' : '8px',
                    fontSize: isMobile ? '13px' : '16px',
                    fontWeight: isMobile ? '600' : 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                    width: isMobile ? '160px' : 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  {t('viewSample')}
                </button>
              </div>
              <div style={{ fontSize: isMobile ? '11px' : '14px', color: '#999', marginTop: isMobile ? '4px' : '0' }}>
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
            calibrationMode={calibrationMode}
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
            touchAction: 'none', // Prevent browser's default touch handling
          }}
        >
          {(() => {
            // Get layers and create a map for quick lookup
            const layers = useLayerStore((state) => state.layers);
            const layerMap = new Map(layers.map(l => [l.id, l]));

            // Filter furniture by layer visibility and sort by layer order + element order
            const visibleFurniture = furniture
              .filter(item => {
                const layer = layerMap.get(item.layerId);
                return layer && layer.visible;
              })
              .sort((a, b) => {
                const layerA = layerMap.get(a.layerId);
                const layerB = layerMap.get(b.layerId);
                if (!layerA || !layerB) return 0;

                // First sort by layer order (lower order = render first = behind)
                if (layerA.order !== layerB.order) {
                  return layerA.order - layerB.order;
                }

                // Then sort by element order within the layer
                return a.order - b.order;
              });

            return visibleFurniture.map((item) => (
              <FurnitureItem
                key={item.id}
                item={item}
                scale={furnitureScale}
                canvasZoom={zoom}
                canvasPanX={panX}
                canvasPanY={panY}
                eraserMode={eraserMode}
                drawingEraserActive={currentTool === 'eraser' && (drawingEraserMode === 'universal' || drawingEraserMode === 'furniture')}
                layerOpacity={layerMap.get(item.layerId)?.opacity ?? 100}
              />
            ));
          })()}
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
            pointerEvents: measurementMode ? 'auto' : 'none',
            touchAction: 'none', // Prevent browser's default touch handling
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

              {/* 클릭 횟수 표시 */}
              <rect
                x={calibrationMousePos.x + 15}
                y={calibrationMousePos.y - 25}
                width={isHoldingCalibration ? "75" : "45"}
                height="30"
                fill="rgba(255, 102, 0, 0.9)"
                stroke="white"
                strokeWidth="2"
                rx="4"
              />
              <text
                x={calibrationMousePos.x + (isHoldingCalibration ? 32 : 37.5)}
                y={calibrationMousePos.y - 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="16"
                fontWeight="bold"
              >
                {calibrationStart ? '2/2' : '1/2'}
              </text>

              {/* Hold progress indicator (circular gauge) */}
              {isHoldingCalibration && (
                <g>
                  {/* Background circle */}
                  <circle
                    cx={calibrationMousePos.x + 65}
                    cy={calibrationMousePos.y - 10}
                    r="10"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth="2"
                  />
                  {/* Progress circle */}
                  <circle
                    cx={calibrationMousePos.x + 65}
                    cy={calibrationMousePos.y - 10}
                    r="10"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 10}`}
                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - calibrationHoldProgress / 100)}`}
                    transform={`rotate(-90 ${calibrationMousePos.x + 65} ${calibrationMousePos.y - 10})`}
                  />
                </g>
              )}
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

      {/* PDF Conversion Modal */}
      {pdfFile && (
        <PDFConversionModal
          file={pdfFile}
          onConvert={(convertedPages) => {
            // 변환된 여러 페이지를 pages에 추가
            const newPages = convertedPages.map((page, index) => {
              const reader = new FileReader();
              return new Promise<any>((resolve) => {
                reader.onloadend = () => {
                  resolve({
                    id: `page-${Date.now()}-${index}`,
                    name: `페이지 ${page.pageNumber}`,
                    imageUrl: reader.result as string,
                    furniture: [],
                    drawings: [],
                    createdAt: Date.now(),
                  });
                };
                reader.readAsDataURL(page.blob);
              });
            });

            Promise.all(newPages).then((pages) => {
              useAppStore.getState().addPages(pages);
              toast.success(`${pages.length}개 페이지가 로드되었습니다`);
            });

            setPdfFile(null);
          }}
          onCancel={() => setPdfFile(null)}
        />
      )}
    </div>
  );
});

FloorPlanCanvas.displayName = 'FloorPlanCanvas';

export default FloorPlanCanvas;
