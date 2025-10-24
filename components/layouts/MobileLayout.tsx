'use client';

import { useRef, useState, useEffect } from 'react';
import FloorPlanCanvas from '@/components/canvas/FloorPlanCanvas';
import FurniturePanel from '@/components/ui/FurniturePanel';
import PropertiesPanel from '@/components/ui/PropertiesPanel';
import LayerPanel from '@/components/ui/LayerPanel';
import MobileToolbar from '@/components/ui/MobileToolbar';
import BottomSheet from '@/components/ui/BottomSheet';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useAppStore } from '@/lib/stores/app-store';
import { useDrawingStore } from '@/lib/stores/drawing-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import toast from 'react-hot-toast';

type TabType = 'furniture' | 'properties' | 'layers';

export default function MobileLayout() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('furniture');
  const { selectedId } = useFurnitureStore();
  const { calibratedScale } = useAppStore();
  const { currentTool, selectedElementId } = useDrawingStore();

  // ESC key to cancel calibration mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (calibrationMode) {
          setCalibrationMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [calibrationMode]);

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
        duration: 1500,
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

  // Auto-switch to properties tab when furniture or drawing element is selected
  useEffect(() => {
    const hasSelection = selectedId || selectedElementId;
    if (hasSelection && showBottomSheet) {
      setActiveTab('properties');
    } else if (!hasSelection && activeTab === 'properties') {
      setActiveTab('furniture');
    }
  }, [selectedId, selectedElementId, showBottomSheet, activeTab]);

  // Turn off calibration mode when drawing tool is selected
  useEffect(() => {
    if (currentTool !== 'select' && calibrationMode) {
      setCalibrationMode(false);
    }
  }, [currentTool, calibrationMode]);

  // Turn off calibration mode when bottom sheet is opened
  useEffect(() => {
    if (showBottomSheet && calibrationMode) {
      setCalibrationMode(false);
    }
  }, [showBottomSheet, calibrationMode]);

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
          {/* Properties button - left (when furniture or drawing element is selected) */}
          {(selectedId || selectedElementId) && (
            <button
              onClick={() => {
                setActiveTab('properties');
                setShowBottomSheet(true);
              }}
              className="px-4 py-2 bg-card border-2 border-primary rounded-full shadow-lg text-sm font-bold hover:bg-accent transition-colors"
              title={t('selectedItem')}
            >
              ⚙️ {t('selectedItem')}
            </button>
          )}

          {/* Layers button - left (when nothing is selected) */}
          {!selectedId && !selectedElementId && (
            <button
              onClick={() => {
                setActiveTab('layers');
                setShowBottomSheet(true);
              }}
              className="px-4 py-2 bg-card border-2 border-border rounded-full shadow-lg text-sm font-bold hover:bg-accent transition-colors"
              title="레이어"
            >
              📋 레이어
            </button>
          )}

          <div className="flex-1" />

          {/* Add Furniture button - right */}
          <button
            onClick={() => {
              setActiveTab('furniture');
              setShowBottomSheet(true);
            }}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center text-2xl font-bold hover:opacity-90 transition-opacity"
            title={t('addFurniture')}
          >
            +
          </button>
        </div>
      </main>

      {/* Unified Tabbed Bottom Sheet */}
      <BottomSheet
        isOpen={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        snapPoints={activeTab === 'properties' ? [50, 80] : [70, 90]}
      >
        <div className="h-full overflow-hidden">
          {activeTab === 'furniture' && (
            <div className="h-full">
              <FurniturePanel isMobile={true} onClose={() => setShowBottomSheet(false)} />
            </div>
          )}
          {activeTab === 'properties' && (
            <div className="h-full overflow-auto">
              <PropertiesPanel isMobile={true} />
            </div>
          )}
          {activeTab === 'layers' && (
            <div className="h-full overflow-auto">
              <LayerPanel isMobile={true} />
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
