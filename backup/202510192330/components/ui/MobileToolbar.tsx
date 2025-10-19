'use client';

import { useState, RefObject } from 'react';
import { useAppStore } from '@/lib/stores/app-store';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { exportAsJPEG } from '@/lib/utils/export';
import BottomSheet from './BottomSheet';

interface MobileToolbarProps {
  canvasRef: RefObject<HTMLElement | null>;
}

export default function MobileToolbar({ canvasRef }: MobileToolbarProps) {
  const { t } = useTranslation();
  const { language: currentLang, setLanguage } = useAppStore();
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

  return (
    <>
      <div className="h-14 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        {/* Hamburger Menu */}
        <button
          onClick={() => setShowMenuSheet(true)}
          className="p-2 hover:bg-accent rounded"
          title="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="flex-1" />

        {/* Save Button */}
        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm font-medium"
          title={t('exportJPEG')}
        >
          {t('save')}
        </button>

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="px-2.5 py-1.5 bg-secondary hover:bg-accent rounded text-sm font-medium"
          title={t('language')}
        >
          {currentLang === 'ko' ? 'EN' : 'KO'}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 bg-secondary hover:bg-accent rounded"
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
