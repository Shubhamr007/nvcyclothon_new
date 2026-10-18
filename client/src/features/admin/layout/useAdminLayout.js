import { useState, useCallback } from 'react';

export const DEFAULT_LAYOUT = {
  sidebarWidth: 256, // 16rem
  aiWidth: 480, // 30rem
};

export const LAYOUT_CONSTRAINTS = {
  sidebar: {
    min: 200,
    max: 360,
    default: 256,
  },
  aiPanel: {
    min: 340,
    max: 760,
    default: 480,
  },
  minWorkspace: 360,
};

export const LAYOUT_STORAGE_KEY = 'nv_admin_layout_widths';

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function loadSavedLayout() {
  if (typeof window === 'undefined') return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw);
    const sidebarWidth = Number(parsed?.sidebarWidth);
    const aiWidth = Number(parsed?.aiWidth);

    return {
      sidebarWidth: Number.isFinite(sidebarWidth)
        ? clamp(sidebarWidth, LAYOUT_CONSTRAINTS.sidebar.min, LAYOUT_CONSTRAINTS.sidebar.max)
        : DEFAULT_LAYOUT.sidebarWidth,
      aiWidth: Number.isFinite(aiWidth)
        ? clamp(aiWidth, LAYOUT_CONSTRAINTS.aiPanel.min, LAYOUT_CONSTRAINTS.aiPanel.max)
        : DEFAULT_LAYOUT.aiWidth,
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function useAdminLayout() {
  const [layout, setLayout] = useState(loadSavedLayout);

  const persist = useCallback((nextLayout) => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(nextLayout));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, []);

  const updateSidebarWidth = useCallback((width) => {
    const clamped = clamp(width, LAYOUT_CONSTRAINTS.sidebar.min, LAYOUT_CONSTRAINTS.sidebar.max);
    setLayout((prev) => ({ ...prev, sidebarWidth: clamped }));
  }, []);

  const commitSidebarWidth = useCallback((width) => {
    const clamped = clamp(width, LAYOUT_CONSTRAINTS.sidebar.min, LAYOUT_CONSTRAINTS.sidebar.max);
    setLayout((prev) => {
      const next = { ...prev, sidebarWidth: clamped };
      persist(next);
      return next;
    });
  }, [persist]);

  const updateAiWidth = useCallback((width) => {
    const clamped = clamp(width, LAYOUT_CONSTRAINTS.aiPanel.min, LAYOUT_CONSTRAINTS.aiPanel.max);
    setLayout((prev) => ({ ...prev, aiWidth: clamped }));
  }, []);

  const commitAiWidth = useCallback((width) => {
    const clamped = clamp(width, LAYOUT_CONSTRAINTS.aiPanel.min, LAYOUT_CONSTRAINTS.aiPanel.max);
    setLayout((prev) => {
      const next = { ...prev, aiWidth: clamped };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    try {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch {
      // Storage unavailable
    }
  }, []);

  const isCustomized =
    layout.sidebarWidth !== DEFAULT_LAYOUT.sidebarWidth ||
    layout.aiWidth !== DEFAULT_LAYOUT.aiWidth;

  return {
    sidebarWidth: layout.sidebarWidth,
    aiWidth: layout.aiWidth,
    updateSidebarWidth,
    commitSidebarWidth,
    updateAiWidth,
    commitAiWidth,
    resetLayout,
    isCustomized,
  };
}

export default useAdminLayout;
