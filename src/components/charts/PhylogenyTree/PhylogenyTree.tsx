import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Text, Card } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
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

// Helper function to calculate text width (rough approximation)
function getTextWidth(text: string, fontSize: number = 12): number {
  return text.length * fontSize * 0.7; // Increased multiplier for even better accuracy
}

// Helper function to create hexagon path for subject icons (rotated 90 degrees)
function createHexagonPath(cx: number, cy: number, radius: number): string {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 2; // Add 90 degree rotation
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return `M${points.join('L')}Z`;
}

// Helper function to process subcategories and add empty items for empty categories
function processSubcategories(subcategories: SubCategory[]): SubCategory[] {
  return subcategories.map((subcategory) => {
    if (subcategory.items.length === 0) {
      // Add a special empty item for empty subcategories
      return {
        ...subcategory,
        items: [{ id: '', name: '(empty)' }],
      };
    }
    return subcategory;
  });
}

function calculateSubcategoryPositions(
  subcategories: SubCategory[],
  expandedCategories: Set<string>,
  nodeSpacing: number,
  itemSpacing: number
) {
  const positions: { [key: string]: number } = {};
  let currentY = 80; // Starting Y position

  subcategories.forEach((subcategory) => {
    if (expandedCategories.has(subcategory.id)) {
      // Calculate the space needed for this expanded category's items
      const itemCount = subcategory.items.length;
      const itemsSpan = Math.max(0, (itemCount - 1) * itemSpacing);

      // Position the subcategory node in the center of its expanded items
      // The category should be centered vertically among its items
      const categoryY = currentY + itemsSpan / 2;
      positions[subcategory.id] = categoryY;

      // Move to next position accounting for the full span of expanded items plus padding
      currentY += itemsSpan + 80; // Increased padding between expanded sections
    } else {
      // Regular spacing for non-expanded categories
      positions[subcategory.id] = currentY;
      currentY += nodeSpacing;
    }
  });

  return positions;
}

function calculateTreeDimensions(
  subcategories: SubCategory[],
  expandedCategories: Set<string>,
  nodeSpacing: number,
  itemSpacing: number
) {
  // Fixed width - no dynamic horizontal expansion
  const fixedWidth = 800; // Fixed width for consistent layout

  // Calculate height based on dynamic positioning
  const subcategoryPositions = calculateSubcategoryPositions(
    subcategories,
    expandedCategories,
    nodeSpacing,
    itemSpacing
  );

  // Calculate the actual bottom extent of the tree
  let maxBottomY = 0;
  let minTopY = Infinity;

  subcategories.forEach((subcategory) => {
    const subcategoryY = subcategoryPositions[subcategory.id];

    if (expandedCategories.has(subcategory.id)) {
      // For expanded categories, find the top-most and bottom-most items
      const itemCount = subcategory.items.length;
      const itemsSpan = Math.max(0, (itemCount - 1) * itemSpacing);

      // Items are centered around the subcategory position
      const topMostItemY = subcategoryY - itemsSpan / 2;
      const bottomMostItemY = subcategoryY + itemsSpan / 2;

      minTopY = Math.min(minTopY, topMostItemY - 15); // Account for item size
      maxBottomY = Math.max(maxBottomY, bottomMostItemY + 15); // Account for item size
    } else {
      // For collapsed categories, just account for the subcategory node
      minTopY = Math.min(minTopY, subcategoryY - 15);
      maxBottomY = Math.max(maxBottomY, subcategoryY + 15);
    }
  });

  // Ensure we don't have negative starting position and add padding
  const bottomPadding = 60; // Bottom padding

  // Adjust all positions if we need top padding
  if (minTopY < 80) {
    const adjustment = 80 - minTopY;
    Object.keys(subcategoryPositions).forEach((key) => {
      subcategoryPositions[key] += adjustment;
    });
    maxBottomY += adjustment;
  }

  const totalHeight = maxBottomY + bottomPadding;
  const height = Math.max(300, totalHeight);

  return {
    width: fixedWidth,
    height,
    viewBox: `0 0 ${fixedWidth} ${height}`,
    subcategoryPositions,
  };
}

function calculatePositions(subcategoryPositions: { [key: string]: number }) {
  // Calculate root position based on dynamic subcategory positions
  const allPositions = Object.values(subcategoryPositions);
  const minY = Math.min(...allPositions);
  const maxY = Math.max(...allPositions);
  const rootY = (minY + maxY) / 2; // Center root between first and last subcategory

  const verticalLineStart = minY - 5; // Slightly above first subcategory
  const verticalLineEnd = maxY + 5; // Slightly below last subcategory

  return {
    rootY,
    verticalLineStart,
    verticalLineEnd,
  };
}

// Motion components
const MotionCard = motion.create(Card.Root);
const MotionG = motion.g;

// Main component
export const PhylogenyTree: React.FC<PhylogenyTreeProps> = ({
  data,
  nodeSpacing = 80, // Reduced from 120
  levelSpacing = 240, // Reduced from 280
  itemSpacing = 40, // Reduced from 60
  width = '100%',
  height = 'auto',
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Track previous positions for smooth transitions
  const previousPositions = useRef<{ [key: string]: number }>({});

  // Refs for viewport centering
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Function to smoothly scroll to center a category in the viewport
  const centerCategoryInViewport = useCallback(
    (categoryId: string, categoryY: number) => {
      const container = containerRef.current;
      if (!container) return;

      // Get container dimensions
      const containerRect = container.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const containerScrollTop = container.scrollTop;

      // Calculate the center of the container viewport
      const viewportCenter = containerHeight / 2;

      // Calculate where the category currently is in the viewport
      const categoryScreenY = categoryY; // SVG coordinate

      // Calculate the desired scroll position to center the category
      const desiredScrollTop = categoryScreenY - viewportCenter;

      // Smooth scroll to the calculated position
      container.scrollTo({
        top: Math.max(0, desiredScrollTop), // Ensure we don't scroll to negative
        behavior: 'smooth',
      });
    },
    []
  );

  const toggleCategory = useCallback(
    (categoryId: string) => {
      setExpandedCategories((prev) => {
        const newSet = new Set(prev);
        const isExpanding = !newSet.has(categoryId);

        if (newSet.has(categoryId)) {
          newSet.delete(categoryId);
        } else {
          newSet.add(categoryId);
        }

        // If we're expanding a category, schedule viewport centering
        if (isExpanding) {
          // Use setTimeout to allow the layout to update first
          setTimeout(() => {
            // Calculate dimensions with the new expanded state
            const processedSubcategories = processSubcategories(
              data.subcategories
            );
            const dimensions = calculateTreeDimensions(
              processedSubcategories,
              newSet, // Use the new expanded state
              nodeSpacing,
              itemSpacing
            );

            const categoryY = dimensions.subcategoryPositions[categoryId];
            if (categoryY !== undefined) {
              centerCategoryInViewport(categoryId, categoryY);
            }
          }, 100); // Small delay to allow React to update the DOM
        }

        return newSet;
      });
    },
    [data.subcategories, nodeSpacing, itemSpacing, centerCategoryInViewport]
  );

  // Process subcategories to add empty items for empty categories
  const processedSubcategories = processSubcategories(data.subcategories);

  // Calculate dimensions using processed subcategories
  const dimensions = calculateTreeDimensions(
    processedSubcategories,
    expandedCategories,
    nodeSpacing,
    itemSpacing
  );

  // Calculate positions
  const positions = calculatePositions(dimensions.subcategoryPositions);

  // Update previous positions after calculation
  useEffect(() => {
    Object.keys(dimensions.subcategoryPositions).forEach((categoryId) => {
      if (previousPositions.current[categoryId] === undefined) {
        // First time seeing this category, set it to current position
        previousPositions.current[categoryId] =
          dimensions.subcategoryPositions[categoryId];
      }
    });
  }, [dimensions.subcategoryPositions]);

  return (
    <MotionCard
      variant='outline'
      w='100%' // Always 100% of container width
      h={height}
      p={6}
      overflowX='auto' // Scroll on horizontal overflow
      overflowY='auto' // Add vertical scrolling for viewport centering
      maxH='70vh' // Limit height to ensure scrolling is possible
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        height: Math.min(dimensions.height + 120, window.innerHeight * 0.7), // Ensure container is smaller than content when needed
      }}
      transition={{ duration: 0.5 }}
      ref={containerRef} // Add container ref for scroll control
      css={{
        // Smooth scrolling behavior
        scrollBehavior: 'smooth',
        // Custom scrollbar styling
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'var(--chakra-colors-bg-subtle)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'var(--chakra-colors-border-muted)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'var(--chakra-colors-border-emphasized)',
        },
      }}
    >
      {/* Instructions Card - moved to top */}
      <MotionCard
        variant='subtle'
        mb={4}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card.Body textAlign='center' py={3}>
          <Text color='fg.secondary' fontSize='sm' fontFamily='body'>
            Click on any{' '}
            <Text as='strong' color='fg'>
              subcategory node
            </Text>{' '}
            to expand and view the related items. The viewport will
            automatically center on expanded branches for better focus.
          </Text>
        </Card.Body>
      </MotionCard>

      <Box minW={`${dimensions.width}px`}>
        <svg
          ref={svgRef} // Add SVG ref for potential future use
          width='100%'
          height={dimensions.height}
          viewBox={dimensions.viewBox}
          style={{ overflow: 'visible' }}
        >
          {/* Root Node */}
          <MotionG
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Square root node with dynamic width that fits text exactly */}
            {(() => {
              const rootTextWidth = getTextWidth(data.root.name, 12);
              const rootWidth = rootTextWidth + 48; // Doubled padding from 24 to 48
              return (
                <>
                  <motion.rect
                    x={80 - rootWidth / 2}
                    animate={{ y: positions.rootY - 15 }}
                    width={rootWidth}
                    height={30}
                    rx={6}
                    fill='var(--chakra-colors-bg-canvas)'
                    stroke='var(--chakra-colors-border-emphasized)'
                    strokeWidth='2'
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                  <motion.text
                    x={80}
                    animate={{ y: positions.rootY + 4 }}
                    textAnchor='middle'
                    fill='var(--chakra-colors-fg)'
                    fontSize='12'
                    fontWeight='600'
                    fontFamily='var(--chakra-fonts-heading)'
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  >
                    {data.root.name}
                  </motion.text>
                </>
              );
            })()}
          </MotionG>

          {/* Main horizontal line from root */}
          {(() => {
            const rootTextWidth = getTextWidth(data.root.name, 12);
            const rootWidth = rootTextWidth + 48; // Updated to match rect width
            return (
              <motion.line
                x1={80 + rootWidth / 2}
                animate={{ y1: positions.rootY, y2: positions.rootY }}
                x2={levelSpacing - 40}
                stroke='var(--chakra-colors-border-muted)'
                strokeWidth='2'
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            );
          })()}

          {/* Vertical connector line */}
          <motion.line
            x1={levelSpacing - 40}
            animate={{
              y1: positions.verticalLineStart,
              y2: positions.verticalLineEnd,
            }}
            x2={levelSpacing - 40}
            stroke='var(--chakra-colors-border-muted)'
            strokeWidth='2'
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />

          {/* Subcategory Nodes */}
          {processedSubcategories.map((subcategory, index) => {
            const yPos = dimensions.subcategoryPositions[subcategory.id]; // Use dynamic position
            const isExpanded = expandedCategories.has(subcategory.id);
            const subcategoryTextWidth = getTextWidth(subcategory.name, 12);
            const subcategoryWidth = Math.max(subcategoryTextWidth + 60, 120); // Reduced padding since no icon needed

            // Get previous position for this category
            const prevPos = previousPositions.current[subcategory.id] || yPos;

            // Update previous position for next render using useEffect
            useEffect(() => {
              previousPositions.current[subcategory.id] = yPos;
            }, [subcategory.id, yPos]);

            return (
              <MotionG
                key={subcategory.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Horizontal line to subcategory */}
                <motion.line
                  x1={levelSpacing - 40}
                  animate={{ y1: yPos, y2: yPos }}
                  x2={levelSpacing - 20}
                  stroke='var(--chakra-colors-border-muted)'
                  strokeWidth='2'
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />

                {/* Subcategory Node */}
                <motion.g
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleCategory(subcategory.id)}
                  animate={{ y: 0 }} // Keep at 0 since we're animating the individual elements
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  whileHover={{ scale: 1.05 }} // Add subtle hover feedback
                  whileTap={{ scale: 0.95 }} // Add click feedback
                >
                  <motion.rect
                    x={levelSpacing - 20}
                    animate={{ y: yPos - 15 }}
                    width={subcategoryWidth}
                    height={30}
                    rx={6}
                    fill='var(--chakra-colors-fg-secondary)' // Theme secondary color instead of custom colors
                    stroke='var(--chakra-colors-border-emphasized)'
                    strokeWidth='2'
                    filter='url(#dropShadow)'
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                  <motion.text
                    x={levelSpacing - 20 + subcategoryWidth / 2}
                    animate={{ y: yPos + 4 }}
                    textAnchor='middle'
                    fill='var(--chakra-colors-bg-canvas)' // Contrast text
                    fontSize='12'
                    fontWeight='600'
                    fontFamily='var(--chakra-fonts-heading)'
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ pointerEvents: 'none' }} // Prevent text from interfering with click
                  >
                    {subcategory.name}
                  </motion.text>
                </motion.g>

                {/* Horizontal line to items - moves with branch using y1/y2 animation */}
                {isExpanded && (
                  <motion.line
                    x1={levelSpacing - 20 + subcategoryWidth}
                    x2={levelSpacing - 20 + subcategoryWidth + 40}
                    initial={{ y1: prevPos, y2: prevPos }}
                    animate={{ y1: yPos, y2: yPos }}
                    stroke='var(--chakra-colors-border-muted)'
                    strokeWidth='2'
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                )}

                {/* Items (when expanded) */}
                <AnimatePresence>
                  {isExpanded && (
                    <MotionG
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Vertical connector for items */}
                      {subcategory.items.length > 1 && (
                        <motion.line
                          x1={levelSpacing - 20 + subcategoryWidth + 40}
                          x2={levelSpacing - 20 + subcategoryWidth + 40}
                          animate={{
                            y1:
                              yPos -
                              ((subcategory.items.length - 1) * itemSpacing) /
                                2,
                            y2:
                              yPos +
                              ((subcategory.items.length - 1) * itemSpacing) /
                                2,
                          }}
                          stroke='var(--chakra-colors-border-muted)'
                          strokeWidth='2'
                          transition={{ duration: 0.3 }}
                        />
                      )}

                      {/* Item nodes */}
                      {subcategory.items.map((item, itemIndex) => {
                        const itemY =
                          yPos -
                          ((subcategory.items.length - 1) * itemSpacing) / 2 +
                          itemIndex * itemSpacing;

                        // Check if this is an empty item (for empty subcategories)
                        const isEmpty = item.id === '';

                        return (
                          <MotionG
                            key={item.id || `empty-${itemIndex}`}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{
                              opacity: 0,
                              x: 30,
                              transition: {
                                duration: 0.3, // Exit duration (regular)
                                ease: 'easeIn',
                              },
                            }}
                            transition={{
                              duration: 0.1, // Enter duration (fast)
                              ease: 'easeOut',
                              delay: itemIndex * 0.05,
                            }}
                          >
                            {/* Line to item - only show if not empty */}
                            {!isEmpty && (
                              <motion.line
                                x1={levelSpacing - 20 + subcategoryWidth + 40}
                                animate={{ y1: itemY, y2: itemY }}
                                x2={levelSpacing - 20 + subcategoryWidth + 60}
                                stroke='var(--chakra-colors-border-muted)'
                                strokeWidth='2'
                                transition={{ duration: 0.3 }}
                              />
                            )}

                            {/* Item node - Hexagon subject icon (rotated 90 degrees) */}
                            <motion.path
                              d={createHexagonPath(
                                isEmpty
                                  ? levelSpacing - 20 + subcategoryWidth + 40 // Position empty hexagon where the line would start
                                  : levelSpacing - 20 + subcategoryWidth + 70, // Normal position for regular items
                                itemY,
                                8
                              )}
                              animate={{
                                d: createHexagonPath(
                                  isEmpty
                                    ? levelSpacing - 20 + subcategoryWidth + 40
                                    : levelSpacing - 20 + subcategoryWidth + 70,
                                  itemY,
                                  8
                                ),
                              }}
                              fill={
                                isEmpty
                                  ? 'var(--chakra-colors-bg-canvas)'
                                  : 'var(--chakra-colors-brand)'
                              }
                              stroke={
                                isEmpty
                                  ? 'var(--chakra-colors-border-muted)'
                                  : 'var(--chakra-colors-border-emphasized)'
                              }
                              strokeWidth='1'
                              transition={{ duration: 0.3 }}
                            />

                            {/* Item label - show for all items now */}
                            <motion.text
                              initial={{
                                x: isEmpty
                                  ? levelSpacing -
                                    20 +
                                    subcategoryWidth +
                                    60 +
                                    30 // Start 30px to the right
                                  : levelSpacing -
                                    20 +
                                    subcategoryWidth +
                                    90 +
                                    30,
                                y: itemY + 3, // Set initial Y to final Y to prevent coming from top
                                opacity: 0,
                              }}
                              animate={{
                                x: isEmpty
                                  ? levelSpacing - 20 + subcategoryWidth + 60 // Final position
                                  : levelSpacing - 20 + subcategoryWidth + 90,
                                y: itemY + 3, // Animate Y position for smooth repositioning
                                opacity: 1,
                              }}
                              fill={
                                isEmpty
                                  ? 'var(--chakra-colors-fg-muted)'
                                  : 'var(--chakra-colors-fg)'
                              }
                              fontSize='10'
                              fontWeight='500'
                              fontFamily='var(--chakra-fonts-body)'
                              transition={{
                                x: {
                                  type: 'tween',
                                  duration: 0.1, // Fast horizontal entry
                                  ease: 'easeOut',
                                },
                                y: {
                                  type: 'tween',
                                  duration: 0.4, // Slower vertical repositioning
                                  ease: 'easeOut',
                                },
                                opacity: {
                                  duration: 0.1, // Fast opacity fade in
                                  ease: 'easeOut',
                                },
                              }}
                            >
                              {item.name}
                            </motion.text>
                          </MotionG>
                        );
                      })}
                    </MotionG>
                  )}
                </AnimatePresence>
              </MotionG>
            );
          })}

          {/* Gradient Definitions */}
          <defs>
            <filter
              id='dropShadow'
              x='-20%'
              y='-20%'
              width='140%'
              height='140%'
            >
              <feDropShadow
                dx='1'
                dy='2'
                stdDeviation='2'
                floodColor='rgba(0,0,0,0.1)'
              />
            </filter>
          </defs>
        </svg>
      </Box>
    </MotionCard>
  );
};

export default PhylogenyTree;
