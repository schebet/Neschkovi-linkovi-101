import React, { useState } from 'react';
import { Download, Upload, Trash2, AlertTriangle, Check, FileText } from 'lucide-react';
import { Link, Group } from '../types';

interface DataManagerProps {
  links: Link[];
  groups: Group[];
  onImportData: (links: Link[], groups: Group[]) => void;
  onClearData: () => void;
}

export const DataManager: React.FC<DataManagerProps> = ({
  links,
  groups,
  onImportData,
  onClearData,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'success'>('idle');

  const exportData = () => {
    try {
      const data = {
        links,
        groups,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `link-drvo-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate data structure
        if (!data.links || !data.groups || !Array.isArray(data.links) || !Array.isArray(data.groups)) {
          throw new Error('Invalid file format');
        }

        // Validate link objects
        const validLinks = data.links.filter((link: any) => 
          link.id && link.title && link.url && link.createdAt
        ).map((link: any) => ({
          ...link,
          createdAt: new Date(link.createdAt)
        }));

        // Validate group objects
        const validGroups = data.groups.filter((group: any) => 
          group.id && group.name && group.color && group.createdAt
        ).map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt)
        }));

        onImportData(validLinks, validGroups);
        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 3000);
      } catch (error) {
        console.error('Import error:', error);
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };

    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const handleClearData = () => {
    onClearData();
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Управљање подацима
        </h3>
        
        <div className="space-y-4">
          {/* Export Section */}
          <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
            <div>
              <h4 className="text-white font-medium">Извези податке</h4>
              <p className="text-blue-200 text-sm">
                Сачувај све линкове и групе у JSON фајл
              </p>
            </div>
            <button
              onClick={exportData}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {exportStatus === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exportStatus === 'success' ? 'Извезено!' : 'Извези'}
            </button>
          </div>

          {/* Import Section */}
          <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-400/20 rounded-lg">
            <div>
              <h4 className="text-white font-medium">Увези податке</h4>
              <p className="text-green-200 text-sm">
                Учитај линкове и групе из JSON фајла
              </p>
            </div>
            <div className="flex items-center gap-2">
              {importStatus === 'success' && (
                <span className="text-green-400 text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Увезено!
                </span>
              )}
              {importStatus === 'error' && (
                <span className="text-red-400 text-sm">Грешка!</span>
              )}
              <label className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                Увези
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Clear Data Section */}
          <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-400/20 rounded-lg">
            <div>
              <h4 className="text-white font-medium">Обриши све податке</h4>
              <p className="text-red-200 text-sm">
                Трајно уклони све линкове и групе
              </p>
            </div>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Обриши све
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1 text-white/70 hover:text-white text-sm"
                >
                  Откажи
                </button>
                <button
                  onClick={handleClearData}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Потврди
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-400">{links.length}</div>
              <div className="text-blue-200 text-sm">Линкова</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">{groups.length}</div>
              <div className="text-purple-200 text-sm">Група</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};