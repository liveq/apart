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
  const { language: currentLang, setLanguage, calibratedScale, setCalibratedScale, uploadedImageUrl, setUploadedImageUrl, showSampleFloorPlan, setShowSampleFloorPlan, showCanvasSizeDialog, setShowCanvasSizeDialog, pages, addPages, setCurrentPageIndex, showCalibrationPulse, triggerCalibrationPulse } = useAppStore();
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if any PDF file exists
    const pdfFile = Array.from(files).find(file =>
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFile) {
      // PDF 파일이 있으면 PDF만 처리 (한 번에 하나만)
      if (files.length > 1) {
        toast.error('PDF는 한 번에 하나만 업로드 가능합니다');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setPdfFile(pdfFile);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // 모든 파일이 이미지인지 확인
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('이미지 또는 PDF 파일만 업로드 가능합니다');
      return;
    }

    if (imageFiles.length !== files.length) {
      toast.error('이미지와 PDF를 함께 업로드할 수 없습니다');
      return;
    }

    // 이미지 파일 처리
    processMultipleImageFiles(imageFiles);
  };

  const processMultipleImageFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // 첫 번째 이미지만 업로드 이미지로 설정 (기존 동작)
    if (files.length === 1) {
      processImageFile(files[0]);
      return;
    }

    // 여러 이미지를 페이지로 추가
    const imageUrls: string[] = [];

    try {
      // 모든 이미지를 base64로 변환
      for (const file of files) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imageUrls.push(base64);
      }

      // 기존 데이터 초기화
      setCalibratedScale(null);
      clearAll();
      setShowSampleFloorPlan(false);
      setUploadedImageUrl(null);

      // 각 이미지를 페이지로 추가
      const newPages = imageUrls.map((url, index) => ({
        id: `page-${Date.now()}-${index}`,
        name: files[index].name,
        imageUrl: url,
      }));

      addPages(newPages);
      setCurrentPageIndex(0);

      toast.success(`${files.length}개의 이미지가 페이지로 추가되었습니다`);

      // 배율 설정 안내
      setTimeout(() => {
        toast('⚠️ 정확한 치수를 위해 배율적용을 설정해주세요', {
          id: 'upload-calibration-reminder',
          duration: 1500,
          style: {
            background: '#f59e0b',
            color: '#fff',
          },
        });
        triggerCalibrationPulse();
      }, 1000);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('이미지 업로드 중 오류가 발생했습니다');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        triggerCalibrationPulse();
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
  // 프로젝트 전체 저장 (통합 버전)
  const handleSaveProject = () => {
    const currentFurniture = useFurnitureStore.getState().furniture;
    const currentElements = useDrawingStore.getState().elements;
    const currentPageIndex = useAppStore.getState().currentPageIndex;

    let pagesToSave = [...pages];

    // 페이지가 없는 경우: 현재 작업을 단일 페이지로 저장
    if (pages.length === 0) {
      const singlePage = {
        id: `page-${Date.now()}`,
        name: uploadedImageUrl ? '업로드 이미지' : showSampleFloorPlan ? '샘플 도면' : '직접 그리기',
        imageUrl: uploadedImageUrl || '',
        furniture: JSON.parse(JSON.stringify(currentFurniture)),
        drawings: JSON.parse(JSON.stringify(currentElements)),
        createdAt: Date.now(),
      };
      pagesToSave = [singlePage];
    } else {
      // 페이지가 있는 경우: 현재 페이지 업데이트
      if (currentPageIndex >= 0 && currentPageIndex < pages.length) {
        pagesToSave[currentPageIndex] = {
          ...pagesToSave[currentPageIndex],
          furniture: JSON.parse(JSON.stringify(currentFurniture)),
          drawings: JSON.parse(JSON.stringify(currentElements)),
        };
      }
    }

    const projectData = {
      version: '1.0',
      pages: pagesToSave,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `apart-project-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Update pages in store if they were created
    if (pages.length === 0) {
      useAppStore.setState({ pages: pagesToSave, currentPageIndex: 0 });
    } else {
      useAppStore.setState({ pages: pagesToSave });
    }

    toast.success(`프로젝트가 저장되었습니다 (${pagesToSave.length}개 페이지)`);
  };

  // 프로젝트 전체 로드
  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && !file.name.endsWith('.apart')) {
      toast.error('.json 또는 .apart 파일만 로드할 수 있습니다');
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

        // Load first page's furniture, drawings, and image
        const firstPage = projectData.pages[0];
        if (firstPage) {
          // Clear current furniture and drawings
          clearAll();
          clearAllElements();

          // Load first page's image (중요!)
          if (firstPage.imageUrl) {
            setUploadedImageUrl(firstPage.imageUrl);
            setShowSampleFloorPlan(false);
          } else {
            setUploadedImageUrl(null);
            setShowSampleFloorPlan(false);
          }

          // Load first page's furniture
          if (firstPage.furniture && firstPage.furniture.length > 0) {
            firstPage.furniture.forEach((item: any) => {
              useFurnitureStore.getState().addFurniture({
                templateId: item.templateId,
                name: item.name,
                x: item.x,
                y: item.y,
                width: item.width,
                depth: item.depth || item.height,
                height: item.height,
                rotation: item.rotation,
                color: item.color,
                category: item.category,
              });
            });
          }

          // Load first page's drawings
          if (firstPage.drawings && firstPage.drawings.length > 0) {
            useDrawingStore.setState({ elements: firstPage.drawings });
          }
        }

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
          multiple
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        <button
          onClick={handleDirectDraw}
          className="px-3 py-2 bg-white text-amber-700 hover:bg-amber-50 hover:ring-2 hover:ring-amber-200 hover:shadow-md rounded text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1 border border-amber-200"
          title={t('createFloorPlanTooltip')}
        >
          ✏️ {t('directDraw')}
        </button>

        <button
          onClick={handleUploadClick}
          className="px-3 py-2 bg-amber-600 text-white hover:bg-amber-700 hover:ring-2 hover:ring-amber-300 hover:shadow-md rounded text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1"
          title={t('uploadFloorPlanTooltip')}
        >
          📁 {t('uploadButton')}
        </button>

        <button
          onClick={handleLoadSample}
          className="px-3 py-2 bg-white text-gray-700 hover:bg-gray-50 hover:ring-2 hover:ring-gray-200 hover:shadow-md rounded text-sm font-medium transition-all whitespace-nowrap border border-gray-200"
          title={t('sampleFloorPlanTooltip')}
        >
          {t('sample')}
        </button>

        <button
          onClick={handleReset}
          className="px-3 py-2 bg-white text-gray-600 hover:bg-gray-50 hover:ring-2 hover:ring-gray-200 hover:shadow-md rounded text-sm font-medium transition-all whitespace-nowrap border border-gray-200"
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
              ? 'bg-amber-600 text-white hover:bg-amber-700 hover:ring-2 hover:ring-amber-300 shadow-lg'
              : calibratedScale
              ? 'bg-amber-500 text-white hover:bg-amber-600 hover:ring-2 hover:ring-amber-200'
              : `bg-white text-amber-600 hover:bg-amber-50 hover:ring-2 hover:ring-amber-200 border border-amber-200 ${showCalibrationPulse ? 'calibration-pulse' : ''}`)
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
            className="px-2 py-2 bg-white text-gray-600 hover:bg-gray-50 hover:ring-2 hover:ring-gray-200 hover:shadow-md rounded text-xs transition-all whitespace-nowrap border border-gray-200"
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
          className="px-3 py-2 bg-white text-gray-600 hover:bg-gray-50 hover:ring-2 hover:ring-gray-200 hover:shadow-md rounded text-sm transition-all whitespace-nowrap border border-gray-200"
          title={t('clearAllFurnitureTooltip')}
        >
          {t('clearAllFurniture')}
        </button>

        {/* 통합 저장/로드 버튼 - 항상 파일 기반 */}
        <button
          onClick={handleSaveProject}
          className="px-3 py-2 bg-amber-600 text-white hover:bg-amber-700 hover:ring-2 hover:ring-amber-300 hover:shadow-md rounded text-sm transition-all whitespace-nowrap flex items-center gap-1"
          title="프로젝트를 파일로 저장"
        >
          💾 {t('saveButton')}
        </button>

        <input
          type="file"
          accept=".apart,.json"
          onChange={handleLoadProject}
          style={{ display: 'none' }}
          id="project-file-input"
        />
        <button
          onClick={() => document.getElementById('project-file-input')?.click()}
          className="px-3 py-2 bg-white text-amber-700 hover:bg-amber-50 hover:ring-2 hover:ring-amber-200 hover:shadow-md rounded text-sm transition-all whitespace-nowrap flex items-center gap-1 border border-amber-200"
          title="저장된 파일 로드"
        >
          📂 {t('loadButton')}
        </button>

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
              // 기존 페이지를 초기화하고 새 페이지로 교체
              useAppStore.setState({
                pages: pages,
                currentPageIndex: 0
              });

              // 기존 가구와 도형도 초기화
              clearAll();
              clearAllElements();

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
