import React from 'react';
import { WifiOff, Wifi, CloudOff, Cloud } from 'lucide-react';
import { useServiceWorker } from '../hooks/useServiceWorker';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, isRegistered } = useServiceWorker();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-500/90 backdrop-blur-md border border-red-400/30 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-white">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Нема интернета</span>
          {isRegistered && (
            <div className="flex items-center gap-1 ml-2 text-red-200">
              <CloudOff className="w-3 h-3" />
              <span className="text-xs">Offline режим</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};