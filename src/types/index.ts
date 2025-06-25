export interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  groupId?: string;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  parentGroupId?: string;
  createdAt: Date;
}

export interface DragItem {
  type: 'link' | 'url' | 'group';
  id?: string;
  url?: string;
}