import React, { createContext, useContext, useState, useEffect } from 'react';
import { UIStyleId, UI_STYLES, DEFAULT_UI_STYLE, UIStyleDefinition } from '../types';

interface UIStyleContextType {
  currentStyle: UIStyleId;
  setStyle: (style: UIStyleId) => void;
  styleDefinition: UIStyleDefinition;
  allStyles: UIStyleDefinition[];
}

const UIStyleContext = createContext<UIStyleContextType | undefined>(undefined);

const STORAGE_KEY = 'pop_ui_style_v2';

export const UIStyleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStyle, setCurrentStyleState] = useState<UIStyleId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && UI_STYLES.some((s) => s.id === saved)) {
        return saved as UIStyleId;
      }
    } catch (_) {}
    return DEFAULT_UI_STYLE;
  });

  const setStyle = (style: UIStyleId) => {
    setCurrentStyleState(style);
    try {
      localStorage.setItem(STORAGE_KEY, style);
    } catch (_) {}
  };

  useEffect(() => {
    // Apply data-ui-style attribute to root document
    document.documentElement.setAttribute('data-ui-style', currentStyle);
  }, [currentStyle]);

  const styleDefinition = UI_STYLES.find((s) => s.id === currentStyle) || UI_STYLES[0];

  return (
    <UIStyleContext.Provider
      value={{
        currentStyle,
        setStyle,
        styleDefinition,
        allStyles: UI_STYLES,
      }}
    >
      {children}
    </UIStyleContext.Provider>
  );
};

export const useUIStyle = (): UIStyleContextType => {
  const context = useContext(UIStyleContext);
  if (!context) {
    throw new Error('useUIStyle must be used within a UIStyleProvider');
  }
  return context;
};
