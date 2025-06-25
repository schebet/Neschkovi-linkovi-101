import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { DataManager } from './DataManager';
import { Link, Group } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: Link[];
  groups: Group[];
  onImportData: (links: Link[], groups: Group[]) => void;
  onClearData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  links,
  groups,
  onImportData,
  onClearData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 flex-shrink-0">
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Подешавања
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Content - Hidden scrollbar but scrolling enabled */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="space-y-6">
            <DataManager
              links={links}
              groups={groups}
              onImportData={onImportData}
              onClearData={onClearData}
            />
            
            {/* Instructions */}
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Како сачувати апликацију:</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Извезите податке редовно као резервну копију</li>
                <li>• Инсталирајте као PWA за рад без интернета</li>
                <li>• Подаци се чувају локално у прегледачу</li>
                <li>• Увезите податке да вратите резервну копију</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};