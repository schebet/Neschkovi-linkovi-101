import React, { useState, useEffect } from 'react';
import { Plus, FolderPlus, Link as LinkIcon, QrCode, Settings } from 'lucide-react';
import { Link, Group } from './types';
import { LinkCard } from './components/LinkCard';
import { GroupSection } from './components/GroupSection';
import { Modal } from './components/Modal';
import { LinkForm } from './components/LinkForm';
import { GroupForm } from './components/GroupForm';
import { QRScanner } from './components/QRScanner';
import { QRCodeModal } from './components/QRCodeModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useServiceWorker } from './hooks/useServiceWorker';
import { extractUrlFromText, isValidUrl, formatUrl } from './utils/linkUtils';

function App() {
  const [links, setLinks] = useLocalStorage<Link[]>('linktree-links', []);
  const [groups, setGroups] = useLocalStorage<Group[]>('linktree-groups', []);
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | undefined>();
  const [editingGroup, setEditingGroup] = useState<Group | undefined>();
  const [selectedLinkForQR, setSelectedLinkForQR] = useState<Link | undefined>();
  const [parentGroupForNewGroup, setParentGroupForNewGroup] = useState<string | undefined>();
  const [isDragOverApp, setIsDragOverApp] = useState(false);
  const [scannedUrl, setScannedUrl] = useState<string>('');

  // PWA hooks
  const { registerBackgroundSync, updateAvailable, updateServiceWorker } = useServiceWorker();

  // Get top-level groups (no parent)
  const topLevelGroups = groups.filter(group => !group.parentGroupId);
  
  // Get ungrouped links
  const ungroupedLinks = links.filter(link => !link.groupId);

  // Helper function to get subgroups of a parent group
  const getSubgroups = (parentId: string) => {
    return groups.filter(group => group.parentGroupId === parentId);
  };

  // Helper function to get all descendant group IDs
  const getAllDescendantGroupIds = (groupId: string): string[] => {
    const subgroups = getSubgroups(groupId);
    const descendantIds = [groupId];
    
    subgroups.forEach(subgroup => {
      descendantIds.push(...getAllDescendantGroupIds(subgroup.id));
    });
    
    return descendantIds;
  };

  const handleAddLink = (linkData: Omit<Link, 'id' | 'createdAt'>) => {
    const newLink: Link = {
      ...linkData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setLinks(prev => [...prev, newLink]);
    setIsLinkModalOpen(false);
    setScannedUrl(''); // Clear scanned URL after adding
    
    // Register background sync for new link
    registerBackgroundSync('sync-links');
  };

  const handleEditLink = (linkData: Omit<Link, 'id' | 'createdAt'>) => {
    if (!editingLink) return;
    
    setLinks(prev => prev.map(link => 
      link.id === editingLink.id 
        ? { ...link, ...linkData }
        : link
    ));
    setEditingLink(undefined);
    setIsLinkModalOpen(false);
    
    // Register background sync for updated link
    registerBackgroundSync('sync-links');
  };

  const handleDeleteLink = (id: string) => {
    setLinks(prev => prev.filter(link => link.id !== id));
    registerBackgroundSync('sync-links');
  };

  const handleShowQR = (link: Link) => {
    setSelectedLinkForQR(link);
    setIsQRCodeModalOpen(true);
  };

  const handleAddGroup = (groupData: Omit<Group, 'id' | 'createdAt'>) => {
    const newGroup: Group = {
      ...groupData,
      id: crypto.randomUUID(),
      parentGroupId: parentGroupForNewGroup,
      createdAt: new Date(),
    };
    setGroups(prev => [...prev, newGroup]);
    setIsGroupModalOpen(false);
    setParentGroupForNewGroup(undefined);
    
    // Register background sync for new group
    registerBackgroundSync('sync-groups');
  };

  const handleEditGroup = (groupData: Omit<Group, 'id' | 'createdAt'>) => {
    if (!editingGroup) return;
    
    setGroups(prev => prev.map(group => 
      group.id === editingGroup.id 
        ? { ...group, ...groupData }
        : group
    ));
    setEditingGroup(undefined);
    setIsGroupModalOpen(false);
    
    // Register background sync for updated group
    registerBackgroundSync('sync-groups');
  };

  const handleDeleteGroup = (id: string) => {
    // Get all descendant group IDs
    const descendantIds = getAllDescendantGroupIds(id);
    
    // Move links from deleted groups to ungrouped
    setLinks(prev => prev.map(link => 
      descendantIds.includes(link.groupId || '') 
        ? { ...link, groupId: undefined }
        : link
    ));
    
    // Remove all descendant groups
    setGroups(prev => prev.filter(group => !descendantIds.includes(group.id)));
    
    // Register background sync
    registerBackgroundSync('sync-groups');
    registerBackgroundSync('sync-links');
  };

  const handleQRScan = (url: string) => {
    const extractedUrl = extractUrlFromText(url) || url;
    if (isValidUrl(formatUrl(extractedUrl))) {
      setScannedUrl(extractedUrl);
      setIsQRScannerOpen(false);
      setIsLinkModalOpen(true);
    }
  };

  const handleImportData = (importedLinks: Link[], importedGroups: Group[]) => {
    setLinks(importedLinks);
    setGroups(importedGroups);
    
    // Register background sync for imported data
    registerBackgroundSync('sync-links');
    registerBackgroundSync('sync-groups');
  };

  const handleClearData = () => {
    setLinks([]);
    setGroups([]);
    
    // Register background sync for cleared data
    registerBackgroundSync('sync-links');
    registerBackgroundSync('sync-groups');
  };

  const handleDrop = (e: React.DragEvent, targetGroupId?: string) => {
    e.preventDefault();
    setIsDragOverApp(false);
    
    try {
      // Try to get dropped data
      const dragData = e.dataTransfer.getData('application/json');
      
      if (dragData) {
        const parsedData = JSON.parse(dragData);
        
        if (parsedData.type === 'link' && parsedData.id) {
          // Moving existing link
          setLinks(prev => prev.map(link =>
            link.id === parsedData.id
              ? { ...link, groupId: targetGroupId }
              : link
          ));
          registerBackgroundSync('sync-links');
          return;
        }
        
        if (parsedData.type === 'group' && parsedData.id) {
          // Moving existing group
          const groupToMove = groups.find(g => g.id === parsedData.id);
          if (groupToMove && targetGroupId !== parsedData.id) {
            // Prevent circular references
            const descendantIds = getAllDescendantGroupIds(parsedData.id);
            if (!descendantIds.includes(targetGroupId || '')) {
              setGroups(prev => prev.map(group =>
                group.id === parsedData.id
                  ? { ...group, parentGroupId: targetGroupId }
                  : group
              ));
              registerBackgroundSync('sync-groups');
            }
          }
          return;
        }
      }
      
      // Handle URL drops
      const url = e.dataTransfer.getData('text/uri-list') || 
                  e.dataTransfer.getData('text/plain');
      
      if (url) {
        const extractedUrl = extractUrlFromText(url);
        if (extractedUrl && isValidUrl(extractedUrl)) {
          const formattedUrl = formatUrl(extractedUrl);
          const newLink: Link = {
            id: crypto.randomUUID(),
            title: new URL(formattedUrl).hostname.replace('www.', ''),
            url: formattedUrl,
            groupId: targetGroupId,
            createdAt: new Date(),
          };
          setLinks(prev => [...prev, newLink]);
          registerBackgroundSync('sync-links');
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  // Handle drag over the entire app for ungrouped drops
  const handleAppDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverApp(true);
  };

  const handleAppDragLeave = (e: React.DragEvent) => {
    // Only set to false if we're leaving the app container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverApp(false);
    }
  };

  const handleAppDrop = (e: React.DragEvent) => {
    // Only handle drops that aren't handled by specific group components
    if (e.defaultPrevented) return;
    handleDrop(e); // Drop to ungrouped
  };

  const openLinkModal = (link?: Link) => {
    setEditingLink(link);
    setIsLinkModalOpen(true);
  };

  const openGroupModal = (group?: Group, parentGroupId?: string) => {
    setEditingGroup(group);
    setParentGroupForNewGroup(parentGroupId);
    setIsGroupModalOpen(true);
  };

  const closeModals = () => {
    setIsLinkModalOpen(false);
    setIsGroupModalOpen(false);
    setIsQRScannerOpen(false);
    setIsQRCodeModalOpen(false);
    setIsSettingsModalOpen(false);
    setEditingLink(undefined);
    setEditingGroup(undefined);
    setSelectedLinkForQR(undefined);
    setParentGroupForNewGroup(undefined);
    setScannedUrl('');
  };

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 transition-all duration-300 ${
        isDragOverApp ? 'bg-opacity-90' : ''
      }`}
      onDragOver={handleAppDragOver}
      onDragLeave={handleAppDragLeave}
      onDrop={handleAppDrop}
    >
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Update Available Banner */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-500/90 backdrop-blur-md border border-blue-400/30 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-white text-sm font-medium">Ново ажурирање је доступно!</span>
              <button
                onClick={updateServiceWorker}
                className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                Ажурирај
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Controls - Fixed Position */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full transition-all hover:scale-105"
          title="Подешавања"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header with Logo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src="/schebet-amblem+++.png" 
              alt="Šebet Logo" 
              className="w-16 h-16 md:w-20 md:h-20 object-contain"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              МОЈЕ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">ЛИНК-ДРВО</span>
            </h1>
          </div>
          <p className="text-blue-200 text-lg md:text-xl max-w-2xl mx-auto">
            Организујте своје линкове лепо са функционалношћу превлачења и угнежђеним групама
          </p>
          {isDragOverApp && (
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg backdrop-blur-sm">
              <p className="text-blue-200 text-sm">
                Пустите овде да додате линк у главну секцију
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed height and width for mobile consistency */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 max-w-md mx-auto sm:max-w-none">
          <button
            onClick={() => openLinkModal()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-4 rounded-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/20 min-h-[56px] flex-1 sm:flex-none sm:min-w-[160px]"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm sm:text-base">Додај линк</span>
          </button>
          <button
            onClick={() => setIsQRScannerOpen(true)}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-4 rounded-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400/20 min-h-[56px] flex-1 sm:flex-none sm:min-w-[160px]"
          >
            <QrCode className="w-5 h-5" />
            <span className="text-sm sm:text-base">Скенирај QR</span>
          </button>
          <button
            onClick={() => openGroupModal()}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-4 rounded-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400/20 min-h-[56px] flex-1 sm:flex-none sm:min-w-[160px]"
          >
            <FolderPlus className="w-5 h-5" />
            <span className="text-sm sm:text-base">Направи групу</span>
          </button>
        </div>

        {/* Top-level Groups */}
        {topLevelGroups.map(group => {
          const groupLinks = links.filter(link => link.groupId === group.id);
          const subgroups = getSubgroups(group.id);
          return (
            <GroupSection
              key={group.id}
              group={group}
              links={groupLinks}
              subgroups={subgroups}
              allGroups={groups}
              allLinks={links}
              onEditGroup={openGroupModal}
              onDeleteGroup={handleDeleteGroup}
              onEditLink={openLinkModal}
              onDeleteLink={handleDeleteLink}
              onShowQR={handleShowQR}
              onDrop={handleDrop}
              onCreateSubgroup={(parentId) => openGroupModal(undefined, parentId)}
              getSubgroups={getSubgroups}
            />
          );
        })}

        {/* Ungrouped Links Section */}
        {ungroupedLinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Линкови ({ungroupedLinks.length})
            </h2>
            
            {/* Ungrouped Links Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {ungroupedLinks.map(link => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onEdit={openLinkModal}
                  onDelete={handleDeleteLink}
                  onShowQR={handleShowQR}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state message when no content */}
        {topLevelGroups.length === 0 && ungroupedLinks.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 max-w-md mx-auto">
              <LinkIcon className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-2">
                Почните са организовањем
              </h3>
              <p className="text-blue-200 text-sm mb-4">
                Додајте своје прве линкове, скенирајте QR кодове или направите групе за боље организовање
              </p>
              <p className="text-blue-300 text-xs">
                Можете превући линкове из прегледача директно овде!
              </p>
            </div>
          </div>
        )}

        {/* Modals */}
        <Modal
          isOpen={isLinkModalOpen}
          onClose={closeModals}
          title={editingLink ? 'Измени линк' : 'Додај нови линк'}
        >
          <LinkForm
            link={editingLink}
            groups={groups}
            onSave={editingLink ? handleEditLink : handleAddLink}
            onCancel={closeModals}
            initialUrl={scannedUrl}
          />
        </Modal>

        <Modal
          isOpen={isGroupModalOpen}
          onClose={closeModals}
          title={editingGroup ? 'Измени групу' : (parentGroupForNewGroup ? 'Направи подгрупу' : 'Направи нову групу')}
        >
          <GroupForm
            group={editingGroup}
            parentGroupId={parentGroupForNewGroup}
            groups={groups}
            onSave={editingGroup ? handleEditGroup : handleAddGroup}
            onCancel={closeModals}
          />
        </Modal>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={closeModals}
          links={links}
          groups={groups}
          onImportData={handleImportData}
          onClearData={handleClearData}
        />

        {/* QR Scanner */}
        <QRScanner
          isOpen={isQRScannerOpen}
          onClose={closeModals}
          onScan={handleQRScan}
        />

        {/* QR Code Display Modal */}
        {selectedLinkForQR && (
          <QRCodeModal
            isOpen={isQRCodeModalOpen}
            onClose={closeModals}
            url={selectedLinkForQR.url}
            title={selectedLinkForQR.title}
          />
        )}
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

export default App;