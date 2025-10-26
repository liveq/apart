'use client';

import { useRef, useState, useEffect } from 'react';
import FloorPlanCanvas from '@/components/canvas/FloorPlanCanvas';
import FurniturePanel from '@/components/ui/FurniturePanel';
import Toolbar from '@/components/ui/Toolbar';
import RightSidebar from '@/components/ui/RightSidebar';
import MobileLayout from '@/components/layouts/MobileLayout';
import FloatingControls from '@/components/ui/FloatingControls';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

export default function Home() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [eraserMode, setEraserMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

      {/* <PageTabs /> */}  {/* 우측 상단 FloatingControls로 이동 */}

      <div className="flex flex-1 overflow-hidden">
        <FurniturePanel />

        <main className="flex-1 overflow-hidden relative">
          {/* <FloatingControls /> */}  {/* 페이지 네비게이션이 왼쪽 줌 컨트롤로 이동됨 */}
          <FloorPlanCanvas
            ref={canvasRef}
            measurementMode={measurementMode}
            calibrationMode={calibrationMode}
            eraserMode={eraserMode}
            onCalibrationComplete={handleCalibrationComplete}
          />
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}
