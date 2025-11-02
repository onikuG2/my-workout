import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import AlertModal from './modals/AlertModal';

interface AlertContextType {
  showAlert: (message: string, title?: string) => void;
}

const AlertContext = createContext<AlertContextType>({
    showAlert: () => { throw new Error('showAlert function not available. Is the component wrapped in AlertProvider?'); }
});

export const useAlert = () => {
  return useContext(AlertContext);
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    message: string;
    title: string;
  }>({ isOpen: false, message: '', title: '' });

  const showAlert = useCallback((message: string, title: string = '通知') => {
    setAlertState({ isOpen: true, message, title });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const value = { showAlert };

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
      />
    </AlertContext.Provider>
  );
};
