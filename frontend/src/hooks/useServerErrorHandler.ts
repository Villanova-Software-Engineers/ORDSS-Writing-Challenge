import { useEffect } from 'react';
import { ApiClientError } from '../services/apiClient';

/**
 * Hook to handle server startup errors globally
 * Detects when the server is starting and triggers the ServerStarting screen
 */
export function useServerErrorHandler(onServerStarting: () => void) {
  useEffect(() => {
    // Create a global error handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      // Check if this is an API error indicating server startup
      if (error instanceof ApiClientError && error.isServerStartup) {
        event.preventDefault(); // Prevent console error
        onServerStarting();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onServerStarting]);
}
