import { useEffect } from 'react';
import { useFurnitureStore } from '../stores/furniture-store';
import { useDrawingStore } from '../stores/drawing-store';
import { exportAsJPEG } from '../utils/export';

interface PanCallbacks {
  setPanX: (fn: (prev: number) => number) => void;
  setPanY: (fn: (prev: number) => number) => void;
}

export function useKeyboardShortcuts(
  canvasRef: React.RefObject<HTMLElement | null>,
  panCallbacks?: PanCallbacks
) {
  const { selectedId, deleteFurniture, rotateFurniture, undo, redo, updateFurniture, furniture } = useFurnitureStore();
  const { selectedElementId, updateElement, elements, gridSize } = useDrawingStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Arrow keys for navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();

        const moveAmount = gridSize; // Use gridSize directly (already in mm, will be scaled appropriately)

        // If furniture is selected, move furniture
        if (selectedId) {
          const item = furniture.find(f => f.id === selectedId);
          if (item) {
            let newX = item.x;
            let newY = item.y;

            if (e.key === 'ArrowUp') newY -= moveAmount;
            if (e.key === 'ArrowDown') newY += moveAmount;
            if (e.key === 'ArrowLeft') newX -= moveAmount;
            if (e.key === 'ArrowRight') newX += moveAmount;

            updateFurniture(selectedId, { x: newX, y: newY });
          }
        }
        // If drawing element is selected, move drawing element
        else if (selectedElementId) {
          const element = elements.find(el => el.id === selectedElementId);
          if (element) {
            if (element.type === 'line') {
              let updates: any = {};
              if (e.key === 'ArrowUp') {
                updates = { startY: element.startY - moveAmount, endY: element.endY - moveAmount };
              } else if (e.key === 'ArrowDown') {
                updates = { startY: element.startY + moveAmount, endY: element.endY + moveAmount };
              } else if (e.key === 'ArrowLeft') {
                updates = { startX: element.startX - moveAmount, endX: element.endX - moveAmount };
              } else if (e.key === 'ArrowRight') {
                updates = { startX: element.startX + moveAmount, endX: element.endX + moveAmount };
              }
              updateElement(selectedElementId, updates);
            } else if (element.type === 'rectangle' || element.type === 'text') {
              let newX = element.x;
              let newY = element.y;

              if (e.key === 'ArrowUp') newY -= moveAmount;
              if (e.key === 'ArrowDown') newY += moveAmount;
              if (e.key === 'ArrowLeft') newX -= moveAmount;
              if (e.key === 'ArrowRight') newX += moveAmount;

              updateElement(selectedElementId, { x: newX, y: newY });
            } else if (element.type === 'circle') {
              let newCx = element.cx;
              let newCy = element.cy;

              if (e.key === 'ArrowUp') newCy -= moveAmount;
              if (e.key === 'ArrowDown') newCy += moveAmount;
              if (e.key === 'ArrowLeft') newCx -= moveAmount;
              if (e.key === 'ArrowRight') newCx += moveAmount;

              updateElement(selectedElementId, { cx: newCx, cy: newCy });
            } else if (element.type === 'path') {
              // Move entire path by adjusting all points
              let deltaX = 0, deltaY = 0;
              if (e.key === 'ArrowUp') deltaY = -moveAmount;
              if (e.key === 'ArrowDown') deltaY = moveAmount;
              if (e.key === 'ArrowLeft') deltaX = -moveAmount;
              if (e.key === 'ArrowRight') deltaX = moveAmount;

              const newPoints = element.points.map(p => ({
                x: p.x + deltaX,
                y: p.y + deltaY
              }));
              updateElement(selectedElementId, { points: newPoints });
            }
          }
        }
        // If nothing is selected, pan the canvas
        else if (panCallbacks) {
          const panAmount = gridSize * 10; // Multiply by 10 for more noticeable canvas panning

          if (e.key === 'ArrowUp') panCallbacks.setPanY(prev => prev - panAmount);
          if (e.key === 'ArrowDown') panCallbacks.setPanY(prev => prev + panAmount);
          if (e.key === 'ArrowLeft') panCallbacks.setPanX(prev => prev - panAmount);
          if (e.key === 'ArrowRight') panCallbacks.setPanX(prev => prev + panAmount);
        }
      }

      // Delete
      if (e.key === 'Delete' && selectedId) {
        deleteFurniture(selectedId);
      }

      // Rotate
      if (e.key === 'r' || e.key === 'R') {
        if (selectedId) {
          e.preventDefault();
          rotateFurniture(selectedId);
        }
      }

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }

      // Save as JPEG
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (canvasRef.current) {
          exportAsJPEG(canvasRef.current);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, selectedElementId, deleteFurniture, rotateFurniture, undo, redo, updateFurniture, updateElement, furniture, elements, gridSize, panCallbacks, canvasRef]);
}
