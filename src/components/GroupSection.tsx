import React, { useState } from 'react';
import { Folder, Edit, Trash2, Plus, FolderPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { Group, Link } from '../types';
import { LinkCard } from './LinkCard';

interface GroupSectionProps {
  group: Group;
  links: Link[];
  subgroups: Group[];
  allGroups: Group[];
  allLinks: Link[];
  onEditGroup: (group: Group, parentGroupId?: string) => void;
  onDeleteGroup: (id: string) => void;
  onEditLink: (link: Link) => void;
  onDeleteLink: (id: string) => void;
  onShowQR: (link: Link) => void;
  onDrop: (e: React.DragEvent, groupId: string) => void;
  onCreateSubgroup: (parentId: string) => void;
  getSubgroups: (parentId: string) => Group[];
  level?: number;
}

export const GroupSection: React.FC<GroupSectionProps> = ({
  group,
  links,
  subgroups,
  allGroups,
  allLinks,
  onEditGroup,
  onDeleteGroup,
  onEditLink,
  onDeleteLink,
  onShowQR,
  onDrop,
  onCreateSubgroup,
  getSubgroups,
  level = 0,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide drag over if we're actually leaving the group area
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onDrop(e, group.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'group', id: group.id }));
  };

  // Convert hex color to RGB for opacity effects
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb = hexToRgb(group.color);
  const rgbString = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : '59, 130, 246'; // fallback to blue

  const marginLeft = level * 24;
  const hasContent = links.length > 0 || subgroups.length > 0;

  // Dynamic styling based on group color and drag state
  const containerStyles = {
    borderColor: isDragOver ? group.color : `rgba(${rgbString}, 0.2)`,
    backgroundColor: isDragOver ? `rgba(${rgbString}, 0.15)` : `rgba(${rgbString}, 0.05)`,
    boxShadow: isDragOver ? `0 8px 32px rgba(${rgbString}, 0.3)` : 'none',
  };

  const headerStyles = {
    background: `linear-gradient(135deg, rgba(${rgbString}, 0.1) 0%, rgba(${rgbString}, 0.05) 100%)`,
    borderColor: `rgba(${rgbString}, 0.2)`,
  };

  return (
    <div 
      className={`mb-6 border-2 border-dashed rounded-xl transition-all duration-300 ${
        isDragOver ? 'scale-[1.01]' : ''
      }`}
      style={{ marginLeft: `${marginLeft}px`, ...containerStyles }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Group Header with Color Theme */}
      <div 
        className="flex items-center justify-between mb-4 p-4 rounded-t-xl border-b backdrop-blur-sm"
        style={headerStyles}
      >
        <div className="flex items-center gap-3">
          {hasContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-white" />
              ) : (
                <ChevronRight className="w-4 h-4 text-white" />
              )}
            </button>
          )}
          <div 
            className="w-5 h-5 rounded-full border-2 border-white/30 shadow-lg" 
            style={{ backgroundColor: group.color }}
          />
          <h2 
            className="text-white text-xl font-bold flex items-center gap-2 cursor-move hover:text-opacity-80 transition-all"
            draggable
            onDragStart={handleDragStart}
          >
            <Folder className="w-5 h-5" style={{ color: group.color }} />
            {group.name}
          </h2>
          <span className="text-blue-200 text-sm bg-white/10 px-2 py-1 rounded-full">
            {links.length} линкова{subgroups.length > 0 && `, ${subgroups.length} подгрупа`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCreateSubgroup(group.id)}
            className="p-2 rounded-lg transition-all hover:scale-105"
            style={{ 
              backgroundColor: `rgba(${rgbString}, 0.2)`,
              color: group.color,
            }}
            title="Направи подгрупу"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditGroup(group)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            title="Измени групу"
          >
            <Edit className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => onDeleteGroup(group.id)}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
            title="Обриши групу"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Group Content Area */}
          <div className="p-4 pt-0">
            {isDragOver && (
              <div className="mb-4 p-3 bg-white/10 border border-white/20 rounded-lg text-center">
                <p className="text-white text-sm font-medium">
                  Пустите овде да додате у групу "{group.name}"
                </p>
              </div>
            )}

            {links.length === 0 && !isDragOver ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div 
                  className="p-3 rounded-full mb-3 border-2 border-dashed"
                  style={{ 
                    borderColor: group.color,
                    backgroundColor: `rgba(${rgbString}, 0.1)`
                  }}
                >
                  <Plus className="w-8 h-8" style={{ color: group.color }} />
                </div>
                <p className="text-white text-sm font-medium">
                  Превуци линкове или групе овде
                </p>
                <p className="text-blue-200 text-xs mt-1">
                  Додај садржај у групу "{group.name}"
                </p>
              </div>
            ) : (
              links.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-4">
                  {links.map((link) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      onEdit={onEditLink}
                      onDelete={onDeleteLink}
                      onShowQR={onShowQR}
                    />
                  ))}
                </div>
              )
            )}
          </div>

          {/* Render subgroups recursively */}
          {subgroups.map(subgroup => {
            const subgroupLinks = allLinks.filter(link => link.groupId === subgroup.id);
            const nestedSubgroups = getSubgroups(subgroup.id);
            return (
              <div key={subgroup.id} className="px-4 pb-4">
                <GroupSection
                  group={subgroup}
                  links={subgroupLinks}
                  subgroups={nestedSubgroups}
                  allGroups={allGroups}
                  allLinks={allLinks}
                  onEditGroup={onEditGroup}
                  onDeleteGroup={onDeleteGroup}
                  onEditLink={onEditLink}
                  onDeleteLink={onDeleteLink}
                  onShowQR={onShowQR}
                  onDrop={onDrop}
                  onCreateSubgroup={onCreateSubgroup}
                  getSubgroups={getSubgroups}
                  level={level + 1}
                />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};