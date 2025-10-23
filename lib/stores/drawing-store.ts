import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useLayerStore } from './layer-store';

export type DrawingTool = 'select' | 'line' | 'rectangle' | 'circle' | 'text' | 'pen' | 'eraser';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type EraserMode = 'universal' | 'shape' | 'furniture';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingLine {
  id: string;
  type: 'line';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  thickness: number;
  lineStyle: LineStyle;
  rotation?: number;
  layerId: string;
  order: number;
}

export interface DrawingRectangle {
  id: string;
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  fillColor: string;
  thickness: number;
  opacity: number;
  lineStyle: LineStyle;
  rotation?: number;
  layerId: string;
  order: number;
}

export interface DrawingCircle {
  id: string;
  type: 'circle';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  strokeColor: string;
  fillColor: string;
  thickness: number;
  opacity: number;
  lineStyle: LineStyle;
  rotation?: number;
  layerId: string;
  order: number;
}

export interface DrawingText {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  rotation?: number;
  layerId: string;
  order: number;
}

export interface DrawingPath {
  id: string;
  type: 'path';
  points: Point[];
  color: string;
  thickness: number;
  lineStyle: LineStyle;
  rotation?: number;
  layerId: string;
  order: number;
}

export type DrawingElement = DrawingLine | DrawingRectangle | DrawingCircle | DrawingText | DrawingPath;

interface SavedWork {
  id: string;
  name?: string; // Optional custom name
  timestamp: number;
  canvasWidth: number;
  canvasHeight: number;
  canvasUnit: 'mm' | 'cm' | 'm';
  elements: DrawingElement[];
}

interface DrawingState {
  // Drawing elements
  elements: DrawingElement[];
  selectedElementId: string | null;
  currentWorkId: string | null;

  // Current tool and settings
  currentTool: DrawingTool;
  eraserMode: EraserMode;
  color: string;
  fillColor: string;
  thickness: number;
  lineStyle: LineStyle;
  opacity: number;
  fontSize: number;
  fontFamily: string;

  // Grid and canvas settings
  showGrid: boolean;
  showGridLabels: boolean; // Show grid size labels
  showDimensionLabels: boolean; // Show dimension labels on shapes
  gridSize: number; // 5mm
  majorGridSize: number; // 50mm
  canvasWidth: number; // in mm
  canvasHeight: number; // in mm
  canvasUnit: 'mm' | 'cm' | 'm';
  guidelineColor: string; // Smart guide color

  // Drawing mode
  drawingMode: boolean; // Whether drawing toolbar is active
  continuousMode: boolean; // For line drawing
  toolbarCollapsed: boolean;

  // Temporary drawing state (not persisted)
  isDrawing: boolean;
  tempStartPoint: Point | null;
  tempEndPoint: Point | null;

  // Actions
  setCurrentTool: (tool: DrawingTool) => void;
  setEraserMode: (mode: EraserMode) => void;
  setColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setThickness: (thickness: number) => void;
  setLineStyle: (style: LineStyle) => void;
  setOpacity: (opacity: number) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;

  setShowGrid: (show: boolean) => void;
  setShowGridLabels: (show: boolean) => void;
  setShowDimensionLabels: (show: boolean) => void;
  setCanvasSize: (width: number, height: number, unit: 'mm' | 'cm' | 'm') => void;
  setGuidelineColor: (color: string) => void;

  setDrawingMode: (mode: boolean) => void;
  setContinuousMode: (mode: boolean) => void;
  setToolbarCollapsed: (collapsed: boolean) => void;

  addElement: (element: DrawingElement) => void;
  updateElement: (id: string, updates: Partial<DrawingElement>) => void;
  deleteElement: (id: string) => void;
  clearAllElements: () => void;
  rotateElement: (id: string, angle?: number) => void;
  duplicateElement: (id: string) => void;

  // Layer-related functions
  getElementsByLayer: (layerId: string) => DrawingElement[];
  moveElementToLayer: (elementId: string, targetLayerId: string) => void;
  moveElementUp: (id: string) => void;
  moveElementDown: (id: string) => void;
  moveElementToTop: (id: string) => void;
  moveElementToBottom: (id: string) => void;

  setSelectedElementId: (id: string | null) => void;

  setIsDrawing: (isDrawing: boolean) => void;
  setTempStartPoint: (point: Point | null) => void;
  setTempEndPoint: (point: Point | null) => void;

  // Work management
  saveCurrentWork: (name?: string) => void;
  loadWork: (workId: string) => void;
  getSavedWorks: () => SavedWork[];
  deleteWork: (workId: string) => void;
  startNewWork: (width: number, height: number, unit: 'mm' | 'cm' | 'm') => void;
}

export type { SavedWork };

export const useDrawingStore = create<DrawingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        elements: [],
        selectedElementId: null,
        currentWorkId: null,

        currentTool: 'select',
        eraserMode: 'universal',
        color: '#000000',
        fillColor: 'rgba(255, 255, 255, 0.1)',
        thickness: 1,
        lineStyle: 'solid',
        opacity: 0.1,
        fontSize: 16,
        fontFamily: 'Arial',

        showGrid: true,
        showGridLabels: true,
        showDimensionLabels: true,
        gridSize: 5, // 5mm
        majorGridSize: 50, // 50mm
        canvasWidth: 11300, // Default 26평형
        canvasHeight: 6900,
        canvasUnit: 'mm',
        guidelineColor: '#00d4ff',

        drawingMode: false,
        continuousMode: false,
        toolbarCollapsed: true,

        isDrawing: false,
        tempStartPoint: null,
        tempEndPoint: null,

        // Actions
        setCurrentTool: (tool) => set({ currentTool: tool }),
        setEraserMode: (mode) => set({ eraserMode: mode }),
        setColor: (color) => set({ color }),
        setFillColor: (color) => set({ fillColor: color }),
        setThickness: (thickness) => set({ thickness }),
        setLineStyle: (style) => set({ lineStyle: style }),
        setOpacity: (opacity) => set({ opacity }),
        setFontSize: (size) => set({ fontSize: size }),
        setFontFamily: (family) => set({ fontFamily: family }),

        setShowGrid: (show) => set({ showGrid: show }),
        setShowGridLabels: (show) => set({ showGridLabels: show }),
        setShowDimensionLabels: (show) => set({ showDimensionLabels: show }),
        setCanvasSize: (width, height, unit) => set({
          canvasWidth: width,
          canvasHeight: height,
          canvasUnit: unit
        }),
        setGuidelineColor: (color) => set({ guidelineColor: color }),

        setDrawingMode: (mode) => set({ drawingMode: mode }),
        setContinuousMode: (mode) => set({ continuousMode: mode }),
        setToolbarCollapsed: (collapsed) => set({ toolbarCollapsed: collapsed }),

        addElement: (element) => {
          // Get active layer ID from layer store
          const activeLayerId = useLayerStore.getState().activeLayerId;

          // Get max order in the active layer
          const elementsInLayer = get().elements.filter(el => el.layerId === activeLayerId);
          const maxOrder = elementsInLayer.length > 0
            ? Math.max(...elementsInLayer.map(el => el.order))
            : 0;

          // Add layerId and order to the element
          const elementWithLayer = {
            ...element,
            layerId: activeLayerId,
            order: maxOrder + 1,
          };

          set((state) => ({
            elements: [...state.elements, elementWithLayer]
          }));
          // Auto-save after adding element
          setTimeout(() => get().saveCurrentWork(), 100);
        },

        updateElement: (id, updates) => {
          set((state) => ({
            elements: state.elements.map((el) =>
              el.id === id ? { ...el, ...updates } : el
            )
          }));
          // Auto-save after updating element
          setTimeout(() => get().saveCurrentWork(), 100);
        },

        deleteElement: (id) => {
          set((state) => ({
            elements: state.elements.filter((el) => el.id !== id),
            selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
          }));
          // Auto-save after deleting element
          setTimeout(() => get().saveCurrentWork(), 100);
        },

        clearAllElements: () => set({ elements: [], selectedElementId: null }),

        rotateElement: (id, angle = 90) => {
          set((state) => ({
            elements: state.elements.map((el) => {
              if (el.id === id) {
                const currentRotation = el.rotation || 0;
                return { ...el, rotation: (currentRotation + angle) % 360 };
              }
              return el;
            })
          }));
          setTimeout(() => get().saveCurrentWork(), 100);
        },

        duplicateElement: (id) => {
          const state = get();
          const element = state.elements.find(el => el.id === id);
          if (!element) return;

          // Get max order in the same layer
          const elementsInLayer = state.elements.filter(el => el.layerId === element.layerId);
          const maxOrder = elementsInLayer.length > 0
            ? Math.max(...elementsInLayer.map(el => el.order))
            : 0;

          const newElement = {
            ...element,
            id: `${element.type}-${Date.now()}`,
            order: maxOrder + 1,
          };

          // Offset the duplicate slightly
          if (newElement.type === 'line') {
            newElement.startX += 20;
            newElement.startY += 20;
            newElement.endX += 20;
            newElement.endY += 20;
          } else if (newElement.type === 'rectangle') {
            newElement.x += 20;
            newElement.y += 20;
          } else if (newElement.type === 'circle') {
            newElement.cx += 20;
            newElement.cy += 20;
          } else if (newElement.type === 'text') {
            newElement.x += 20;
            newElement.y += 20;
          }

          set((state) => ({
            elements: [...state.elements, newElement],
            selectedElementId: newElement.id,
          }));
          setTimeout(() => get().saveCurrentWork(), 100);
        },

        setSelectedElementId: (id) => set({ selectedElementId: id }),

        setIsDrawing: (isDrawing) => set({ isDrawing }),
        setTempStartPoint: (point) => set({ tempStartPoint: point }),
        setTempEndPoint: (point) => set({ tempEndPoint: point }),

        // Layer-related functions
        getElementsByLayer: (layerId) => {
          return get().elements.filter(el => el.layerId === layerId);
        },

        moveElementToLayer: (elementId, targetLayerId) => {
          const element = get().elements.find(el => el.id === elementId);
          if (!element) return;

          // Get max order in target layer
          const elementsInTargetLayer = get().elements.filter(el => el.layerId === targetLayerId);
          const maxOrder = elementsInTargetLayer.length > 0
            ? Math.max(...elementsInTargetLayer.map(el => el.order))
            : 0;

          get().updateElement(elementId, {
            layerId: targetLayerId,
            order: maxOrder + 1,
          });
        },

        moveElementUp: (id) => {
          const element = get().elements.find(el => el.id === id);
          if (!element) return;

          // Get elements in the same layer, sorted by order
          const elementsInLayer = get().elements
            .filter(el => el.layerId === element.layerId)
            .sort((a, b) => a.order - b.order);

          const currentIndex = elementsInLayer.findIndex(el => el.id === id);

          // If not at the top, swap order with the element above
          if (currentIndex < elementsInLayer.length - 1) {
            const currentOrder = element.order;
            const nextElement = elementsInLayer[currentIndex + 1];

            get().updateElement(id, { order: nextElement.order });
            get().updateElement(nextElement.id, { order: currentOrder });
          }
        },

        moveElementDown: (id) => {
          const element = get().elements.find(el => el.id === id);
          if (!element) return;

          // Get elements in the same layer, sorted by order
          const elementsInLayer = get().elements
            .filter(el => el.layerId === element.layerId)
            .sort((a, b) => a.order - b.order);

          const currentIndex = elementsInLayer.findIndex(el => el.id === id);

          // If not at the bottom, swap order with the element below
          if (currentIndex > 0) {
            const currentOrder = element.order;
            const prevElement = elementsInLayer[currentIndex - 1];

            get().updateElement(id, { order: prevElement.order });
            get().updateElement(prevElement.id, { order: currentOrder });
          }
        },

        moveElementToTop: (id) => {
          const element = get().elements.find(el => el.id === id);
          if (!element) return;

          // Get max order in the same layer
          const elementsInLayer = get().elements.filter(el => el.layerId === element.layerId);
          const maxOrder = elementsInLayer.length > 0
            ? Math.max(...elementsInLayer.map(el => el.order))
            : 0;

          get().updateElement(id, { order: maxOrder + 1 });
        },

        moveElementToBottom: (id) => {
          const element = get().elements.find(el => el.id === id);
          if (!element) return;

          // Get min order in the same layer
          const elementsInLayer = get().elements.filter(el => el.layerId === element.layerId);
          const minOrder = elementsInLayer.length > 0
            ? Math.min(...elementsInLayer.map(el => el.order))
            : 0;

          get().updateElement(id, { order: minOrder - 1 });
        },

        // Work management
        saveCurrentWork: (name?: string) => {
          const state = get();
          const workId = state.currentWorkId || `work-${Date.now()}`;
          const work: SavedWork = {
            id: workId,
            name: name, // Store the custom name if provided
            timestamp: Date.now(),
            canvasWidth: state.canvasWidth,
            canvasHeight: state.canvasHeight,
            canvasUnit: state.canvasUnit,
            elements: state.elements,
          };

          const savedWorks = get().getSavedWorks();
          const existingIndex = savedWorks.findIndex(w => w.id === workId);

          if (existingIndex >= 0) {
            savedWorks[existingIndex] = work;
          } else {
            savedWorks.push(work);
          }

          localStorage.setItem('drawing-saved-works', JSON.stringify(savedWorks));
          set({ currentWorkId: workId });
        },

        loadWork: (workId) => {
          const savedWorks = get().getSavedWorks();
          const work = savedWorks.find(w => w.id === workId);

          if (work) {
            set({
              currentWorkId: work.id,
              canvasWidth: work.canvasWidth,
              canvasHeight: work.canvasHeight,
              canvasUnit: work.canvasUnit,
              elements: work.elements,
              selectedElementId: null,
            });
          }
        },

        getSavedWorks: () => {
          try {
            const saved = localStorage.getItem('drawing-saved-works');
            return saved ? JSON.parse(saved) : [];
          } catch {
            return [];
          }
        },

        deleteWork: (workId) => {
          const savedWorks = get().getSavedWorks();
          const filtered = savedWorks.filter(w => w.id !== workId);
          localStorage.setItem('drawing-saved-works', JSON.stringify(filtered));
        },

        startNewWork: (width, height, unit) => {
          set({
            currentWorkId: null,
            canvasWidth: width,
            canvasHeight: height,
            canvasUnit: unit,
            elements: [],
            selectedElementId: null,
            drawingMode: true,
          });
        },
      }),
      {
        name: 'drawing-storage',
        partialize: (state) => ({
          elements: state.elements,
          showGrid: state.showGrid,
          showGridLabels: state.showGridLabels,
          showDimensionLabels: state.showDimensionLabels,
          canvasWidth: state.canvasWidth,
          canvasHeight: state.canvasHeight,
          canvasUnit: state.canvasUnit,
          guidelineColor: state.guidelineColor,
          eraserMode: state.eraserMode,
          color: state.color,
          fillColor: state.fillColor,
          thickness: state.thickness,
          lineStyle: state.lineStyle,
          opacity: state.opacity,
          fontSize: state.fontSize,
          fontFamily: state.fontFamily,
        }),
      }
    ),
    { name: 'drawing-store' }
  )
);
