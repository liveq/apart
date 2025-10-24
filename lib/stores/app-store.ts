import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { FurnitureItem } from './furniture-store';
import { Page } from '../types/page';

export type Language = 'ko' | 'en';
export type CanvasMode = 'floor-plan' | 'upload' | 'blank';

interface SavedLayout {
  id: string;
  name: string;
  furniture: FurnitureItem[];
  createdAt: number;
  updatedAt: number;
}

interface AppState {
  language: Language;
  canvasMode: CanvasMode;
  currentFloorPlanId: string;
  uploadedImageUrl: string | null;
  uploadedImageScale: number;
  blankCanvasWidth: number;
  blankCanvasHeight: number;
  savedLayouts: SavedLayout[];
  currentLayoutId: string | null;
  showSampleFloorPlan: boolean; // Whether to show default floor plan
  showCanvasSizeDialog: boolean; // Control canvas size dialog from anywhere

  // Multi-page support
  pages: Page[]; // All loaded pages
  currentPageIndex: number; // Currently active page index

  // Scale calibration (not persisted - resets on refresh)
  calibratedScale: number | null; // px/mm ratio, null = auto-calculate

  // Viewport state (not persisted)
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
    scale: number;
    containerWidth: number;
    containerHeight: number;
  };
  setViewport: (viewport: Partial<AppState['viewport']>) => void;

  // Actions
  setLanguage: (lang: Language) => void;
  setCanvasMode: (mode: CanvasMode) => void;
  setCurrentFloorPlanId: (id: string) => void;
  setUploadedImageUrl: (url: string | null) => void;
  setUploadedImageScale: (scale: number) => void;
  setBlankCanvasSize: (width: number, height: number) => void;
  setCalibratedScale: (scale: number | null) => void;
  setShowSampleFloorPlan: (show: boolean) => void;
  setShowCanvasSizeDialog: (show: boolean) => void;

  // Multi-page actions
  addPages: (pages: Page[]) => void; // Add multiple pages at once
  setCurrentPageIndex: (index: number) => void; // Switch to a page
  updatePageName: (index: number, name: string) => void; // Rename a page
  removePage: (index: number) => void; // Delete a page
  getCurrentPage: () => Page | null; // Get current page

  // Layout management
  saveLayout: (name: string, furniture: FurnitureItem[]) => void;
  loadLayout: (id: string) => FurnitureItem[] | null;
  deleteLayout: (id: string) => void;
  updateLayoutName: (id: string, name: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        language: 'ko',
        canvasMode: 'floor-plan',
        currentFloorPlanId: '112-90',
        uploadedImageUrl: null,
        uploadedImageScale: 1.0,
        blankCanvasWidth: 11300,
        blankCanvasHeight: 6900,
        savedLayouts: [],
        currentLayoutId: null,
        calibratedScale: null,
        showSampleFloorPlan: false, // Start with no floor plan shown
        showCanvasSizeDialog: false,

        // Multi-page initial state
        pages: [],
        currentPageIndex: -1, // -1 means no pages loaded

        viewport: {
          zoom: 1,
          panX: 0,
          panY: 0,
          scale: 0.05,
          containerWidth: 800,
          containerHeight: 600,
        },

        setViewport: (viewport) => {
          set((state) => ({
            viewport: { ...state.viewport, ...viewport },
          }));
        },

        setCalibratedScale: (scale) => {
          set({ calibratedScale: scale });
        },

        setLanguage: (lang) => {
          set({ language: lang });
        },

        setCanvasMode: (mode) => {
          set({ canvasMode: mode });
        },

        setCurrentFloorPlanId: (id) => {
          set({ currentFloorPlanId: id });
        },

        setUploadedImageUrl: (url) => {
          set({ uploadedImageUrl: url });
        },

        setUploadedImageScale: (scale) => {
          set({ uploadedImageScale: scale });
        },

        setBlankCanvasSize: (width, height) => {
          set({ blankCanvasWidth: width, blankCanvasHeight: height });
        },

        setShowSampleFloorPlan: (show) => {
          set({ showSampleFloorPlan: show });
        },

        setShowCanvasSizeDialog: (show) => {
          set({ showCanvasSizeDialog: show });
        },

        saveLayout: (name, furniture) => {
          const { currentLayoutId, savedLayouts } = get();

          if (currentLayoutId) {
            // Update existing layout
            set({
              savedLayouts: savedLayouts.map((layout) =>
                layout.id === currentLayoutId
                  ? {
                      ...layout,
                      name,
                      furniture: JSON.parse(JSON.stringify(furniture)),
                      updatedAt: Date.now(),
                    }
                  : layout
              ),
            });
          } else {
            // Create new layout
            const newLayout: SavedLayout = {
              id: `layout-${Date.now()}`,
              name,
              furniture: JSON.parse(JSON.stringify(furniture)),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            set({
              savedLayouts: [...savedLayouts, newLayout],
              currentLayoutId: newLayout.id,
            });
          }
        },

        loadLayout: (id) => {
          const layout = get().savedLayouts.find((l) => l.id === id);
          if (layout) {
            set({ currentLayoutId: id });
            return JSON.parse(JSON.stringify(layout.furniture));
          }
          return null;
        },

        deleteLayout: (id) => {
          set((state) => ({
            savedLayouts: state.savedLayouts.filter((l) => l.id !== id),
            currentLayoutId: state.currentLayoutId === id ? null : state.currentLayoutId,
          }));
        },

        updateLayoutName: (id, name) => {
          set((state) => ({
            savedLayouts: state.savedLayouts.map((layout) =>
              layout.id === id ? { ...layout, name, updatedAt: Date.now() } : layout
            ),
          }));
        },

        // Multi-page actions
        addPages: (newPages) => {
          const { pages } = get();
          set({
            pages: [...pages, ...newPages],
            currentPageIndex: pages.length > 0 ? get().currentPageIndex : 0,
          });
        },

        setCurrentPageIndex: (index) => {
          const { pages } = get();
          if (index >= 0 && index < pages.length) {
            set({ currentPageIndex: index });
          }
        },

        updatePageName: (index, name) => {
          set((state) => ({
            pages: state.pages.map((page, i) =>
              i === index ? { ...page, name } : page
            ),
          }));
        },

        removePage: (index) => {
          set((state) => {
            const newPages = state.pages.filter((_, i) => i !== index);
            let newIndex = state.currentPageIndex;

            if (newPages.length === 0) {
              newIndex = -1;
            } else if (index === state.currentPageIndex) {
              newIndex = Math.min(index, newPages.length - 1);
            } else if (index < state.currentPageIndex) {
              newIndex = state.currentPageIndex - 1;
            }

            return {
              pages: newPages,
              currentPageIndex: newIndex,
            };
          });
        },

        getCurrentPage: () => {
          const { pages, currentPageIndex } = get();
          if (currentPageIndex >= 0 && currentPageIndex < pages.length) {
            return pages[currentPageIndex];
          }
          return null;
        },
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          language: state.language,
          savedLayouts: state.savedLayouts,
          currentLayoutId: state.currentLayoutId,
        }),
      }
    ),
    { name: 'app-store' }
  )
);
