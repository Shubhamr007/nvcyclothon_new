import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import { GripVertical } from 'lucide-react';

export const LayoutResizeDivider = memo(function LayoutResizeDivider({
  panel,
  currentWidth,
  minWidth,
  maxWidth,
  onResize,
  onResizeEnd,
  onReset,
  label,
  className = '',
  disabled = false,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const latestWidthRef = useRef(currentWidth);

  latestWidthRef.current = currentWidth;

  const handlePointerDown = useCallback(
    (e) => {
      if (disabled || e.button !== 0) return;
      e.preventDefault();

      const startX = e.clientX;
      const initialWidth = latestWidthRef.current;
      isDraggingRef.current = true;
      setIsDragging(true);

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      const onPointerMove = (moveEvent) => {
        if (!isDraggingRef.current) return;
        const deltaX = moveEvent.clientX - startX;
        const rawWidth = panel === 'ai' ? initialWidth - deltaX : initialWidth + deltaX;
        const clamped = Math.max(minWidth, Math.min(maxWidth, rawWidth));
        latestWidthRef.current = clamped;
        onResize(clamped);
      };

      const onPointerUp = () => {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        onResizeEnd(latestWidthRef.current);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [disabled, panel, minWidth, maxWidth, onResize, onResizeEnd]
  );

  useEffect(() => {
    return () => {
      if (isDraggingRef.current) {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };
  }, []);

  const handleKeyDown = (e) => {
    if (disabled) return;
    const step = e.shiftKey ? 32 : 16;
    let nextWidth = null;

    if (panel === 'ai') {
      if (e.key === 'ArrowLeft') nextWidth = Math.min(maxWidth, currentWidth + step);
      else if (e.key === 'ArrowRight') nextWidth = Math.max(minWidth, currentWidth - step);
    } else {
      if (e.key === 'ArrowRight') nextWidth = Math.min(maxWidth, currentWidth + step);
      else if (e.key === 'ArrowLeft') nextWidth = Math.max(minWidth, currentWidth - step);
    }

    if (e.key === 'Home') nextWidth = minWidth;
    if (e.key === 'End') nextWidth = maxWidth;

    if (nextWidth !== null) {
      e.preventDefault();
      onResize(nextWidth);
      onResizeEnd(nextWidth);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onReset?.();
    }
  };

  return (
    <div
      role="separator"
      tabIndex={disabled ? -1 : 0}
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={Math.round(currentWidth)}
      aria-valuemin={minWidth}
      aria-valuemax={maxWidth}
      onPointerDown={handlePointerDown}
      onDoubleClick={onReset}
      onKeyDown={handleKeyDown}
      title={`${label} (${Math.round(currentWidth)}px) • Drag to resize, double-click to reset`}
      className={`relative z-20 group flex items-center justify-center w-2.5 -mx-1 select-none cursor-col-resize outline-none shrink-0 transition-colors ${
        disabled ? 'pointer-events-none opacity-0' : ''
      } ${className}`}
    >
      {/* Invisible expanded hit area */}
      <div className="absolute inset-y-0 -left-1 -right-1" aria-hidden="true" />

      {/* Visible hairline divider */}
      <div
        className={`h-full w-px transition-colors ${
          isDragging
            ? 'bg-[#0078d4] w-0.5'
            : 'bg-slate-200 dark:bg-[#2A2D35] group-hover:bg-[#0078d4] group-focus-visible:bg-[#0078d4]'
        }`}
        aria-hidden="true"
      />

      {/* Floating Grip indicator on hover/drag */}
      <div
        className={`absolute pointer-events-none flex items-center justify-center h-7 w-3.5 rounded bg-white dark:bg-[#1C1E24] border border-slate-300 dark:border-[#383C46] shadow-xs text-slate-400 dark:text-slate-400 group-hover:text-[#0078d4] dark:group-hover:text-[#50e6ff] transition-opacity duration-150 ${
          isDragging ? 'opacity-100 scale-105 border-[#0078d4]' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
        }`}
        aria-hidden="true"
      >
        <GripVertical className="h-3 w-3" />
      </div>
    </div>
  );
});

LayoutResizeDivider.propTypes = {
  panel: PropTypes.oneOf(['sidebar', 'ai']).isRequired,
  currentWidth: PropTypes.number.isRequired,
  minWidth: PropTypes.number.isRequired,
  maxWidth: PropTypes.number.isRequired,
  onResize: PropTypes.func.isRequired,
  onResizeEnd: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

LayoutResizeDivider.defaultProps = {
  className: '',
  disabled: false,
};

export default LayoutResizeDivider;
