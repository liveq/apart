import { useEffect } from 'react';
import { useFurnitureStore } from '../stores/furniture-store';
import { exportAsJPEG } from '../utils/export';

export function useKeyboardShortcuts(canvasRef: React.RefObject<HTMLElement | null>) {
  const { selectedId, deleteFurniture, rotateFurniture, undo, redo } = useFurnitureStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
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
  }, [selectedId, deleteFurniture, rotateFurniture, undo, redo, canvasRef]);
}
