'use client';

import { useAppStore } from '@/lib/stores/app-store';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useDrawingStore } from '@/lib/stores/drawing-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { exportAsJPEG } from '@/lib/utils/export';
import { RefObject, useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import LayoutsDialog from './LayoutsDialog';
import CanvasSizeDialog from './CanvasSizeDialog';
import toast from 'react-hot-toast';
import type { DrawingTool, EraserMode } from '@/lib/stores/drawing-store';

const PDFConversionModal = dynamic(() => import('./PDFConversionModal'), { ssr: false });

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
  const { language: currentLang, setLanguage, calibratedScale, setCalibratedScale, uploadedImageUrl, setUploadedImageUrl, showSampleFloorPlan, setShowSampleFloorPlan, showCanvasSizeDialog, setShowCanvasSizeDialog, pages, addPages, setCurrentPageIndex } = useAppStore();
  const { snapEnabled, setSnapEnabled, snapSize, setSnapSize, undo, redo, clearAll } = useFurnitureStore();
  const { setDrawingMode, setCanvasSize, clearAllElements, drawingMode, saveCurrentWork, currentTool, eraserMode: currentEraserMode, toolbarCollapsed, setToolbarCollapsed } = useDrawingStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadWorkDialog, setShowLoadWorkDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    showDontShowAgain?: boolean;
    dontShowAgainKey?: string;
  } | null>(null);
  const [dontShowAgainChecked, setDontShowAgainChecked] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
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
    setShowConfirmDialog({
      title: '가구 전체 삭제',
      message: '모든 가구를 삭제합니다.\n\n계속하시겠습니까?',
      onConfirm: () => {
        clearAll();
        toast.success('가구가 삭제되었습니다');
        setShowConfirmDialog(null);
      },
    });
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
        duration: 1500,
        style: {
          background: '#f59e0b',
          color: '#fff',
        },
      });
      return;
    }
    onToggleMeasurement();
  };

  const hasUnsavedWork = () => {
    // If no floor plan is loaded (initial screen), nothing to lose
    if (!uploadedImageUrl && !showSampleFloorPlan && !drawingMode) {
      return false;
    }

    // If drawing mode and has a saved work ID, it's already saved
    const { currentWorkId } = useDrawingStore.getState();
    if (drawingMode && currentWorkId) {
      return false;
    }

    const { furniture } = useFurnitureStore.getState();
    const { elements } = useDrawingStore.getState();
    return furniture.length > 0 || elements.length > 0;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is a PDF
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      // PDF 파일 - 모달 표시
      setPdfFile(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 또는 PDF 파일만 업로드 가능합니다');
      return;
    }

    // 이미지 파일 처리 (기존 로직 그대로)
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    // Convert image to base64 for localStorage persistence
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;

      // Clear calibration when uploading new image
      setCalibratedScale(null);
      clearAll();

      // Disable sample floor plan and set uploaded image as base64
      setShowSampleFloorPlan(false);
      setUploadedImageUrl(base64String);

      toast.success('도면이 업로드되었습니다');

      // Show calibration reminder after 1 second
      setTimeout(() => {
        toast('⚠️ 정확한 치수를 위해 배율적용을 설정해주세요', {
          id: 'upload-calibration-reminder',
          duration: 1500,
          style: {
            background: '#f59e0b',
            color: '#fff',
          },
        });
      }, 1000);
    };

    reader.onerror = () => {
      toast.error('이미지 업로드 중 오류가 발생했습니다');
    };

    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleLoadSample = () => {
    const dontShowKey = 'dontShowSampleWarning';
    const dontShow = localStorage.getItem(dontShowKey) === 'true';

    const loadSample = () => {
      // Clear uploaded image and show sample floor plan
      setUploadedImageUrl(null);
      setShowSampleFloorPlan(true);
      toast.success('샘플 도면이 로드되었습니다');
      setShowConfirmDialog(null);
    };

    // If no unsaved work or user chose "don't show again", just load sample
    if (!hasUnsavedWork() || dontShow) {
      loadSample();
      return;
    }

    // Show warning dialog
    setShowConfirmDialog({
      title: '샘플 도면 로드',
      message: '저장되지 않은 작업이 있습니다.\n샘플을 로드하면 현재 작업이 모두 삭제됩니다.\n\n계속하시겠습니까?',
      onConfirm: loadSample,
      showDontShowAgain: true,
      dontShowAgainKey: dontShowKey,
    });
  };

  const handleReset = () => {
    const dontShowKey = 'dontShowResetWarning';
    setShowConfirmDialog({
      title: '전체 초기화',
      message: '도면과 모든 가구를 삭제합니다.\n\n계속하시겠습니까?',
      onConfirm: () => {
        // Clear everything: uploaded image, sample, furniture, calibration, and drawings
        setUploadedImageUrl(null);
        setShowSampleFloorPlan(false);
        setCalibratedScale(null);
        clearAll();
        clearAllElements();
        setDrawingMode(false);
        toast.success('초기화되었습니다');
        setShowConfirmDialog(null);
      },
      showDontShowAgain: true,
      dontShowAgainKey: dontShowKey,
    });
  };

  const handleGoToHome = () => {
    // Check if "don't show again" is checked
    const dontShowKey = 'dontShowHomeWarning';
    const dontShow = localStorage.getItem(dontShowKey) === 'true';

    const resetToHome = () => {
      setUploadedImageUrl(null);
      setShowSampleFloorPlan(false);
      clearAll();
      setCalibratedScale(null);
      setDrawingMode(false);
      clearAllElements();
      toast.success('메인 페이지로 돌아왔습니다');
      setShowConfirmDialog(null);
    };

    // If no unsaved work or user chose "don't show again", just reset
    if (!hasUnsavedWork() || dontShow) {
      resetToHome();
      return;
    }

    // Show warning dialog
    setShowConfirmDialog({
      title: '메인 페이지로 이동',
      message: '저장되지 않은 작업이 있습니다.\n메인 페이지로 돌아가면 현재 작업이 모두 삭제됩니다.\n\n계속하시겠습니까?',
      onConfirm: resetToHome,
      showDontShowAgain: true,
      dontShowAgainKey: dontShowKey,
    });
  }
  // 프로젝트 전체 저장 (모든 페이지)
  const handleSaveProject = () => {
    if (pages.length === 0) {
      toast.error('저장할 페이지가 없습니다');
      return;
    }

    const projectData = {
      version: '1.0',
      pages: pages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `apart-project-${timestamp}.apart`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`프로젝트가 저장되었습니다 (${pages.length}개 페이지)`);
  };

  // 프로젝트 전체 로드
  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.apart')) {
      toast.error('.apart 파일만 로드할 수 있습니다');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const projectData = JSON.parse(event.target?.result as string);
        
        if (!projectData.pages || !Array.isArray(projectData.pages)) {
          toast.error('올바른 프로젝트 파일이 아닙니다');
          return;
        }

        // 기존 pages 초기화 후 새로운 pages 추가
        useAppStore.setState({ pages: projectData.pages, currentPageIndex: 0 });
        
        toast.success(`프로젝트가 로드되었습니다 (${projectData.pages.length}개 페이지)`);
      } catch (error) {
        console.error('프로젝트 로드 실패:', error);
        toast.error('프로젝트 파일을 읽을 수 없습니다');
      }
    };

    reader.readAsText(file);
    
    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

;

  const handleLoadClick = () => {
    // Check if "don't show again" is checked
    const dontShowKey = 'dontShowLoadWarning';
    const dontShow = localStorage.getItem(dontShowKey) === 'true';

    const openLoadDialog = () => {
      setShowLoadWorkDialog(true);
      setShowConfirmDialog(null);
    };

    // If no unsaved work or user chose "don't show again", just open load dialog
    if (!hasUnsavedWork() || dontShow) {
      openLoadDialog();
      return;
    }

    // Show warning dialog
    setShowConfirmDialog({
      title: '로드하기',
      message: '저장되지 않은 작업이 있습니다.\n로드하면 현재 작업이 모두 삭제됩니다.\n\n계속하시겠습니까?',
      onConfirm: openLoadDialog,
      showDontShowAgain: true,
      dontShowAgainKey: dontShowKey,
    });
  };

  const handleDirectDraw = () => {
    // Turn off eraser mode when entering drawing mode
    if (eraserMode) {
      onToggleEraser();
    }
    setShowCanvasSizeDialog(true);
  };

  const handleCanvasSizeConfirm = (width: number, height: number, unit: 'mm' | 'cm' | 'm') => {
    // Hide existing floor plans
    setUploadedImageUrl(null);
    setShowSampleFloorPlan(false);

    // Set canvas size
    setCanvasSize(width, height, unit);

    // Enable drawing mode
    setDrawingMode(true);

    // Clear calibration
    setCalibratedScale(null);

    setShowCanvasSizeDialog(false);
    toast.success('캔버스가 생성되었습니다');
  };

  // Get icon for current drawing tool
  const getToolIcon = (tool: DrawingTool, eraserModeType: EraserMode): string => {
    switch (tool) {
      case 'select':
        return '✋';
      case 'line':
        return '🖊';
      case 'rectangle':
        return '⬛';
      case 'circle':
        return '●';
      case 'text':
        return 'T';
      case 'pen':
        return '✏️';
      case 'eraser':
        return eraserModeType === 'universal' ? '✨' : eraserModeType === 'shape' ? '📐' : '🛋️';
      default:
        return '✋';
    }
  };

  const getToolLabel = (tool: DrawingTool): string => {
    switch (tool) {
      case 'select':
        return t('select');
      case 'line':
        return t('lineDrawing');
      case 'rectangle':
        return t('rectangle');
      case 'circle':
        return t('circleEllipse');
      case 'text':
        return t('text');
      case 'pen':
        return t('penFreehand');
      case 'eraser':
        return t('eraser');
      default:
        return t('select');
    }
  };

  return (
    <div className="h-16 bg-card border-b border-border flex items-center px-4 gap-4 overflow-x-auto">
      <div className="flex items-center gap-2">
        <h1
          className="text-xl font-bold hidden md:block cursor-pointer hover:text-primary transition-colors"
          onClick={handleGoToHome}
          title="메인 페이지로 돌아가기"
        >
          {t('title')}
        </h1>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        <button
          onClick={handleDirectDraw}
          className="px-3 py-2 bg-purple-500 text-white hover:bg-purple-600 hover:ring-2 hover:ring-purple-300 hover:shadow-md rounded text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1"
          title={t('createFloorPlanTooltip')}
        >
          ✏️ {t('directDraw')}
        </button>

        <button
          onClick={handleUploadClick}
          className="px-3 py-2 bg-green-500 text-white hover:bg-green-600 hover:ring-2 hover:ring-green-300 hover:shadow-md rounded text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1"
          title={t('uploadFloorPlanTooltip')}
        >
          📁 {t('uploadButton')}
        </button>

        <button
          onClick={handleLoadSample}
          className="px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 hover:ring-2 hover:ring-blue-300 hover:shadow-md rounded text-sm font-medium transition-all whitespace-nowrap"
          title={t('sampleFloorPlanTooltip')}
        >
          {t('sample')}
        </button>

        <button
          onClick={handleReset}
          className="px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 hover:ring-2 hover:ring-gray-300 hover:shadow-md rounded text-sm font-medium transition-all whitespace-nowrap"
          title={t('resetAllTooltip')}
        >
          {t('reset')}
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={onToggleCalibration}
          className={
            'px-3 py-2 rounded text-sm font-medium transition-all hover:shadow-md whitespace-nowrap flex items-center gap-1 ' +
            (calibrationMode
              ? 'bg-orange-500 text-white hover:bg-orange-600 hover:ring-2 hover:ring-orange-300 shadow-lg'
              : calibratedScale
              ? 'bg-blue-500 text-white hover:bg-blue-600 hover:ring-2 hover:ring-blue-300'
              : 'bg-yellow-500 text-white hover:bg-yellow-600 hover:ring-2 hover:ring-yellow-300')
          }
          title={calibratedScale ? `${t('calibrated')} (${calibratedScale.toFixed(5)})` : t('calibrationTooltip')}
        >
          ⭐ {t('calibration')}
        </button>

        {calibratedScale && (
          <button
            onClick={() => {
              setShowConfirmDialog({
                title: t('resetCalibration'),
                message: t('confirmResetCalibration'),
                onConfirm: () => {
                  clearAll();
                  setCalibratedScale(null);
                  setShowConfirmDialog(null);
                },
              });
            }}
            className="px-2 py-2 bg-red-500 text-white hover:bg-red-600 hover:ring-2 hover:ring-red-300 hover:shadow-md rounded text-xs transition-all whitespace-nowrap"
            title={t('resetCalibrationTooltip')}
          >
            {t('resetCalibration')}
          </button>
        )}

        {/* Current Drawing Tool Indicator */}
        <button
          onClick={() => {
            if (toolbarCollapsed) {
              setToolbarCollapsed(false);
            }
          }}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1"
          title={`현재 도구: ${getToolLabel(currentTool)}`}
        >
          {getToolIcon(currentTool, currentEraserMode)}
          <span className="hidden md:inline">{getToolLabel(currentTool)}</span>
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={undo}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all whitespace-nowrap"
          title={t('undo')}
        >
          ↶
        </button>

        <button
          onClick={redo}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all whitespace-nowrap"
          title={t('redo')}
        >
          ↷
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          className={"px-3 py-2 rounded-l text-sm transition-all hover:shadow-md whitespace-nowrap " + (
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
          className="px-2 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded-r text-sm border-l border-border transition-all cursor-pointer whitespace-nowrap"
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
          className={"px-3 py-2 rounded text-sm font-medium transition-all hover:shadow-md whitespace-nowrap " + (
            measurementMode
              ? 'bg-red-500 text-white hover:bg-red-600 hover:ring-2 hover:ring-red-300'
              : 'bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30'
          )}
          title={measurementMode ? t('measurementEndTooltip') : t('measurementTooltip')}
        >
          {measurementMode ? t('measurementEnd') : t('measurement')}
        </button>

        <button
          onClick={onToggleEraser}
          className={"px-3 py-2 rounded text-sm font-medium transition-all hover:shadow-md whitespace-nowrap " + (
            eraserMode
              ? 'bg-red-500 text-white hover:bg-red-600 hover:ring-2 hover:ring-red-300'
              : 'bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30'
          )}
          title={eraserMode ? t('eraserEndTooltip') : t('eraserTooltip')}
        >
          {eraserMode ? t('eraserEnd') : t('eraser')}
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={handleClearAll}
          className="px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 hover:ring-2 hover:ring-gray-300 hover:shadow-md rounded text-sm transition-all whitespace-nowrap"
          title={t('clearAllFurnitureTooltip')}
        >
          {t('clearAllFurniture')}
        </button>

        <button
          onClick={() => {
            // Always show save dialog regardless of mode
            setShowSaveDialog(true);
          }}
          className="px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all whitespace-nowrap flex items-center gap-1"
          title={t('saveTooltip')}
        >
          💾 {t('saveButton')}
        </button>

        <button
          onClick={handleLoadClick}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all whitespace-nowrap flex items-center gap-1"
          title={t('loadTooltip')}
        >
          📂 {t('loadButton')}
        </button>

        {/* 프로젝트 저장/로드 버튼 (페이지 여러 개 저장) */}
        {pages.length > 0 && (
          <>
            <div className="w-px h-6 bg-border mx-2" />
            
            <button
              onClick={handleSaveProject}
              className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 hover:ring-2 hover:ring-green-300 hover:shadow-md rounded text-sm transition-all whitespace-nowrap flex items-center gap-1"
              title="모든 페이지를 프로젝트 파일로 저장"
            >
              💾📄 프로젝트 저장
            </button>

            <input
              type="file"
              accept=".apart"
              onChange={handleLoadProject}
              style={{ display: 'none' }}
              id="project-file-input"
            />
            <button
              onClick={() => document.getElementById('project-file-input')?.click()}
              className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all whitespace-nowrap flex items-center gap-1"
              title="프로젝트 파일 로드 (.apart)"
            >
              📂📄 프로젝트 로드
            </button>
          </>
        )}

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={handleExport}
          className="px-3 py-2 bg-primary text-primary-foreground hover:opacity-90 hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all whitespace-nowrap"
          title={t('exportJPEG')}
        >
          {t('export')}
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        <button
          onClick={toggleLanguage}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all whitespace-nowrap"
          title={t('language')}
        >
          {currentLang === 'ko' ? 'EN' : 'KO'}
        </button>

        <button
          onClick={toggleTheme}
          className="px-3 py-2 bg-secondary hover:bg-accent hover:ring-2 hover:ring-primary/30 hover:shadow-md rounded text-sm transition-all whitespace-nowrap"
          title={t('theme')}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <LayoutsDialog
        key={showSaveDialog ? 'save' : 'save-closed'}
        open={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        mode="save"
      />
      <CanvasSizeDialog
        open={showCanvasSizeDialog}
        onClose={() => setShowCanvasSizeDialog(false)}
        onConfirm={handleCanvasSizeConfirm}
      />
      <LayoutsDialog
        key={showLoadWorkDialog ? 'load-work' : 'load-work-closed'}
        open={showLoadWorkDialog}
        onClose={() => setShowLoadWorkDialog(false)}
        mode="load"
      />

      {/* PDF Conversion Modal */}
      {pdfFile && (
        <PDFConversionModal
          file={pdfFile}
          onConvert={(convertedPages) => {
            // 변환된 여러 페이지를 pages에 추가
            const newPages = convertedPages.map((page, index) => {
              const reader = new FileReader();
              return new Promise<any>((resolve) => {
                reader.onloadend = () => {
                  resolve({
                    id: `page-${Date.now()}-${index}`,
                    name: `페이지 ${page.pageNumber}`,
                    imageUrl: reader.result as string,
                    furniture: [],
                    drawings: [],
                    createdAt: Date.now(),
                  });
                };
                reader.readAsDataURL(page.blob);
              });
            });

            Promise.all(newPages).then((pages) => {
              useAppStore.getState().addPages(pages);
              toast.success(`${pages.length}개 페이지가 로드되었습니다`);
            });

            setPdfFile(null);
          }}
          onCancel={() => setPdfFile(null)}
        />
      )}

      {/* Custom Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
          onClick={() => {
            setShowConfirmDialog(null);
            setDontShowAgainChecked(false);
          }}
        >
          <div
            className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-md m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">⚠️ {showConfirmDialog.title}</h3>
            <p className="text-muted-foreground mb-6 whitespace-pre-line">
              {showConfirmDialog.message}
            </p>
            {showConfirmDialog.showDontShowAgain && (
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowAgainChecked}
                  onChange={(e) => setDontShowAgainChecked(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="dontShowAgain" className="text-sm cursor-pointer select-none">
                  {t('dontShowAgain')}
                </label>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(null);
                  setDontShowAgainChecked(false);
                }}
                className="flex-1 px-4 py-2 bg-secondary hover:bg-accent rounded transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  if (showConfirmDialog.showDontShowAgain && showConfirmDialog.dontShowAgainKey && dontShowAgainChecked) {
                    localStorage.setItem(showConfirmDialog.dontShowAgainKey, 'true');
                  }
                  showConfirmDialog.onConfirm();
                  setDontShowAgainChecked(false);
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded transition-colors"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
