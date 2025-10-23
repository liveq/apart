'use client';

import { useState, RefObject, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useDrawingStore } from '@/lib/stores/drawing-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { exportAsJPEG } from '@/lib/utils/export';
import BottomSheet from './BottomSheet';
import CanvasSizeDialog from './CanvasSizeDialog';
import LayoutsDialog from './LayoutsDialog';
import toast from 'react-hot-toast';

interface MobileToolbarProps {
  canvasRef: RefObject<HTMLElement | null>;
  measurementMode?: boolean;
  onToggleMeasurement?: () => void;
  calibrationMode?: boolean;
  onToggleCalibration?: () => void;
  eraserMode?: boolean;
  onToggleEraser?: () => void;
}

export default function MobileToolbar({
  canvasRef,
  measurementMode = false,
  onToggleMeasurement,
  calibrationMode = false,
  onToggleCalibration,
  eraserMode = false,
  onToggleEraser,
}: MobileToolbarProps) {
  const { t } = useTranslation();
  const {
    language: currentLang,
    setLanguage,
    setCalibratedScale,
    setUploadedImageUrl,
    setShowSampleFloorPlan,
    showCanvasSizeDialog,
    setShowCanvasSizeDialog
  } = useAppStore();
  const {
    snapEnabled,
    setSnapEnabled,
    snapSize,
    setSnapSize,
    undo,
    redo,
    clearAll,
    clearMeasurements
  } = useFurnitureStore();
  const {
    toolbarCollapsed,
    setToolbarCollapsed,
    setCanvasSize,
    setDrawingMode,
    clearAllElements
  } = useDrawingStore();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Screen width detection for responsive positioning
  useEffect(() => {
    const handleResize = () => {
      setIsNarrowScreen(window.innerWidth <= 580);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const toggleLanguage = () => {
    setLanguage(currentLang === 'ko' ? 'en' : 'ko');
  };

  const handleExport = () => {
    if (canvasRef.current) {
      exportAsJPEG(canvasRef.current);
    }
  };

  const handleClearAll = () => {
    if (confirm(t('confirmClearAll'))) {
      clearAll(); // Clear furniture
      clearAllElements(); // Clear drawing shapes
      setShowMenuSheet(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('imageOnlyError'));
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setCalibratedScale(null);
    clearAll();
    setUploadedImageUrl(imageUrl);

    toast.success(t('imageUploadedSuccess'));
    setShowMenuSheet(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDirectDraw = () => {
    if (eraserMode && onToggleEraser) {
      onToggleEraser();
    }
    if (calibrationMode && onToggleCalibration) {
      onToggleCalibration();
    }
    setShowCanvasSizeDialog(true);
  };

  const handleCanvasSizeConfirm = (width: number, height: number, unit: 'mm' | 'cm' | 'm') => {
    setUploadedImageUrl(null);
    setShowSampleFloorPlan(false);
    setCanvasSize(width, height, unit);
    setDrawingMode(true);
    setCalibratedScale(null);
    setShowCanvasSizeDialog(false);
    toast.success(t('canvasCreated') || '캔버스가 생성되었습니다');
  };

  const handleLoadClick = () => {
    setShowLoadDialog(true);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Drawing Toolbar Expand Button (floating only on narrow screens) */}
      {toolbarCollapsed && isNarrowScreen && (
        <div
          style={{
            position: 'fixed',
            top: '55px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (calibrationMode && onToggleCalibration) {
                onToggleCalibration();
              }
              setToolbarCollapsed(false);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (calibrationMode && onToggleCalibration) {
                onToggleCalibration();
              }
              setToolbarCollapsed(false);
            }}
            className="px-3 py-1.5 bg-purple-500 text-white hover:bg-purple-600 rounded text-xs font-medium shadow-lg"
            style={{
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
            title="그리기 도구 펼치기"
          >
            ✏️ 그리기 도구
          </button>
        </div>
      )}

      <div className="h-14 bg-card border-b border-border flex items-center px-1.5 gap-1 shrink-0">
        {/* Hamburger Menu */}
        <button
          onClick={() => setShowMenuSheet(true)}
          className="p-1.5 hover:bg-accent rounded flex-shrink-0"
          title={t('menu') || 'Menu'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Export JPEG Button */}
        <button
          onClick={handleExport}
          className="px-2 py-1.5 bg-primary text-primary-foreground rounded text-sm flex-shrink-0"
          title={t('exportJPEG')}
        >
          📥
        </button>

        {/* Create Floor Plan Button */}
        <button
          onClick={handleDirectDraw}
          className="px-2 py-1.5 bg-purple-500 text-white hover:bg-purple-600 rounded text-sm flex-shrink-0"
          title={t('createFloorPlanTooltip') || '도면 생성'}
        >
          ✏️
        </button>

        {/* Upload Button */}
        <button
          onClick={() => {
            if (calibrationMode && onToggleCalibration) {
              onToggleCalibration();
            }
            fileInputRef.current?.click();
          }}
          className="px-2 py-1.5 bg-green-500 text-white hover:bg-green-600 rounded text-sm flex-shrink-0"
          title={t('uploadFloorPlanTooltip')}
        >
          📤
        </button>

        {/* Calibration Button */}
        <button
          onClick={onToggleCalibration}
          className={`px-2 py-1.5 rounded text-sm flex-shrink-0 ${
            calibrationMode
              ? 'bg-orange-500 text-white'
              : 'bg-secondary hover:bg-accent'
          }`}
          title={t('calibrationTooltip')}
        >
          📐
        </button>

        {/* Measurement Button */}
        <button
          onClick={onToggleMeasurement}
          className={`px-2 py-1.5 rounded text-sm flex-shrink-0 ${
            measurementMode
              ? 'bg-green-500 text-white'
              : 'bg-secondary hover:bg-accent'
          }`}
          title={t('measurementTooltip')}
        >
          📏
        </button>

        {/* Eraser Button */}
        <button
          onClick={onToggleEraser}
          className={`px-2 py-1.5 rounded text-sm flex-shrink-0 ${
            eraserMode
              ? 'bg-red-500 text-white'
              : 'bg-secondary hover:bg-accent'
          }`}
          title={t('delete')}
        >
          🗑️
        </button>

        {/* Clear All Button */}
        <button
          onClick={handleClearAll}
          className="px-2 py-1.5 bg-red-500 text-white hover:bg-red-600 rounded text-sm flex-shrink-0"
          title={t('clearAllFurnitureTooltip') || '가구 전체 삭제'}
        >
          💣
        </button>

        {/* Save Work Button */}
        <button
          onClick={() => setShowSaveDialog(true)}
          className="px-2 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded text-sm flex-shrink-0"
          title={t('saveTooltip') || '작업 저장'}
        >
          💾
        </button>

        {/* Load Work Button */}
        <button
          onClick={handleLoadClick}
          className="px-2 py-1.5 bg-secondary hover:bg-accent rounded text-sm flex-shrink-0"
          title={t('loadTooltip') || '작업 불러오기'}
        >
          📂
        </button>

        {/* Drawing Toolbar Expand Button (in header on wide screens) */}
        {toolbarCollapsed && !isNarrowScreen && (
          <button
            onClick={() => {
              if (calibrationMode && onToggleCalibration) {
                onToggleCalibration();
              }
              setToolbarCollapsed(false);
            }}
            className="px-3 py-1.5 bg-purple-500 text-white hover:bg-purple-600 rounded text-xs font-medium flex-shrink-0"
            title="그리기 도구 펼치기"
          >
            ✏️ 그리기 도구
          </button>
        )}

        <div className="flex-1" />

        {/* Language Toggle */}
        <button
          onClick={() => {
            if (calibrationMode && onToggleCalibration) {
              onToggleCalibration();
            }
            toggleLanguage();
          }}
          className="px-2 py-1.5 bg-secondary hover:bg-accent rounded text-xs font-medium flex-shrink-0"
          title={t('language')}
        >
          {currentLang === 'ko' ? 'EN' : 'KO'}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => {
            if (calibrationMode && onToggleCalibration) {
              onToggleCalibration();
            }
            toggleTheme();
          }}
          className="p-1.5 bg-secondary hover:bg-accent rounded text-sm flex-shrink-0"
          title={t('theme')}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Menu Bottom Sheet */}
      <BottomSheet
        isOpen={showMenuSheet}
        onClose={() => setShowMenuSheet(false)}
        title="Menu"
        snapPoints={[60, 90]}
      >
        <div className="space-y-3 py-4">
          {/* Undo/Redo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                undo();
              }}
              className="px-4 py-3 bg-secondary hover:bg-accent rounded text-sm font-medium"
            >
              ↶ {t('undo')}
            </button>
            <button
              onClick={() => {
                redo();
              }}
              className="px-4 py-3 bg-secondary hover:bg-accent rounded text-sm font-medium"
            >
              ↷ {t('redo')}
            </button>
          </div>

          {/* Snap Grid Settings */}
          <div className="bg-secondary/50 rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('snap')}</span>
              <button
                onClick={() => setSnapEnabled(!snapEnabled)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  snapEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    snapEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                {t('gridSize')}
              </label>
              <select
                value={snapSize}
                onChange={(e) => setSnapSize(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded"
              >
                <option value={10}>1cm</option>
                <option value={50}>5cm</option>
                <option value={100}>10cm</option>
                <option value={200}>20cm</option>
                <option value={500}>50cm</option>
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm font-medium flex items-center justify-center gap-2"
          >
            📤 도면 이미지 업로드
          </button>

          {/* Clear Measurements */}
          <button
            onClick={() => {
              clearMeasurements();
            }}
            className="w-full px-4 py-3 bg-secondary hover:bg-accent rounded text-sm font-medium"
          >
            {t('clearMeasurements')}
          </button>

          {/* Clear All */}
          <button
            onClick={handleClearAll}
            className="w-full px-4 py-3 bg-destructive text-destructive-foreground rounded text-sm font-medium"
          >
            {t('clearAll')}
          </button>
        </div>
      </BottomSheet>

      {/* Canvas Size Dialog for Creating Floor Plan */}
      <CanvasSizeDialog
        open={showCanvasSizeDialog}
        onClose={() => setShowCanvasSizeDialog(false)}
        onConfirm={handleCanvasSizeConfirm}
      />

      {/* Save Work Dialog */}
      <LayoutsDialog
        key={showSaveDialog ? 'save' : 'save-closed'}
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        mode="save"
      />

      {/* Load Work Dialog */}
      <LayoutsDialog
        key={showLoadDialog ? 'load' : 'load-closed'}
        open={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        mode="load"
      />
    </>
  );
}
