import React from 'react';
import { Box, Text, VStack, Card, Button, HStack } from '@chakra-ui/react';
import { useTheme } from '../../../context/ThemeContext';
import PhylogenyTree from './index';
import type { PhylogenyData } from './types';

// Example data structure using your taxonomy approach
const exampleData: PhylogenyData = {
  root: {
    id: 'root',
    name: 'Technology Taxonomy',
  },
  subcategories: [
    {
      id: 'ai-ml',
      name: 'AI & Machine Learning',
      color: '#E07B91', // Using your fs_color_1
      items: [
        { id: 'neural-networks', name: 'Neural Networks' },
        { id: 'nlp', name: 'Natural Language Processing' },
        { id: 'computer-vision', name: 'Computer Vision' },
        { id: 'robotics', name: 'Autonomous Robotics' },
        { id: 'deep-learning', name: 'Deep Learning' },
      ],
    },
    {
      id: 'biotech',
      name: 'Biotechnology',
      color: '#E69500', // Using your fs_color_2
      items: [
        { id: 'gene-editing', name: 'CRISPR Gene Editing' },
        { id: 'synthetic-biology', name: 'Synthetic Biology' },
        { id: 'bioinformatics', name: 'Bioinformatics' },
        { id: 'precision-medicine', name: 'Precision Medicine' },
      ],
    },
    {
      id: 'quantum',
      name: 'Quantum Computing',
      color: '#F2CD5D', // Using your fs_color_3
      items: [
        { id: 'quantum-algorithms', name: 'Quantum Algorithms' },
        { id: 'quantum-hardware', name: 'Quantum Hardware' },
        { id: 'quantum-cryptography', name: 'Quantum Cryptography' },
        { id: 'quantum-sensing', name: 'Quantum Sensing' },
      ],
    },
    {
      id: 'energy',
      name: 'Clean Energy',
      color: '#C3DE6D', // Using your fs_color_4
      items: [
        { id: 'solar-cells', name: 'Perovskite Solar Cells' },
        { id: 'batteries', name: 'Solid-State Batteries' },
        { id: 'fusion', name: 'Nuclear Fusion' },
        { id: 'hydrogen', name: 'Green Hydrogen' },
        { id: 'wind', name: 'Offshore Wind' },
      ],
    },
    {
      id: 'space',
      name: 'Space Technology',
      color: '#7CCBA2', // Using your fs_color_5
      items: [
        { id: 'reusable-rockets', name: 'Reusable Rockets' },
        { id: 'satellite-constellations', name: 'Satellite Constellations' },
        { id: 'space-mining', name: 'Asteroid Mining' },
        { id: 'mars-colonization', name: 'Mars Colonization' },
      ],
    },
    {
      id: 'materials',
      name: 'Advanced Materials',
      color: '#46ACC8', // Using your fs_color_6
      items: [
        { id: 'graphene', name: 'Graphene Applications' },
        { id: 'metamaterials', name: 'Metamaterials' },
        { id: 'smart-materials', name: 'Smart Materials' },
        { id: 'nanotubes', name: 'Carbon Nanotubes' },
      ],
    },
  ],
};

// Alternative dataset for subject matter
const subjectData: PhylogenyData = {
  root: {
    id: 'subjects',
    name: 'Research Subjects',
  },
  subcategories: [
    {
      id: 'climate-tech',
      name: 'Climate Technology',
      // Let default colors be assigned
      items: [
        { id: 'carbon-capture', name: 'Direct Air Capture' },
        { id: 'geoengineering', name: 'Solar Geoengineering' },
        { id: 'climate-modeling', name: 'Climate Modeling' },
      ],
    },
    {
      id: 'longevity',
      name: 'Longevity Research',
      items: [
        { id: 'cellular-aging', name: 'Cellular Aging' },
        { id: 'senescence', name: 'Senescence Therapy' },
        { id: 'regenerative-medicine', name: 'Regenerative Medicine' },
      ],
    },
    {
      id: 'food-tech',
      name: 'Food Technology',
      items: [
        { id: 'alt-protein', name: 'Alternative Proteins' },
        { id: 'vertical-farming', name: 'Vertical Farming' },
        { id: 'lab-meat', name: 'Cultured Meat' },
      ],
    },
  ],
};

export const PhylogenyTreeExample: React.FC = () => {
  const { isDark, toggleColorMode } = useTheme();
  const [currentData, setCurrentData] =
    React.useState<PhylogenyData>(exampleData);

  return (
    <VStack spacing={6} p={6} fontFamily='body'>
      {/* Header Card */}
      <Card variant='outline' w='100%' maxW='1200px'>
        <Card.Header>
          <HStack justify='space-between' align='center'>
            <Box>
              <Text
                fontSize='xl'
                fontWeight='600'
                fontFamily='heading'
                color='fg'
              >
                Phylogeny Tree Component
              </Text>
              <Text fontSize='sm' color='fg.secondary' mt={1}>
                Interactive taxonomy visualization using your theme system
              </Text>
            </Box>
            <HStack spacing={3}>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentData(exampleData)}
                disabled={currentData === exampleData}
              >
                Technology View
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentData(subjectData)}
                disabled={currentData === subjectData}
              >
                Subjects View
              </Button>
              <Button variant='ghost' size='sm' onClick={toggleColorMode}>
                {isDark ? '☀️' : '🌙'}
              </Button>
            </HStack>
          </HStack>
        </Card.Header>
      </Card>

      {/* Tree Visualization */}
      <Box w='100%' maxW='1200px'>
        <PhylogenyTree
          data={currentData}
          nodeSpacing={120}
          levelSpacing={280}
          itemSpacing={60}
        />
      </Box>

      {/* Features Card */}
      <Card variant='subtle' w='100%' maxW='1200px'>
        <Card.Body>
          <Text
            fontSize='md'
            fontWeight='600'
            color='fg'
            mb={3}
            fontFamily='heading'
          >
            Component Features
          </Text>
          <VStack align='start' spacing={2}>
            <Text fontSize='sm' color='fg.secondary'>
              •{' '}
              <Text as='span' color='fg'>
                Theme Integration:
              </Text>{' '}
              Uses your semantic tokens for colors, borders, and typography
            </Text>
            <Text fontSize='sm' color='fg.secondary'>
              •{' '}
              <Text as='span' color='fg'>
                FS Color Palette:
              </Text>{' '}
              Automatically assigns colors from your 8-color FS system
            </Text>
            <Text fontSize='sm' color='fg.secondary'>
              •{' '}
              <Text as='span' color='fg'>
                Card System:
              </Text>{' '}
              Wraps content in your theme's card components
            </Text>
            <Text fontSize='sm' color='fg.secondary'>
              •{' '}
              <Text as='span' color='fg'>
                Responsive Design:
              </Text>{' '}
              Adapts to different screen sizes with horizontal scrolling
            </Text>
            <Text fontSize='sm' color='fg.secondary'>
              •{' '}
              <Text as='span' color='fg'>
                Animation:
              </Text>{' '}
              Smooth expand/collapse with Framer Motion
            </Text>
            <Text fontSize='sm' color='fg.secondary'>
              •{' '}
              <Text as='span' color='fg'>
                Dark Mode:
              </Text>{' '}
              Automatically switches with your theme context
            </Text>
          </VStack>
        </Card.Body>
      </Card>
    </VStack>
  );
};

export default PhylogenyTreeExample;
