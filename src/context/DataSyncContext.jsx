import { createContext, useContext, useState, useCallback } from 'react';

const DataSyncContext = createContext();

export const useDataSync = () => useContext(DataSyncContext);

export const DataSyncProvider = ({ children }) => {
  const [syncKey, setSyncKey] = useState(0);

  const notifyDataChange = useCallback(() => {
    setSyncKey((prev) => prev + 1);
  }, []);

  return (
    <DataSyncContext.Provider value={{ syncKey, notifyDataChange }}>
      {children}
    </DataSyncContext.Provider>
  );
};
