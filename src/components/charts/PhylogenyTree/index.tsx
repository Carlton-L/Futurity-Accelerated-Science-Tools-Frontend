// Main component export
export { default, PhylogenyTree } from './PhylogenyTree';

// Type exports
export type {
  TreeItem,
  SubCategory,
  PhylogenyData,
  PhylogenyTreeProps,
} from './types';

// Utility exports
export {
  assignDefaultColors,
  calculateTreeDimensions,
  calculatePositions,
} from './utils';
