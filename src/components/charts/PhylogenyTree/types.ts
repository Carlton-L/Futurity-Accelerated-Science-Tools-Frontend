export interface TreeItem {
  id: string;
  name: string;
  fsid?: string; // Optional fsid for routing - will be used if available
}

export interface SubCategory {
  id: string;
  name: string;
  items: TreeItem[];
  color?: string;
}

export interface PhylogenyData {
  root: {
    id: string;
    name: string;
  };
  subcategories: SubCategory[];
}

export interface PhylogenyTreeProps {
  data: PhylogenyData;
  nodeSpacing?: number;
  levelSpacing?: number;
  itemSpacing?: number;
  width?: string | number;
  height?: string | number;
  onItemClick?: (item: TreeItem) => void; // Optional callback for custom click handling
  generateItemUrl?: (item: TreeItem) => string; // Optional custom URL generator
}
