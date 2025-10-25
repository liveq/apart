'use client';

import { useState, useRef, useEffect } from 'react';
import PropertiesPanel from './PropertiesPanel';
import LayerPanel from './LayerPanel';

const STORAGE_KEY = 'rightSidebar_splitRatio';
const DEFAULT_SPLIT_RATIO = 66.67; // PropertiesPanel 2/3, LayerPanel 1/3
const MIN_PANEL_HEIGHT = 150; // Minimum height in pixels

export default function RightSidebar() {
  const [splitRatio, setSplitRatio] = useState(DEFAULT_SPLIT_RATIO);
  const [isDragging, setIsDragging] = useState(false);
  const [isLayerPanelCollapsed, setIsLayerPanelCollapsed] = useState(false);
  const [isPropertiesPanelCollapsed, setIsPropertiesPanelCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartRatio = useRef<number>(0);

  // Load split ratio from localStorage on mount
  useEffect(() => {
    const savedRatio = localStorage.getItem(STORAGE_KEY);
    if (savedRatio) {
      const ratio = parseFloat(savedRatio);
      if (!isNaN(ratio) && ratio > 0 && ratio < 100) {
        setSplitRatio(ratio);
      }
    }
  }, []);

  // Save split ratio to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, splitRatio.toString());
  }, [splitRatio]);

  // Handle mouse down on resize bar
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartRatio.current = splitRatio;
  };

  // Handle mouse move during drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRect.height;

      // Calculate the change in Y position
      const deltaY = e.clientY - dragStartY.current;

      // Calculate the change in percentage
      const deltaPercentage = (deltaY / containerHeight) * 100;

      // Calculate new ratio
      let newRatio = dragStartRatio.current + deltaPercentage;

      // Apply bounds checking based on MIN_PANEL_HEIGHT
      const minRatioTop = (MIN_PANEL_HEIGHT / containerHeight) * 100;
      const maxRatioTop = 100 - (MIN_PANEL_HEIGHT / containerHeight) * 100;

      newRatio = Math.max(minRatioTop, Math.min(maxRatioTop, newRatio));

      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // When properties panel is collapsed, entire sidebar becomes narrow (48px)
  // No need for conditional rendering - just control the width
  const sidebarWidth = isPropertiesPanelCollapsed ? 'w-12' : '';

  // Calculate heights based on layer panel collapse state
  const layerPanelCollapsedHeight = 60; // Header height when collapsed
  const propertiesPanelHeight = isLayerPanelCollapsed
    ? `calc(100% - ${layerPanelCollapsedHeight}px)`
    : `${splitRatio}%`;
  const layerPanelHeight = isLayerPanelCollapsed
    ? `${layerPanelCollapsedHeight}px`
    : `${100 - splitRatio}%`;

  return (
    <div
      ref={containerRef}
      className={`h-full flex flex-col bg-card border-l border-border ${sidebarWidth}`}
      style={{ userSelect: isDragging ? 'none' : 'auto' }}
    >
      {/* PropertiesPanel - Top Section */}
      <div
        style={{
          height: isPropertiesPanelCollapsed ? '100%' : propertiesPanelHeight,
          minHeight: isLayerPanelCollapsed ? 'auto' : `${MIN_PANEL_HEIGHT}px`,
          display: isPropertiesPanelCollapsed ? 'flex' : undefined
        }}
        className="overflow-hidden flex flex-col"
      >
        <PropertiesPanel onCollapseChange={setIsPropertiesPanelCollapsed} />
      </div>

      {/* Resize Bar - Hidden when layer panel is collapsed OR properties panel is collapsed */}
      {!isLayerPanelCollapsed && !isPropertiesPanelCollapsed && (
        <div
          className={`relative h-[3px] bg-border hover:bg-gray-400 cursor-row-resize flex-shrink-0 transition-colors ${
            isDragging ? 'bg-gray-400' : ''
          }`}
          onMouseDown={handleMouseDown}
          style={{ cursor: 'row-resize' }}
        >
          {/* Optional: Add a grab indicator */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
            <div className="w-8 h-1 bg-gray-500 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}

      {/* LayerPanel - Bottom Section - Visually hidden when properties panel is collapsed but keep mounted to preserve state */}
      <div
        style={{
          height: layerPanelHeight,
          minHeight: isLayerPanelCollapsed ? 'auto' : `${MIN_PANEL_HEIGHT}px`,
          display: isPropertiesPanelCollapsed ? 'none' : 'flex'
        }}
        className="overflow-hidden flex-col"
      >
        <LayerPanel onCollapseChange={setIsLayerPanelCollapsed} />
      </div>
    </div>
  );
}
