import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  autoplay: boolean;
  dataSaver: boolean;
  notifications: boolean;
  darkMode: boolean;
  accentColor: string;
  contentFilter: boolean;
  autoplayTrailers: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: (key: keyof Settings, value: any) => void;
}

export const DEFAULT_ACCENT_COLOR = '#E50914';

const DEFAULT_SETTINGS: Settings = {
  autoplay: true,
  dataSaver: false,
  notifications: true,
  darkMode: true,
  accentColor: DEFAULT_ACCENT_COLOR,
  contentFilter: true,
  autoplayTrailers: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
