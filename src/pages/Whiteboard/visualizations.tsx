import React from 'react';
import {
  Box,
  Text,
  Grid,
  VStack,
  HStack,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { Progress } from '@chakra-ui/react';
import { FiTrash2 } from 'react-icons/fi';
import type { WhiteboardSubject, DraftMetrics } from './types';
import { getInnovationQuadrant } from './types';

// Blue hexagon icon component for subjects
const SubjectHexagonIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M12 2L20.196 7V17L12 22L3.804 17V7L12 2Z'
      fill='#0005E9'
      stroke='#0005E9'
      strokeWidth='1'
      strokeLinejoin='round'
    />
  </svg>
);

// Utility function for color mapping
const getMetricColor = (
  value: number,
  type: 'horizon' | 'techTransfer' | 'whiteSpace'
) => {
  switch (type) {
    case 'horizon':
      return value < 0.3 ? 'red' : value < 0.7 ? 'orange' : 'green';
    case 'techTransfer':
      return value < 40 ? 'red' : value < 70 ? 'orange' : 'green';
    case 'whiteSpace':
      return value < 30 ? 'red' : value < 60 ? 'orange' : 'green';
    default:
      return 'gray';
  }
};

// ListView Component
export const ListView: React.FC<{
  subjects: WhiteboardSubject[];
  onRemoveSubject?: (subjectId: string) => void;
}> = ({ subjects, onRemoveSubject }) => {
  if (subjects.length === 0) {
    return (
      <Flex align='center' justify='center' minH='150px' color='gray.500'>
        <Text fontSize='sm'>No subjects in this lab seed</Text>
      </Flex>
    );
  }

  return (
    <VStack gap={2} align='stretch'>
      {subjects.map((subject) => (
        <Box
          key={subject.id}
          p={3}
          bg='black'
          borderRadius='md'
          border='1px solid'
          borderColor='gray.600'
        >
          <VStack gap={2} align='stretch'>
            <HStack justify='space-between' align='start'>
              <HStack gap={2} flex='1' align='start'>
                <SubjectHexagonIcon size={24} />
                <VStack gap={1} align='start' flex='1'>
                  <Text fontSize='sm' fontWeight='medium' color='white'>
                    {subject.name}
                  </Text>
                  <Text fontSize='xs' color='gray.300' lineClamp={2}>
                    {subject.description}
                  </Text>
                </VStack>
              </HStack>
              {onRemoveSubject && (
                <IconButton
                  size='xs'
                  variant='ghost'
                  colorScheme='red'
                  onClick={() => onRemoveSubject(subject.id)}
                  aria-label='Remove subject'
                >
                  <FiTrash2 size={12} />
                </IconButton>
              )}
            </HStack>

            <Grid templateColumns='repeat(3, 1fr)' gap={3}>
              <VStack gap={1}>
                <Text fontSize='xs' color='gray.400'>
                  Horizon Rank
                </Text>
                <HStack gap={1} width='100%'>
                  <Progress.Root
                    value={subject.horizonRank * 100}
                    size='sm'
                    flex='1'
                    colorPalette={getMetricColor(
                      subject.horizonRank,
                      'horizon'
                    )}
                  >
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                  <Text
                    fontSize='xs'
                    fontWeight='medium'
                    minW='35px'
                    color='white'
                  >
                    {subject.horizonRank.toFixed(2)}
                  </Text>
                </HStack>
              </VStack>

              <VStack gap={1}>
                <Text fontSize='xs' color='gray.400'>
                  Tech Transfer
                </Text>
                <HStack gap={1} width='100%'>
                  <Progress.Root
                    value={subject.techTransfer}
                    size='sm'
                    flex='1'
                    colorPalette={getMetricColor(
                      subject.techTransfer,
                      'techTransfer'
                    )}
                  >
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                  <Text
                    fontSize='xs'
                    fontWeight='medium'
                    minW='35px'
                    color='white'
                  >
                    {subject.techTransfer}
                  </Text>
                </HStack>
              </VStack>

              <VStack gap={1}>
                <Text fontSize='xs' color='gray.400'>
                  White Space
                </Text>
                <HStack gap={1} width='100%'>
                  <Progress.Root
                    value={subject.whiteSpace}
                    size='sm'
                    flex='1'
                    colorPalette={getMetricColor(
                      subject.whiteSpace,
                      'whiteSpace'
                    )}
                  >
                    <Progress.Track>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                  <Text
                    fontSize='xs'
                    fontWeight='medium'
                    minW='35px'
                    color='white'
                  >
                    {subject.whiteSpace}
                  </Text>
                </HStack>
              </VStack>
            </Grid>
          </VStack>
        </Box>
      ))}
    </VStack>
  );
};

// Innovation Matrix Component
export const InnovationMatrix: React.FC<{
  subjects: WhiteboardSubject[];
}> = ({ subjects }) => {
  const maxWhiteSpace = Math.max(...subjects.map((s) => s.whiteSpace), 100);
  const maxTechTransfer = Math.max(...subjects.map((s) => s.techTransfer), 100);

  return (
    <Box
      position='relative'
      height='300px'
      border='1px solid'
      borderColor='gray.200'
      borderRadius='md'
    >
      {/* Quadrant backgrounds */}
      <Box
        position='absolute'
        top='0'
        left='0'
        width='50%'
        height='50%'
        bg='orange.50'
      />
      <Box
        position='absolute'
        top='0'
        right='0'
        width='50%'
        height='50%'
        bg='blue.50'
      />
      <Box
        position='absolute'
        bottom='0'
        left='0'
        width='50%'
        height='50%'
        bg='gray.100'
      />
      <Box
        position='absolute'
        bottom='0'
        right='0'
        width='50%'
        height='50%'
        bg='red.50'
      />

      {/* Quadrant labels */}
      <Text
        position='absolute'
        top='10px'
        left='10px'
        fontSize='xs'
        fontWeight='bold'
        color='orange.600'
      >
        Emerging
      </Text>
      <Text
        position='absolute'
        top='10px'
        right='10px'
        fontSize='xs'
        fontWeight='bold'
        color='blue.600'
      >
        Blue Ocean
      </Text>
      <Text
        position='absolute'
        bottom='10px'
        left='10px'
        fontSize='xs'
        fontWeight='bold'
        color='gray.600'
      >
        Saturated
      </Text>
      <Text
        position='absolute'
        bottom='10px'
        right='10px'
        fontSize='xs'
        fontWeight='bold'
        color='red.600'
      >
        Competitive
      </Text>

      {/* Axis lines */}
      <Box
        position='absolute'
        top='50%'
        left='0'
        right='0'
        height='1px'
        bg='gray.400'
        transform='translateY(-50%)'
      />
      <Box
        position='absolute'
        left='50%'
        top='0'
        bottom='0'
        width='1px'
        bg='gray.400'
        transform='translateX(-50%)'
      />

      {/* Data points */}
      {subjects.map((subject) => {
        const x = (subject.techTransfer / maxTechTransfer) * 100;
        const y = 100 - (subject.whiteSpace / maxWhiteSpace) * 100; // Invert Y axis
        const quadrant = getInnovationQuadrant(
          subject.whiteSpace,
          subject.techTransfer
        );

        return (
          <Box
            key={subject.id}
            position='absolute'
            left={`${x}%`}
            top={`${y}%`}
            transform='translate(-50%, -50%)'
            zIndex='10'
          >
            <Box
              width='8px'
              height='8px'
              borderRadius='full'
              bg={`${quadrant.color}.500`}
              border='2px solid white'
              cursor='pointer'
              title={`${subject.name} - ${quadrant.name}: ${quadrant.description}`}
              _hover={{ transform: 'scale(1.3)' }}
              transition='transform 0.2s'
            />
          </Box>
        );
      })}

      {/* Axis labels */}
      <Text
        position='absolute'
        bottom='-20px'
        left='50%'
        transform='translateX(-50%)'
        fontSize='xs'
        color='gray.600'
      >
        Tech Transfer →
      </Text>
      <Text
        position='absolute'
        left='-40px'
        top='50%'
        transform='translateY(-50%) rotate(-90deg)'
        fontSize='xs'
        color='gray.600'
        transformOrigin='center'
      >
        White Space →
      </Text>
    </Box>
  );
};

// Metrics Radar Component
export const MetricsRadar: React.FC<{
  metrics: DraftMetrics;
}> = ({ metrics }) => {
  const radarMetrics = [
    {
      name: 'Innovation Potential',
      value: metrics.innovationPotential,
      max: 100,
    },
    { name: 'Cluster Coefficient', value: metrics.coherenceScore, max: 100 },
    { name: 'Tech Velocity', value: metrics.avgTechTransfer, max: 100 },
    { name: 'Market Opportunity', value: metrics.avgWhiteSpace, max: 100 },
    {
      name: 'Technology Maturity',
      value: metrics.avgHorizonRank * 100,
      max: 100,
    },
  ];

  return (
    <VStack gap={3} align='stretch'>
      <Text fontSize='sm' fontWeight='medium' textAlign='center'>
        Lab Seed Performance Radar
      </Text>

      {radarMetrics.map((metric) => (
        <HStack key={metric.name} justify='space-between'>
          <Text fontSize='xs' color='gray.600' minW='120px'>
            {metric.name}
          </Text>
          <HStack gap={1} flex='1'>
            <Progress.Root
              value={metric.value}
              size='sm'
              flex='1'
              colorPalette={
                metric.value > 70
                  ? 'green'
                  : metric.value > 40
                  ? 'orange'
                  : 'red'
              }
            >
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
            <Text fontSize='xs' fontWeight='medium' minW='35px'>
              {Math.round(metric.value)}
            </Text>
          </HStack>
        </HStack>
      ))}
    </VStack>
  );
};

// Placeholder components for missing visualizations
export const ClusterCoefficientHeatmap: React.FC<{
  subjects: WhiteboardSubject[];
}> = ({ subjects }) => {
  return (
    <VStack gap={3} align='center' justify='center' minH='200px'>
      <Text fontSize='sm' color='gray.500'>
        Cluster Coefficient Heatmap
      </Text>
      <Text fontSize='xs' color='gray.400'>
        {subjects.length} subjects analyzed
      </Text>
    </VStack>
  );
};

export const NetworkGraph: React.FC<{
  subjects: WhiteboardSubject[];
}> = ({ subjects }) => {
  return (
    <VStack gap={3} align='center' justify='center' minH='200px'>
      <Text fontSize='sm' color='gray.500'>
        Network Graph
      </Text>
      <Text fontSize='xs' color='gray.400'>
        {subjects.length} subjects connected
      </Text>
    </VStack>
  );
};

export const MetricsDistribution: React.FC<{
  subjects: WhiteboardSubject[];
}> = ({ subjects }) => {
  return (
    <VStack gap={3} align='center' justify='center' minH='200px'>
      <Text fontSize='sm' color='gray.500'>
        Metrics Distribution
      </Text>
      <Text fontSize='xs' color='gray.400'>
        Distribution of {subjects.length} subjects
      </Text>
    </VStack>
  );
};
