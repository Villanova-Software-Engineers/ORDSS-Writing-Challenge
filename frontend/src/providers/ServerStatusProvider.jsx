import { createContext, useContext, useState, useCallback } from 'react';
import ServerStarting from '../components/ServerStarting';
import { waitForServer } from '../utils/serverStatus';

const ServerStatusContext = createContext(null);

export function ServerStatusProvider({ children }) {
  const [isServerStarting, setIsServerStarting] = useState(false);

  const handleServerStarting = useCallback(async () => {
    setIsServerStarting(true);

    // Wait for server to become available
    const isAvailable = await waitForServer();

    if (isAvailable) {
      setIsServerStarting(false);
      // Reload the page to retry the failed request
      window.location.reload();
    } else {
      // Server still not available after retries
      // Keep showing the screen but allow manual retry
      setIsServerStarting(false);
    }
  }, []);

  const retryConnection = useCallback(() => {
    window.location.reload();
  }, []);

  if (isServerStarting) {
    return <ServerStarting onRetry={retryConnection} />;
  }

  return (
    <ServerStatusContext.Provider value={{ handleServerStarting }}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatus() {
  const context = useContext(ServerStatusContext);
  if (!context) {
    throw new Error('useServerStatus must be used within ServerStatusProvider');
  }
  return context;
}
