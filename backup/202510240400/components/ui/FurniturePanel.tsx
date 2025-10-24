'use client';

import { useState } from 'react';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useAppStore } from '@/lib/stores/app-store';
import { furnitureTemplates, furnitureCategories } from '@/data/furniture-templates';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { mmToCm } from '@/lib/utils/canvas';
import CustomFurnitureDialog from './CustomFurnitureDialog';
import toast from 'react-hot-toast';

interface FurniturePanelProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export default function FurniturePanel({ isMobile = false, onClose }: FurniturePanelProps) {
  const { t, language } = useTranslation();
  const { addFurniture } = useFurnitureStore();
  const { viewport, calibratedScale, uploadedImageUrl } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);

  // Settings
  const [autoClose, setAutoClose] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('furniturePanel_autoClose');
    return saved !== null ? saved === 'true' : true;
  });
  const [spawnPosition, setSpawnPosition] = useState<'left' | 'center'>(() => {
    if (typeof window === 'undefined') return isMobile ? 'center' : 'left';
    const saved = localStorage.getItem('furniturePanel_spawnPosition');
    return (saved as 'left' | 'center') || (isMobile ? 'center' : 'left');
  });

  const handleAddFurniture = (template: typeof furnitureTemplates[0]) => {
    // Show warning if scale is not calibrated ONLY when image is uploaded
    if (!calibratedScale && uploadedImageUrl) {
      toast('⚠️ 정확한 치수를 위해 배율적용을 먼저 설정해주세요', {
        id: 'calibration-warning',
        duration: 1000,
        style: {
          background: '#f59e0b',
          color: '#fff',
        },
      });
    }

    // Calculate spawn position
    let x = 1000;
    let y = 1000;

    if (spawnPosition === 'center') {
      // Center of current viewport (camera view)
      // Floor plan center in mm
      const centerX = 11300 / 2; // floorPlan112.width / 2
      const centerY = 6900 / 2;  // floorPlan112.height / 2

      // Pan offset in mm (negative pan means view moved right, so content moved left)
      const panOffsetX = -viewport.panX / (viewport.scale * viewport.zoom);
      const panOffsetY = -viewport.panY / (viewport.scale * viewport.zoom);

      x = centerX + panOffsetX;
      y = centerY + panOffsetY;
    } else {
      // Left side
      x = 1000;
      y = 1000;
    }

    addFurniture({
      templateId: template.id,
      name: template.name,
      x,
      y,
      width: template.width,
      depth: template.depth,
      height: template.height,
      rotation: 0,
      color: template.color,
      category: template.category,
      shape: template.shape,
    });

    // Auto close if enabled
    if (autoClose && onClose) {
      onClose();
    }
  };

  // Save settings to localStorage
  const handleAutoCloseToggle = () => {
    const newValue = !autoClose;
    setAutoClose(newValue);
    localStorage.setItem('furniturePanel_autoClose', String(newValue));
  };

  const handleSpawnPositionToggle = () => {
    const newValue = spawnPosition === 'left' ? 'center' : 'left';
    setSpawnPosition(newValue);
    localStorage.setItem('furniturePanel_spawnPosition', newValue);
  };

  // 유사 검색 함수 (fuzzy search)
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!query) return true;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    // 완전 일치
    if (lowerText.includes(lowerQuery)) return true;

    // 초성 검색 지원 (한글)
    const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    const getChosung = (char: string) => {
      const code = char.charCodeAt(0) - 0xAC00;
      if (code < 0 || code > 11171) return char;
      return CHOSUNG[Math.floor(code / 588)];
    };

    const textChosung = Array.from(lowerText).map(getChosung).join('');
    if (textChosung.includes(lowerQuery)) return true;

    return false;
  };

  const filteredTemplates = furnitureTemplates.filter((template) => {
    // 카테고리 필터
    if (selectedCategory && template.category !== selectedCategory) {
      return false;
    }

    // 검색 필터
    if (searchQuery) {
      const matchesKorean = fuzzyMatch(template.name.ko, searchQuery);
      const matchesEnglish = fuzzyMatch(template.name.en, searchQuery);
      const matchesCategory = furnitureCategories.find(c => c.id === template.category);
      const matchesCategoryName = matchesCategory ?
        (fuzzyMatch(matchesCategory.name.ko, searchQuery) || fuzzyMatch(matchesCategory.name.en, searchQuery)) : false;

      if (!matchesKorean && !matchesEnglish && !matchesCategoryName) {
        return false;
      }
    }

    return true;
  });

  // Mobile layout
  if (isMobile) {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Settings row */}
        <div className="px-3 pt-2 pb-1 flex gap-2 text-xs border-b border-border/30">
          <button
            onClick={handleAutoCloseToggle}
            className={`px-2 py-1 rounded transition-colors ${
              autoClose ? 'bg-primary/20 text-primary' : 'bg-secondary/60 text-muted-foreground'
            }`}
          >
            {autoClose ? t('autoCloseEnabled') : t('autoClose')}
          </button>
          <button
            onClick={handleSpawnPositionToggle}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              spawnPosition === 'center' ? 'bg-primary/20 text-primary' : 'bg-gray-600/80 text-white'
            }`}
          >
            {spawnPosition === 'center' ? t('spawnPositionCenter') : t('spawnPositionLeft')}
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pt-2 pb-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${t('search')}... (${t('fuzzySearchSupported')})`}
            className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Compact controls */}
        <div className="px-3 pt-2 pb-2 space-y-2">
          {/* First row: +신규 and main categories */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setShowCustomDialog(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-full text-xs transition-opacity font-medium flex-shrink-0"
            >
              +신규
            </button>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-secondary-foreground'
              }`}
            >
              All
            </button>
            {furnitureCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-secondary-foreground'
                }`}
              >
                {category.name[language]}
              </button>
            ))}
          </div>
        </div>

        {/* Optimized grid layout */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleAddFurniture(template)}
                className="rounded-lg border-2 border-black/15 dark:border-white/20 hover:border-black/30 dark:hover:border-white/30 active:scale-95 transition-all overflow-hidden"
                style={{
                  backgroundColor: template.color,
                }}
              >
                {/* Text overlay */}
                <div className="aspect-square w-full flex items-end p-1">
                  <div className="w-full bg-black/70 backdrop-blur-sm rounded px-1 py-0.5">
                    <div className="font-semibold text-white leading-tight break-keep" style={{ fontSize: 'clamp(8px, 2vw, 10px)' }}>
                      {template.name[language]}
                    </div>
                    <div className="text-white/80 mt-0.5" style={{ fontSize: 'clamp(7px, 1.8vw, 8px)' }}>
                      {mmToCm(template.width)}×{mmToCm(template.height)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <CustomFurnitureDialog open={showCustomDialog} onClose={() => setShowCustomDialog(false)} />
      </div>
    );
  }

  // Desktop layout
  if (isCollapsed) {
    return (
      <div className="w-12 bg-card border-r border-border flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-accent rounded"
          title={t('addFurniture')}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3l10 7-10 7V3z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 md:w-72 bg-card border-r border-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-bold text-lg">{t('furnitureList')}</h2>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-accent rounded"
          title="Collapse"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 3L5 10l10 7V3z" />
          </svg>
        </button>
      </div>

      {/* Settings */}
      <div className="px-4 pt-3 pb-2 border-b border-border/30 flex gap-2">
        <button
          onClick={() => setShowCustomDialog(true)}
          className="flex-1 px-2 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded text-xs transition-opacity font-medium"
        >
          {t('customFurnitureButton')}
        </button>
        <button
          onClick={handleSpawnPositionToggle}
          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            spawnPosition === 'center' ? 'bg-primary text-primary-foreground' : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {spawnPosition === 'center' ? t('spawnPositionCenter') : t('spawnPositionLeft')}
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`${t('search')}... (${t('fuzzySearchSupported')})`}
          className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            All
          </button>
          {furnitureCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {category.name[language]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleAddFurniture(template)}
              className="w-full p-3 bg-secondary hover:bg-accent rounded border border-border text-left transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="border-2 border-black/15 dark:border-white/20"
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: template.color,
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {template.name[language]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mmToCm(template.width)} x {mmToCm(template.height)} cm
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <CustomFurnitureDialog open={showCustomDialog} onClose={() => setShowCustomDialog(false)} />
    </div>
  );
}
