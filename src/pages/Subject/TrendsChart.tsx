import React from 'react';
import {
  Box,
  Card,
  Heading,
  HStack,
  VStack,
  Text,
  IconButton,
  Popover,
} from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';

// TypeScript interfaces
type TrendType = 'Press' | 'Patents' | 'Papers' | 'Books';

interface TrendPlotData {
  x: string[];
  y: number[];
  name: string;
  type: string;
  mode: string;
  line: {
    color: string;
    width: number;
  };
}

interface TrendData {
  plot_data: TrendPlotData[];
  plot_layout: {
    title: string;
    xaxis: { title: string };
    yaxis: { title: string };
    margin: { t: number; r: number; b: number; l: number };
    legend: { orientation: string };
  };
}

interface TrendsChartProps {
  subjectSlug: string;
  initialData?: TrendData;
}

// TODO: Replace with official brand colors
const trendColors: Record<TrendType, string> = {
  Press: '#3182CE', // Blue
  Patents: '#38A169', // Green
  Papers: '#D69E2E', // Orange
  Books: '#9F7AEA', // Purple
};

// Mock trend data
const mockTrendData: TrendData = {
  plot_data: [
    {
      x: ['2020', '2021', '2022', '2023', '2024', '2025'],
      y: [45, 67, 89, 123, 156, 134],
      name: 'Press',
      type: 'scatter',
      mode: 'lines',
      line: { color: trendColors.Press, width: 3 },
    },
    {
      x: ['2020', '2021', '2022', '2023', '2024', '2025'],
      y: [23, 34, 45, 67, 78, 89],
      name: 'Patents',
      type: 'scatter',
      mode: 'lines',
      line: { color: trendColors.Patents, width: 3 },
    },
    {
      x: ['2020', '2021', '2022', '2023', '2024', '2025'],
      y: [12, 18, 25, 34, 42, 38],
      name: 'Papers',
      type: 'scatter',
      mode: 'lines',
      line: { color: trendColors.Papers, width: 3 },
    },
    {
      x: ['2020', '2021', '2022', '2023', '2024', '2025'],
      y: [3, 5, 8, 12, 15, 18],
      name: 'Books',
      type: 'scatter',
      mode: 'lines',
      line: { color: trendColors.Books, width: 3 },
    },
  ],
  plot_layout: {
    title: 'Trends Over Time',
    xaxis: { title: 'Year' },
    yaxis: { title: 'Count' },
    margin: { t: 80, r: 40, b: 80, l: 60 },
    legend: { orientation: 'h' },
  },
};

// Info text for the trends chart
const trendsInfoText =
  'This chart shows publication and activity trends across different source types over time. Each line represents a different category of content related to the subject, allowing you to compare relative activity levels and identify patterns in the **computer vision** space.';

// Placeholder Graph Component
const TrendsGraph: React.FC<{ data: TrendData }> = ({ data }) => {
  return (
    <Box
      height='400px'
      bg='gray.50'
      border='1px solid'
      borderColor='gray.200'
      borderRadius='md'
      display='flex'
      flexDirection='column'
      position='relative'
    >
      {/* Graph Area */}
      <Box flex='1' display='flex' alignItems='center' justifyContent='center'>
        <VStack gap={2}>
          <Text color='gray.500' fontSize='lg'>
            Trends Graph
          </Text>
          <Text color='gray.400' fontSize='sm'>
            D3 Graph Component (Placeholder)
          </Text>
          <Text color='gray.400' fontSize='xs'>
            Multi-line chart with {data.plot_data.length} trend lines
          </Text>
        </VStack>
      </Box>

      {/* Legend */}
      <Box p={4} borderTop='1px solid' borderColor='gray.200' bg='white'>
        <HStack justify='center' wrap='wrap' gap={6}>
          {data.plot_data.map((trend) => (
            <HStack key={trend.name} gap={2}>
              <Box
                width='20px'
                height='3px'
                bg={trend.line.color}
                borderRadius='sm'
              />
              <Text fontSize='sm' color='gray.700'>
                {trend.name}
              </Text>
            </HStack>
          ))}
        </HStack>
      </Box>
    </Box>
  );
};

const TrendsChart: React.FC<TrendsChartProps> = ({
  subjectSlug: _subjectSlug, // eslint-disable-line @typescript-eslint/no-unused-vars
  initialData = mockTrendData,
}) => {
  return (
    <Card.Root width='100%' mt={6}>
      <Card.Body p={6}>
        <VStack gap={6} align='stretch'>
          {/* Header */}
          <HStack justify='space-between' align='center'>
            <Heading as='h2' size='lg'>
              Trends
            </Heading>

            <Popover.Root>
              <Popover.Trigger asChild>
                <IconButton
                  size='sm'
                  variant='ghost'
                  aria-label='Info about trends chart'
                >
                  <FiInfo size={16} />
                </IconButton>
              </Popover.Trigger>
              <Popover.Positioner>
                <Popover.Content>
                  <Popover.Arrow />
                  <Popover.Body>
                    <Text fontSize='sm' maxW='300px'>
                      {trendsInfoText}
                    </Text>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Root>
          </HStack>

          {/* Graph with Built-in Legend */}
          <TrendsGraph data={initialData} />
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default TrendsChart;
