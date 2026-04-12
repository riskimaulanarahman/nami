'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { TabletLayoutMode } from '@/hooks/use-tablet-viewport';

interface TabletShellProps {
  children: React.ReactNode;
  isDesktopFallback?: boolean;
  maxWidth?: number;
  layoutMode?: TabletLayoutMode;
  canvasHeight?: number;
}

export default function TabletShell({
  children,
  isDesktopFallback = false,
  maxWidth = 1280,
  layoutMode = 'regular',
  canvasHeight = 800,
}: TabletShellProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const updateMeasurements = () => {
      if (viewportRef.current) {
        setViewportSize({
          width: viewportRef.current.clientWidth,
          height: viewportRef.current.clientHeight,
        });
      }
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(updateMeasurements);
    if (viewportRef.current) {
      resizeObserver.observe(viewportRef.current);
    }

    window.addEventListener('resize', updateMeasurements);
    window.addEventListener('orientationchange', updateMeasurements);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMeasurements);
      window.removeEventListener('orientationchange', updateMeasurements);
    };
  }, []);

  const scale = React.useMemo(() => {
    if (!viewportSize.width || !viewportSize.height) return 1;

    return Math.min(
      viewportSize.width / maxWidth,
      viewportSize.height / canvasHeight,
      1
    );
  }, [canvasHeight, maxWidth, viewportSize.height, viewportSize.width]);

  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,_#fbfcfe,_#eef2ff)] p-3 dark:bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(180deg,_#020617,_#0f172a)]">
      <div className="mx-auto flex h-full w-full flex-col">
        {isDesktopFallback && (
          <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/80 bg-white/80 px-5 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-500 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <span>Desktop Fallback</span>
            <span>{layoutMode === 'regular' ? '1280x800' : '1024x768'} Tablet Canvas</span>
          </div>
        )}

        <div ref={viewportRef} className="relative flex-1 overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: maxWidth,
              height: canvasHeight,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className={cn(
                'flex h-full w-full flex-col overflow-hidden rounded-[36px] border border-white/80 bg-white/94 shadow-[0_36px_120px_rgba(15,23,42,0.18)] backdrop-blur dark:border-white/10 dark:bg-slate-950/90',
                layoutMode === 'compact' ? 'ring-1 ring-slate-950/5 dark:ring-white/10' : '',
                isDesktopFallback ? 'ring-1 ring-white/50 dark:ring-white/10' : ''
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
