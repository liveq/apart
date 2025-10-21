'use client';

import { useRef, useState, useEffect } from 'react';
import FloorPlanCanvas from '@/components/canvas/FloorPlanCanvas';
import FurniturePanel from '@/components/ui/FurniturePanel';
import PropertiesPanel from '@/components/ui/PropertiesPanel';
import MobileToolbar from '@/components/ui/MobileToolbar';
import BottomSheet from '@/components/ui/BottomSheet';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useAppStore } from '@/lib/stores/app-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import toast from 'react-hot-toast';

export default function MobileLayout() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [showFurnitureSheet, setShowFurnitureSheet] = useState(false);
  const [showPropertiesSheet, setShowPropertiesSheet] = useState(false);
  const { selectedId } = useFurnitureStore();
  const { calibratedScale } = useAppStore();

  const handleToggleMeasurement = () => {
    // If already in measurement mode, turn it off
    if (measurementMode) {
      setMeasurementMode(false);
      return;
    }

    // Check calibration before activating measurement mode
    if (!calibratedScale) {
      toast('⚠️ 거리측정을 위해 배율적용을 먼저 설정해주세요', {
        id: 'measurement-calibration-required',
        duration: 4000,
        style: {
          background: '#f59e0b',
          color: '#fff',
        },
      });
      return;
    }

    setMeasurementMode(true);
    setCalibrationMode(false);
    setEraserMode(false);
  };

  const handleToggleCalibration = () => {
    setCalibrationMode(!calibrationMode);
    if (!calibrationMode) {
      setMeasurementMode(false);
      setEraserMode(false);
    }
  };

  const handleToggleEraser = () => {
    setEraserMode(!eraserMode);
    if (!eraserMode) {
      setMeasurementMode(false);
      setCalibrationMode(false);
    }
  };

  const handleCalibrationComplete = () => {
    setCalibrationMode(false);
  };

  // Close properties sheet when furniture is deselected
  useEffect(() => {
    if (!selectedId) {
      setShowPropertiesSheet(false);
    }
  }, [selectedId]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <MobileToolbar
        canvasRef={canvasRef}
        measurementMode={measurementMode}
        onToggleMeasurement={handleToggleMeasurement}
        calibrationMode={calibrationMode}
        onToggleCalibration={handleToggleCalibration}
        eraserMode={eraserMode}
        onToggleEraser={handleToggleEraser}
      />

      {/* Full screen canvas */}
      <main className="flex-1 overflow-hidden relative">
        <FloorPlanCanvas
          ref={canvasRef}
          measurementMode={measurementMode}
          calibrationMode={calibrationMode}
          eraserMode={eraserMode}
          onCalibrationComplete={handleCalibrationComplete}
        />

        {/* Bottom Floating Action Buttons */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-between items-center gap-3 px-6 z-30">
          {/* Properties button - left */}
          {selectedId && (
            <button
              onClick={() => setShowPropertiesSheet(true)}
              className="px-4 py-2 bg-card border-2 border-primary rounded-full shadow-lg text-sm font-bold hover:bg-accent transition-colors"
              title={t('selectedItem')}
            >
              ⚙️ {t('selectedItem')}
            </button>
          )}

          <div className="flex-1" />

          {/* Add Furniture button - right */}
          <button
            onClick={() => setShowFurnitureSheet(true)}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center text-2xl font-bold hover:opacity-90 transition-opacity"
            title={t('addFurniture')}
          >
            +
          </button>
        </div>
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
