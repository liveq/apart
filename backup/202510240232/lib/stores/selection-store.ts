import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useFurnitureStore } from './furniture-store';
import { useDrawingStore } from './drawing-store';

interface SelectionItem {
  id: string;
  type: 'furniture' | 'drawing';
}

interface SelectionStore {
  selectedItems: SelectionItem[];

  // Selection management
  toggleSelection: (id: string, type: 'furniture' | 'drawing', ctrlKey: boolean) => void;
  clearSelection: () => void;
  isSelected: (id: string, type: 'furniture' | 'drawing') => boolean;
  getSelectedCount: () => number;
  getSelectedFurnitureIds: () => string[];
  getSelectedDrawingIds: () => string[];
  selectAll: (furnitureIds: string[], drawingIds: string[]) => void;
}

export const useSelectionStore = create<SelectionStore>()(
  devtools(
    (set, get) => ({
      selectedItems: [],

      toggleSelection: (id, type, ctrlKey) => {
        const { selectedItems, isSelected } = get();

        if (!ctrlKey) {
          // Without Ctrl: clear previous selection and select only this item
          const newSelection = [{ id, type }];
          set({ selectedItems: newSelection });

          // Sync with legacy stores
          if (type === 'furniture') {
            useFurnitureStore.getState().setSelectedId(id);
            useDrawingStore.getState().setSelectedElementId(null);
          } else {
            useDrawingStore.getState().setSelectedElementId(id);
            useFurnitureStore.getState().setSelectedId(null);
          }
        } else {
          // With Ctrl: toggle this item in the selection
          if (isSelected(id, type)) {
            // Remove from selection
            const newSelection = selectedItems.filter(item => !(item.id === id && item.type === type));
            set({ selectedItems: newSelection });

            // Sync with legacy stores: update to last selected item of same type, or null
            const lastFurniture = newSelection.filter(item => item.type === 'furniture').pop();
            const lastDrawing = newSelection.filter(item => item.type === 'drawing').pop();
            useFurnitureStore.getState().setSelectedId(lastFurniture?.id || null);
            useDrawingStore.getState().setSelectedElementId(lastDrawing?.id || null);
          } else {
            // Add to selection
            const newSelection = [...selectedItems, { id, type }];
            set({ selectedItems: newSelection });

            // Sync with legacy stores: set to this item
            if (type === 'furniture') {
              useFurnitureStore.getState().setSelectedId(id);
            } else {
              useDrawingStore.getState().setSelectedElementId(id);
            }
          }
        }
      },

      clearSelection: () => {
        set({ selectedItems: [] });

        // Sync with legacy stores
        useFurnitureStore.getState().setSelectedId(null);
        useDrawingStore.getState().setSelectedElementId(null);
      },

      isSelected: (id, type) => {
        return get().selectedItems.some(item => item.id === id && item.type === type);
      },

      getSelectedCount: () => get().selectedItems.length,

      getSelectedFurnitureIds: () => {
        return get().selectedItems
          .filter(item => item.type === 'furniture')
          .map(item => item.id);
      },

      getSelectedDrawingIds: () => {
        return get().selectedItems
          .filter(item => item.type === 'drawing')
          .map(item => item.id);
      },

      selectAll: (furnitureIds, drawingIds) => {
        const items: SelectionItem[] = [
          ...furnitureIds.map(id => ({ id, type: 'furniture' as const })),
          ...drawingIds.map(id => ({ id, type: 'drawing' as const }))
        ];
        set({ selectedItems: items });

        // Sync with legacy stores: set to last item of each type
        const lastFurniture = furnitureIds[furnitureIds.length - 1] || null;
        const lastDrawing = drawingIds[drawingIds.length - 1] || null;
        useFurnitureStore.getState().setSelectedId(lastFurniture);
        useDrawingStore.getState().setSelectedElementId(lastDrawing);
      },
    }),
    { name: 'selection-store' }
  )
);
