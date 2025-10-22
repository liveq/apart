'use client';

import { useState, RefObject, useRef } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { exportAsJPEG } from '@/lib/utils/export';
import BottomSheet from './BottomSheet';
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
  const { language: currentLang, setLanguage, setCalibratedScale, setUploadedImageUrl } = useAppStore();
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

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      clearAll();
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

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="h-14 bg-card border-b border-border flex items-center px-1.5 gap-1 shrink-0">
        {/* Hamburger Menu */}
        <button
          onClick={() => setShowMenuSheet(true)}
          className="p-1.5 hover:bg-accent rounded flex-shrink-0"
          title="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-2 py-1.5 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm flex-shrink-0"
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

        <div className="flex-1" />

        {/* Save Button */}
        <button
          onClick={handleExport}
          className="px-2 py-1.5 bg-primary text-primary-foreground rounded text-sm flex-shrink-0"
          title={t('exportJPEG')}
        >
          💾
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="px-2 py-1.5 bg-secondary hover:bg-accent rounded text-xs font-medium flex-shrink-0"
          title={t('language')}
        >
          {currentLang === 'ko' ? 'EN' : 'KO'}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
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
    </>
  );
}
