'use client';

import { useState, useEffect } from 'react';
import { useDrawingStore, SavedWork } from '@/lib/stores/drawing-store';

interface CanvasSizeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (width: number, height: number, unit: 'mm' | 'cm' | 'm') => void;
  mode?: 'new' | 'continue';
  showNewTab?: boolean; // Whether to show the "새로 그리기" tab
}

export default function CanvasSizeDialog({ open, onClose, onConfirm, mode: initialMode = 'new', showNewTab = true }: CanvasSizeDialogProps) {
  const [mode, setMode] = useState<'new' | 'continue'>(initialMode);
  const [unit, setUnit] = useState<'mm' | 'cm' | 'm'>('mm');
  const [width, setWidth] = useState('11300');
  const [height, setHeight] = useState('6900');
  const [prevUnit, setPrevUnit] = useState<'mm' | 'cm' | 'm'>('mm');
  const { getSavedWorks, loadWork, deleteWork, startNewWork } = useDrawingStore();
  const [savedWorks, setSavedWorks] = useState<SavedWork[]>([]);

  useEffect(() => {
    if (open) {
      // If showNewTab is false, force mode to 'continue'
      setMode(showNewTab ? initialMode : 'continue');
      const works = getSavedWorks();
      setSavedWorks(works.sort((a, b) => b.timestamp - a.timestamp));
    }
  }, [open, getSavedWorks, initialMode, showNewTab]);

  // Auto-convert when unit changes
  useEffect(() => {
    if (unit === prevUnit) return;

    const prevMultiplier = prevUnit === 'mm' ? 1 : prevUnit === 'cm' ? 10 : 1000;
    const newMultiplier = unit === 'mm' ? 1 : unit === 'cm' ? 10 : 1000;

    const currentWidthMm = parseFloat(width) * prevMultiplier;
    const currentHeightMm = parseFloat(height) * prevMultiplier;

    if (!isNaN(currentWidthMm) && !isNaN(currentHeightMm)) {
      setWidth((currentWidthMm / newMultiplier).toFixed(unit === 'm' ? 1 : 0));
      setHeight((currentHeightMm / newMultiplier).toFixed(unit === 'm' ? 1 : 0));
    }

    setPrevUnit(unit);
  }, [unit]);

  const getMultiplier = () => {
    return unit === 'mm' ? 1 : unit === 'cm' ? 10 : 1000;
  };

  const handleNewDrawing = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      alert('올바른 크기를 입력해주세요.');
      return;
    }

    const multiplier = getMultiplier();
    const widthMm = w * multiplier;
    const heightMm = h * multiplier;

    startNewWork(widthMm, heightMm, unit);
    onConfirm(widthMm, heightMm, unit);
    onClose();
  };

  const handleLoadWork = (workId: string) => {
    loadWork(workId);
    onClose();
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteWork = (workId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(workId);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteWork(deleteConfirmId);
      setSavedWorks(getSavedWorks().sort((a, b) => b.timestamp - a.timestamp));
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatSize = (work: SavedWork) => {
    const unit = work.canvasUnit;
    const multiplier = unit === 'mm' ? 1 : unit === 'cm' ? 10 : 1000;
    const width = work.canvasWidth / multiplier;
    const height = work.canvasHeight / multiplier;
    return `${width}${unit} × ${height}${unit}`;
  };

  const getPreviewAspectRatio = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return { width: 200, height: 122 };
    }

    const maxWidth = 200;
    const maxHeight = 150;
    const ratio = w / h;

    if (ratio > maxWidth / maxHeight) {
      return { width: maxWidth, height: maxWidth / ratio };
    } else {
      return { width: maxHeight * ratio, height: maxHeight };
    }
  };

  if (!open) return null;

  const previewSize = getPreviewAspectRatio();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          minWidth: '500px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>
          {showNewTab ? '도면 생성' : '저장된 작업 불러오기'}
        </h2>

        {/* Mode selection - only show if showNewTab is true */}
        {showNewTab && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => setMode('new')}
              style={{
                flex: 1,
                padding: '12px',
                border: mode === 'new' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: mode === 'new' ? '#eff6ff' : 'white',
                cursor: 'pointer',
                fontWeight: mode === 'new' ? 'bold' : 'normal',
                color: mode === 'new' ? '#3b82f6' : '#666',
                fontSize: '16px',
              }}
            >
              📄 새로 그리기
            </button>
            <button
              onClick={() => setMode('continue')}
              style={{
                flex: 1,
                padding: '12px',
                border: mode === 'continue' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: mode === 'continue' ? '#eff6ff' : 'white',
                cursor: 'pointer',
                fontWeight: mode === 'continue' ? 'bold' : 'normal',
                color: mode === 'continue' ? '#3b82f6' : '#666',
                fontSize: '16px',
              }}
            >
              📂 이전 작업 이어하기
            </button>
          </div>
        )}

        {mode === 'new' ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                가로
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '16px',
                }}
                placeholder="11300"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                세로
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '16px',
                }}
                placeholder="6900"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                단위
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {(['mm', 'cm', 'm'] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: unit === u ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: unit === u ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      fontWeight: unit === u ? 'bold' : 'normal',
                      color: unit === u ? '#3b82f6' : '#666',
                      transition: 'all 0.2s',
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#999', marginBottom: '12px' }}>
                비율 미리보기
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '160px',
                }}
              >
                <div
                  style={{
                    width: `${previewSize.width}px`,
                    height: `${previewSize.height}px`,
                    border: '3px solid #3b82f6',
                    borderRadius: '4px',
                    position: 'relative',
                    backgroundColor: '#f3f4f6',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '12px',
                      color: '#666',
                      textAlign: 'center',
                    }}
                  >
                    {width} × {height}
                    <br />
                    {unit}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '14px', color: '#999', marginBottom: '20px', textAlign: 'center' }}>
              💡 기본값: 26평형 아파트 도면 크기 (11.3m × 6.9m)
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '16px',
                }}
              >
                취소
              </button>
              <button
                onClick={handleNewDrawing}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                시작하기
              </button>
            </div>
          </>
        ) : (
          <>
            {savedWorks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p>저장된 작업이 없습니다.</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>새로 그리기를 시작해보세요!</p>
              </div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {savedWorks.map((work) => (
                  <div
                    key={work.id}
                    onClick={() => handleLoadWork(work.id)}
                    style={{
                      padding: '16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {work.name || formatDate(work.timestamp)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {work.name && (
                          <>
                            {formatDate(work.timestamp)}
                            <br />
                          </>
                        )}
                        크기: {formatSize(work)} | 요소: {work.elements.length}개
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteWork(work.id, e)}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#fee',
                        color: '#c00',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fcc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee';
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '6px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '16px',
              }}
            >
              취소
            </button>
          </>
        )}

        {/* Custom Delete Confirmation Dialog */}
        {deleteConfirmId && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
            onClick={() => setDeleteConfirmId(null)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '400px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                ⚠️ 작업 삭제
              </h3>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                이 작업을 삭제하시겠습니까?<br />
                삭제된 작업은 복구할 수 없습니다.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '16px',
                  }}
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
