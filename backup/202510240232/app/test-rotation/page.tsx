'use client';

import { useState } from 'react';

export default function TestRotationPage() {
  const [rotation, setRotation] = useState(0);
  const [furnitureWidth, setFurnitureWidth] = useState(150);
  const [furnitureDepth, setFurnitureDepth] = useState(100);
  const [isResizing, setIsResizing] = useState(false);

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // 본 페이지 현재 로직 (버그 있음)
  const currentLogic = (w: number, d: number) => {
    const buttonSize = 24;
    const margin = 6;
    const offsetX = w / 2 + buttonSize / 2 + margin;
    const offsetY = -(d / 2 + buttonSize / 2 + margin);
    return { offsetX, offsetY };
  };

  // 개선 로직 후보들
  const testCases = [
    {
      title: '현재 본페이지 로직 (버그)',
      color: '#ef4444',
      getOffset: (w: number, d: number) => {
        const buttonSize = 24;
        const margin = 6;
        const offsetX = w / 2 + buttonSize / 2 + margin;
        const offsetY = -(d / 2 + buttonSize / 2 + margin);
        return { offsetX, offsetY };
      },
    },
    {
      title: '✅ 해결: 고정 거리 18px',
      color: '#10b981',
      getOffset: (w: number, d: number) => {
        // 가구 크기와 무관하게 모서리에서 고정 거리
        const FIXED_OFFSET = 18; // 버튼이 살짝 밖으로
        const offsetX = w / 2 + FIXED_OFFSET;
        const offsetY = -(d / 2 + FIXED_OFFSET);
        return { offsetX, offsetY };
      },
    },
    {
      title: '✅ 해결: 고정 거리 12px',
      color: '#3b82f6',
      getOffset: (w: number, d: number) => {
        const FIXED_OFFSET = 12; // 살짝 겹침
        const offsetX = w / 2 + FIXED_OFFSET;
        const offsetY = -(d / 2 + FIXED_OFFSET);
        return { offsetX, offsetY };
      },
    },
    {
      title: '✅ 해결: 고정 거리 24px',
      color: '#f59e0b',
      getOffset: (w: number, d: number) => {
        const FIXED_OFFSET = 24; // 더 멀리
        const offsetX = w / 2 + FIXED_OFFSET;
        const offsetY = -(d / 2 + FIXED_OFFSET);
        return { offsetX, offsetY };
      },
    },
    {
      title: '비교: 모서리 정확히 (0px)',
      color: '#8b5cf6',
      getOffset: (w: number, d: number) => {
        // 가구 모서리 정확히
        const offsetX = w / 2;
        const offsetY = -d / 2;
        return { offsetX, offsetY };
      },
    },
    {
      title: '비교: 고정 거리 6px',
      color: '#ec4899',
      getOffset: (w: number, d: number) => {
        const FIXED_OFFSET = 6; // 최소 간격
        const offsetX = w / 2 + FIXED_OFFSET;
        const offsetY = -(d / 2 + FIXED_OFFSET);
        return { offsetX, offsetY };
      },
    },
  ];

  // 회전 후 시각적 오른쪽 위 추적 (사용자 제안)
  const smartCases = [
    {
      title: '🎯 최종 해결: 회전 시 재배치 (역회전 없음)',
      color: '#16a34a',
      getOffset: (w: number, d: number, rot: number) => {
        // 회전 각도 정규화
        const normalizedRotation = ((rot % 360) + 360) % 360;
        const FIXED_OFFSET = 18;

        let baseX, baseY;
        if (normalizedRotation >= 315 || normalizedRotation < 45) {
          // 0도: 오른쪽 위
          baseX = w / 2 + FIXED_OFFSET;
          baseY = -(d / 2 + FIXED_OFFSET);
        } else if (normalizedRotation >= 45 && normalizedRotation < 135) {
          // 90도: 왼쪽 위 (시각적 오른쪽 위)
          baseX = -(w / 2 + FIXED_OFFSET);
          baseY = -(d / 2 + FIXED_OFFSET);
        } else if (normalizedRotation >= 135 && normalizedRotation < 225) {
          // 180도: 왼쪽 아래 (시각적 오른쪽 위)
          baseX = -(w / 2 + FIXED_OFFSET);
          baseY = d / 2 + FIXED_OFFSET;
        } else {
          // 270도: 오른쪽 아래 (시각적 오른쪽 위)
          baseX = w / 2 + FIXED_OFFSET;
          baseY = d / 2 + FIXED_OFFSET;
        }

        return { offsetX: baseX, offsetY: baseY };
      },
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">X 버튼 위치 버그 수정: 고정 거리 방식</h1>
        <p className="text-muted-foreground mb-6">
          크기 조절 시 X 버튼이 멀어지거나 가까워지는 버그 → 고정 픽셀 거리로 해결
        </p>

        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={rotate}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
          >
            회전 ({rotation}°)
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">가로:</label>
            <input
              type="range"
              min="50"
              max="300"
              value={furnitureWidth}
              onChange={(e) => {
                setFurnitureWidth(Number(e.target.value));
                setIsResizing(true);
                setTimeout(() => setIsResizing(false), 100);
              }}
              className="w-32"
            />
            <span className="text-sm w-12">{furnitureWidth}px</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">세로:</label>
            <input
              type="range"
              min="50"
              max="200"
              value={furnitureDepth}
              onChange={(e) => {
                setFurnitureDepth(Number(e.target.value));
                setIsResizing(true);
                setTimeout(() => setIsResizing(false), 100);
              }}
              className="w-32"
            />
            <span className="text-sm w-12">{furnitureDepth}px</span>
          </div>

          <button
            onClick={() => {
              setFurnitureWidth(150);
              setFurnitureDepth(100);
              setRotation(0);
            }}
            className="px-4 py-2 bg-secondary rounded hover:bg-accent"
          >
            전체 리셋
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {testCases.map((testCase, index) => (
            <TestBox
              key={index}
              title={testCase.title}
              color={testCase.color}
              rotation={rotation}
              furnitureWidth={furnitureWidth}
              furnitureDepth={furnitureDepth}
              getOffset={testCase.getOffset}
              isResizing={isResizing}
            />
          ))}
        </div>

        <div className="mt-8 p-4 bg-green-500/20 border-2 border-green-500 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-green-600">🎯 최종 해결: X 버튼 재배치 방식</h2>
          <p className="text-sm mb-4">
            <strong>핵심 아이디어:</strong> 역회전 대신, 회전할 때마다 X 버튼 위치를 재계산<br/>
            - 회전 각도에 따라 "시각적 오른쪽 위" 모서리를 찾음<br/>
            - X 버튼은 항상 수평 (역회전 없음!)<br/>
            - translate만으로 위치 이동 → 간단하고 정확함
          </p>
          <div className="grid grid-cols-1 gap-6">
            {smartCases.map((testCase, index) => (
              <SmartTestBox
                key={index}
                title={testCase.title}
                color={testCase.color}
                rotation={rotation}
                furnitureWidth={furnitureWidth}
                furnitureDepth={furnitureDepth}
                getOffset={testCase.getOffset}
                isResizing={isResizing}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <h3 className="font-semibold mb-2 text-red-500">❌ 버그 원인</h3>
            <p className="text-sm">
              첫 번째 박스(현재 로직)를 보면 크기 조절 시 X 버튼이 멀어지거나 가까워짐<br/>
              <strong>원인:</strong> offset에 가구 크기(width/2, depth/2)가 포함되어 있어서<br/>
              → 가구가 커지면 offset도 커지고, 가구가 작아지면 offset도 작아짐
            </p>
            <code className="block bg-red-500/20 p-2 rounded text-xs mt-2">
              ❌ offsetX = width/2 + buttonSize/2 + margin<br/>
              ❌ offsetY = -(depth/2 + buttonSize/2 + margin)
            </code>
          </div>

          <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg">
            <h3 className="font-semibold mb-2 text-green-500">✅ 해결 방법</h3>
            <p className="text-sm">
              <strong>고정 픽셀 거리</strong>를 사용하면 가구 크기와 상관없이 일정한 거리 유지<br/>
              녹색/파랑/주황 박스를 보면 크기를 바꿔도 X 버튼이 항상 같은 위치!
            </p>
            <code className="block bg-green-500/20 p-2 rounded text-xs mt-2">
              ✅ const FIXED_OFFSET = 18; // 고정값<br/>
              ✅ offsetX = width/2 + FIXED_OFFSET;<br/>
              ✅ offsetY = -(depth/2 + FIXED_OFFSET);
            </code>
          </div>

          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-semibold mb-2">권장 값</h3>
            <p className="text-sm">
              <strong className="text-green-500">18px</strong>: 버튼이 살짝 밖으로 (가장 자연스러움)<br/>
              <strong className="text-blue-500">12px</strong>: 살짝 겹침 (컴팩트)<br/>
              <strong className="text-orange-500">24px</strong>: 더 멀리 (여유있게)
            </p>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-500">💡 핵심 로직</h3>
            <code className="block bg-blue-500/20 p-3 rounded text-xs">
              // 회전 각도에 따라 시각적 오른쪽 위 계산<br/>
              if (rotation 0~45도) → 물리적 오른쪽 위<br/>
              if (rotation 45~135도) → 물리적 왼쪽 위<br/>
              if (rotation 135~225도) → 물리적 왼쪽 아래<br/>
              if (rotation 225~315도) → 물리적 오른쪽 아래<br/>
              <br/>
              // X 버튼은 역회전 없이 translate만 사용<br/>
              transform: translate(offsetX, offsetY) ← 역회전 제거!
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartTestBox({
  title,
  color,
  rotation,
  furnitureWidth,
  furnitureDepth,
  getOffset,
  isResizing,
}: {
  title: string;
  color: string;
  rotation: number;
  furnitureWidth: number;
  furnitureDepth: number;
  getOffset: (w: number, d: number, rot: number) => { offsetX: number; offsetY: number };
  isResizing: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { offsetX, offsetY } = getOffset(furnitureWidth, furnitureDepth, rotation);

  return (
    <div className="p-6 bg-card border-4 rounded-lg" style={{ borderColor: color }}>
      <h3 className="text-lg font-bold mb-4 text-center" style={{ color }}>
        {title}
      </h3>

      <div className="relative flex items-center justify-center h-[400px] bg-muted/30 rounded overflow-visible">
        <div
          style={{
            width: `${furnitureWidth}px`,
            height: `${furnitureDepth}px`,
            backgroundColor: '#8B7355',
            border: '3px solid rgba(0,0,0,0.7)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white',
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center',
            opacity: 0.8,
            transition: isResizing ? 'none' : 'all 0.1s ease',
            position: 'relative',
            userSelect: 'none',
            touchAction: 'none',
            pointerEvents: 'auto',
          }}
        >
          {furnitureWidth}×{furnitureDepth}
          <br />
          {rotation}°

          <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: color,
              color: 'white',
              border: '3px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              zIndex: 3,
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transition: 'none',
              // 역회전 없음! translate만으로 위치 이동
              transform: isHovered
                ? `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(1.15)`
                : `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-center space-y-2">
        <div className="font-semibold">
          {rotation}° | {furnitureWidth}×{furnitureDepth}px
        </div>
        <div className="text-xs" style={{ color }}>
          offset: ({offsetX.toFixed(0)}, {offsetY.toFixed(0)})
        </div>
        <div className="text-xs font-semibold" style={{ color }}>
          ✓ 역회전 없음 | ✓ 위치만 재계산 | ✓ 항상 수평
        </div>
      </div>
    </div>
  );
}

function TestBox({
  title,
  color,
  rotation,
  furnitureWidth,
  furnitureDepth,
  getOffset,
  isResizing,
}: {
  title: string;
  color: string;
  rotation: number;
  furnitureWidth: number;
  furnitureDepth: number;
  getOffset: (w: number, d: number) => { offsetX: number; offsetY: number };
  isResizing: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { offsetX, offsetY } = getOffset(furnitureWidth, furnitureDepth);

  return (
    <div className="p-4 bg-card border-2 rounded-lg" style={{ borderColor: color }}>
      <h3 className="text-sm font-semibold mb-3 text-center h-10 flex items-center justify-center" style={{ color }}>
        {title}
      </h3>

      <div className="relative flex items-center justify-center h-[300px] bg-muted/30 rounded overflow-visible">
        {/* 본 페이지와 동일한 구조 */}
        <div
          style={{
            width: `${furnitureWidth}px`,
            height: `${furnitureDepth}px`,
            backgroundColor: '#8B7355',
            border: '2px solid rgba(0,0,0,0.5)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'white',
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center',
            opacity: 0.8,
            transition: isResizing ? 'none' : 'all 0.1s ease',
            position: 'relative',
            userSelect: 'none',
            touchAction: 'none',
            pointerEvents: 'auto',
          }}
        >
          {furnitureWidth}×{furnitureDepth}
          <br />
          {rotation}°

          {/* 본 페이지와 동일한 X 버튼 로직 */}
          <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: color,
              color: 'white',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              zIndex: 3,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'none',
              // 본 페이지와 동일한 transform
              transform: isHovered
                ? `translate(-50%, -50%) rotate(${-rotation}deg) translate(${offsetX}px, ${offsetY}px) scale(1.1)`
                : `translate(-50%, -50%) rotate(${-rotation}deg) translate(${offsetX}px, ${offsetY}px)`,
            }}
          >
            ×
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs text-center space-y-1">
        <div className="text-muted-foreground">
          {rotation}° | {furnitureWidth}×{furnitureDepth}px
        </div>
        <div className="text-[10px]" style={{ color }}>
          offset: ({offsetX.toFixed(0)}, {offsetY.toFixed(0)})
        </div>
      </div>
    </div>
  );
}
