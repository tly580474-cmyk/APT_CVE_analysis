import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const hoverTimer = useRef(null);

  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev);
    setHoverExpanded(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!collapsed) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverExpanded(true), 200);
  }, [collapsed]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    if (!collapsed) return;
    hoverTimer.current = setTimeout(() => setHoverExpanded(false), 150);
  }, [collapsed]);

  const isExpanded = !collapsed || hoverExpanded;
  const sidebarWidth = isExpanded ? 220 : 64;

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  }, [sidebarWidth]);

  return (
    <SidebarContext.Provider value={{
      collapsed,
      hoverExpanded,
      isExpanded,
      sidebarWidth,
      toggleCollapsed,
      handleMouseEnter,
      handleMouseLeave,
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
