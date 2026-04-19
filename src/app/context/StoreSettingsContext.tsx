import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getPublicStoreSettings,
  type ResolvedStoreSettings,
} from "../api/storeSettings";
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "../lib/storeSettings";

type StoreSettingsContextValue = {
  settings: StoreSettings;
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  setResolvedSettings: (value: ResolvedStoreSettings) => void;
};

const defaultStoreSettingsContextValue: StoreSettingsContextValue = {
  settings: DEFAULT_STORE_SETTINGS,
  updatedAt: null,
  isLoading: false,
  error: null,
  refreshSettings: async () => {},
  setResolvedSettings: () => {},
};

const StoreSettingsContext = createContext<StoreSettingsContextValue>(defaultStoreSettingsContextValue);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setResolvedSettings = useCallback((value: ResolvedStoreSettings) => {
    setSettings(value.settings);
    setUpdatedAt(value.updatedAt);
    setError(null);
  }, []);

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);

    try {
      const resolved = await getPublicStoreSettings();
      setResolvedSettings(resolved);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Impossible de charger les parametres de la boutique.");
    } finally {
      setIsLoading(false);
    }
  }, [setResolvedSettings]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        updatedAt,
        isLoading,
        error,
        refreshSettings,
        setResolvedSettings,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings(): StoreSettingsContextValue {
  return useContext(StoreSettingsContext);
}