import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
  });

  useEffect(() => {
    if (!state.isSupported) return;

    // Регистрација Service Worker-а
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('Service Worker registered:', registration);
        setState(prev => ({ ...prev, isRegistered: true }));

        // Провери за ажурирања
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setState(prev => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });

        // Периодично провери за ажурирања
        setInterval(() => {
          registration.update();
        }, 60000); // Сваки минут

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerSW();

    // Слушај поруке од Service Worker-а
    const handleMessage = (event: MessageEvent) => {
      const { data } = event;
      
      switch (data.type) {
        case 'SYNC_LINKS':
          console.log('Background sync: Links data sync requested');
          // Овде можете додати логику за синхронизацију
          break;
        case 'SYNC_GROUPS':
          console.log('Background sync: Groups data sync requested');
          break;
        case 'DAILY_SYNC':
          console.log('Daily sync triggered');
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Слушај online/offline статус
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.isSupported]);

  // Функција за регистрацију background sync-а
  const registerBackgroundSync = async (tag: string) => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log('Background sync registered:', tag);
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  };

  // Функција за ажурирање Service Worker-а
  const updateServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const waitingWorker = registration.waiting;
        
        if (waitingWorker) {
          waitingWorker.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      } catch (error) {
        console.error('Service Worker update failed:', error);
      }
    }
  };

  return {
    ...state,
    registerBackgroundSync,
    updateServiceWorker,
  };
};