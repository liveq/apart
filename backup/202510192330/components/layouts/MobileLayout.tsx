'use client';

import { useRef, useState, useEffect } from 'react';
import FloorPlanCanvas from '@/components/canvas/FloorPlanCanvas';
import FurniturePanel from '@/components/ui/FurniturePanel';
import PropertiesPanel from '@/components/ui/PropertiesPanel';
import MobileToolbar from '@/components/ui/MobileToolbar';
import BottomSheet from '@/components/ui/BottomSheet';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function MobileLayout() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [showFurnitureSheet, setShowFurnitureSheet] = useState(false);
  const [showPropertiesSheet, setShowPropertiesSheet] = useState(false);
  const { selectedId } = useFurnitureStore();

  const handleToggleMeasurement = () => {
    setMeasurementMode(!measurementMode);
  };

  // Close properties sheet when furniture is deselected
  useEffect(() => {
    if (!selectedId) {
      setShowPropertiesSheet(false);
    }
  }, [selectedId]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <MobileToolbar canvasRef={canvasRef} />

      {/* Full screen canvas */}
      <main className="flex-1 overflow-hidden relative">
        <FloorPlanCanvas ref={canvasRef} measurementMode={measurementMode} />

        {/* Floating Add Furniture Button */}
        <button
          onClick={() => setShowFurnitureSheet(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center text-2xl font-bold hover:opacity-90 transition-opacity z-30"
          title={t('addFurniture')}
        >
          +
        </button>

        {/* Show properties button when furniture is selected */}
        {selectedId && (
          <button
            onClick={() => setShowPropertiesSheet(true)}
            className="fixed bottom-6 left-6 px-4 py-2 bg-card border border-border rounded-full shadow-lg text-sm font-medium hover:bg-accent transition-colors z-30"
            title={t('selectedItem')}
          >
            {t('selectedItem')}
          </button>
        )}
      </main>

      {/* Furniture List Bottom Sheet */}
      <BottomSheet
        isOpen={showFurnitureSheet}
        onClose={() => setShowFurnitureSheet(false)}
        snapPoints={[70, 90]}
      >
        <div className="h-full">
          <FurniturePanel isMobile={true} onClose={() => setShowFurnitureSheet(false)} />
        </div>
      </BottomSheet>

      {/* Properties Panel Bottom Sheet */}
      <BottomSheet
        isOpen={showPropertiesSheet}
        onClose={() => setShowPropertiesSheet(false)}
        title={t('selectedItem')}
        snapPoints={[50, 80]}
      >
        <div className="h-full">
          <PropertiesPanel isMobile={true} />
        </div>
      </BottomSheet>
    </div>
  );
}
