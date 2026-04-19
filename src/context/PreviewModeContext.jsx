import { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const PreviewModeContext = createContext({
  isPreviewMode: false,
});

export function PreviewModeProvider({ children }) {
  const location = useLocation();

  const isPreviewMode = useMemo(() => {
    const sp = new URLSearchParams(location.search || '');
    const raw = String(sp.get('preview') || '').trim().toLowerCase();
    return raw === '1' || raw === 'true' || raw === 'yes';
  }, [location.search]);

  const value = useMemo(() => ({ isPreviewMode }), [isPreviewMode]);

  return <PreviewModeContext.Provider value={value}>{children}</PreviewModeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreviewMode() {
  return useContext(PreviewModeContext);
}
