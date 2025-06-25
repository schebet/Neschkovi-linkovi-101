import React, { useState } from 'react';
import { Group } from '../types';

interface GroupFormProps {
  group?: Group;
  parentGroupId?: string;
  groups: Group[];
  onSave: (groupData: Omit<Group, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const GROUP_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
];

export const GroupForm: React.FC<GroupFormProps> = ({ 
  group, 
  parentGroupId, 
  groups, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: group?.name || '',
    color: group?.color || GROUP_COLORS[0],
    parentGroupId: group?.parentGroupId || parentGroupId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available parent groups (exclude current group and its descendants)
  const getAvailableParentGroups = () => {
    if (!group) return groups.filter(g => !g.parentGroupId); // Only top-level for new groups
    
    // For editing, exclude self and descendants
    const getAllDescendantIds = (groupId: string): string[] => {
      const children = groups.filter(g => g.parentGroupId === groupId);
      const descendantIds = [groupId];
      children.forEach(child => {
        descendantIds.push(...getAllDescendantIds(child.id));
      });
      return descendantIds;
    };

    const excludedIds = getAllDescendantIds(group.id);
    return groups.filter(g => !excludedIds.includes(g.id));
  };

  const availableParentGroups = getAvailableParentGroups();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Име групе је обавезно';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        parentGroupId: formData.parentGroupId || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Име групе *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
          placeholder="Унесите име групе"
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Родитељска група
        </label>
        <select
          value={formData.parentGroupId}
          onChange={(e) => setFormData({ ...formData, parentGroupId: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
        >
          <option value="">Нема родитеља (главна група)</option>
          {availableParentGroups.map((parentGroup) => (
            <option key={parentGroup.id} value={parentGroup.id} className="bg-gray-800">
              {parentGroup.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Боја
        </label>
        <div className="grid grid-cols-5 gap-3">
          {GROUP_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-10 h-10 rounded-lg transition-all ${
                formData.color === color 
                  ? 'scale-110 ring-2 ring-white/50' 
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/20"
        >
          {group ? 'Ажурирај групу' : (parentGroupId ? 'Направи подгрупу' : 'Направи групу')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          Откажи
        </button>
      </div>
    </form>
  );
};