import { createContext, useContext } from 'react';

const AppContext = createContext({});

export function AppProvider({ children }) {
  return <AppContext.Provider value={{}}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
