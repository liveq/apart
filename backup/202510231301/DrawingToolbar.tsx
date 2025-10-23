'use client';

import { useState, useEffect, useRef } from 'react';
import { useDrawingStore, DrawingTool, LineStyle, EraserMode } from '@/lib/stores/drawing-store';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import HelpDialog from './HelpDialog';

export default function DrawingToolbar() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const {
    currentTool,
    setCurrentTool,
    eraserMode,
    setEraserMode,
    color,
    setColor,
    fillColor,
    setFillColor,
    thickness,
    setThickness,
    lineStyle,
    setLineStyle,
    opacity,
    setOpacity,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    showGrid,
    setShowGrid,
    continuousMode,
    setContinuousMode,
    toolbarCollapsed,
    setToolbarCollapsed,
    guidelineColor,
    setGuidelineColor,
  } = useDrawingStore();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);
  const [showThicknessPicker, setShowThicknessPicker] = useState(false);
  const [showLineStylePicker, setShowLineStylePicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuidelineColorPicker, setShowGuidelineColorPicker] = useState(false);
  const [showEraserModePicker, setShowEraserModePicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showIconGuide, setShowIconGuide] = useState(false);
  const [mobileColumns, setMobileColumns] = useState(8);
  const [menuWidth, setMenuWidth] = useState<string>('fit-content');
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);
  const [isSingleLine, setIsSingleLine] = useState(true);

  const fillColorPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const thicknessPickerRef = useRef<HTMLDivElement>(null);
  const lineStylePickerRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const eraserModePickerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Long press handler for mobile tooltips
  const handleLongPressStart = (text: string, e: React.TouchEvent | React.MouseEvent) => {
    if (!isMobile) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    longPressTimer.current = setTimeout(() => {
      setTooltip({ text, x: clientX, y: clientY - 50 });
    }, 500); // 0.5초 롱프레스
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setTooltip(null);
  };

  const colorPalette = [
    '#000000', // 검정
    '#ffffff', // 흰색
    '#ef4444', // 빨강
    '#3b82f6', // 파랑
    '#22c55e', // 초록
    '#f59e0b', // 주황
    '#8b5cf6', // 보라
    '#6b7280', // 회색
  ];

  const guidelineColorPalette = [
    '#00d4ff', // 청록 (기본)
    '#ff00ff', // 마젠타
    '#00ff00', // 초록
    '#ffff00', // 노랑
    '#ff6600', // 주황
    '#ff0066', // 핑크
  ];

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      if (fillColorPickerRef.current && !fillColorPickerRef.current.contains(target)) {
        setShowFillColorPicker(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(false);
      }
      if (thicknessPickerRef.current && !thicknessPickerRef.current.contains(target)) {
        setShowThicknessPicker(false);
      }
      if (lineStylePickerRef.current && !lineStylePickerRef.current.contains(target)) {
        setShowLineStylePicker(false);
      }
      if (eraserModePickerRef.current && !eraserModePickerRef.current.contains(target)) {
        setShowEraserModePicker(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
        setShowGuidelineColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Calculate optimal column count based on screen width (mobile only)
  useEffect(() => {
    if (!isMobile) return;

    const calculateColumns = () => {
      const screenWidth = window.innerWidth;
      const toolbarPadding = 16; // padding 8px * 2
      const toolbarGap = 4; // gap between items
      const availableWidth = screenWidth - toolbarPadding - 20; // 20px margin

      // 총 버튼 개수: 대략 14개 정도 (도구 7개 + 옵션 5개 + 설정 2개)
      const totalButtons = 14;

      // 2줄로 만들기 위해 열 개수 계산
      const targetRows = 2;
      const columnsFor2Rows = Math.ceil(totalButtons / targetRows);

      // 버튼 크기 계산: (사용 가능한 폭 - gap들) / 열 개수
      const buttonWidth = (availableWidth - (columnsFor2Rows - 1) * toolbarGap) / columnsFor2Rows;

      // 버튼이 너무 작아지지 않도록 최소 크기 체크 (35px)
      let finalColumns = columnsFor2Rows;
      if (buttonWidth < 35) {
        // 버튼이 너무 작으면 열 개수 줄이기 (3줄로)
        finalColumns = Math.ceil(totalButtons / 3);
      }

      setMobileColumns(finalColumns);
    };

    calculateColumns();
    window.addEventListener('resize', calculateColumns);
    return () => window.removeEventListener('resize', calculateColumns);
  }, [isMobile]);

  // Auto-collapse toolbar on narrow screens - REMOVED
  // This was causing the toolbar to immediately collapse when user tried to expand it
  // useEffect(() => {
  //   if (isNarrowScreen && !toolbarCollapsed) {
  //     setToolbarCollapsed(true);
  //   }
  // }, [isNarrowScreen, toolbarCollapsed, setToolbarCollapsed]);

  // Calculate menu width dynamically and check narrow screen
  useEffect(() => {
    const calculateMenuWidth = () => {
      const screenWidth = window.innerWidth;

      // Check if screen is narrow (580px or less)
      setIsNarrowScreen(screenWidth <= 580);

      // 버튼 개수와 크기 (현재 선택된 도구에 따라 동적으로 계산)
      // 기본 normal 버튼: 선택 + 선 + 사각형 + 원 + 텍스트 + 펜 + 지우개 = 7개
      // 고정 버튼: 그리드 + 설정 + 접기 = 3개
      let normalButtons = 10; // 7 (tools) + 3 (fixed buttons)
      let dividers = isMobile ? 0 : 3; // 데스크톱에서만 구분선 3개 (도구|옵션, 옵션|그리드, 그리드|설정)

      const normalButtonWidth = isMobile ? 40 : 44;
      const dividerWidth = 1; // 구분선 실제 폭
      const gap = isMobile ? 4 : 6;
      const padding = isMobile ? 16 : 24; // 8px * 2 or 12px * 2

      // 개별 dropdown 버튼 폭 (모바일/데스크톱 각각)
      // border 1px × 2 (좌우) = 2px 포함
      const thicknessWidth = isMobile ? 52 : 87;
      const lineStyleWidth = isMobile ? 52 : 72;
      const colorWidth = isMobile ? 52 : 112;
      const fillColorWidth = isMobile ? 52 : 92; // rectangle, circle일 때
      const fontSizeInputWidth = 62; // text일 때 (60px + border 2px)
      const fontFamilySelectWidth = 87; // text일 때 (85px + border 2px)

      // 항상 표시되는 dropdown: 두께 + 선스타일 + 색상
      let dropdownWidthSum = thicknessWidth + lineStyleWidth + colorWidth;

      // 도구별 추가 dropdown
      if (currentTool === 'rectangle' || currentTool === 'circle') {
        dropdownWidthSum += fillColorWidth; // 채우기
      } else if (currentTool === 'text') {
        dropdownWidthSum += fontSizeInputWidth + fontFamilySelectWidth; // 폰트크기 + 폰트
      }

      // 전체 요소 개수 계산 (gap 계산용)
      let dropdownCount = 3; // 기본: thickness, lineStyle, color
      if (currentTool === 'rectangle' || currentTool === 'circle') {
        dropdownCount += 1; // fillColor
      } else if (currentTool === 'text') {
        dropdownCount += 2; // fontSize, fontFamily
      }
      let totalItems = normalButtons + dropdownCount + dividers;

      // 모든 요소가 1줄에 필요한 최소 폭
      const minWidthForOneLine =
        (normalButtons * normalButtonWidth) +
        dropdownWidthSum +
        (dividers * dividerWidth) +
        ((totalItems - 1) * gap) + // 전체 요소 간 gap
        padding;

      // 화면의 95% (모바일) 또는 98% (데스크톱)
      const maxScreenWidth = screenWidth * (isMobile ? 0.95 : 0.98);


      if (minWidthForOneLine <= maxScreenWidth) {
        // 1줄에 다 들어갈 수 있음 → 정확히 그 폭만큼 사용 (더 이상 넓어지지 않음)
        setMenuWidth(`${minWidthForOneLine}px`);
        setIsSingleLine(true);
      } else {
        // 1줄에 안 들어감 → 화면 폭까지 넓히기 (버튼들이 2줄, 3줄로)
        setMenuWidth(`${Math.floor(maxScreenWidth)}px`);
        setIsSingleLine(false);
      }
    };

    calculateMenuWidth();
    window.addEventListener('resize', calculateMenuWidth);
    return () => window.removeEventListener('resize', calculateMenuWidth);
  }, [isMobile, currentTool]);

  const thicknessPresets = [1, 2, 3, 5, 8, 10, 15, 20];

  // 모바일 버튼 공통 스타일 - 고정 크기로 통일
  const mobileButtonStyle = isMobile ? {
    padding: '4px',
    width: '40px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  } : {
    padding: '6px 10px',
    width: '44px',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const mobileDropdownButtonStyle = isMobile ? {
    padding: '4px 6px',
    minWidth: '50px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2px',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  } : {
    padding: '6px 10px',
    minWidth: '110px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    justifyContent: 'center',
    flexShrink: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };


  const handleToolClick = (tool: DrawingTool) => {
    if (currentTool === tool && tool !== 'select') {
      // 같은 버튼 다시 누르면 선택 모드로 전환
      setCurrentTool('select');
    } else {
      setCurrentTool(tool);
    }
  };

  if (toolbarCollapsed) {
    return null;
  }

  return (
    <>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: isNarrowScreen ? '55px' : '55px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          padding: isMobile ? '6px 8px' : '8px 12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: isMobile ? '4px' : '6px',
          width: menuWidth,
          maxWidth: isMobile ? 'calc(100vw - 20px)' : '95vw',
          alignItems: 'center',
          justifyContent: isSingleLine ? 'center' : 'flex-start',
        }}
      >
      {/* Tools */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToolClick('select');
        }}
        style={{
          ...mobileButtonStyle,
          backgroundColor: currentTool === 'select' ? '#3b82f6' : '#f3f4f6',
          color: currentTool === 'select' ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentTool === 'select' ? 'bold' : 'normal',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title={t('select')}
      >
        ✋
      </button>

      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToolClick('line');
          }}
          style={{
            ...mobileButtonStyle,
            backgroundColor: currentTool === 'line' ? '#3b82f6' : '#f3f4f6',
            color: currentTool === 'line' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: currentTool === 'line' ? 'bold' : 'normal',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
          title={t('lineDrawing')}
        >
          🖊
        </button>
        {currentTool === 'line' && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              zIndex: 1000,
              whiteSpace: 'nowrap',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setContinuousMode(!continuousMode);
            }}
          >
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={() => {}}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '16px',
                height: '16px',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '13px', color: '#333', userSelect: 'none' }}>
              연속모드
            </span>
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToolClick('rectangle');
        }}
        style={{
          ...mobileButtonStyle,
          backgroundColor: currentTool === 'rectangle' ? '#3b82f6' : '#f3f4f6',
          color: currentTool === 'rectangle' ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentTool === 'rectangle' ? 'bold' : 'normal',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title={t('rectangle')}
      >
        ⬛
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToolClick('circle');
        }}
        style={{
          ...mobileButtonStyle,
          backgroundColor: currentTool === 'circle' ? '#3b82f6' : '#f3f4f6',
          color: currentTool === 'circle' ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentTool === 'circle' ? 'bold' : 'normal',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title={t('circleEllipse')}
      >
        ●
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToolClick('text');
        }}
        style={{
          ...mobileButtonStyle,
          backgroundColor: currentTool === 'text' ? '#3b82f6' : '#f3f4f6',
          color: currentTool === 'text' ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentTool === 'text' ? 'bold' : 'normal',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title={t('text')}
      >
        T
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToolClick('pen');
        }}
        style={{
          ...mobileButtonStyle,
          backgroundColor: currentTool === 'pen' ? '#3b82f6' : '#f3f4f6',
          color: currentTool === 'pen' ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentTool === 'pen' ? 'bold' : 'normal',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title={t('penFreehand')}
      >
        ✏️
      </button>

      <div style={{ position: 'relative' }} ref={eraserModePickerRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowEraserModePicker(!showEraserModePicker);
            if (currentTool !== 'eraser') {
              handleToolClick('eraser');
            }
          }}
          style={{
            ...mobileButtonStyle,
            backgroundColor: currentTool === 'eraser' ? '#6b7280' : '#f3f4f6',
            color: currentTool === 'eraser' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: currentTool === 'eraser' ? 'bold' : 'normal',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
          title={t('eraser')}
        >
          {currentTool === 'eraser' ? (
            eraserMode === 'universal' ? '✨' :
            eraserMode === 'shape' ? '📐' :
            '🛋️'
          ) : '🧹'}
        </button>
        {showEraserModePicker && currentTool === 'eraser' && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '4px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 1000,
              whiteSpace: 'nowrap',
              minWidth: '150px',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEraserMode('universal');
                setShowEraserModePicker(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                padding: '8px 12px',
                backgroundColor: eraserMode === 'universal' ? '#6b7280' : '#f3f4f6',
                color: eraserMode === 'universal' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              ✨ 만능지우개
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEraserMode('shape');
                setShowEraserModePicker(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                padding: '8px 12px',
                backgroundColor: eraserMode === 'shape' ? '#6b7280' : '#f3f4f6',
                color: eraserMode === 'shape' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              📐 도형지우개
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEraserMode('furniture');
                setShowEraserModePicker(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                padding: '8px 12px',
                backgroundColor: eraserMode === 'furniture' ? '#6b7280' : '#f3f4f6',
                color: eraserMode === 'furniture' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              🛋️ 가구지우개
            </button>
          </div>
        )}
      </div>

      {!isMobile && <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />}

      {/* Thickness */}
      <div style={{ position: 'relative' }} ref={thicknessPickerRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowThicknessPicker(!showThicknessPicker);
          }}
          style={{
            ...mobileDropdownButtonStyle,
            minWidth: isMobile ? '50px' : '85px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          {isMobile ? `${thickness}px` : `${t('thicknessLabel')}: ${thickness}px`} ▼
        </button>
        {showThicknessPicker && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '4px',
              minWidth: '160px',
              zIndex: 1000,
            }}
          >
            {thicknessPresets.map((t) => (
              <button
                key={t}
                onClick={(e) => {
                  e.stopPropagation();
                  setThickness(t);
                  setShowThicknessPicker(false);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  padding: '6px',
                  backgroundColor: thickness === t ? '#3b82f6' : '#f3f4f6',
                  color: thickness === t ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {t}px
              </button>
            ))}
            <input
              type="number"
              value={thickness}
              onChange={(e) => {
                e.stopPropagation();
                setThickness(parseInt(e.target.value) || 1);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                gridColumn: '1 / -1',
                padding: '4px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              placeholder={t('inputCustom')}
            />
          </div>
        )}
      </div>

      {/* Line Style */}
      <div style={{ position: 'relative' }} ref={lineStylePickerRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLineStylePicker(!showLineStylePicker);
          }}
          style={{
            ...mobileDropdownButtonStyle,
            minWidth: isMobile ? '50px' : '70px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
          title={t('lineType')}
        >
          {isMobile ? (
            <>
              {lineStyle === 'solid' && '━'}
              {lineStyle === 'dashed' && '╍'}
              {lineStyle === 'dotted' && '···'}
            </>
          ) : (
            <>
              {lineStyle === 'solid' && t('solidLine').substring(0, 7)}
              {lineStyle === 'dashed' && t('dashedLine').substring(0, 9)}
              {lineStyle === 'dotted' && t('dottedLine').substring(0, 9)}
            </>
          )}
          <span>▼</span>
        </button>
        {showLineStylePicker && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '140px',
              zIndex: 1000,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLineStyle('solid');
                setShowLineStylePicker(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '8px 12px',
                backgroundColor: lineStyle === 'solid' ? '#3b82f6' : '#f3f4f6',
                color: lineStyle === 'solid' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              {t('solidLine')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLineStyle('dashed');
                setShowLineStylePicker(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '8px 12px',
                backgroundColor: lineStyle === 'dashed' ? '#3b82f6' : '#f3f4f6',
                color: lineStyle === 'dashed' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              {t('dashedLine')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLineStyle('dotted');
                setShowLineStylePicker(false);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                padding: '8px 12px',
                backgroundColor: lineStyle === 'dotted' ? '#3b82f6' : '#f3f4f6',
                color: lineStyle === 'dotted' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                textAlign: 'left',
              }}
            >
              {t('dottedLine')}
            </button>
          </div>
        )}
      </div>

      {/* Color */}
      <div style={{ position: 'relative' }} ref={colorPickerRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          style={{
            ...mobileDropdownButtonStyle,
            minWidth: isMobile ? '50px' : '110px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
        >
          {!isMobile && `${t('lineColorLabel')}:`}
          <span
            style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              backgroundColor: color,
              border: '1px solid #ccc',
              borderRadius: '3px',
            }}
          />
          ▼
        </button>
        {showColorPicker && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 10000,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              {colorPalette.map((c) => (
                <button
                  key={c}
                  onClick={(e) => {
                    e.stopPropagation();
                    setColor(c);
                    setShowColorPicker(false);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: c,
                    border: color === c ? '3px solid #3b82f6' : '2px solid #666',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                ></button>
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                e.stopPropagation();
                setColor(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            />
          </div>
        )}
      </div>

      {/* Shape-specific options */}
      {(currentTool === 'rectangle' || currentTool === 'circle') && (
        <>
          <div style={{ position: 'relative' }} ref={fillColorPickerRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFillColorPicker(!showFillColorPicker);
              }}
              style={{
                ...mobileDropdownButtonStyle,
                minWidth: isMobile ? '50px' : '90px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
            >
              {!isMobile && '채우기:'}
              <span
                style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  backgroundColor: fillColor,
                  border: '1px solid #ccc',
                  borderRadius: '3px',
                }}
              />
              ▼
            </button>
            {showFillColorPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 10000,
                  minWidth: '180px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  {colorPalette.map((c) => (
                    <button
                      key={c}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFillColor(`rgba(${parseInt(c.slice(1, 3), 16)}, ${parseInt(c.slice(3, 5), 16)}, ${parseInt(c.slice(5, 7), 16)}, ${opacity})`);
                        setShowFillColorPicker(false);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: c,
                        border: '2px solid #666',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    ></button>
                  ))}
                </div>
                <label style={{ fontSize: '12px', color: '#666' }}>
                  투명도: {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => {
                    e.stopPropagation();
                    setOpacity(parseFloat(e.target.value));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Text-specific options */}
      {currentTool === 'text' && (
        <>
          <input
            type="number"
            value={fontSize}
            onChange={(e) => {
              e.stopPropagation();
              setFontSize(parseInt(e.target.value) || 16);
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '60px',
              padding: '6px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
            }}
            placeholder={t('size')}
          />
          <select
            value={fontFamily}
            onChange={(e) => {
              e.stopPropagation();
              setFontFamily(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '85px',
              padding: '6px 10px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            <option value="Arial">Arial</option>
            <option value="Noto Sans KR">본고딕</option>
            <option value="Nanum Gothic">나눔고딕</option>
            <option value="Courier New">Courier</option>
          </select>
        </>
      )}

      {!isMobile && <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />}

      {/* Grid */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowGrid(!showGrid);
        }}
        style={{
          ...mobileButtonStyle,
          backgroundColor: showGrid ? '#22c55e' : '#f3f4f6',
          color: showGrid ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title={t('gridDisplay')}
      >
        ⊞
      </button>

      {!isMobile && <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />}

      {/* Settings */}
      <div style={{ position: 'relative' }} ref={settingsRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSettings(!showSettings);
          }}
          style={{
            ...mobileButtonStyle,
            backgroundColor: showSettings ? '#3b82f6' : '#f3f4f6',
            color: showSettings ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
          title={t('settings')}
        >
          ⚙
        </button>

        {/* Settings dropdown */}
        {showSettings && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: '220px',
            zIndex: 1000,
          }}
        >
          <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold' }}>
            {t('settings')}
          </h3>

          {/* Guideline color picker */}
          <div style={{ marginBottom: '12px', position: 'relative' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGuidelineColorPicker(!showGuidelineColorPicker);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              <span>가이드라인 색상</span>
              <span
                style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  backgroundColor: guidelineColor,
                  border: '2px solid #666',
                  borderRadius: '3px',
                }}
              />
            </button>

            {showGuidelineColorPicker && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 10001,
                  minWidth: '180px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  {guidelineColorPalette.map((c) => (
                    <button
                      key={c}
                      onClick={(e) => {
                        e.stopPropagation();
                        setGuidelineColor(c);
                        setShowGuidelineColorPicker(false);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: c,
                        border: guidelineColor === c ? '3px solid #3b82f6' : '2px solid #666',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    ></button>
                  ))}
                </div>
                <input
                  type="color"
                  value={guidelineColor}
                  onChange={(e) => {
                    e.stopPropagation();
                    setGuidelineColor(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    height: '32px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                />
              </div>
            )}
          </div>

          {/* Help button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowHelp(true);
              setShowSettings(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              textAlign: 'left',
              marginTop: '8px',
            }}
          >
            ❓ 도움말
          </button>

          {/* Reset warning popups */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              localStorage.removeItem('dontShowHomeWarning');
              localStorage.removeItem('dontShowLoadWarning');
              localStorage.removeItem('dontShowResetWarning');
              localStorage.removeItem('dontShowDirectDrawWarning');
              localStorage.removeItem('dontShowSampleWarning');
              alert(t('resetWarningsConfirm'));
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              textAlign: 'left',
              marginTop: '8px',
            }}
          >
            🔔 {t('resetWarnings')}
          </button>

          <div style={{ fontSize: '13px', color: '#999', marginTop: '12px' }}>
            <p>• 격자 간격 설정</p>
            <p>• 스냅 설정</p>
          </div>
        </div>
        )}
      </div>

      {/* Collapse */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setToolbarCollapsed(true);
        }}
        style={{
          ...mobileButtonStyle,
          backgroundColor: '#f3f4f6',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title={t('collapse')}
      >
        ▲
      </button>
    </div>

    {/* Help Dialog */}
    <HelpDialog open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
}
