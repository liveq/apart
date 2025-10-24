'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useDrawingStore, DrawingElement, Point } from '@/lib/stores/drawing-store';
import { useLayerStore } from '@/lib/stores/layer-store';
import { useSelectionStore } from '@/lib/stores/selection-store';

interface DrawingLayerProps {
  canvasWidth: number; // in px
  canvasHeight: number; // in px
  scale: number; // mm to px ratio
  calibratedScale: number | null; // calibrated px/mm ratio from measurement tool
  canvasZoom: number;
  canvasPanX: number;
  canvasPanY: number;
  realWidth?: number; // actual width in mm
  realHeight?: number; // actual height in mm
  calibrationMode?: boolean; // if calibration mode is active
}

export default function DrawingLayer({
  canvasWidth,
  canvasHeight,
  scale,
  calibratedScale,
  canvasZoom,
  canvasPanX,
  canvasPanY,
  realWidth,
  realHeight,
  calibrationMode = false,
}: DrawingLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const handleMouseMoveRef = useRef<(e: MouseEvent | React.MouseEvent<SVGSVGElement>) => void>();
  const handleMouseUpRef = useRef<(e: MouseEvent | React.MouseEvent<SVGSVGElement>) => void>();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);
  const {
    elements,
    selectedElementId,
    currentTool,
    eraserMode,
    color,
    fillColor,
    thickness,
    lineStyle,
    fontSize,
    fontFamily,
    showGrid,
    showGridLabels,
    showDimensionLabels,
    gridSize,
    majorGridSize,
    continuousMode,
    guidelineColor,
    setIsDrawing,
    setTempStartPoint,
    setTempEndPoint,
    addElement,
    updateElement,
    deleteElement,
    setSelectedElementId,
    saveCurrentWork,
  } = useDrawingStore();

  const { isSelected: isItemSelected, toggleSelection } = useSelectionStore();

  // mm ↔ px 변환 헬퍼 함수
  const effectiveScale = calibratedScale || scale; // px/mm 비율
  const mmToPx = (mm: number) => mm * effectiveScale;
  const pxToMm = (px: number) => px / effectiveScale;

  const [isCurrentlyDrawing, setIsCurrentlyDrawing] = useState(false);
  const [tempStart, setTempStart] = useState<Point | null>(null);
  const [tempEnd, setTempEnd] = useState<Point | null>(null);
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [lastLineEndPoint, setLastLineEndPoint] = useState<Point | null>(null);
  const [textInputPosition, setTextInputPosition] = useState<Point | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mousePosition, setMousePosition] = useState<Point | null>(null);
  const [guideLines, setGuideLines] = useState<{ type: 'horizontal' | 'vertical'; position: number }[]>([]);
  const [snapPoints, setSnapPoints] = useState<Point[]>([]);

  // Pen tool state
  const [penPoints, setPenPoints] = useState<Point[]>([]);
  const [isPenDrawing, setIsPenDrawing] = useState(false);
  const [penCtrlMode, setPenCtrlMode] = useState(false); // Ctrl+click mode for pen
  const [penSnapPoint, setPenSnapPoint] = useState<Point | null>(null); // Point to snap to when close

  // Drag state for moving elements in select mode
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Resize state for resizing elements in select mode
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<any>(null);

  // Track Ctrl and Space keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') setCtrlPressed(true);
      if (e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        setSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setCtrlPressed(false);
        // When releasing Ctrl in pen Ctrl mode, complete the drawing automatically
        if (penCtrlMode && penPoints.length >= 2) {
          // px → mm 변환
          addElement({
            id: `path-${Date.now()}`,
            type: 'path',
            points: penPoints.map(pt => ({ x: pxToMm(pt.x), y: pxToMm(pt.y) })),
            color,
            thickness,
            lineStyle,
          });
          setPenCtrlMode(false);
          setPenPoints([]);
          setPenSnapPoint(null);
        } else if (penCtrlMode) {
          // If less than 2 points, just reset
          setPenCtrlMode(false);
          setPenPoints([]);
          setPenSnapPoint(null);
        }
      }
      if (e.key === ' ') {
        setSpacePressed(false);
      }
      if (e.key === 'Escape') {
        setLastLineEndPoint(null);
        setIsCurrentlyDrawing(false);
        setTempStart(null);
        setTempEnd(null);
        setGuideLines([]);
        setSnapPoints([]);
        setIsPenDrawing(false);
        setPenPoints([]);
        setPenCtrlMode(false);
        setPenSnapPoint(null);
        setTextInputPosition(null);
      }
      if (e.key === 'Enter' && penCtrlMode && penPoints.length > 1) {
        // Complete Ctrl mode pen drawing with Enter key (px → mm 변환)
        addElement({
          id: `path-${Date.now()}`,
          type: 'path',
          points: penPoints.map(pt => ({ x: pxToMm(pt.x), y: pxToMm(pt.y) })),
          color,
          thickness,
          lineStyle,
        });
        setPenCtrlMode(false);
        setPenPoints([]);
        setPenSnapPoint(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [penCtrlMode, penPoints, addElement, color, thickness, lineStyle]);

  // Clear guides when tool changes
  useEffect(() => {
    setGuideLines([]);
    setSnapPoints([]);
    setIsCurrentlyDrawing(false);
    setTempStart(null);
    setTempEnd(null);
    setPenSnapPoint(null);
  }, [currentTool]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [textInputValue]);

  // Convert screen coordinates to SVG coordinates (accounting for zoom/pan)
  const screenToSVG = (clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    const transformed = point.matrixTransform(ctm.inverse());
    return { x: transformed.x, y: transformed.y };
  };

  // Snap to grid
  const snapToGrid = (x: number, y: number): Point => {
    if (!showGrid) return { x, y };

    const gridSizePx = gridSize * scale;
    const snappedX = Math.round(x / gridSizePx) * gridSizePx;
    const snappedY = Math.round(y / gridSizePx) * gridSizePx;

    return { x: snappedX, y: snappedY };
  };

  // Snap to horizontal/vertical
  const snapToOrtho = (start: Point, end: Point): Point => {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);

    if (dx > dy) {
      return { x: end.x, y: start.y };
    } else {
      return { x: start.x, y: end.y };
    }
  };

  // Snap to 5 degree increments for pen tool
  const snapToAngle = (start: Point, end: Point): Point => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    // Snap to nearest 5° angle (72 directions)
    const angleStep = Math.PI / 36; // 5 degrees
    const snappedAngle = Math.round(angle / angleStep) * angleStep;

    return {
      x: start.x + length * Math.cos(snappedAngle),
      y: start.y + length * Math.sin(snappedAngle),
    };
  };

  // Get cursor for resize handle based on rotation
  const getResizeCursor = (handle: string, rotation: number): string => {
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const roundedRotation = Math.round(normalizedRotation / 45) * 45;

    const handleAngles: { [key: string]: number } = {
      'e': 0,
      'se': 45,
      's': 90,
      'sw': 135,
      'w': 180,
      'nw': 225,
      'n': 270,
      'ne': 315,
    };

    const finalAngle = (handleAngles[handle] + roundedRotation) % 360;

    if (finalAngle >= 337.5 || finalAngle < 22.5) return 'ew-resize';
    if (finalAngle >= 22.5 && finalAngle < 67.5) return 'nesw-resize';
    if (finalAngle >= 67.5 && finalAngle < 112.5) return 'ns-resize';
    if (finalAngle >= 112.5 && finalAngle < 157.5) return 'nwse-resize';
    if (finalAngle >= 157.5 && finalAngle < 202.5) return 'ew-resize';
    if (finalAngle >= 202.5 && finalAngle < 247.5) return 'nesw-resize';
    if (finalAngle >= 247.5 && finalAngle < 292.5) return 'ns-resize';
    if (finalAngle >= 292.5 && finalAngle < 337.5) return 'nwse-resize';

    return 'default';
  };

  // Extract all key points from existing elements
  const getAllKeyPoints = (): Point[] => {
    const points: Point[] = [];

    elements.forEach(el => {
      if (el.type === 'line') {
        points.push({ x: el.startX, y: el.startY });
        points.push({ x: el.endX, y: el.endY });
      } else if (el.type === 'rectangle') {
        const left = el.x;
        const right = el.x + el.width;
        const top = el.y;
        const bottom = el.y + el.height;
        const centerX = el.x + el.width / 2;
        const centerY = el.y + el.height / 2;

        // Corners
        points.push({ x: left, y: top });
        points.push({ x: right, y: top });
        points.push({ x: left, y: bottom });
        points.push({ x: right, y: bottom });
        // Edge centers
        points.push({ x: centerX, y: top });
        points.push({ x: centerX, y: bottom });
        points.push({ x: left, y: centerY });
        points.push({ x: right, y: centerY });
        // Center
        points.push({ x: centerX, y: centerY });
      } else if (el.type === 'circle') {
        const left = el.cx - el.rx;
        const right = el.cx + el.rx;
        const top = el.cy - el.ry;
        const bottom = el.cy + el.ry;

        points.push({ x: left, y: el.cy });
        points.push({ x: right, y: el.cy });
        points.push({ x: el.cx, y: top });
        points.push({ x: el.cx, y: bottom });
        points.push({ x: el.cx, y: el.cy });
      }
    });

    return points;
  };

  // Detect guides for a given mouse position
  const detectGuidesAtPosition = (mousePos: Point) => {
    const SNAP_THRESHOLD = 8;
    const guides: { type: 'horizontal' | 'vertical'; position: number }[] = [];
    const snaps: Point[] = [];
    let snappedPos = { ...mousePos };

    const keyPoints = getAllKeyPoints();

    let bestXSnap: { x: number; points: Point[] } | null = null;
    let bestYSnap: { y: number; points: Point[] } | null = null;

    // Check for horizontal alignment (same Y)
    keyPoints.forEach(point => {
      const diffY = Math.abs(mousePos.y - point.y);
      if (diffY < SNAP_THRESHOLD) {
        if (!bestYSnap || diffY < Math.abs(mousePos.y - bestYSnap.y)) {
          bestYSnap = { y: point.y, points: [point] };
        } else if (bestYSnap && Math.abs(point.y - bestYSnap.y) < 1) {
          bestYSnap.points.push(point);
        }
      }
    });

    // Check for vertical alignment (same X)
    keyPoints.forEach(point => {
      const diffX = Math.abs(mousePos.x - point.x);
      if (diffX < SNAP_THRESHOLD) {
        if (!bestXSnap || diffX < Math.abs(mousePos.x - bestXSnap.x)) {
          bestXSnap = { x: point.x, points: [point] };
        } else if (bestXSnap && Math.abs(point.x - bestXSnap.x) < 1) {
          bestXSnap.points.push(point);
        }
      }
    });

    // Apply snapping and create guides
    if (bestXSnap) {
      snappedPos.x = bestXSnap.x;
      guides.push({ type: 'vertical', position: bestXSnap.x });
      snaps.push(...bestXSnap.points);
    }
    if (bestYSnap) {
      snappedPos.y = bestYSnap.y;
      guides.push({ type: 'horizontal', position: bestYSnap.y });
      snaps.push(...bestYSnap.points);
    }

    return { snappedPos, guides, snaps };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // If middle button, allow canvas panning (don't start drawing)
    if (e.button === 1) {
      return;
    }

    // If space is pressed, allow panning regardless of tool
    if (spacePressed) {
      return;
    }

    // Check if click is on the SVG background (not on any element)
    if (e.target === e.currentTarget) {
      if (currentTool === 'select') {
        // Deselect when clicking on background in select mode (only if not using Ctrl)
        if (!ctrlPressed) {
          useSelectionStore.getState().clearSelection();
        }
        return;
      }
      if (currentTool === 'eraser') {
        // Let the event propagate to parent for panning
        return;
      }
    } else if (currentTool === 'select' || currentTool === 'eraser') {
      // Clicking on an element in select/eraser mode - let element handle it
      return;
    }

    e.stopPropagation();
    const svgPoint = screenToSVG(e.clientX, e.clientY);
    const gridSnapped = snapToGrid(svgPoint.x, svgPoint.y);

    // Apply smart guide snapping
    const { snappedPos } = detectGuidesAtPosition(gridSnapped);
    const snapped = snappedPos;

    if (currentTool === 'text') {
      setTextInputPosition(snapped);
      setTextInputValue('');
      return;
    }

    if (currentTool === 'pen') {
      if (ctrlPressed) {
        // Ctrl mode: click-to-add-point mode
        if (!penCtrlMode) {
          // Start Ctrl mode
          setIsPenDrawing(false); // Clear freehand mode state
          setPenCtrlMode(true);
          setPenPoints([snapped]);
          setPenSnapPoint(null);
        } else {
          // Add point with snap or angle snap
          let pointToAdd: Point;
          if (penSnapPoint) {
            // Use exact snap point if close to existing point
            pointToAdd = penSnapPoint;
          } else {
            // Otherwise use angle snap
            const lastPoint = penPoints[penPoints.length - 1];
            pointToAdd = snapToAngle(lastPoint, snapped);
          }
          setPenPoints([...penPoints, pointToAdd]);
        }
      } else {
        // Freehand mode: only start drawing (will add points in mouse move)
        setPenCtrlMode(false); // Clear Ctrl mode state
        setPenSnapPoint(null);
        setIsPenDrawing(true);
        setPenPoints([snapped]);
      }
      return;
    }

    if (currentTool === 'line') {
      // Ctrl key only activates continuous mode when it's not already active via checkbox
      const effectiveContinuousMode = continuousMode || ctrlPressed;

      if (!isCurrentlyDrawing) {
        const startPoint = effectiveContinuousMode && lastLineEndPoint ? lastLineEndPoint : snapped;
        setTempStart(startPoint);
        setIsCurrentlyDrawing(true);
      } else {
        if (tempStart) {
          const endPoint = tempEnd || snapped;
          const orthoSnapped = snapToOrtho(tempStart, endPoint);

          // px → mm 변환
          addElement({
            id: `line-${Date.now()}`,
            type: 'line',
            startX: pxToMm(tempStart.x),
            startY: pxToMm(tempStart.y),
            endX: pxToMm(orthoSnapped.x),
            endY: pxToMm(orthoSnapped.y),
            color,
            thickness,
            lineStyle,
          });

          if (effectiveContinuousMode) {
            setTempStart(orthoSnapped);
            setLastLineEndPoint(orthoSnapped);
            setTempEnd(null);
          } else {
            setIsCurrentlyDrawing(false);
            setTempStart(null);
            setTempEnd(null);
            setLastLineEndPoint(null);
          }
        }
      }
    } else if (currentTool === 'rectangle') {
      if (!isCurrentlyDrawing) {
        // Start drawing rectangle (drag mode)
        setTempStart(snapped);
        setIsCurrentlyDrawing(true);
      }
      // Drag mode: mouseUp will create the rectangle
    } else if (currentTool === 'circle') {
      if (!isCurrentlyDrawing) {
        // Start drawing circle (drag mode)
        setTempStart(snapped);
        setIsCurrentlyDrawing(true);
      }
      // Drag mode: mouseUp will create the circle
    }
  };

  const handleMouseMove = (e: MouseEvent | React.MouseEvent<SVGSVGElement>) => {
    const svgPoint = screenToSVG(e.clientX, e.clientY);
    const gridSnapped = snapToGrid(svgPoint.x, svgPoint.y);

    // Always update mouse position for guide display
    setMousePosition(gridSnapped);

    // Handle pen drawing (freehand mode only - Ctrl mode handled in handleMouseDown)
    if (isPenDrawing && currentTool === 'pen' && !ctrlPressed) {
      // Freehand mode: add points smoothly while dragging
      if (penPoints.length === 0 ||
          Math.hypot(gridSnapped.x - penPoints[penPoints.length - 1].x,
                     gridSnapped.y - penPoints[penPoints.length - 1].y) > 3) {
        setPenPoints([...penPoints, gridSnapped]);
      }
      return;
    }

    // Handle element resizing in select mode
    if (isResizing && resizeStart && resizeHandle && selectedElementId) {
      const element = resizeStart.element;
      const minSizePx = (100 / (realWidth || (canvasWidth / scale))) * canvasWidth; // 100mm minimum

      // OPTIMIZATION: Calculate new dimensions but store in local state only
      // Skip smart guides during resize for performance
      // const { snappedPos, guides, snaps } = detectGuidesAtPosition(gridSnapped);
      // setGuideLines(guides);
      // setSnapPoints(snaps);

      if (element.type === 'rectangle') {
        const rotation = element.rotation || 0;
        const rotationRad = (rotation * Math.PI) / 180;

        // Convert resizeStart mm→px for calculations
        const startWidthPx = mmToPx(resizeStart.width);
        const startHeightPx = mmToPx(resizeStart.height);
        const startXPx = mmToPx(resizeStart.x);
        const startYPx = mmToPx(resizeStart.y);

        // Mouse delta in world coordinates (already px)
        const deltaX = gridSnapped.x - resizeStart.mouseX;
        const deltaY = gridSnapped.y - resizeStart.mouseY;

        // Inverse rotate mouse delta to get logical delta
        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);
        const logicalDeltaX = deltaX * cos + deltaY * sin;
        const logicalDeltaY = -deltaX * sin + deltaY * cos;

        let newWidth = startWidthPx;
        let newHeight = startHeightPx;

        // Apply resize based on handle
        switch (resizeHandle) {
          case 'e':
          case 'w':
            newWidth = Math.max(minSizePx, startWidthPx + (resizeHandle === 'e' ? logicalDeltaX : -logicalDeltaX));
            break;
          case 's':
          case 'n':
            newHeight = Math.max(minSizePx, startHeightPx + (resizeHandle === 's' ? logicalDeltaY : -logicalDeltaY));
            break;
          case 'se':
          case 'sw':
          case 'ne':
          case 'nw':
            newWidth = Math.max(minSizePx, startWidthPx + (resizeHandle.includes('e') ? logicalDeltaX : -logicalDeltaX));
            newHeight = Math.max(minSizePx, startHeightPx + (resizeHandle.includes('s') ? logicalDeltaY : -logicalDeltaY));
            break;
        }

        // Opposite anchor point in logical coordinates (relative to original center)
        let anchorLogicalX = 0, anchorLogicalY = 0;
        switch (resizeHandle) {
          case 'e': anchorLogicalX = -startWidthPx / 2; break;
          case 'w': anchorLogicalX = startWidthPx / 2; break;
          case 's': anchorLogicalY = -startHeightPx / 2; break;
          case 'n': anchorLogicalY = startHeightPx / 2; break;
          case 'se': anchorLogicalX = -startWidthPx / 2; anchorLogicalY = -startHeightPx / 2; break;
          case 'sw': anchorLogicalX = startWidthPx / 2; anchorLogicalY = -startHeightPx / 2; break;
          case 'ne': anchorLogicalX = -startWidthPx / 2; anchorLogicalY = startHeightPx / 2; break;
          case 'nw': anchorLogicalX = startWidthPx / 2; anchorLogicalY = startHeightPx / 2; break;
        }

        // Transform anchor to world coordinates
        const centerX = startXPx + startWidthPx / 2;
        const centerY = startYPx + startHeightPx / 2;
        const anchorWorldX = centerX + (anchorLogicalX * cos - anchorLogicalY * sin);
        const anchorWorldY = centerY + (anchorLogicalX * sin + anchorLogicalY * cos);

        // New anchor in logical coordinates (relative to new center)
        let newAnchorLogicalX = 0, newAnchorLogicalY = 0;
        switch (resizeHandle) {
          case 'e': newAnchorLogicalX = -newWidth / 2; break;
          case 'w': newAnchorLogicalX = newWidth / 2; break;
          case 's': newAnchorLogicalY = -newHeight / 2; break;
          case 'n': newAnchorLogicalY = newHeight / 2; break;
          case 'se': newAnchorLogicalX = -newWidth / 2; newAnchorLogicalY = -newHeight / 2; break;
          case 'sw': newAnchorLogicalX = newWidth / 2; newAnchorLogicalY = -newHeight / 2; break;
          case 'ne': newAnchorLogicalX = -newWidth / 2; newAnchorLogicalY = newHeight / 2; break;
          case 'nw': newAnchorLogicalX = newWidth / 2; newAnchorLogicalY = newHeight / 2; break;
        }

        // Calculate new center position that keeps anchor at same world position
        const newCenterX = anchorWorldX - (newAnchorLogicalX * cos - newAnchorLogicalY * sin);
        const newCenterY = anchorWorldY - (newAnchorLogicalX * sin + newAnchorLogicalY * cos);

        // Convert center to top-left position (still px)
        const newX = newCenterX - newWidth / 2;
        const newY = newCenterY - newHeight / 2;

        updateElement(selectedElementId, {
          x: pxToMm(newX),
          y: pxToMm(newY),
          width: pxToMm(newWidth),
          height: pxToMm(newHeight),
        });
      } else if (element.type === 'circle') {
        const rotation = element.rotation || 0;
        const rotationRad = (rotation * Math.PI) / 180;

        // Convert resizeStart mm→px for calculations
        const startRxPx = mmToPx(resizeStart.rx);
        const startRyPx = mmToPx(resizeStart.ry);
        const startCxPx = mmToPx(resizeStart.cx);
        const startCyPx = mmToPx(resizeStart.cy);

        // Mouse delta in world coordinates (already px)
        const deltaX = gridSnapped.x - resizeStart.mouseX;
        const deltaY = gridSnapped.y - resizeStart.mouseY;

        // Inverse rotate mouse delta to get logical delta
        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);
        const logicalDeltaX = deltaX * cos + deltaY * sin;
        const logicalDeltaY = -deltaX * sin + deltaY * cos;

        // Calculate original width/height for easier calculation
        const originalWidth = startRxPx * 2;
        const originalHeight = startRyPx * 2;
        let newWidth = originalWidth;
        let newHeight = originalHeight;

        // Apply resize based on handle
        switch (resizeHandle) {
          case 'e':
          case 'w':
            newWidth = Math.max(minSizePx, originalWidth + (resizeHandle === 'e' ? logicalDeltaX : -logicalDeltaX));
            break;
          case 's':
          case 'n':
            newHeight = Math.max(minSizePx, originalHeight + (resizeHandle === 's' ? logicalDeltaY : -logicalDeltaY));
            break;
          case 'se':
          case 'sw':
          case 'ne':
          case 'nw':
            newWidth = Math.max(minSizePx, originalWidth + (resizeHandle.includes('e') ? logicalDeltaX : -logicalDeltaX));
            newHeight = Math.max(minSizePx, originalHeight + (resizeHandle.includes('s') ? logicalDeltaY : -logicalDeltaY));
            break;
        }

        const newRx = newWidth / 2;
        const newRy = newHeight / 2;

        // Opposite anchor point in logical coordinates
        let anchorLogicalX = 0, anchorLogicalY = 0;
        switch (resizeHandle) {
          case 'e': anchorLogicalX = -originalWidth / 2; break;
          case 'w': anchorLogicalX = originalWidth / 2; break;
          case 's': anchorLogicalY = -originalHeight / 2; break;
          case 'n': anchorLogicalY = originalHeight / 2; break;
          case 'se': anchorLogicalX = -originalWidth / 2; anchorLogicalY = -originalHeight / 2; break;
          case 'sw': anchorLogicalX = originalWidth / 2; anchorLogicalY = -originalHeight / 2; break;
          case 'ne': anchorLogicalX = -originalWidth / 2; anchorLogicalY = originalHeight / 2; break;
          case 'nw': anchorLogicalX = originalWidth / 2; anchorLogicalY = originalHeight / 2; break;
        }

        // Transform anchor to world coordinates
        const anchorWorldX = startCxPx + (anchorLogicalX * cos - anchorLogicalY * sin);
        const anchorWorldY = startCyPx + (anchorLogicalX * sin + anchorLogicalY * cos);

        // New anchor in logical coordinates
        let newAnchorLogicalX = 0, newAnchorLogicalY = 0;
        switch (resizeHandle) {
          case 'e': newAnchorLogicalX = -newWidth / 2; break;
          case 'w': newAnchorLogicalX = newWidth / 2; break;
          case 's': newAnchorLogicalY = -newHeight / 2; break;
          case 'n': newAnchorLogicalY = newHeight / 2; break;
          case 'se': newAnchorLogicalX = -newWidth / 2; newAnchorLogicalY = -newHeight / 2; break;
          case 'sw': newAnchorLogicalX = newWidth / 2; newAnchorLogicalY = -newHeight / 2; break;
          case 'ne': newAnchorLogicalX = -newWidth / 2; newAnchorLogicalY = newHeight / 2; break;
          case 'nw': newAnchorLogicalX = newWidth / 2; newAnchorLogicalY = newHeight / 2; break;
        }

        // Calculate new center position (still px)
        const newCx = anchorWorldX - (newAnchorLogicalX * cos - newAnchorLogicalY * sin);
        const newCy = anchorWorldY - (newAnchorLogicalX * sin + newAnchorLogicalY * cos);

        updateElement(selectedElementId, {
          cx: pxToMm(newCx),
          cy: pxToMm(newCy),
          rx: pxToMm(newRx),
          ry: pxToMm(newRy),
        });
      } else if (element.type === 'line') {
        if (resizeHandle === 'start') {
          updateElement(selectedElementId, {
            startX: pxToMm(snappedPos.x),
            startY: pxToMm(snappedPos.y),
          });
        } else if (resizeHandle === 'end') {
          updateElement(selectedElementId, {
            endX: pxToMm(snappedPos.x),
            endY: pxToMm(snappedPos.y),
          });
        }
      }
      return;
    }

    // Handle element dragging in select mode (가구처럼 간단하게)
    if (isDraggingElement && selectedElementId) {
      // 현재 마우스 위치 (mm)
      const mouseXmm = pxToMm(svgPoint.x);
      const mouseYmm = pxToMm(svgPoint.y);

      // 새 위치 = 마우스 + dragOffset
      const newX = mouseXmm + dragOffset.x;
      const newY = mouseYmm + dragOffset.y;

      // Get current element from store
      const element = elements.find(el => el.id === selectedElementId);
      if (!element) return;

      // 바로 업데이트 (throttle 없이)
      if (element.type === 'rectangle') {
        updateElement(selectedElementId, { x: newX, y: newY });
      } else if (element.type === 'circle') {
        updateElement(selectedElementId, { cx: newX, cy: newY });
      } else if (element.type === 'line') {
        const dx = newX - element.startX;
        const dy = newY - element.startY;
        updateElement(selectedElementId, {
          startX: element.startX + dx,
          startY: element.startY + dy,
          endX: element.endX + dx,
          endY: element.endY + dy,
        });
      } else if (element.type === 'path') {
        const dx = newX - element.points[0].x;
        const dy = newY - element.points[0].y;
        updateElement(selectedElementId, {
          points: element.points.map((pt: Point) => ({ x: pt.x + dx, y: pt.y + dy })),
        });
      } else if (element.type === 'text') {
        updateElement(selectedElementId, { x: newX, y: newY });
      }

      return;
    }

    // Show guides for line and rectangle tools (even before first click)
    // SKIP Smart Guides during drag/resize for performance
    if (!isDraggingElement && !isResizing) {
      if (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle') {
        if (!isCurrentlyDrawing) {
          // Before first click - show guides at mouse position
          const { snappedPos, guides, snaps } = detectGuidesAtPosition(gridSnapped);
          setGuideLines(guides);
          setSnapPoints(snaps);
        } else if (tempStart) {
          // After first click - drawing in progress
          if (currentTool === 'line') {
            const orthoSnapped = snapToOrtho(tempStart, gridSnapped);
            const { snappedPos, guides, snaps } = detectGuidesAtPosition(orthoSnapped);
            setTempEnd(snappedPos);
            setGuideLines(guides);
            setSnapPoints(snaps);
          } else if (currentTool === 'rectangle' || currentTool === 'circle') {
            const { snappedPos, guides, snaps } = detectGuidesAtPosition(gridSnapped);
            setTempEnd(snappedPos);
            setGuideLines(guides);
            setSnapPoints(snaps);
          }
        }
      } else {
        setGuideLines([]);
        setSnapPoints([]);
      }
    }

    // Pen tool Ctrl mode: detect snap to existing points
    if (currentTool === 'pen' && penCtrlMode && penPoints.length > 0) {
      const snapThreshold = 15; // pixels
      let closestPoint: Point | null = null;
      let closestDistance = snapThreshold;

      // Check all existing pen points
      for (const point of penPoints) {
        const distance = Math.hypot(gridSnapped.x - point.x, gridSnapped.y - point.y);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPoint = point;
        }
      }

      setPenSnapPoint(closestPoint);
    } else {
      setPenSnapPoint(null);
    }
  };

  const handleMouseUp = (e: MouseEvent | React.MouseEvent<SVGSVGElement>) => {
    // Handle pen drawing completion (freehand mode only)
    if (isPenDrawing && currentTool === 'pen') {
      // Only create path if it has meaningful length and multiple points
      if (penPoints.length > 1) {
        const totalLength = penPoints.reduce((sum, pt, i) => {
          if (i === 0) return 0;
          const prev = penPoints[i - 1];
          return sum + Math.hypot(pt.x - prev.x, pt.y - prev.y);
        }, 0);

        if (totalLength > 10) { // Minimum 10 pixels to avoid accidental clicks
          // px → mm 변환
          addElement({
            id: `path-${Date.now()}`,
            type: 'path',
            points: penPoints.map(pt => ({ x: pxToMm(pt.x), y: pxToMm(pt.y) })),
            color,
            thickness,
            lineStyle,
          });
        }
      }

      // Always reset pen drawing state
      setIsPenDrawing(false);
      setPenPoints([]);
      return;
    }

    // Handle rectangle/circle drag completion
    if (isCurrentlyDrawing && tempStart && tempEnd) {
      if (currentTool === 'rectangle') {
        const x = Math.min(tempStart.x, tempEnd.x);
        const y = Math.min(tempStart.y, tempEnd.y);
        const width = Math.abs(tempEnd.x - tempStart.x);
        const height = Math.abs(tempEnd.y - tempStart.y);

        if (width > 5 && height > 5) {
          // px → mm 변환
          addElement({
            id: `rect-${Date.now()}`,
            type: 'rectangle',
            x: pxToMm(x),
            y: pxToMm(y),
            width: pxToMm(width),
            height: pxToMm(height),
            strokeColor: color,
            fillColor,
            thickness,
            opacity: parseFloat(fillColor.split(',')[3]?.replace(')', '') || '0.3'),
            lineStyle,
          });
        }

        setIsCurrentlyDrawing(false);
        setTempStart(null);
        setTempEnd(null);
        setGuideLines([]);
        setSnapPoints([]);
      } else if (currentTool === 'circle') {
        const rx = Math.abs(tempEnd.x - tempStart.x) / 2;
        const ry = Math.abs(tempEnd.y - tempStart.y) / 2;
        const cx = (tempStart.x + tempEnd.x) / 2;
        const cy = (tempStart.y + tempEnd.y) / 2;

        if (rx > 5 && ry > 5) {
          // px → mm 변환
          addElement({
            id: `circle-${Date.now()}`,
            type: 'circle',
            cx: pxToMm(cx),
            cy: pxToMm(cy),
            rx: pxToMm(rx),
            ry: pxToMm(ry),
            strokeColor: color,
            fillColor,
            thickness,
            opacity: parseFloat(fillColor.split(',')[3]?.replace(')', '') || '0.3'),
            lineStyle,
          });
        }

        setIsCurrentlyDrawing(false);
        setTempStart(null);
        setTempEnd(null);
        setGuideLines([]);
        setSnapPoints([]);
      }
    }

    // End element resizing
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
      setGuideLines([]);
      setSnapPoints([]);
      saveCurrentWork();
    }

    // End element dragging
    if (isDraggingElement) {
      setIsDraggingElement(false);
      saveCurrentWork();
    }
  };

  // Update refs with latest functions
  handleMouseMoveRef.current = handleMouseMove;
  handleMouseUpRef.current = handleMouseUp;

  // Add window-level event listeners (like FurnitureItem pattern)
  // This ensures drag continues even when mouse leaves SVG area
  useEffect(() => {
    // Don't add listeners if in calibration mode
    if (calibrationMode) return;

    // Only add listeners when actively dragging, resizing, or drawing
    if (!isDraggingElement && !isResizing && !isCurrentlyDrawing && !isPenDrawing) return;

    let rafId: number | null = null;

    const handleMove = (e: MouseEvent) => {
      if (rafId) return; // Skip if already scheduled
      rafId = requestAnimationFrame(() => {
        handleMouseMoveRef.current?.(e);
        rafId = null;
      });
    };

    const handleUp = (e: MouseEvent) => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      handleMouseUpRef.current?.(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault(); // Prevent background panning

        if (rafId) return; // Skip if already scheduled

        const touch = e.touches[0];
        rafId = requestAnimationFrame(() => {
          const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            bubbles: true,
          });
          handleMouseMoveRef.current?.(mouseEvent);
          rafId = null;
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault(); // Prevent background panning
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      const mouseEvent = new MouseEvent('mouseup', {
        bubbles: true,
      });
      handleMouseUpRef.current?.(mouseEvent);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    isDraggingElement,
    isResizing,
    isCurrentlyDrawing,
    isPenDrawing,
    calibrationMode,
  ]);

  const handleTextSubmit = () => {
    if (textInputPosition && textInputValue.trim()) {
      if (editingTextId) {
        // Update existing text
        updateElement(editingTextId, {
          text: textInputValue,
        });
      } else {
        // Create new text (px → mm 변환)
        addElement({
          id: `text-${Date.now()}`,
          type: 'text',
          x: pxToMm(textInputPosition.x),
          y: pxToMm(textInputPosition.y),
          text: textInputValue,
          fontSize,
          color,
          fontFamily,
        });
      }
    }
    setTextInputPosition(null);
    setTextInputValue('');
    setEditingTextId(null);
  };

  const getStrokeDashArray = (style: string) => {
    switch (style) {
      case 'dashed':
        return '10,5';
      case 'dotted':
        return '2,3';
      default:
        return 'none';
    }
  };

  const renderGrid = () => {
    if (!showGrid) return null;

    const lines = [];
    const smallGridPx = gridSize * scale;
    const largeGridPx = majorGridSize * scale;

    for (let x = 0; x <= canvasWidth; x += smallGridPx) {
      lines.push(
        <line
          key={`vgrid-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasHeight}
          stroke="#eee"
          strokeWidth="0.5"
        />
      );
    }
    for (let y = 0; y <= canvasHeight; y += smallGridPx) {
      lines.push(
        <line
          key={`hgrid-${y}`}
          x1={0}
          y1={y}
          x2={canvasWidth}
          y2={y}
          stroke="#eee"
          strokeWidth="0.5"
        />
      );
    }

    for (let x = 0; x <= canvasWidth; x += largeGridPx) {
      lines.push(
        <line
          key={`vgrid-major-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasHeight}
          stroke="#ddd"
          strokeWidth="1"
        />
      );
    }
    for (let y = 0; y <= canvasHeight; y += largeGridPx) {
      lines.push(
        <line
          key={`hgrid-major-${y}`}
          x1={0}
          y1={y}
          x2={canvasWidth}
          y2={y}
          stroke="#ddd"
          strokeWidth="1"
        />
      );
    }

    return lines;
  };

  const renderGridLabels = () => {
    if (!showGrid || !showGridLabels) return null;

    const labels = [];
    const largeGridPx = majorGridSize * scale;
    const largeGridMm = majorGridSize; // in mm

    // Calculate actual canvas dimensions
    let actualWidth: number, actualHeight: number;
    if (calibratedScale) {
      // Use calibrated scale: px / (px/mm) = mm
      actualWidth = canvasWidth / calibratedScale;
      actualHeight = canvasHeight / calibratedScale;
    } else {
      // Use realWidth/realHeight if provided, otherwise fallback to scale calculation
      actualWidth = realWidth || (canvasWidth / scale);
      actualHeight = realHeight || (canvasHeight / scale);
    }

    // Grid size info (top-left corner)
    const smallGridCm = gridSize / 10;
    const largeGridCm = majorGridSize / 10;
    const totalWidthCm = actualWidth / 10;
    const totalHeightCm = actualHeight / 10;
    const widthText = totalWidthCm >= 100 ? `${(totalWidthCm / 100).toFixed(1)}m` : `${totalWidthCm.toFixed(0)}cm`;
    const heightText = totalHeightCm >= 100 ? `${(totalHeightCm / 100).toFixed(1)}m` : `${totalHeightCm.toFixed(0)}cm`;

    labels.push(
      <g key="grid-info">
        <rect
          x={5}
          y={-66}
          width={150}
          height={60}
          fill="rgba(255, 255, 255, 0.95)"
          stroke="#666"
          strokeWidth="1"
          rx="4"
        />
        <text
          x={12}
          y={-51}
          fontSize="12"
          fill="#000"
          fontWeight="bold"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          도면: {widthText} × {heightText}
        </text>
        <text
          x={12}
          y={-36}
          fontSize="10"
          fill="#000"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          격자: {smallGridCm >= 1 ? `${smallGridCm.toFixed(0)}cm` : `${gridSize}mm`}
        </text>
        <text
          x={12}
          y={-21}
          fontSize="10"
          fill="#000"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          주격자: {largeGridCm >= 100 ? `${(largeGridCm / 100).toFixed(1)}m` : `${largeGridCm.toFixed(0)}cm`}
        </text>
      </g>
    );

    // Horizontal labels (top edge) - only show first, middle, and last
    const horizontalPositions = [];
    for (let x = largeGridPx; x <= canvasWidth; x += largeGridPx) {
      horizontalPositions.push(x);
    }

    const showHorizontalIndices = new Set([0, Math.floor(horizontalPositions.length / 2), horizontalPositions.length - 1]);
    horizontalPositions.forEach((x, index) => {
      if (!showHorizontalIndices.has(index)) return;

      const distanceMm = (x / canvasWidth) * actualWidth;
      const distanceCm = distanceMm / 10;
      labels.push(
        <text
          key={`h-label-${x}`}
          x={x}
          y={-5}
          fontSize="11"
          fill={isDarkMode ? "#fff" : "#000"}
          textAnchor="middle"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {distanceCm >= 100 ? `${(distanceCm / 100).toFixed(1)}m` : `${distanceCm.toFixed(0)}cm`}
        </text>
      );
    });

    // Vertical labels (left edge) - only show first, middle, and last
    const verticalPositions = [];
    for (let y = largeGridPx; y <= canvasHeight; y += largeGridPx) {
      verticalPositions.push(y);
    }

    const showVerticalIndices = new Set([0, Math.floor(verticalPositions.length / 2), verticalPositions.length - 1]);
    verticalPositions.forEach((y, index) => {
      if (!showVerticalIndices.has(index)) return;

      const distanceMm = (y / canvasHeight) * actualHeight;
      const distanceCm = distanceMm / 10;
      labels.push(
        <text
          key={`v-label-${y}`}
          x={-5}
          y={y}
          fontSize="11"
          fill={isDarkMode ? "#fff" : "#000"}
          textAnchor="end"
          dominantBaseline="middle"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {distanceCm >= 100 ? `${(distanceCm / 100).toFixed(1)}m` : `${distanceCm.toFixed(0)}cm`}
        </text>
      );
    });

    return labels;
  };

  const renderDimensionLabel = (element: DrawingElement) => {
    if (!showDimensionLabels) return null;

    // Elements are now stored in mm, so we directly use their dimensions
    if (element.type === 'rectangle') {
      // Element dimensions are already in mm
      const widthMm = element.width;
      const heightMm = element.height;
      const widthCm = widthMm / 10;
      const heightCm = heightMm / 10;

      const rotation = element.rotation || 0;

      // Convert mm→px for rendering
      const xPx = mmToPx(element.x);
      const yPx = mmToPx(element.y);
      const widthPx = mmToPx(element.width);
      const heightPx = mmToPx(element.height);

      const centerX = xPx + widthPx / 2;
      const centerY = yPx + heightPx / 2;

      // Calculate rotated label positions (in px)
      const rotationRad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rotationRad);
      const sin = Math.sin(rotationRad);

      // Width label position: top center in local coords (0, -height/2 - 15)
      const widthLocalX = 0;
      const widthLocalY = -heightPx / 2 - 15;
      const widthWorldX = centerX + (widthLocalX * cos - widthLocalY * sin);
      const widthWorldY = centerY + (widthLocalX * sin + widthLocalY * cos);

      // Height label position: left center in local coords (-width/2 - 15, 0)
      const heightLocalX = -widthPx / 2 - 15;
      const heightLocalY = 0;
      const heightWorldX = centerX + (heightLocalX * cos - heightLocalY * sin);
      const heightWorldY = centerY + (heightLocalX * sin + heightLocalY * cos);

      return (
        <g
          key={`dim-${element.id}`}
          style={{ pointerEvents: 'none' }}
        >
          {/* Width label */}
          <text
            x={widthWorldX}
            y={widthWorldY}
            fontSize="12"
            fill="#000"
            fontWeight="bold"
            textAnchor="middle"
            stroke="white"
            strokeWidth="3"
            paintOrder="stroke"
            style={{ userSelect: 'none' }}
          >
            {widthCm >= 100 ? `${(widthCm / 100).toFixed(2)}m` : `${widthCm.toFixed(1)}cm`}
          </text>
          {/* Height label */}
          <text
            x={heightWorldX}
            y={heightWorldY}
            fontSize="12"
            fill="#000"
            fontWeight="bold"
            textAnchor="end"
            dominantBaseline="middle"
            stroke="white"
            strokeWidth="3"
            paintOrder="stroke"
            style={{ userSelect: 'none' }}
          >
            {heightCm >= 100 ? `${(heightCm / 100).toFixed(2)}m` : `${heightCm.toFixed(1)}cm`}
          </text>
        </g>
      );
    } else if (element.type === 'circle') {
      // Element dimensions are already in mm
      const widthMm = element.rx * 2;
      const heightMm = element.ry * 2;
      const widthCm = widthMm / 10;
      const heightCm = heightMm / 10;

      const rotation = element.rotation || 0;

      // Convert mm→px for rendering
      const cxPx = mmToPx(element.cx);
      const cyPx = mmToPx(element.cy);
      const rxPx = mmToPx(element.rx);
      const ryPx = mmToPx(element.ry);

      const centerX = cxPx;
      const centerY = cyPx;

      // Calculate rotated label positions (in px)
      const rotationRad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rotationRad);
      const sin = Math.sin(rotationRad);

      // Width label position: top center in local coords (0, -ry - 15)
      const widthLocalX = 0;
      const widthLocalY = -ryPx - 15;
      const widthWorldX = centerX + (widthLocalX * cos - widthLocalY * sin);
      const widthWorldY = centerY + (widthLocalX * sin + widthLocalY * cos);

      // Height label position: left center in local coords (-rx - 15, 0)
      const heightLocalX = -rxPx - 15;
      const heightLocalY = 0;
      const heightWorldX = centerX + (heightLocalX * cos - heightLocalY * sin);
      const heightWorldY = centerY + (heightLocalX * sin + heightLocalY * cos);

      return (
        <g
          key={`dim-${element.id}`}
          style={{ pointerEvents: 'none' }}
        >
          {/* Width label */}
          <text
            x={widthWorldX}
            y={widthWorldY}
            fontSize="12"
            fill="#000"
            fontWeight="bold"
            textAnchor="middle"
            stroke="white"
            strokeWidth="3"
            paintOrder="stroke"
            style={{ userSelect: 'none' }}
          >
            {widthCm >= 100 ? `${(widthCm / 100).toFixed(2)}m` : `${widthCm.toFixed(1)}cm`}
          </text>
          {/* Height label */}
          <text
            x={heightWorldX}
            y={heightWorldY}
            fontSize="12"
            fill="#000"
            fontWeight="bold"
            textAnchor="end"
            dominantBaseline="middle"
            stroke="white"
            strokeWidth="3"
            paintOrder="stroke"
            style={{ userSelect: 'none' }}
          >
            {heightCm >= 100 ? `${(heightCm / 100).toFixed(2)}m` : `${heightCm.toFixed(1)}cm`}
          </text>
        </g>
      );
    } else if (element.type === 'line') {
      const dx = element.endX - element.startX;
      const dy = element.endY - element.startY;
      const lengthPx = Math.sqrt(dx * dx + dy * dy);

      let lengthMm: number;
      if (calibratedScale) {
        // Use calibrated scale: px / (px/mm) = mm
        lengthMm = lengthPx / calibratedScale;
      } else {
        // Calculate actual mm distance using canvas diagonal
        const canvasDiagonal = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
        const actualDiagonal = Math.sqrt(actualWidth * actualWidth + actualHeight * actualHeight);
        lengthMm = (lengthPx / canvasDiagonal) * actualDiagonal;
      }
      const lengthCm = lengthMm / 10;

      const midX = (element.startX + element.endX) / 2;
      const midY = (element.startY + element.endY) / 2;

      return (
        <text
          key={`dim-${element.id}`}
          x={midX}
          y={midY - 5}
          fontSize="12"
          fill="#000"
          fontWeight="bold"
          textAnchor="middle"
          stroke="white"
          strokeWidth="3"
          paintOrder="stroke"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {lengthCm >= 100 ? `${(lengthCm / 100).toFixed(2)}m` : `${lengthCm.toFixed(1)}cm`}
        </text>
      );
    }

    return null;
  };

  const renderResizeHandles = (element: DrawingElement) => {
    if (element.id !== selectedElementId || currentTool !== 'select') return null;

    const handles = [];
    const handleSize = 8;
    const rotation = element.rotation || 0;

    if (element.type === 'rectangle') {
      // Convert mm→px for rendering
      const xPx = mmToPx(element.x);
      const yPx = mmToPx(element.y);
      const widthPx = mmToPx(element.width);
      const heightPx = mmToPx(element.height);

      const centerX = xPx + widthPx / 2;
      const centerY = yPx + heightPx / 2;

      // 8 handles: n, ne, e, se, s, sw, w, nw
      const handlePositions = [
        { handle: 'n', x: centerX, y: yPx },
        { handle: 'ne', x: xPx + widthPx, y: yPx },
        { handle: 'e', x: xPx + widthPx, y: centerY },
        { handle: 'se', x: xPx + widthPx, y: yPx + heightPx },
        { handle: 's', x: centerX, y: yPx + heightPx },
        { handle: 'sw', x: xPx, y: yPx + heightPx },
        { handle: 'w', x: xPx, y: centerY },
        { handle: 'nw', x: xPx, y: yPx },
      ];

      handlePositions.forEach(({ handle, x, y }) => {
        handles.push(
          <rect
            key={`handle-${element.id}-${handle}`}
            x={x - handleSize / 2}
            y={y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke="#3b82f6"
            strokeWidth="2"
            transform={rotation ? `rotate(${rotation} ${centerX} ${centerY})` : undefined}
            onMouseDown={(e) => {
              e.stopPropagation();
              const svgPoint = screenToSVG(e.clientX, e.clientY);

              setIsResizing(true);
              setResizeHandle(handle);
              setResizeStart({
                element: { ...element },
                width: element.width,
                height: element.height,
                x: element.x,
                y: element.y,
                mouseX: svgPoint.x,
                mouseY: svgPoint.y,
              });
            }}
            onTouchStart={(e) => {
              if (e.touches.length !== 1) return;
              e.stopPropagation();
              e.preventDefault();

              const touch = e.touches[0];
              const svgPoint = screenToSVG(touch.clientX, touch.clientY);

              setIsResizing(true);
              setResizeHandle(handle);
              setResizeStart({
                element: { ...element },
                width: element.width,
                height: element.height,
                x: element.x,
                y: element.y,
                mouseX: svgPoint.x,
                mouseY: svgPoint.y,
              });
            }}
            style={{
              cursor: getResizeCursor(handle, rotation),
              pointerEvents: 'auto',
            }}
          />
        );
      });
    } else if (element.type === 'circle') {
      // Convert mm→px for rendering
      const cxPx = mmToPx(element.cx);
      const cyPx = mmToPx(element.cy);
      const rxPx = mmToPx(element.rx);
      const ryPx = mmToPx(element.ry);

      const centerX = cxPx;
      const centerY = cyPx;

      // 8 handles: n, ne, e, se, s, sw, w, nw
      const handlePositions = [
        { handle: 'n', x: centerX, y: centerY - ryPx },
        { handle: 'ne', x: centerX + rxPx, y: centerY - ryPx },
        { handle: 'e', x: centerX + rxPx, y: centerY },
        { handle: 'se', x: centerX + rxPx, y: centerY + ryPx },
        { handle: 's', x: centerX, y: centerY + ryPx },
        { handle: 'sw', x: centerX - rxPx, y: centerY + ryPx },
        { handle: 'w', x: centerX - rxPx, y: centerY },
        { handle: 'nw', x: centerX - rxPx, y: centerY - ryPx },
      ];

      handlePositions.forEach(({ handle, x, y }) => {
        handles.push(
          <rect
            key={`handle-${element.id}-${handle}`}
            x={x - handleSize / 2}
            y={y - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke="#3b82f6"
            strokeWidth="2"
            transform={rotation ? `rotate(${rotation} ${centerX} ${centerY})` : undefined}
            onMouseDown={(e) => {
              e.stopPropagation();
              const svgPoint = screenToSVG(e.clientX, e.clientY);

              setIsResizing(true);
              setResizeHandle(handle);
              setResizeStart({
                element: { ...element },
                cx: centerX,
                cy: centerY,
                rx: element.rx,
                ry: element.ry,
                mouseX: svgPoint.x,
                mouseY: svgPoint.y,
              });
            }}
            onTouchStart={(e) => {
              if (e.touches.length !== 1) return;
              e.stopPropagation();
              e.preventDefault();

              const touch = e.touches[0];
              const svgPoint = screenToSVG(touch.clientX, touch.clientY);

              setIsResizing(true);
              setResizeHandle(handle);
              setResizeStart({
                element: { ...element },
                cx: centerX,
                cy: centerY,
                rx: element.rx,
                ry: element.ry,
                mouseX: svgPoint.x,
                mouseY: svgPoint.y,
              });
            }}
            style={{
              cursor: getResizeCursor(handle, rotation),
              pointerEvents: 'auto',
            }}
          />
        );
      });
    } else if (element.type === 'line') {
      // Convert mm→px for rendering
      const startXPx = mmToPx(element.startX);
      const startYPx = mmToPx(element.startY);
      const endXPx = mmToPx(element.endX);
      const endYPx = mmToPx(element.endY);

      // 2 handles: start and end
      const lineCenterX = (startXPx + endXPx) / 2;
      const lineCenterY = (startYPx + endYPx) / 2;

      // Calculate rotated handle positions
      let startHandleX = startXPx;
      let startHandleY = startYPx;
      let endHandleX = endXPx;
      let endHandleY = endYPx;

      if (rotation) {
        const rotationRad = (rotation * Math.PI) / 180;
        const cos = Math.cos(rotationRad);
        const sin = Math.sin(rotationRad);

        // Start handle
        const startLocalX = startXPx - lineCenterX;
        const startLocalY = startYPx - lineCenterY;
        startHandleX = lineCenterX + (startLocalX * cos - startLocalY * sin);
        startHandleY = lineCenterY + (startLocalX * sin + startLocalY * cos);

        // End handle
        const endLocalX = endXPx - lineCenterX;
        const endLocalY = endYPx - lineCenterY;
        endHandleX = lineCenterX + (endLocalX * cos - endLocalY * sin);
        endHandleY = lineCenterY + (endLocalX * sin + endLocalY * cos);
      }

      const handlePositions = [
        { handle: 'start', x: startHandleX, y: startHandleY },
        { handle: 'end', x: endHandleX, y: endHandleY },
      ];

      handlePositions.forEach(({ handle, x, y }) => {
        handles.push(
          <circle
            key={`handle-${element.id}-${handle}`}
            cx={x}
            cy={y}
            r={handleSize / 2}
            fill="white"
            stroke="#3b82f6"
            strokeWidth="2"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsResizing(true);
              setResizeHandle(handle);
              setResizeStart({
                element: { ...element },
              });
            }}
            onTouchStart={(e) => {
              if (e.touches.length !== 1) return;
              e.stopPropagation();
              e.preventDefault();

              setIsResizing(true);
              setResizeHandle(handle);
              setResizeStart({
                element: { ...element },
              });
            }}
            style={{
              cursor: 'move',
              pointerEvents: 'auto',
            }}
          />
        );
      });
    }

    return handles;
  };

  // Common touch handler for elements
  const createElementTouchHandler = (element: DrawingElement) => {
    return {
      onTouchStart: (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;

        const touch = e.touches[0];
        if (currentTool === 'select') {
          // Stop propagation to prevent background panning
          e.stopPropagation();

          toggleSelection(element.id, 'drawing', false); // No ctrl on touch

          // Start dragging (same as onMouseDown logic)
          const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0,
            bubbles: true,
          });
          const svgPoint = screenToSVG(mouseEvent.clientX, mouseEvent.clientY);
          const mouseXmm = pxToMm(svgPoint.x);
          const mouseYmm = pxToMm(svgPoint.y);

          // Calculate dragOffset
          let offsetX = 0, offsetY = 0;
          if (element.type === 'rectangle' || element.type === 'text') {
            offsetX = element.x - mouseXmm;
            offsetY = element.y - mouseYmm;
          } else if (element.type === 'circle') {
            offsetX = element.cx - mouseXmm;
            offsetY = element.cy - mouseYmm;
          } else if (element.type === 'line') {
            offsetX = element.startX - mouseXmm;
            offsetY = element.startY - mouseYmm;
          } else if (element.type === 'path') {
            offsetX = element.points[0].x - mouseXmm;
            offsetY = element.points[0].y - mouseYmm;
          }

          setDragOffset({ x: offsetX, y: offsetY });
          setIsDraggingElement(true);
        } else if (currentTool === 'eraser' && (eraserMode === 'universal' || eraserMode === 'shape')) {
          e.stopPropagation();
          deleteElement(element.id);
        }
      },
    };
  };

  const renderElement = (element: DrawingElement) => {
    const isSelected = isItemSelected(element.id, 'drawing');
    const layer = layerMap.get(element.layerId);
    const layerOpacity = (layer?.opacity ?? 100) / 100;

    switch (element.type) {
      case 'line': {
        // mm → px 변환
        const startXPx = mmToPx(element.startX);
        const startYPx = mmToPx(element.startY);
        const endXPx = mmToPx(element.endX);
        const endYPx = mmToPx(element.endY);

        const lineCenterX = (startXPx + endXPx) / 2;
        const lineCenterY = (startYPx + endYPx) / 2;
        return (
          <line
            key={element.id}
            x1={startXPx}
            y1={startYPx}
            x2={endXPx}
            y2={endYPx}
            stroke={element.color}
            strokeWidth={element.thickness}
            strokeDasharray={getStrokeDashArray(element.lineStyle)}
            strokeOpacity={layerOpacity}
            transform={element.rotation ? `rotate(${element.rotation} ${lineCenterX} ${lineCenterY})` : undefined}
            {...createElementTouchHandler(element)}
            onMouseDown={(e) => {
              if (currentTool === 'select') {
                e.stopPropagation();
                toggleSelection(element.id, 'drawing', e.ctrlKey || e.metaKey);
                const svgPoint = screenToSVG(e.clientX, e.clientY);
                const mouseXmm = pxToMm(svgPoint.x);
                const mouseYmm = pxToMm(svgPoint.y);

                // dragOffset = element 위치 - 마우스 위치 (가구처럼)
                let offsetX = 0, offsetY = 0;
                if (element.type === 'rectangle' || element.type === 'text') {
                  offsetX = element.x - mouseXmm;
                  offsetY = element.y - mouseYmm;
                } else if (element.type === 'circle') {
                  offsetX = element.cx - mouseXmm;
                  offsetY = element.cy - mouseYmm;
                } else if (element.type === 'line') {
                  offsetX = element.startX - mouseXmm;
                  offsetY = element.startY - mouseYmm;
                } else if (element.type === 'path') {
                  offsetX = element.points[0].x - mouseXmm;
                  offsetY = element.points[0].y - mouseYmm;
                }

                setDragOffset({ x: offsetX, y: offsetY });
                setIsDraggingElement(true);
              } else if (currentTool === 'eraser' && (eraserMode === 'universal' || eraserMode === 'shape')) {
                e.stopPropagation();
                deleteElement(element.id);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: currentTool === 'select' ? (isDraggingElement ? 'grabbing' : 'grab') : currentTool === 'eraser' ? 'not-allowed' : 'default',
              strokeWidth: isSelected ? element.thickness + 2 : element.thickness,
              pointerEvents: 'visibleStroke',
            }}
          />
        );
      }
      case 'rectangle': {
        // mm → px 변환
        const xPx = mmToPx(element.x);
        const yPx = mmToPx(element.y);
        const widthPx = mmToPx(element.width);
        const heightPx = mmToPx(element.height);

        return (
          <rect
            key={element.id}
            x={xPx}
            y={yPx}
            width={widthPx}
            height={heightPx}
            stroke={element.strokeColor}
            strokeWidth={element.thickness}
            strokeDasharray={getStrokeDashArray(element.lineStyle)}
            strokeOpacity={layerOpacity}
            fill={element.fillColor}
            fillOpacity={layerOpacity * element.opacity}
            transform={element.rotation ? `rotate(${element.rotation} ${xPx + widthPx / 2} ${yPx + heightPx / 2})` : undefined}
            {...createElementTouchHandler(element)}
            onMouseDown={(e) => {
              if (currentTool === 'select') {
                e.stopPropagation();
                toggleSelection(element.id, 'drawing', e.ctrlKey || e.metaKey);
                const svgPoint = screenToSVG(e.clientX, e.clientY);
                const mouseXmm = pxToMm(svgPoint.x);
                const mouseYmm = pxToMm(svgPoint.y);

                // dragOffset = element 위치 - 마우스 위치 (가구처럼)
                let offsetX = 0, offsetY = 0;
                if (element.type === 'rectangle' || element.type === 'text') {
                  offsetX = element.x - mouseXmm;
                  offsetY = element.y - mouseYmm;
                } else if (element.type === 'circle') {
                  offsetX = element.cx - mouseXmm;
                  offsetY = element.cy - mouseYmm;
                } else if (element.type === 'line') {
                  offsetX = element.startX - mouseXmm;
                  offsetY = element.startY - mouseYmm;
                } else if (element.type === 'path') {
                  offsetX = element.points[0].x - mouseXmm;
                  offsetY = element.points[0].y - mouseYmm;
                }

                setDragOffset({ x: offsetX, y: offsetY });
                setIsDraggingElement(true);
              } else if (currentTool === 'eraser' && (eraserMode === 'universal' || eraserMode === 'shape')) {
                e.stopPropagation();
                deleteElement(element.id);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: currentTool === 'select' ? (isDraggingElement ? 'grabbing' : 'grab') : currentTool === 'eraser' ? 'not-allowed' : 'default',
              strokeWidth: isSelected ? element.thickness + 2 : element.thickness,
              pointerEvents: 'auto',
            }}
          />
        );
      }
      case 'circle': {
        // mm → px 변환
        const cxPx = mmToPx(element.cx);
        const cyPx = mmToPx(element.cy);
        const rxPx = mmToPx(element.rx);
        const ryPx = mmToPx(element.ry);

        return (
          <ellipse
            key={element.id}
            cx={cxPx}
            cy={cyPx}
            rx={rxPx}
            ry={ryPx}
            stroke={element.strokeColor}
            strokeWidth={element.thickness}
            strokeDasharray={getStrokeDashArray(element.lineStyle)}
            strokeOpacity={layerOpacity}
            fill={element.fillColor}
            fillOpacity={layerOpacity * element.opacity}
            transform={element.rotation ? `rotate(${element.rotation} ${cxPx} ${cyPx})` : undefined}
            {...createElementTouchHandler(element)}
            onMouseDown={(e) => {
              if (currentTool === 'select') {
                e.stopPropagation();
                toggleSelection(element.id, 'drawing', e.ctrlKey || e.metaKey);
                const svgPoint = screenToSVG(e.clientX, e.clientY);
                const mouseXmm = pxToMm(svgPoint.x);
                const mouseYmm = pxToMm(svgPoint.y);

                // dragOffset = element 위치 - 마우스 위치 (가구처럼)
                let offsetX = 0, offsetY = 0;
                if (element.type === 'rectangle' || element.type === 'text') {
                  offsetX = element.x - mouseXmm;
                  offsetY = element.y - mouseYmm;
                } else if (element.type === 'circle') {
                  offsetX = element.cx - mouseXmm;
                  offsetY = element.cy - mouseYmm;
                } else if (element.type === 'line') {
                  offsetX = element.startX - mouseXmm;
                  offsetY = element.startY - mouseYmm;
                } else if (element.type === 'path') {
                  offsetX = element.points[0].x - mouseXmm;
                  offsetY = element.points[0].y - mouseYmm;
                }

                setDragOffset({ x: offsetX, y: offsetY });
                setIsDraggingElement(true);
              } else if (currentTool === 'eraser' && (eraserMode === 'universal' || eraserMode === 'shape')) {
                e.stopPropagation();
                deleteElement(element.id);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: currentTool === 'select' ? (isDraggingElement ? 'grabbing' : 'grab') : currentTool === 'eraser' ? 'not-allowed' : 'default',
              strokeWidth: isSelected ? element.thickness + 2 : element.thickness,
              pointerEvents: 'auto',
            }}
          />
        );
      }
      case 'text': {
        // mm → px 변환
        const xPx = mmToPx(element.x);
        const yPx = mmToPx(element.y);

        return (
          <text
            key={element.id}
            x={xPx}
            y={yPx}
            fontSize={element.fontSize}
            fill={element.color}
            fillOpacity={layerOpacity}
            fontFamily={element.fontFamily}
            transform={element.rotation ? `rotate(${element.rotation} ${xPx} ${yPx})` : undefined}
            {...createElementTouchHandler(element)}
            onDoubleClick={(e) => {
              // Double-click to edit in select mode
              if (currentTool === 'select') {
                e.stopPropagation();
                setTextInputPosition({ x: xPx, y: yPx });
                setTextInputValue(element.text);
                setEditingTextId(element.id);
              }
            }}
            onMouseDown={(e) => {
              if (currentTool === 'select') {
                e.stopPropagation();
                toggleSelection(element.id, 'drawing', e.ctrlKey || e.metaKey);
                const svgPoint = screenToSVG(e.clientX, e.clientY);
                setIsDraggingElement(true);
                setDragStartPoint(svgPoint);
                // Get fresh element from store to avoid stale closure
                const freshElement = useDrawingStore.getState().elements.find(el => el.id === element.id);
                setDragElementOriginal(freshElement ? { ...freshElement } : { ...element });
              } else if (currentTool === 'text') {
                // Text tool: edit existing text
                e.stopPropagation();
                setTextInputPosition({ x: xPx, y: yPx });
                setTextInputValue(element.text);
                setEditingTextId(element.id);
              } else if (currentTool === 'eraser' && (eraserMode === 'universal' || eraserMode === 'shape')) {
                e.stopPropagation();
                deleteElement(element.id);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: currentTool === 'text' ? 'text' : currentTool === 'select' ? (isDraggingElement ? 'grabbing' : 'grab') : currentTool === 'eraser' ? 'not-allowed' : 'default',
              userSelect: 'none',
              pointerEvents: 'auto',
            }}
          >
            {element.text.split('\n').map((line, i) => (
              <tspan key={i} x={xPx} dy={i === 0 ? 0 : element.fontSize * 1.2}>
                {line}
              </tspan>
            ))}
          </text>
        );
      }
      case 'path': {
        if (element.points.length < 2) return null;

        // mm → px 변환
        const pathD = element.points.map((pt, i) => {
          const ptXPx = mmToPx(pt.x);
          const ptYPx = mmToPx(pt.y);
          return i === 0 ? `M ${ptXPx} ${ptYPx}` : `L ${ptXPx} ${ptYPx}`;
        }).join(' ');

        return (
          <path
            key={element.id}
            d={pathD}
            stroke={element.color}
            strokeWidth={element.thickness}
            strokeDasharray={getStrokeDashArray(element.lineStyle)}
            strokeOpacity={layerOpacity}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...createElementTouchHandler(element)}
            onMouseDown={(e) => {
              if (currentTool === 'select') {
                e.stopPropagation();
                toggleSelection(element.id, 'drawing', e.ctrlKey || e.metaKey);
                const svgPoint = screenToSVG(e.clientX, e.clientY);
                const mouseXmm = pxToMm(svgPoint.x);
                const mouseYmm = pxToMm(svgPoint.y);

                // dragOffset = element 위치 - 마우스 위치 (가구처럼)
                let offsetX = 0, offsetY = 0;
                if (element.type === 'rectangle' || element.type === 'text') {
                  offsetX = element.x - mouseXmm;
                  offsetY = element.y - mouseYmm;
                } else if (element.type === 'circle') {
                  offsetX = element.cx - mouseXmm;
                  offsetY = element.cy - mouseYmm;
                } else if (element.type === 'line') {
                  offsetX = element.startX - mouseXmm;
                  offsetY = element.startY - mouseYmm;
                } else if (element.type === 'path') {
                  offsetX = element.points[0].x - mouseXmm;
                  offsetY = element.points[0].y - mouseYmm;
                }

                setDragOffset({ x: offsetX, y: offsetY });
                setIsDraggingElement(true);
              } else if (currentTool === 'eraser' && (eraserMode === 'universal' || eraserMode === 'shape')) {
                e.stopPropagation();
                deleteElement(element.id);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              cursor: currentTool === 'select' ? (isDraggingElement ? 'grabbing' : 'grab') : currentTool === 'eraser' ? 'not-allowed' : 'default',
              strokeWidth: isSelected ? element.thickness + 2 : element.thickness,
              pointerEvents: 'visibleStroke',
            }}
          />
        );
      }
      default:
        return null;
    }
  };

  // Get layers and create layer map for rendering
  const layers = useLayerStore((state) => state.layers);
  const layerMap = new Map(layers.map(l => [l.id, l]));

  // Filter elements by layer visibility and sort by layer order + element order
  const visibleElements = elements
    .filter(element => {
      const layer = layerMap.get(element.layerId);
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

  return (
    <>
      <svg
        ref={svgRef}
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: canvasWidth + 200,
          height: canvasHeight + 200,
          zIndex: 150,
          cursor: spacePressed ? 'grab' : (currentTool === 'select' ? 'default' : 'crosshair'),
          overflow: 'visible',
          // Select mode: no touchAction to allow FloorPlanCanvas to handle panning
          // Drawing mode: 'none' to prevent browser scrolling
          touchAction: (calibrationMode || currentTool === 'select') ? undefined : 'none',
          // In select mode, make SVG transparent to pointer events so touches pass through to FloorPlanCanvas
          // Individual elements will have pointerEvents: 'auto' to remain interactive
          pointerEvents: calibrationMode ? 'none' : (currentTool === 'select' ? 'none' : 'auto'),
        }}
        viewBox={`-100 -100 ${canvasWidth + 200} ${canvasHeight + 200}`}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => {
          if (!isCurrentlyDrawing) {
            setGuideLines([]);
            setSnapPoints([]);
          }
        }}
        // Only add touch start handler in drawing mode (not select/calibration)
        // touchMove and touchEnd are handled by window-level listeners in useEffect
        // In select/calibration mode, remove handlers completely so FloorPlanCanvas can handle touches
        {...((!calibrationMode && currentTool !== 'select') ? {
          onTouchStart: (e: React.TouchEvent) => {
            if (e.touches.length === 1) {
              const touch = e.touches[0];
              const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY,
                button: 0,
                bubbles: true,
              });
              handleMouseDown(mouseEvent as any);
            }
          }
        } : {})}
      >
        {/* Grid */}
        <g opacity="0.5">{renderGrid()}</g>

        {/* Grid labels */}
        <g>{renderGridLabels()}</g>

        {/* Drawn elements */}
        <g>{visibleElements.map(renderElement)}</g>

        {/* Resize handles for selected element */}
        <g>{visibleElements.map(renderResizeHandles)}</g>

        {/* Dimension labels for shapes */}
        <g>{visibleElements.map(renderDimensionLabel)}</g>

        {/* Smart guides */}
        {guideLines.map((guide, index) => {
          return guide.type === 'horizontal' ? (
            <line
              key={`guide-h-${index}`}
              x1={-100}
              y1={guide.position}
              x2={canvasWidth + 100}
              y2={guide.position}
              stroke={guidelineColor}
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.7"
              pointerEvents="none"
            />
          ) : (
            <line
              key={`guide-v-${index}`}
              x1={guide.position}
              y1={-100}
              x2={guide.position}
              y2={canvasHeight + 100}
              stroke={guidelineColor}
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.7"
              pointerEvents="none"
            />
          );
        })}

        {/* Snap point markers (circles) */}
        {snapPoints.map((point, index) => (
          <circle
            key={`snap-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={guidelineColor}
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.9"
            pointerEvents="none"
          />
        ))}

        {/* Pen tool preview */}
        {(isPenDrawing || penCtrlMode) && penPoints.length > 0 && (
          <>
            {/* Drawn path so far */}
            <path
              d={penPoints.map((pt, i) =>
                i === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`
              ).join(' ')}
              stroke={color}
              strokeWidth={thickness}
              strokeDasharray={getStrokeDashArray(lineStyle)}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={penCtrlMode ? "1.0" : "0.7"}
              pointerEvents="none"
            />
            {/* Preview line to mouse (Ctrl mode with angle snap) */}
            {penCtrlMode && mousePosition && penPoints.length > 0 && (
              <>
                {(() => {
                  const lastPt = penPoints[penPoints.length - 1];
                  // Use snap point if available, otherwise use angle snap
                  const snappedPoint = penSnapPoint || snapToAngle(lastPt, mousePosition);
                  const dx = snappedPoint.x - lastPt.x;
                  const dy = snappedPoint.y - lastPt.y;
                  const angleRad = Math.atan2(dy, dx);
                  const angleDeg = (angleRad * 180 / Math.PI + 360) % 360;
                  const midX = (lastPt.x + snappedPoint.x) / 2;
                  const midY = (lastPt.y + snappedPoint.y) / 2;

                  // Calculate distance
                  const lengthPx = Math.sqrt(dx * dx + dy * dy);
                  let lengthMm: number;
                  if (calibratedScale) {
                    // Use calibrated scale: px / (px/mm) = mm
                    lengthMm = lengthPx / calibratedScale;
                  } else {
                    const actualWidth = realWidth || (canvasWidth / scale);
                    const actualHeight = realHeight || (canvasHeight / scale);
                    const canvasDiagonal = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
                    const actualDiagonal = Math.sqrt(actualWidth * actualWidth + actualHeight * actualHeight);
                    lengthMm = (lengthPx / canvasDiagonal) * actualDiagonal;
                  }
                  const lengthCm = lengthMm / 10;
                  const distanceText = lengthCm >= 100 ? `${(lengthCm / 100).toFixed(2)}m` : `${lengthCm.toFixed(1)}cm`;

                  return (
                    <>
                      <line
                        x1={lastPt.x}
                        y1={lastPt.y}
                        x2={snappedPoint.x}
                        y2={snappedPoint.y}
                        stroke={color}
                        strokeWidth={thickness}
                        strokeDasharray="4,4"
                        opacity="0.6"
                        pointerEvents="none"
                      />
                      <text
                        x={midX}
                        y={midY - 10}
                        fontSize="14"
                        fill="#3b82f6"
                        fontWeight="bold"
                        textAnchor="middle"
                        stroke="white"
                        strokeWidth="3"
                        paintOrder="stroke"
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {angleDeg.toFixed(0)}° / {distanceText}
                      </text>
                      {/* Snap point marker */}
                      {penSnapPoint && (
                        <>
                          <circle
                            cx={penSnapPoint.x}
                            cy={penSnapPoint.y}
                            r="8"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2.5"
                            opacity="1"
                            pointerEvents="none"
                          />
                          <circle
                            cx={penSnapPoint.x}
                            cy={penSnapPoint.y}
                            r="4"
                            fill="#22c55e"
                            opacity="0.8"
                            pointerEvents="none"
                          />
                        </>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}

        {/* Temporary drawing preview */}
        {isCurrentlyDrawing && tempStart && tempEnd && (
          <>
            {currentTool === 'line' && (
              <>
                <line
                  x1={tempStart.x}
                  y1={tempStart.y}
                  x2={tempEnd.x}
                  y2={tempEnd.y}
                  stroke={color}
                  strokeWidth={thickness}
                  strokeDasharray={getStrokeDashArray(lineStyle)}
                  opacity="0.7"
                  pointerEvents="none"
                />
                {/* Line length label */}
                {(() => {
                  const dx = tempEnd.x - tempStart.x;
                  const dy = tempEnd.y - tempStart.y;
                  const lengthPx = Math.sqrt(dx * dx + dy * dy);

                  let lengthMm: number;
                  if (calibratedScale) {
                    // Use calibrated scale: px / (px/mm) = mm
                    lengthMm = lengthPx / calibratedScale;
                  } else {
                    const actualWidth = realWidth || (canvasWidth / scale);
                    const actualHeight = realHeight || (canvasHeight / scale);
                    const canvasDiagonal = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight);
                    const actualDiagonal = Math.sqrt(actualWidth * actualWidth + actualHeight * actualHeight);
                    lengthMm = (lengthPx / canvasDiagonal) * actualDiagonal;
                  }
                  const lengthCm = lengthMm / 10;
                  const midX = (tempStart.x + tempEnd.x) / 2;
                  const midY = (tempStart.y + tempEnd.y) / 2;

                  return (
                    <text
                      x={midX}
                      y={midY - 10}
                      fontSize="14"
                      fill="#3b82f6"
                      fontWeight="bold"
                      textAnchor="middle"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {lengthCm >= 100 ? `${(lengthCm / 100).toFixed(2)}m` : `${lengthCm.toFixed(1)}cm`}
                    </text>
                  );
                })()}
              </>
            )}
            {currentTool === 'rectangle' && (
              <>
                <rect
                  x={Math.min(tempStart.x, tempEnd.x)}
                  y={Math.min(tempStart.y, tempEnd.y)}
                  width={Math.abs(tempEnd.x - tempStart.x)}
                  height={Math.abs(tempEnd.y - tempStart.y)}
                  stroke={color}
                  strokeWidth={thickness}
                  strokeDasharray={getStrokeDashArray(lineStyle)}
                  fill={fillColor}
                  opacity="0.7"
                  pointerEvents="none"
                />
                {/* Rectangle size labels */}
                {(() => {
                  const x = Math.min(tempStart.x, tempEnd.x);
                  const y = Math.min(tempStart.y, tempEnd.y);
                  const widthPx = Math.abs(tempEnd.x - tempStart.x);
                  const heightPx = Math.abs(tempEnd.y - tempStart.y);

                  let widthMm: number, heightMm: number;
                  if (calibratedScale) {
                    // Use calibrated scale: px / (px/mm) = mm
                    widthMm = widthPx / calibratedScale;
                    heightMm = heightPx / calibratedScale;
                  } else {
                    const actualWidth = realWidth || (canvasWidth / scale);
                    const actualHeight = realHeight || (canvasHeight / scale);
                    widthMm = (widthPx / canvasWidth) * actualWidth;
                    heightMm = (heightPx / canvasHeight) * actualHeight;
                  }
                  const widthCm = widthMm / 10;
                  const heightCm = heightMm / 10;

                  return (
                    <>
                      {/* Width label (top) */}
                      <text
                        x={x + widthPx / 2}
                        y={y - 8}
                        fontSize="14"
                        fill="#3b82f6"
                        fontWeight="bold"
                        textAnchor="middle"
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {widthCm >= 100 ? `${(widthCm / 100).toFixed(2)}m` : `${widthCm.toFixed(1)}cm`}
                      </text>
                      {/* Height label (left) */}
                      <text
                        x={x - 8}
                        y={y + heightPx / 2}
                        fontSize="14"
                        fill="#3b82f6"
                        fontWeight="bold"
                        textAnchor="end"
                        dominantBaseline="middle"
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {heightCm >= 100 ? `${(heightCm / 100).toFixed(2)}m` : `${heightCm.toFixed(1)}cm`}
                      </text>
                    </>
                  );
                })()}
              </>
            )}
            {currentTool === 'circle' && (
              <>
                <ellipse
                  cx={(tempStart.x + tempEnd.x) / 2}
                  cy={(tempStart.y + tempEnd.y) / 2}
                  rx={Math.abs(tempEnd.x - tempStart.x) / 2}
                  ry={Math.abs(tempEnd.y - tempStart.y) / 2}
                  stroke={color}
                  strokeWidth={thickness}
                  strokeDasharray={getStrokeDashArray(lineStyle)}
                  fill={fillColor}
                  opacity="0.7"
                  pointerEvents="none"
                />
                {/* Circle size labels */}
                {(() => {
                  const cx = (tempStart.x + tempEnd.x) / 2;
                  const cy = (tempStart.y + tempEnd.y) / 2;
                  const rx = Math.abs(tempEnd.x - tempStart.x) / 2;
                  const ry = Math.abs(tempEnd.y - tempStart.y) / 2;

                  let widthMm: number, heightMm: number;
                  if (calibratedScale) {
                    // Use calibrated scale: px / (px/mm) = mm
                    widthMm = (rx * 2) / calibratedScale;
                    heightMm = (ry * 2) / calibratedScale;
                  } else {
                    const actualWidth = realWidth || (canvasWidth / scale);
                    const actualHeight = realHeight || (canvasHeight / scale);
                    widthMm = ((rx * 2) / canvasWidth) * actualWidth;
                    heightMm = ((ry * 2) / canvasHeight) * actualHeight;
                  }
                  const widthCm = widthMm / 10;
                  const heightCm = heightMm / 10;

                  return (
                    <>
                      {/* Width label (top) */}
                      <text
                        x={cx}
                        y={cy - ry - 8}
                        fontSize="14"
                        fill="#3b82f6"
                        fontWeight="bold"
                        textAnchor="middle"
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {widthCm >= 100 ? `${(widthCm / 100).toFixed(2)}m` : `${widthCm.toFixed(1)}cm`}
                      </text>
                      {/* Height label (left) */}
                      <text
                        x={cx - rx - 8}
                        y={cy}
                        fontSize="14"
                        fill="#3b82f6"
                        fontWeight="bold"
                        textAnchor="end"
                        dominantBaseline="middle"
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {heightCm >= 100 ? `${(heightCm / 100).toFixed(2)}m` : `${heightCm.toFixed(1)}cm`}
                      </text>
                    </>
                  );
                })()}
              </>
            )}
          </>
        )}

        {/* Text input - using foreignObject to stay in SVG coordinate system */}
        {textInputPosition && (
          <foreignObject
            x={textInputPosition.x}
            y={textInputPosition.y}
            width={300}
            height={200}
            style={{ overflow: 'visible' }}
          >
            <div style={{ position: 'relative' }}>
              <textarea
                ref={(el) => {
                  textareaRef.current = el;
                  if (el) {
                    // Manually focus after a small delay to avoid blur race condition
                    setTimeout(() => el.focus(), 10);
                  }
                }}
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleTextSubmit();
                  }
                  if (e.key === 'Escape') {
                    setTextInputPosition(null);
                    setTextInputValue('');
                    setEditingTextId(null);
                  }
                }}
                onBlur={handleTextSubmit}
                style={{
                  padding: '4px 8px',
                  border: '2px solid #3b82f6',
                  borderRadius: '4px',
                  fontSize: `${fontSize}px`,
                  fontFamily,
                  color,
                  minWidth: '100px',
                  minHeight: `${fontSize * 1.5}px`,
                  resize: 'none',
                  overflow: 'hidden',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  backgroundColor: 'white',
                }}
                placeholder="텍스트 입력... (Enter로 완료, Esc로 취소)"
                rows={1}
              />
            </div>
          </foreignObject>
        )}
      </svg>
    </>
  );
}
