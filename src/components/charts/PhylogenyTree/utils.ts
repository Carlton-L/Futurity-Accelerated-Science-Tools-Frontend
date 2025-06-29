import type { SubCategory } from './types';

/**
 * Default color palette for subcategories - using your FS colors from the theme
 */
const DEFAULT_COLORS = [
  '#E07B91', // fs_color_1 - Light pink
  '#E69500', // fs_color_2 - Orange
  '#F2CD5D', // fs_color_3 - Light yellow
  '#C3DE6D', // fs_color_4 - Light green
  '#7CCBA2', // fs_color_5 - Medium green
  '#46ACC8', // fs_color_6 - Blue
  '#3366FF', // fs_color_7 - Dark blue (your brand color)
  '#6A35D4', // fs_color_8 - Purple
];

/**
 * Assigns default colors to subcategories that don't have colors
 * Uses your theme's FS color palette for consistency
 */
export function assignDefaultColors(
  subcategories: SubCategory[]
): SubCategory[] {
  return subcategories.map((subcategory, index) => ({
    ...subcategory,
    color: subcategory.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));
}

/**
 * Calculates the optimal SVG dimensions based on tree data
 * Adjusts for expanded items and ensures minimum readable size
 */
export function calculateTreeDimensions(
  subcategoriesCount: number,
  nodeSpacing: number,
  hasExpandedItems: boolean
) {
  const baseWidth = hasExpandedItems ? 900 : 600;
  const height = Math.max(400, subcategoriesCount * nodeSpacing + 160); // Added padding

  return {
    width: baseWidth,
    height,
    viewBox: `0 0 ${baseWidth} ${height}`,
  };
}

/**
 * Calculates positions for tree elements
 * Centers the root node based on subcategory count
 */
export function calculatePositions(
  subcategoriesCount: number,
  nodeSpacing: number
) {
  const rootY = (subcategoriesCount * nodeSpacing) / 2 + 80; // Center root vertically
  const verticalLineStart = 80; // Start from first subcategory
  const verticalLineEnd = subcategoriesCount * nodeSpacing + 40; // End at last subcategory

  return {
    rootY,
    verticalLineStart,
    verticalLineEnd,
  };
}

/**
 * Helper function to get contrast text color for backgrounds
 * Uses your theme's contrast colors
 */
export function getContrastColor(backgroundColor: string): string {
  // This is a simple implementation - you could enhance this to use
  // your theme's contrast color mappings
  const lightColors = ['#F2CD5D', '#C3DE6D', '#7CCBA2']; // Colors that need dark text

  if (lightColors.includes(backgroundColor)) {
    return 'var(--chakra-colors-fg)'; // Use theme's foreground color (dark text)
  }

  return 'white'; // Use white text for darker backgrounds
}
