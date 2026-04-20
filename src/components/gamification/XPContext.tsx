// XP Context for managing XP state and refreshing across components

'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface XPData {
  total: number;
  level: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressXp: number;
  progressPercent: number;
  isMaxLevel: boolean;
}

interface XPContextValue {
  xpData: XPData | null;
  isLoading: boolean;
  refreshXP: () => Promise<void>;
}

const XPContext = createContext<XPContextValue | undefined>(undefined);

export function useXP() {
  const context = useContext(XPContext);
  if (!context) {
    throw new Error('useXP must be used within an XPProvider');
  }
  return context;
}

interface XPProviderProps {
  children: ReactNode;
}

export function XPProvider({ children }: XPProviderProps) {
  const [xpData, setXPData] = useState<XPData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshXP = useCallback(async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (response.ok) {
        const result = await response.json();
        setXPData(result.data.xp);
      }
    } catch (error) {
      console.error('Failed to fetch XP stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    refreshXP();
  }, [refreshXP]);

  return (
    <XPContext.Provider value={{ xpData, isLoading, refreshXP }}>
      {children}
    </XPContext.Provider>
  );
}
