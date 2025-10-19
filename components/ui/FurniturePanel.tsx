'use client';

import { useState } from 'react';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useAppStore } from '@/lib/stores/app-store';
import { furnitureTemplates } from '@/data/furniture-templates';
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
    // Show warning if scale is not calibrated (for both uploaded and default images)
    if (!calibratedScale) {
      toast('⚠️ 정확한 치수를 위해 배율적용을 먼저 설정해주세요\n\n배율 설정 시 기존 가구들도 자동으로 크기가 조절됩니다.', {
        id: 'calibration-warning',
        duration: 4000,
        style: {
          background: '#f59e0b',
          color: '#fff',
          whiteSpace: 'pre-line',
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

  const filteredTemplates = selectedCategory
    ? furnitureTemplates.filter((t) => t.category === selectedCategory)
    : furnitureTemplates;

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
            {autoClose ? '✓ 자동닫기' : '자동닫기'}
          </button>
          <button
            onClick={handleSpawnPositionToggle}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              spawnPosition === 'center' ? 'bg-primary/20 text-primary' : 'bg-gray-600/80 text-white'
            }`}
          >
            {spawnPosition === 'center' ? '생성위치:중앙' : '생성위치:좌측'}
          </button>
        </div>

        {/* Compact controls */}
        <div className="px-3 pt-2 pb-2 space-y-2">
          {/* First row: +신규 and main categories */}
          <div className="flex gap-2">
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
            <button
              onClick={() => setSelectedCategory('bed')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === 'bed'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-secondary-foreground'
              }`}
            >
              {t('bed')}
            </button>
            <button
              onClick={() => setSelectedCategory('sofa')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === 'sofa'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/60 text-secondary-foreground'
              }`}
            >
              {t('sofa')}
            </button>
          </div>

          {/* Second row: other categories */}
          <div className="flex gap-2 flex-wrap">
            {['table', 'desk', 'storage', 'appliance'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-secondary-foreground'
                }`}
              >
                {t(cat as any)}
              </button>
            ))}
          </div>
        </div>

        {/* Optimized grid layout */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
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
                <div className="aspect-square w-full flex items-end p-1.5">
                  <div className="w-full bg-black/70 backdrop-blur-sm rounded px-1.5 py-1">
                    <div className="font-semibold text-white leading-tight break-keep" style={{ fontSize: 'clamp(9px, 2.5vw, 11px)' }}>
                      {template.name[language]}
                    </div>
                    <div className="text-white/80 mt-0.5" style={{ fontSize: 'clamp(8px, 2vw, 9px)' }}>
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
          사용자정의가구
        </button>
        <button
          onClick={handleSpawnPositionToggle}
          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            spawnPosition === 'center' ? 'bg-primary text-primary-foreground' : 'bg-gray-600 text-white hover:bg-gray-700'
          }`}
        >
          {spawnPosition === 'center' ? '생성위치:중앙' : '생성위치:좌측'}
        </button>
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
          <button
            onClick={() => setSelectedCategory('bed')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedCategory === 'bed'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {t('bed')}
          </button>
          <button
            onClick={() => setSelectedCategory('sofa')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedCategory === 'sofa'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {t('sofa')}
          </button>
          <button
            onClick={() => setSelectedCategory('table')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedCategory === 'table'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {t('table')}
          </button>
          <button
            onClick={() => setSelectedCategory('desk')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedCategory === 'desk'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {t('desk')}
          </button>
          <button
            onClick={() => setSelectedCategory('storage')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedCategory === 'storage'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {t('storage')}
          </button>
          <button
            onClick={() => setSelectedCategory('appliance')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedCategory === 'appliance'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {t('appliance')}
          </button>
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
