import React, { useState, useEffect } from 'react';
import { Link, Group } from '../types';
import { formatUrl, isValidUrl, getDomainFromUrl } from '../utils/linkUtils';

interface LinkFormProps {
  link?: Link;
  groups: Group[];
  onSave: (linkData: Omit<Link, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialUrl?: string;
}

export const LinkForm: React.FC<LinkFormProps> = ({ 
  link, 
  groups, 
  onSave, 
  onCancel, 
  initialUrl = '' 
}) => {
  const [formData, setFormData] = useState({
    title: link?.title || '',
    url: link?.url || initialUrl,
    description: link?.description || '',
    groupId: link?.groupId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when initialUrl changes (from QR scan)
  useEffect(() => {
    if (initialUrl && !link) {
      const formattedUrl = formatUrl(initialUrl);
      let suggestedTitle = '';
      
      try {
        suggestedTitle = getDomainFromUrl(formattedUrl);
      } catch {
        suggestedTitle = initialUrl;
      }

      setFormData(prev => ({
        ...prev,
        url: formattedUrl,
        title: suggestedTitle,
      }));
    }
  }, [initialUrl, link]);

  // Helper function to get group hierarchy display name
  const getGroupDisplayName = (group: Group): string => {
    const getParentPath = (g: Group): string => {
      const parent = groups.find(pg => pg.id === g.parentGroupId);
      if (parent) {
        return `${getParentPath(parent)} > ${g.name}`;
      }
      return g.name;
    };
    return getParentPath(group);
  };

  // Sort groups by hierarchy for better display
  const sortedGroups = [...groups].sort((a, b) => {
    const aPath = getGroupDisplayName(a);
    const bPath = getGroupDisplayName(b);
    return aPath.localeCompare(bPath);
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Наслов је обавезан';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL је обавезан';
    } else if (!isValidUrl(formatUrl(formData.url))) {
      newErrors.url = 'Молимо унесите важећи URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        url: formatUrl(formData.url),
        groupId: formData.groupId || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {initialUrl && !link && (
        <div className="p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
          <p className="text-green-200 text-sm">
            ✓ QR код успешно скениран! Проверите и допуните детаље.
          </p>
        </div>
      )}

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Наслов *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
          placeholder="Унесите наслов линка"
        />
        {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          URL *
        </label>
        <input
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
          placeholder="https://primer.com"
        />
        {errors.url && <p className="text-red-400 text-sm mt-1">{errors.url}</p>}
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Опис
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 resize-none"
          rows={3}
          placeholder="Опциони опис"
        />
      </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">
          Група
        </label>
        <select
          value={formData.groupId}
          onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
        >
          <option value="">Без групе</option>
          {sortedGroups.map((group) => (
            <option key={group.id} value={group.id} className="bg-gray-800">
              {getGroupDisplayName(group)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400/20"
        >
          {link ? 'Ажурирај линк' : 'Додај линк'}
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