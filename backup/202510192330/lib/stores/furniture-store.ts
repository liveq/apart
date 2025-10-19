import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface FurnitureItem {
  id: string;
  templateId: string;
  name: {
    ko: string;
    en: string;
  };
  x: number;
  y: number;
  width: number;  // 가로 (mm)
  depth: number;  // 깊이 (mm) - 평면도에서 세로
  height: number; // 높이 (mm) - 실제 바닥에서 위로
  rotation: number; // 0, 90, 180, 270
  color: string;
  category: string;
}

export interface MeasurementLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  distance: number; // mm
}

interface FurnitureState {
  furniture: FurnitureItem[];
  selectedId: string | null;
  measurements: MeasurementLine[];
  history: FurnitureItem[][];
  historyIndex: number;
  snapEnabled: boolean;
  snapSize: number; // mm

  // Actions
  addFurniture: (item: Omit<FurnitureItem, 'id'>) => void;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  deleteFurniture: (id: string) => void;
  duplicateFurniture: (id: string) => void;
  rotateFurniture: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  clearAll: () => void;

  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;

  // Measurements
  addMeasurement: (line: Omit<MeasurementLine, 'id' | 'distance'>) => void;
  removeMeasurement: (id: string) => void;
  clearMeasurements: () => void;

  // Settings
  setSnapEnabled: (enabled: boolean) => void;
  setSnapSize: (size: number) => void;
}

const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const useFurnitureStore = create<FurnitureState>()(
  devtools(
    (set, get) => ({
      furniture: [],
      selectedId: null,
      measurements: [],
      history: [[]],
      historyIndex: 0,
      snapEnabled: true,
      snapSize: 10, // 1cm = 10mm (default)

      addFurniture: (item) => {
        const newItem: FurnitureItem = {
          ...item,
          id: `furniture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          furniture: [...state.furniture, newItem],
        }));
        get().saveToHistory();
      },

      updateFurniture: (id, updates) => {
        set((state) => ({
          furniture: state.furniture.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      deleteFurniture: (id) => {
        set((state) => ({
          furniture: state.furniture.filter((item) => item.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }));
        get().saveToHistory();
      },

      duplicateFurniture: (id) => {
        const item = get().furniture.find((f) => f.id === id);
        if (item) {
          const newItem: FurnitureItem = {
            ...item,
            id: `furniture-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x: item.x + 200, // offset by 20cm
            y: item.y + 200,
          };
          set((state) => ({
            furniture: [...state.furniture, newItem],
            selectedId: newItem.id,
          }));
          get().saveToHistory();
        }
      },

      rotateFurniture: (id) => {
        set((state) => ({
          furniture: state.furniture.map((item) =>
            item.id === id
              ? {
                  ...item,
                  rotation: (item.rotation + 90) % 360,
                }
              : item
          ),
        }));
        get().saveToHistory();
      },

      setSelectedId: (id) => {
        set({ selectedId: id });
      },

      clearAll: () => {
        set({ furniture: [], selectedId: null });
        get().saveToHistory();
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({
            furniture: history[newIndex],
            historyIndex: newIndex,
            selectedId: null,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({
            furniture: history[newIndex],
            historyIndex: newIndex,
            selectedId: null,
          });
        }
      },

      saveToHistory: () => {
        const { furniture, history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(furniture)));

        // Limit history to 50 states
        if (newHistory.length > 50) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      addMeasurement: (line) => {
        const distance = calculateDistance(line.startX, line.startY, line.endX, line.endY);
        const newMeasurement: MeasurementLine = {
          ...line,
          id: `measurement-${Date.now()}`,
          distance,
        };
        set((state) => ({
          measurements: [...state.measurements, newMeasurement],
        }));
      },

      removeMeasurement: (id) => {
        set((state) => ({
          measurements: state.measurements.filter((m) => m.id !== id),
        }));
      },

      clearMeasurements: () => {
        set({ measurements: [] });
      },

      setSnapEnabled: (enabled) => {
        set({ snapEnabled: enabled });
      },

      setSnapSize: (size) => {
        set({ snapSize: size });
      },
    }),
    { name: 'furniture-store' }
  )
);
