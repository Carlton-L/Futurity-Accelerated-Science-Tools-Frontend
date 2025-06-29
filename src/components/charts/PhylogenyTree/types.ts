export interface TreeItem {
  id: string;
  name: string;
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
}
