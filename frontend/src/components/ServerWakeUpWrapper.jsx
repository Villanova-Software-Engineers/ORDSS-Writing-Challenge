import { useLocation } from 'react-router-dom';
import { useServerWakeUp } from '../hooks/useServerWakeUp';
import ServerStarting from './ServerStarting';
import { waitForServer } from '../utils/serverStatus';

/**
 * Wrapper component that proactively wakes up the server
 * Shows ServerStarting screen only if server takes more than 2 seconds to respond
 * This prevents a flash of the screen if server is already running
 * Does not show on auth pages
 */
export default function ServerWakeUpWrapper({ children }) {
  const { showStartingScreen } = useServerWakeUp();
  const location = useLocation();

  // Don't show server starting screen on auth pages that don't require backend communication
  const authPagesWithoutBackend = ['/auth/sign-in', '/auth/sign-up', '/auth/forgot-password'];
  const isAuthPageWithoutBackend = authPagesWithoutBackend.includes(location.pathname) || location.pathname === '/';

  if (showStartingScreen && !isAuthPageWithoutBackend) {
    return (
      <ServerStarting
        onRetry={async () => {
          const isAvailable = await waitForServer();
          if (isAvailable) {
            window.location.reload();
          }
        }}
      />
    );
  }

  return children;
}
