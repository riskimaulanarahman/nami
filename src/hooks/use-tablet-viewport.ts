'use client';

import * as React from 'react';

export const TABLET_MIN_WIDTH = 768;
export const TABLET_COMPACT_WIDTH = 1024;
export const TABLET_COMPACT_HEIGHT = 768;
export const TABLET_REGULAR_WIDTH = 1280;
export const TABLET_REGULAR_HEIGHT = 800;

export type TabletLayoutMode = 'compact' | 'regular';
export type AppShellMode = 'compact' | 'regular' | 'wide';

export interface TabletViewportState {
  width: number;
  height: number;
  isHydrated: boolean;
  isLandscape: boolean;
  isAllowed: boolean;
  isPortraitTablet: boolean;
  isBlockedMobile: boolean;
  isDesktopFallback: boolean;
  layoutMode: TabletLayoutMode;
  appShellMode: AppShellMode;
  canvasWidth: number;
  canvasHeight: number;
  shellMaxWidth: number;
}

function resolveLayoutMode(width: number): TabletLayoutMode {
  return width >= 1180 ? 'regular' : 'compact';
}

function resolveViewportState(
  width: number,
  height: number,
  isHydrated = true
): TabletViewportState {
  const isLandscape = width > height;
  const isBlockedMobile = width > 0 && width < TABLET_MIN_WIDTH;
  const isPortraitTablet = width >= TABLET_MIN_WIDTH && !isLandscape;
  const isAllowed = width >= TABLET_MIN_WIDTH && isLandscape;
  const layoutMode = resolveLayoutMode(width);
  const canvasWidth = layoutMode === 'regular' ? TABLET_REGULAR_WIDTH : TABLET_COMPACT_WIDTH;
  const canvasHeight = layoutMode === 'regular' ? TABLET_REGULAR_HEIGHT : TABLET_COMPACT_HEIGHT;
  const isDesktopFallback = isAllowed && width > canvasWidth;
  const appShellMode: AppShellMode = isDesktopFallback ? 'wide' : layoutMode;

  return {
    width,
    height,
    isHydrated,
    isLandscape,
    isAllowed,
    isPortraitTablet,
    isBlockedMobile,
    isDesktopFallback,
    layoutMode,
    appShellMode,
    canvasWidth,
    canvasHeight,
    shellMaxWidth: canvasWidth,
  };
}

export function useTabletViewport(): TabletViewportState {
  const [state, setState] = React.useState<TabletViewportState>(() => resolveViewportState(0, 0, false));

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const updateViewport = () => {
      setState(resolveViewportState(window.innerWidth, window.innerHeight));
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return state;
}
