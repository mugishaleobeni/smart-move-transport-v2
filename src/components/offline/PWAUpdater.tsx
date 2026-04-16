import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

/**
 * PWAUpdater Component
 * 
 * Automatically detects when a new version of the app is available 
 * and forces a browser reload to ensure the user gets the latest content.
 */
const PWAUpdater = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
      // Optional: Periodic check for updates (every 1 hour)
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      console.log('New content available, reloading...');
      toast.info("Updating to newest version...", {
        description: "Please wait while we sync the latest changes.",
        duration: 5000,
      });
      
      // Short delay to allow the toast to be seen before reload
      const timeout = setTimeout(() => {
        updateServiceWorker(true);
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [needRefresh, updateServiceWorker]);

  return null; // This component doesn't render anything visible
};

export default PWAUpdater;
