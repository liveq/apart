'use client';

import { useState } from 'react';
import { useFurnitureStore } from '@/lib/stores/furniture-store';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface MeasurementToolProps {
  isActive: boolean;
  scale: number;
  calibratedScale: number | null;
  displayScale: number;
  eraserMode?: boolean;
}

interface MeasurementLineProps {
  measurement: any;
  scale: number;
  calibratedScale: number | null;
  displayScale: number;
  eraserMode: boolean;
  onRemove: (id: string) => void;
  t: (key: string) => string;
}

function MeasurementLine({ measurement, scale, calibratedScale, displayScale, eraserMode, onRemove, t }: MeasurementLineProps) {
  const [isHovered, setIsHovered] = useState(false);

  const x1 = measurement.startX * scale;
  const y1 = measurement.startY * scale;
  const x2 = measurement.endX * scale;
  const y2 = measurement.endY * scale;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Apply calibrated scale to get real distance
  let realDistance = measurement.distance;
  if (calibratedScale && displayScale) {
    // Convert image distance to real distance
    realDistance = measurement.distance * (displayScale / calibratedScale);
  }

  const distanceCm = (realDistance / 10).toFixed(1);
  const distanceM = (realDistance / 1000).toFixed(2);

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#FF0000"
        strokeWidth={eraserMode ? "8" : "2"}
        strokeDasharray="5,5"
        style={{ cursor: eraserMode ? 'pointer' : 'default' }}
        onClick={(e) => {
          if (eraserMode) {
            e.stopPropagation();
            onRemove(measurement.id);
          }
        }}
      />

      {/* Start Point */}
      <circle cx={x1} cy={y1} r="4" fill="#FF0000" />

      {/* End Point */}
      <circle cx={x2} cy={y2} r="4" fill="#FF0000" />

      {/* Distance Label */}
      <g transform={`translate(${midX}, ${midY})`}>
        <rect
          x="-40"
          y="-15"
          width="80"
          height="30"
          fill="white"
          stroke="#FF0000"
          strokeWidth="1"
          rx="4"
        />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#FF0000"
          fontSize="12"
          fontWeight="bold"
        >
          {distanceCm} {t('cm')}
        </text>
        <text
          x="0"
          y="12"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#666"
          fontSize="10"
        >
          ({distanceM} {t('m')})
        </text>
      </g>

      {/* Delete button - only show when hovered */}
      {isHovered && (
        <g transform={`translate(${midX + 45}, ${midY - 15})`}>
          <circle
            cx="0"
            cy="0"
            r="12"
            fill="#ef4444"
            stroke="white"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onClick={() => onRemove(measurement.id)}
          />
          <text
            x="0"
            y="1"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="16"
            fontWeight="bold"
            style={{ cursor: 'pointer', pointerEvents: 'none' }}
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
}

export default function MeasurementTool({ isActive, scale, calibratedScale, displayScale, eraserMode = false }: MeasurementToolProps) {
  const { t } = useTranslation();
  const { measurements, removeMeasurement } = useFurnitureStore();

  if (!isActive && measurements.length === 0) return null;

  return (
    <>
      {/* Measurement Lines */}
      {measurements.map((measurement) => (
        <MeasurementLine
          key={measurement.id}
          measurement={measurement}
          scale={scale}
          calibratedScale={calibratedScale}
          displayScale={displayScale}
          eraserMode={eraserMode}
          onRemove={removeMeasurement}
          t={t}
        />
      ))}

      {/* Hint Text */}
      {isActive && (
        <foreignObject x="10" y="10" width="250" height="40">
          <div className="flex items-start">
            <div className="px-3 py-2 bg-blue-500 text-white rounded text-sm shadow-lg">
              {t('clickTwoPoints')}
            </div>
          </div>
        </foreignObject>
      )}
    </>
  );
}
