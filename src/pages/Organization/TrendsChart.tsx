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
type OrganizationTrendType = 'Press' | 'Patents' | 'Papers' | 'Books';

interface OrganizationTrendPlotData {
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

interface OrganizationTrendData {
  plot_data: OrganizationTrendPlotData[];
  plot_layout: {
    title: string;
    xaxis: { title: string };
    yaxis: { title: string };
    margin: { t: number; r: number; b: number; l: number };
    legend: { orientation: string };
  };
}

interface TrendsChartProps {
  organizationSlug: string;
  initialData?: OrganizationTrendData;
}

// TODO: Replace with official brand colors
const organizationTrendColors: Record<OrganizationTrendType, string> = {
  Press: '#3182CE', // Blue
  Patents: '#38A169', // Green
  Papers: '#D69E2E', // Orange
  Books: '#9F7AEA', // Purple
};

// Mock trend data for Apple Inc.
const mockOrganizationTrendData: OrganizationTrendData = {
  plot_data: [
    {
      x: ['2020', '2021', '2022', '2023', '2024', '2025'],
      y: [890, 1234, 1456, 1678, 1823, 1567],
      name: 'Press',
      type: 'scatter',
      mode: 'lines',
      line: { color: organizationTrendColors.Press, width: 3 },
    },
    {
      x: ['2020', '2021', '2022', '2023', '2024', '2025'],
      y: [456, 523, 634, 789, 812, 743],
      name: 'Patents',
      type: 'scatter',
      mode: 'lines',
      line: { color: organizationTrendColors.Patents, width: 3 },
    },
    {
      x: ['2020', '2021', '2022', '2023', '2024', '2025'],
      y: [234, 345, 423, 567, 634, 589],
      name: 'Papers',
      type: 'scatter',
      mode: 'lines',
      line: { color: organizationTrendColors.Papers, width: 3 },
    },
    {
      x: ['2020', '2021', '2022', '2023', '2024', '2025'],
      y: [12, 18, 25, 34, 42, 38],
      name: 'Books',
      type: 'scatter',
      mode: 'lines',
      line: { color: organizationTrendColors.Books, width: 3 },
    },
  ],
  plot_layout: {
    title: 'Organization Trends Over Time',
    xaxis: { title: 'Year' },
    yaxis: { title: 'Count' },
    margin: { t: 80, r: 40, b: 80, l: 60 },
    legend: { orientation: 'h' },
  },
};

// Info text for the organization trends chart
const organizationTrendsInfoText =
  "This chart shows publication and activity trends for Apple Inc. across different content types over time. Each line represents a different category of content mentioning or related to Apple, allowing you to track the organization's visibility and research impact across various domains.";

// Placeholder Graph Component
const OrganizationTrendsGraph: React.FC<{ data: OrganizationTrendData }> = ({
  data,
}) => {
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
            Organization Trends Graph
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
  organizationSlug: _organizationSlug, // eslint-disable-line @typescript-eslint/no-unused-vars
  initialData = mockOrganizationTrendData,
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
                  aria-label='Info about organization trends chart'
                >
                  <FiInfo size={16} />
                </IconButton>
              </Popover.Trigger>
              <Popover.Positioner>
                <Popover.Content>
                  <Popover.Arrow />
                  <Popover.Body>
                    <Text fontSize='sm' maxW='300px'>
                      {organizationTrendsInfoText}
                    </Text>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Root>
          </HStack>

          {/* Graph with Built-in Legend */}
          <OrganizationTrendsGraph data={initialData} />
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default TrendsChart;
