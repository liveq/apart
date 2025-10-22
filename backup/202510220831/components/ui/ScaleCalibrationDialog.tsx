'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/stores/app-store';

interface ScaleCalibrationDialogProps {
  open: boolean;
  pixelDistance: number;
  onClose: () => void;
  onConfirm: (scale: number) => void;
}

export default function ScaleCalibrationDialog({
  open,
  pixelDistance,
  onClose,
  onConfirm,
}: ScaleCalibrationDialogProps) {
  const [distance, setDistance] = useState('6000');
  const [unit, setUnit] = useState<'mm' | 'cm' | 'm'>('mm');

  if (!open) return null;

  const handleConfirm = () => {
    const distanceValue = parseFloat(distance);
    if (isNaN(distanceValue) || distanceValue <= 0) {
      alert('유효한 거리를 입력해주세요.');
      return;
    }

    // Convert to mm
    let distanceInMm = distanceValue;
    if (unit === 'cm') {
      distanceInMm = distanceValue * 10;
    } else if (unit === 'm') {
      distanceInMm = distanceValue * 1000;
    }

    // Calculate scale (px/mm)
    const scale = pixelDistance / distanceInMm;
    onConfirm(scale);
  };

  const handleCancel = () => {
    setDistance('6000');
    setUnit('mm');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleCancel}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div
        className="bg-card rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">축척 설정</h2>

        <p className="text-sm text-muted-foreground mb-4">
          도면에서 그린 선의 실제 길이를 입력해주세요.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              실제 거리
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="flex-1 px-3 py-2 border border-border rounded bg-background"
                placeholder="6000"
                autoFocus
              />
              <div className="flex bg-secondary rounded overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUnit('mm');
                  }}
                  className={
                    'px-4 py-2 text-sm font-medium transition-colors ' +
                    (unit === 'mm'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent')
                  }
                >
                  mm
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUnit('cm');
                  }}
                  className={
                    'px-4 py-2 text-sm font-medium transition-colors border-x border-border ' +
                    (unit === 'cm'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent')
                  }
                >
                  cm
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUnit('m');
                  }}
                  className={
                    'px-4 py-2 text-sm font-medium transition-colors ' +
                    (unit === 'm'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent')
                  }
                >
                  m
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded">
            <p>도면에서 알고 있는 거리(예: 방 너비 6m)를 선택하여 정확한 축척을 설정할 수 있습니다.</p>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCancel();
            }}
            className="flex-1 px-4 py-2 bg-secondary hover:bg-accent rounded transition-colors"
          >
            취소
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded transition-opacity"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
