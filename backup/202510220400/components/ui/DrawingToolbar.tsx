'use client';

import { useState, useEffect, useRef } from 'react';
import { useDrawingStore, DrawingTool, LineStyle, EraserMode } from '@/lib/stores/drawing-store';

export default function DrawingToolbar() {
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
  const [showSettings, setShowSettings] = useState(false);
  const [showGuidelineColorPicker, setShowGuidelineColorPicker] = useState(false);
  const [showEraserModePicker, setShowEraserModePicker] = useState(false);

  const fillColorPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const thicknessPickerRef = useRef<HTMLDivElement>(null);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (fillColorPickerRef.current && !fillColorPickerRef.current.contains(event.target as Node)) {
        setShowFillColorPicker(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (thicknessPickerRef.current && !thicknessPickerRef.current.contains(event.target as Node)) {
        setShowThicknessPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const thicknessPresets = [1, 2, 3, 5, 8, 10, 15, 20];

  const handleToolClick = (tool: DrawingTool) => {
    if (currentTool === tool && tool !== 'select') {
      // 같은 버튼 다시 누르면 선택 모드로 전환
      setCurrentTool('select');
    } else {
      setCurrentTool(tool);
    }
  };

  if (toolbarCollapsed) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 300,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '14px', color: '#666' }}>그리기 도구</span>
        <button
          onClick={() => setToolbarCollapsed(false)}
          style={{
            padding: '4px 12px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          펼치기 ▼
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.98)',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          padding: '8px 12px',
          display: 'flex',
          flexWrap: 'nowrap',
          gap: '6px',
          maxWidth: '98vw',
          alignItems: 'center',
        }}
      >
      {/* Tools */}
      <button
        onClick={() => handleToolClick('select')}
        style={{
          padding: '6px 10px',
          backgroundColor: currentTool === 'select' ? '#3b82f6' : '#f3f4f6',
          color: currentTool === 'select' ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentTool === 'select' ? 'bold' : 'normal',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title="선택"
      >
        ✋
      </button>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => handleToolClick('line')}
          style={{
            padding: '6px 10px',
            backgroundColor: currentTool === 'line' ? '#3b82f6' : '#f3f4f6',
            color: currentTool === 'line' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: currentTool === 'line' ? 'bold' : 'normal',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
          title="선 그리기"
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
            onClick={() => setContinuousMode(!continuousMode)}
          >
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={() => {}}
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
        onClick={() => handleToolClick('rectangle')}
        style={{
          padding: '6px 10px',
          backgroundColor: currentTool === 'rectangle' ? '#3b82f6' : '#f3f4f6',
          color: currentTool === 'rectangle' ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentTool === 'rectangle' ? 'bold' : 'normal',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title="사각형"
      >
        ⬛
      </button>

      <button
        onClick={() => handleToolClick('circle')}
        style={{
          padding: '6px 10px',
          backgroundColor: currentTool === 'circle' ? '#3b82f6' : '#f3f4f6',
          color: currentTool === 'circle' ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentTool === 'circle' ? 'bold' : 'normal',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title="원/타원"
      >
        ●
      </button>

      <button
        onClick={() => handleToolClick('text')}
        style={{
          padding: '6px 10px',
          backgroundColor: currentTool === 'text' ? '#3b82f6' : '#f3f4f6',
          color: currentTool === 'text' ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentTool === 'text' ? 'bold' : 'normal',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title="텍스트"
      >
        T
      </button>

      <button
        onClick={() => handleToolClick('pen')}
        style={{
          padding: '6px 10px',
          backgroundColor: currentTool === 'pen' ? '#3b82f6' : '#f3f4f6',
          color: currentTool === 'pen' ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: currentTool === 'pen' ? 'bold' : 'normal',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title="펜 (자유곡선 / Ctrl+직선)"
      >
        ✏️
      </button>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => handleToolClick('eraser')}
          style={{
            padding: '6px 10px',
            backgroundColor: currentTool === 'eraser' ? '#6b7280' : '#f3f4f6',
            color: currentTool === 'eraser' ? 'white' : '#333',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: currentTool === 'eraser' ? 'bold' : 'normal',
            fontSize: '13px',
            whiteSpace: 'nowrap',
          }}
          title="지우개"
        >
          🗑️
        </button>
        {currentTool === 'eraser' && (
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
              onClick={() => setEraserMode('universal')}
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
              onClick={() => setEraserMode('shape')}
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
              onClick={() => setEraserMode('furniture')}
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

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />

      {/* Thickness */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowThicknessPicker(!showThicknessPicker)}
          style={{
            padding: '6px 10px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          두께: {thickness}px ▼
        </button>
        {showThicknessPicker && (
          <div
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
                onClick={() => {
                  setThickness(t);
                  setShowThicknessPicker(false);
                }}
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
              onChange={(e) => setThickness(parseInt(e.target.value) || 1)}
              style={{
                gridColumn: '1 / -1',
                padding: '4px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              placeholder="직접 입력"
            />
          </div>
        )}
      </div>

      {/* Line Style */}
      <select
        value={lineStyle}
        onChange={(e) => setLineStyle(e.target.value as LineStyle)}
        style={{
          padding: '6px 10px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        <option value="solid">실선 ━</option>
        <option value="dashed">파선 ──</option>
        <option value="dotted">점선 ···</option>
      </select>

      {/* Color */}
      <div style={{ position: 'relative' }} ref={colorPickerRef}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          style={{
            padding: '6px 10px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          색상:
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
                  onClick={() => {
                    setColor(c);
                    setShowColorPicker(false);
                  }}
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
              onChange={(e) => setColor(e.target.value)}
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
              onClick={() => setShowFillColorPicker(!showFillColorPicker)}
              style={{
                padding: '6px 10px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              채우기:
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
                      onClick={() => {
                        setFillColor(`rgba(${parseInt(c.slice(1, 3), 16)}, ${parseInt(c.slice(3, 5), 16)}, ${parseInt(c.slice(5, 7), 16)}, ${opacity})`);
                        setShowFillColorPicker(false);
                      }}
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
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
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
            onChange={(e) => setFontSize(parseInt(e.target.value) || 16)}
            style={{
              width: '60px',
              padding: '6px',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
            }}
            placeholder="크기"
          />
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            style={{
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

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />

      {/* Grid */}
      <button
        onClick={() => setShowGrid(!showGrid)}
        style={{
          padding: '6px 10px',
          backgroundColor: showGrid ? '#22c55e' : '#f3f4f6',
          color: showGrid ? 'white' : '#333',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title="격자 표시"
      >
        ⊞
      </button>

      <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb' }} />

      {/* Settings */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        style={{
          padding: '6px 10px',
          backgroundColor: '#f3f4f6',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title="설정"
      >
        ⚙
      </button>

      {/* Collapse */}
      <button
        onClick={() => setToolbarCollapsed(true)}
        style={{
          padding: '6px 10px',
          backgroundColor: '#f3f4f6',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          whiteSpace: 'nowrap',
        }}
        title="접기"
      >
        ▲
      </button>

      {/* Settings dropdown */}
      {showSettings && (
        <div
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
            설정
          </h3>

          {/* Guideline color picker */}
          <div style={{ marginBottom: '12px', position: 'relative' }}>
            <button
              onClick={() => setShowGuidelineColorPicker(!showGuidelineColorPicker)}
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
                      onClick={() => {
                        setGuidelineColor(c);
                        setShowGuidelineColorPicker(false);
                      }}
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
                  onChange={(e) => setGuidelineColor(e.target.value)}
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

          <div style={{ fontSize: '13px', color: '#999', marginTop: '8px' }}>
            <p>• 경고 팝업 초기화</p>
            <p>• 격자 간격 설정</p>
            <p>• 스냅 설정</p>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
