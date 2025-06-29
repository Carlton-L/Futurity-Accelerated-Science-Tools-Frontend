import React, { useState } from 'react';
import { Box, Text, Card } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PhylogenyTreeProps } from './types';
import {
  assignDefaultColors,
  calculateTreeDimensions,
  calculatePositions,
} from './utils';

const MotionBox = motion.create(Box);
const MotionCard = motion.create(Card.Root);
const MotionG = motion.g;

export const PhylogenyTree: React.FC<PhylogenyTreeProps> = ({
  data,
  nodeSpacing = 120,
  levelSpacing = 280,
  itemSpacing = 60,
  width = '100%',
  height = 'auto',
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  // Assign default colors to subcategories
  const subcategoriesWithColors = assignDefaultColors(data.subcategories);

  // Calculate dimensions
  const dimensions = calculateTreeDimensions(
    data.subcategories.length,
    nodeSpacing,
    expandedCategory !== null,
    levelSpacing
  );

  // Calculate positions
  const positions = calculatePositions(
    data.subcategories.length,
    nodeSpacing,
    levelSpacing
  );

  return (
    <MotionCard
      variant='outline'
      w={width}
      h={height}
      p={6}
      overflowX='auto'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box minW='800px'>
        <svg
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
            <circle
              cx={80}
              cy={positions.rootY}
              r={35}
              fill='url(#rootGradient)'
              stroke='var(--chakra-colors-brand)'
              strokeWidth='3'
            />
            <text
              x={80}
              y={positions.rootY + 8}
              textAnchor='middle'
              fill='var(--chakra-colors-brand-contrast)'
              fontSize='14'
              fontWeight='600'
              fontFamily='var(--chakra-fonts-heading)'
            >
              {data.root.name}
            </text>
          </MotionG>

          {/* Main horizontal line from root */}
          <line
            x1={115}
            y1={positions.rootY}
            x2={levelSpacing - 50}
            y2={positions.rootY}
            stroke='var(--chakra-colors-border-muted)'
            strokeWidth='2'
          />

          {/* Vertical connector line */}
          <line
            x1={levelSpacing - 50}
            y1={positions.verticalLineStart}
            x2={levelSpacing - 50}
            y2={positions.verticalLineEnd}
            stroke='var(--chakra-colors-border-muted)'
            strokeWidth='2'
          />

          {/* Subcategory Nodes */}
          {subcategoriesWithColors.map((subcategory, index) => {
            const yPos = index * nodeSpacing + 80;
            const isExpanded = expandedCategory === subcategory.id;

            return (
              <MotionG
                key={subcategory.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Horizontal line to subcategory */}
                <line
                  x1={levelSpacing - 50}
                  y1={yPos}
                  x2={levelSpacing - 20}
                  y2={yPos}
                  stroke='var(--chakra-colors-border-muted)'
                  strokeWidth='2'
                />

                {/* Subcategory Node */}
                <MotionG
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleCategory(subcategory.id)}
                >
                  <rect
                    x={levelSpacing - 20}
                    y={yPos - 20}
                    width={140}
                    height={40}
                    rx={8}
                    fill={subcategory.color}
                    stroke='var(--chakra-colors-border-emphasized)'
                    strokeWidth='2'
                    filter='url(#dropShadow)'
                  />
                  <text
                    x={levelSpacing + 50}
                    y={yPos + 6}
                    textAnchor='middle'
                    fill='white'
                    fontSize='14'
                    fontWeight='600'
                    fontFamily='var(--chakra-fonts-heading)'
                  >
                    {subcategory.name}
                  </text>

                  {/* Expand/Collapse Icon */}
                  <MotionG
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <circle
                      cx={levelSpacing + 100}
                      cy={yPos}
                      r={8}
                      fill='rgba(255,255,255,0.3)'
                    />
                    <polygon
                      points={`${levelSpacing + 97},${yPos - 3} ${
                        levelSpacing + 103
                      },${yPos} ${levelSpacing + 97},${yPos + 3}`}
                      fill='white'
                    />
                  </MotionG>
                </MotionG>

                {/* Items (when expanded) */}
                <AnimatePresence>
                  {isExpanded && (
                    <MotionG
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Horizontal line to items */}
                      <line
                        x1={levelSpacing + 120}
                        y1={yPos}
                        x2={levelSpacing + 170}
                        y2={yPos}
                        stroke='var(--chakra-colors-border-muted)'
                        strokeWidth='2'
                      />

                      {/* Vertical connector for items */}
                      {subcategory.items.length > 1 && (
                        <line
                          x1={levelSpacing + 170}
                          y1={
                            yPos -
                            ((subcategory.items.length - 1) * itemSpacing) / 2
                          }
                          x2={levelSpacing + 170}
                          y2={
                            yPos +
                            ((subcategory.items.length - 1) * itemSpacing) / 2
                          }
                          stroke='var(--chakra-colors-border-muted)'
                          strokeWidth='2'
                        />
                      )}

                      {/* Item nodes */}
                      {subcategory.items.map((item, itemIndex) => {
                        const itemY =
                          yPos -
                          ((subcategory.items.length - 1) * itemSpacing) / 2 +
                          itemIndex * itemSpacing;

                        return (
                          <MotionG
                            key={item.id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.3,
                              delay: itemIndex * 0.05,
                            }}
                          >
                            {/* Line to item */}
                            <line
                              x1={levelSpacing + 170}
                              y1={itemY}
                              x2={levelSpacing + 190}
                              y2={itemY}
                              stroke='var(--chakra-colors-border-muted)'
                              strokeWidth='2'
                            />

                            {/* Item node */}
                            <circle
                              cx={levelSpacing + 205}
                              cy={itemY}
                              r={12}
                              fill={subcategory.color}
                              stroke='var(--chakra-colors-border-emphasized)'
                              strokeWidth='2'
                              opacity='0.8'
                            />

                            {/* Item label */}
                            <rect
                              x={levelSpacing + 220}
                              y={itemY - 12}
                              width={item.name.length * 8 + 16}
                              height={24}
                              rx={6}
                              fill='var(--chakra-colors-bg-canvas)'
                              stroke='var(--chakra-colors-border-muted)'
                              strokeWidth='1'
                            />
                            <text
                              x={levelSpacing + 228}
                              y={itemY + 4}
                              fill='var(--chakra-colors-fg)'
                              fontSize='12'
                              fontWeight='500'
                              fontFamily='var(--chakra-fonts-body)'
                            >
                              {item.name}
                            </text>
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
            <linearGradient
              id='rootGradient'
              x1='0%'
              y1='0%'
              x2='100%'
              y2='100%'
            >
              <stop offset='0%' stopColor='var(--chakra-colors-brand)' />
              <stop offset='100%' stopColor='var(--chakra-colors-brand-600)' />
            </linearGradient>

            <filter
              id='dropShadow'
              x='-20%'
              y='-20%'
              width='140%'
              height='140%'
            >
              <feDropShadow
                dx='2'
                dy='4'
                stdDeviation='3'
                floodColor='rgba(0,0,0,0.1)'
              />
            </filter>
          </defs>
        </svg>

        {/* Instructions Card */}
        <MotionCard
          variant='subtle'
          mt={6}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card.Body textAlign='center'>
            <Text color='fg.secondary' fontSize='sm' fontFamily='body'>
              Click on any{' '}
              <Text as='strong' color='fg'>
                subcategory node
              </Text>{' '}
              to expand and view the related items. Only one branch can be
              expanded at a time.
            </Text>
          </Card.Body>
        </MotionCard>
      </Box>
    </MotionCard>
  );
};

export default PhylogenyTree;
