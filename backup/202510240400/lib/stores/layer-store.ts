import { create } from 'zustand';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number; // 높을수록 위 (z-index)
  color?: string; // 색상 태그
  opacity: number; // 0-100
}

interface LayerStore {
  layers: Layer[];
  activeLayerId: string;

  // Layer CRUD
  addLayer: (name?: string) => string;
  removeLayer: (layerId: string, skipConfirm?: boolean) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  renameLayer: (layerId: string, name: string) => void;

  // Layer selection
  setActiveLayer: (layerId: string) => void;
  getActiveLayer: () => Layer | null;

  // Layer visibility & lock
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;

  // Layer order
  moveLayerUp: (layerId: string) => void;
  moveLayerDown: (layerId: string) => void;
  moveLayerToTop: (layerId: string) => void;
  moveLayerToBottom: (layerId: string) => void;
  reorderLayers: (newOrder: string[]) => void;

  // Layer color tag
  setLayerColor: (layerId: string, color: string | undefined) => void;

  // Layer opacity
  setLayerOpacity: (layerId: string, opacity: number) => void;

  // Layer merge & duplicate
  mergeLayerDown: (layerId: string, skipConfirm?: boolean) => void;
  duplicateLayer: (layerId: string) => string;

  // Utility
  getLayerById: (layerId: string) => Layer | undefined;
  getSortedLayers: () => Layer[]; // order 기준 정렬

  // Reset
  resetLayers: () => void;
}

const DEFAULT_LAYER: Layer = {
  id: 'layer-1',
  name: '레이어 1',
  visible: true,
  locked: false,
  order: 1,
  opacity: 100,
};

export const useLayerStore = create<LayerStore>()((set, get) => ({
  layers: [DEFAULT_LAYER],
  activeLayerId: 'layer-1',

      addLayer: (name) => {
        const layers = get().layers;
        const maxOrder = Math.max(...layers.map(l => l.order), 0);
        const newId = `layer-${Date.now()}`;
        const newLayer: Layer = {
          id: newId,
          name: name || `레이어 ${layers.length + 1}`,
          visible: true,
          locked: false,
          order: maxOrder + 1,
          opacity: 100,
        };

        set({ layers: [...layers, newLayer], activeLayerId: newId });
        return newId;
      },

      removeLayer: (layerId, skipConfirm = false) => {
        const { layers, activeLayerId } = get();

        // 최소 1개 레이어는 유지
        if (layers.length <= 1) {
          return; // Let UI handle the error message
        }

        const layerToRemove = layers.find(l => l.id === layerId);
        if (!layerToRemove) return;

        // Skip confirmation if requested (UI will handle it)
        if (!skipConfirm) {
          return; // Let UI handle the confirmation
        }

        const newLayers = layers.filter(l => l.id !== layerId);

        // 활성 레이어가 삭제되면 첫 번째 레이어로 변경
        const newActiveId = activeLayerId === layerId
          ? newLayers[0].id
          : activeLayerId;

        set({ layers: newLayers, activeLayerId: newActiveId });
      },

      updateLayer: (layerId, updates) => {
        set(state => ({
          layers: state.layers.map(l =>
            l.id === layerId ? { ...l, ...updates } : l
          )
        }));
      },

      renameLayer: (layerId, name) => {
        get().updateLayer(layerId, { name });
      },

      setActiveLayer: (layerId) => {
        set({ activeLayerId: layerId });
      },

      getActiveLayer: () => {
        const { layers, activeLayerId } = get();
        return layers.find(l => l.id === activeLayerId) || null;
      },

      toggleLayerVisibility: (layerId) => {
        const layer = get().layers.find(l => l.id === layerId);
        if (layer) {
          get().updateLayer(layerId, { visible: !layer.visible });
        }
      },

      toggleLayerLock: (layerId) => {
        const layer = get().layers.find(l => l.id === layerId);
        if (layer) {
          get().updateLayer(layerId, { locked: !layer.locked });
        }
      },

      moveLayerUp: (layerId) => {
        const layers = get().getSortedLayers();
        const index = layers.findIndex(l => l.id === layerId);

        if (index < layers.length - 1) {
          const temp = layers[index].order;
          layers[index].order = layers[index + 1].order;
          layers[index + 1].order = temp;

          set({ layers: [...layers] });
        }
      },

      moveLayerDown: (layerId) => {
        const layers = get().getSortedLayers();
        const index = layers.findIndex(l => l.id === layerId);

        if (index > 0) {
          const temp = layers[index].order;
          layers[index].order = layers[index - 1].order;
          layers[index - 1].order = temp;

          set({ layers: [...layers] });
        }
      },

      moveLayerToTop: (layerId) => {
        const layers = get().layers;
        const maxOrder = Math.max(...layers.map(l => l.order));
        get().updateLayer(layerId, { order: maxOrder + 1 });
      },

      moveLayerToBottom: (layerId) => {
        const layers = get().layers;
        const minOrder = Math.min(...layers.map(l => l.order));
        get().updateLayer(layerId, { order: minOrder - 1 });
      },

      reorderLayers: (newOrder) => {
        set(state => ({
          layers: state.layers.map(layer => {
            const newIndex = newOrder.indexOf(layer.id);
            return newIndex !== -1
              ? { ...layer, order: newIndex + 1 }
              : layer;
          })
        }));
      },

      setLayerColor: (layerId, color) => {
        get().updateLayer(layerId, { color });
      },

      setLayerOpacity: (layerId, opacity) => {
        get().updateLayer(layerId, { opacity: Math.max(0, Math.min(100, opacity)) });
      },

      mergeLayerDown: (layerId, skipConfirm = false) => {
        const layers = get().getSortedLayers();
        const index = layers.findIndex(l => l.id === layerId);

        if (index === 0) {
          return; // Let UI handle the error message
        }

        const currentLayer = layers[index];
        const targetLayer = layers[index - 1];

        // Skip confirmation if requested (UI will handle it)
        if (!skipConfirm) {
          return; // Let UI handle the confirmation
        }

        // Import stores dynamically to avoid circular dependency
        const { useFurnitureStore } = require('./furniture-store');
        const { useDrawingStore } = require('./drawing-store');

        // Move all furniture from current layer to target layer
        const furnitureInCurrentLayer = useFurnitureStore.getState().getFurnitureByLayer(layerId);
        furnitureInCurrentLayer.forEach(furniture => {
          useFurnitureStore.getState().updateFurniture(furniture.id, {
            layerId: targetLayer.id
          });
        });

        // Move all drawing elements from current layer to target layer
        const elementsInCurrentLayer = useDrawingStore.getState().getElementsByLayer(layerId);
        elementsInCurrentLayer.forEach(element => {
          useDrawingStore.getState().updateElement(element.id, {
            layerId: targetLayer.id
          });
        });

        // Remove the current layer (with skipConfirm = true)
        get().removeLayer(layerId, true);
      },

      duplicateLayer: (layerId) => {
        const layer = get().getLayerById(layerId);
        if (!layer) return '';

        const newId = get().addLayer(`${layer.name} 사본`);
        get().updateLayer(newId, {
          visible: layer.visible,
          locked: layer.locked,
          color: layer.color,
          opacity: layer.opacity,
        });

        // Import stores dynamically to avoid circular dependency
        const { useFurnitureStore } = require('./furniture-store');
        const { useDrawingStore } = require('./drawing-store');

        // Duplicate all furniture in the layer
        const furnitureInLayer = useFurnitureStore.getState().getFurnitureByLayer(layerId);
        furnitureInLayer.forEach(furniture => {
          // Create a copy without id, layerId, and order (will be assigned by addFurniture)
          const { id, layerId: _, order, ...furnitureCopy } = furniture;

          // Temporarily set active layer to new layer
          const originalActiveLayerId = require('./layer-store').useLayerStore.getState().activeLayerId;
          require('./layer-store').useLayerStore.getState().setActiveLayer(newId);

          useFurnitureStore.getState().addFurniture(furnitureCopy);

          // Restore original active layer
          require('./layer-store').useLayerStore.getState().setActiveLayer(originalActiveLayerId);
        });

        // Duplicate all drawing elements in the layer
        const elementsInLayer = useDrawingStore.getState().getElementsByLayer(layerId);
        elementsInLayer.forEach(element => {
          // Create a copy without id, layerId, and order
          const { id, layerId: _, order, ...elementCopy } = element;

          // Temporarily set active layer to new layer
          const originalActiveLayerId = require('./layer-store').useLayerStore.getState().activeLayerId;
          require('./layer-store').useLayerStore.getState().setActiveLayer(newId);

          useDrawingStore.getState().addElement(elementCopy as any);

          // Restore original active layer
          require('./layer-store').useLayerStore.getState().setActiveLayer(originalActiveLayerId);
        });

        return newId;
      },

      getLayerById: (layerId) => {
        return get().layers.find(l => l.id === layerId);
      },

      getSortedLayers: () => {
        return [...get().layers].sort((a, b) => a.order - b.order);
      },

      resetLayers: () => {
        set({ layers: [DEFAULT_LAYER], activeLayerId: 'layer-1' });
      },
}));
