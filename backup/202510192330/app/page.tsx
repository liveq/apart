'use client';

import { useRef, useState, useEffect } from 'react';
import FloorPlanCanvas from '@/components/canvas/FloorPlanCanvas';
import FurniturePanel from '@/components/ui/FurniturePanel';
import Toolbar from '@/components/ui/Toolbar';
import PropertiesPanel from '@/components/ui/PropertiesPanel';
import MobileLayout from '@/components/layouts/MobileLayout';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

export default function Home() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();

  useKeyboardShortcuts(canvasRef);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleToggleMeasurement = () => {
    setMeasurementMode(!measurementMode);
    // Turn off other modes when measurement mode is activated
    if (!measurementMode) {
      setCalibrationMode(false);
      setEraserMode(false);
    }
  };

  const handleToggleCalibration = () => {
    setCalibrationMode(!calibrationMode);
    // Turn off other modes when calibration mode is activated
    if (!calibrationMode) {
      setMeasurementMode(false);
      setEraserMode(false);
    }
  };

  const handleToggleEraser = () => {
    setEraserMode(!eraserMode);
    // Turn off other modes when eraser mode is activated
    if (!eraserMode) {
      setMeasurementMode(false);
      setCalibrationMode(false);
    }
  };

  const handleCalibrationComplete = () => {
    setCalibrationMode(false);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  // Mobile layout
  if (isMobile) {
    return <MobileLayout />;
  }

  // Desktop layout
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      <Toolbar
        canvasRef={canvasRef}
        measurementMode={measurementMode}
        onToggleMeasurement={handleToggleMeasurement}
        calibrationMode={calibrationMode}
        onToggleCalibration={handleToggleCalibration}
        eraserMode={eraserMode}
        onToggleEraser={handleToggleEraser}
      />

      <div className="flex flex-1 overflow-hidden">
        <FurniturePanel />

        <main className="flex-1 overflow-hidden">
          <FloorPlanCanvas
            ref={canvasRef}
            measurementMode={measurementMode}
            calibrationMode={calibrationMode}
            eraserMode={eraserMode}
            onCalibrationComplete={handleCalibrationComplete}
          />
        </main>

        <PropertiesPanel />
      </div>
    </div>
  );
}
