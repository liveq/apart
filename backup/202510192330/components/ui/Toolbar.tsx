'use client';

import { useAppStore } from '@/lib/stores/app-store';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { exportAsJPEG } from '@/lib/utils/export';
import { RefObject, useState, useEffect, useRef } from 'react';
import LayoutsDialog from './LayoutsDialog';
import toast from 'react-hot-toast';

interface ToolbarProps {
  canvasRef: RefObject<HTMLElement | null>;
  measurementMode: boolean;
  onToggleMeasurement: () => void;
  calibrationMode: boolean;
  onToggleCalibration: () => void;
  eraserMode: boolean;
  onToggleEraser: () => void;
}

export default function Toolbar({ canvasRef, measurementMode, onToggleMeasurement, calibrationMode, onToggleCalibration, eraserMode, onToggleEraser }: ToolbarProps) {
  const { t } = useTranslation();
  const { language: currentLang, setLanguage, calibratedScale, setCalibratedScale, setUploadedImageUrl } = useAppStore();
  const { snapEnabled, setSnapEnabled, snapSize, setSnapSize, undo, redo, clearAll } = useFurnitureStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showLayoutsDialog, setShowLayoutsDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    setTheme(isDark ? 'dark' : 'light');
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
      clearAll();
    }
  };

  const handleMeasurementClick = () => {
    // If already in measurement mode, turn it off
    if (measurementMode) {
      onToggleMeasurement();
      return;
    }

    // If trying to start measurement mode, check calibration
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
    onToggleMeasurement();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }

    // Create object URL for the uploaded image
    const imageUrl = URL.createObjectURL(file);

    // Clear calibration when uploading new image
    setCalibratedScale(null);
    clearAll();

    // Set the uploaded image URL
    setUploadedImageUrl(imageUrl);

    toast.success('도면이 업로드되었습니다');

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-16 bg-card border-b border-border flex items-center px-4 gap-4 overflow-x-auto">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold hidden md:block">{t('title')}</h1>
        <span className="text-sm text-muted-foreground hidden lg:block">{t('subtitle')}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        <button
          onClick={handleUploadClick}
          className="px-3 py-2 bg-green-500 text-white hover:bg-green-600 hover:ring-2 hover:ring-green-300 hover:shadow-md rounded text-sm font-medium transition-all"
          title="도면 업로드"
        >
          📁 업로드
        </button>

        <button
          onClick={onToggleCalibration}
          className={
            'px-3 py-2 rounded text-sm font-medium transition-all hover:shadow-md ' +
            (calibrationMode
              ? 'bg-orange-500 text-white hover:bg-orange-600 hover:ring-2 hover:ring-orange-300 shadow-lg'
              : calibratedScale
              ? 'bg-blue-500 text-white hover:bg-blue-600 hover:ring-2 hover:ring-blue-300'
              : 'bg-yellow-500 text-white hover:bg-yellow-600 hover:ring-2 hover:ring-yellow-300')
          }
          title={calibratedScale ? `배율 설정됨 (${calibratedScale.toFixed(5)})` : '배율 설정'}
        >
          ⭐ 배율적용
        </button>

        {calibratedScale && (
          <button
            onClick={() => {
              if (confirm('⚠️ 배율을 초기화하면 모든 가구가 삭제됩니다.\n\n계속하시겠습니까?')) {
                clearAll();
                setCalibratedScale(null);
              }
            }}
            className="px-2 py-2 bg-red-500 text-white hover:bg-red-600 hover:ring-2 hover:ring-red-300 hover:shadow-md rounded text-xs transition-all"
            title="배율 초기화 (모든 가구 삭제)"
          >
            초기화
          </button>
        )}

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={undo}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all"
          title={t('undo')}
        >
          ↶
        </button>

        <button
          onClick={redo}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all"
          title={t('redo')}
        >
          ↷
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          className={"px-3 py-2 rounded-l text-sm transition-all hover:shadow-md " + (
            snapEnabled
              ? 'bg-primary text-primary-foreground hover:ring-2 hover:ring-primary/30'
              : 'bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30'
          )}
          title={t('snap')}
        >
          {t('snap')}
        </button>

        <select
          value={snapSize}
          onChange={(e) => setSnapSize(Number(e.target.value))}
          className="px-2 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded-r text-sm border-l border-border transition-all cursor-pointer"
          title={t('gridSize')}
        >
          <option value={10}>1cm</option>
          <option value={50}>5cm</option>
          <option value={100}>10cm</option>
          <option value={200}>20cm</option>
          <option value={500}>50cm</option>
        </select>

        <button
          onClick={handleMeasurementClick}
          className={"px-3 py-2 rounded text-sm font-medium transition-all hover:shadow-md " + (
            measurementMode
              ? 'bg-red-500 text-white hover:bg-red-600 hover:ring-2 hover:ring-red-300'
              : 'bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30'
          )}
          title={measurementMode ? "거리측정 종료" : "거리측정"}
        >
          {measurementMode ? '거리측정종료' : '거리측정'}
        </button>

        <button
          onClick={onToggleEraser}
          className={"px-3 py-2 rounded text-sm font-medium transition-all hover:shadow-md " + (
            eraserMode
              ? 'bg-red-500 text-white hover:bg-red-600 hover:ring-2 hover:ring-red-300'
              : 'bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30'
          )}
          title={eraserMode ? "지우기 종료" : "지우기"}
        >
          {eraserMode ? '지우기종료' : '지우기'}
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={() => setShowLayoutsDialog(true)}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all"
          title={t('layouts')}
        >
          {t('layouts')}
        </button>

        <button
          onClick={handleClearAll}
          className="px-3 py-2 bg-destructive text-destructive-foreground hover:opacity-90 hover:ring-2 hover:ring-destructive/30 hover:shadow-md rounded text-sm transition-all"
          title={t('clearAll')}
        >
          {t('clearAll')}
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={handleExport}
          className="px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all"
          title={t('exportJPEG')}
        >
          {t('export')}
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={toggleLanguage}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all"
          title={t('language')}
        >
          {currentLang === 'ko' ? 'EN' : 'KO'}
        </button>

        <button
          onClick={toggleTheme}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all"
          title={t('theme')}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <LayoutsDialog open={showLayoutsDialog} onClose={() => setShowLayoutsDialog(false)} />
    </div>
  );
}
