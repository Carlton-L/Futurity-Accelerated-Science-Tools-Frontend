import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Heading,
  HStack,
  VStack,
  Text,
  IconButton,
  Popover,
  Spinner,
} from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';
import ChartErrorBoundary from './ChartErrorBoundary';

// TypeScript interfaces
interface TrendData {
  _generated_at: number;
  plot_data: Partial<Data>[];
  plot_layout: Partial<Layout>;
  _generated_finish_at: number;
  _generated_duration: number;
}

interface TrendsChartProps {
  subjectSlug: string;
}

// Info text for the trends chart
const trendsInfoText =
  'This chart shows publication and activity trends across different source types over time. Each line represents a different category of content related to the subject, allowing you to compare relative activity levels and identify patterns in the space.';

const TrendsChart: React.FC<TrendsChartProps> = ({ subjectSlug }) => {
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendsData = async () => {
      if (!subjectSlug) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://fast.futurity.science/graphs/ridgeline-data?subject==${subjectSlug}`,
          {
            headers: {
              Authorization: 'Bearer xE8C9T4QGRcbnUoZPrjkyI5mOVjKJAiJ',
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const trendsData: TrendData = await response.json();
        setData(trendsData);
      } catch (err) {
        console.error('Failed to fetch trends data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load trends data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTrendsData();
  }, [subjectSlug]);

  if (loading) {
    return (
      <Card.Root width='100%' mt={6} bg='bg.canvas'>
        <Card.Body p={6}>
          <VStack gap={6} align='stretch'>
            <HStack gap={2} align='center'>
              <Heading as='h2' size='lg' color='fg'>
                Trends
              </Heading>
            </HStack>
            <Box
              height='500px'
              display='flex'
              alignItems='center'
              justifyContent='center'
            >
              <VStack gap={2}>
                <Spinner size='lg' />
                <Text color='fg.muted'>Loading trends data...</Text>
              </VStack>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  if (error) {
    return (
      <Card.Root width='100%' mt={6} bg='bg.canvas'>
        <Card.Body p={6}>
          <VStack gap={6} align='stretch'>
            <HStack gap={2} align='center'>
              <Heading as='h2' size='lg' color='fg'>
                Trends
              </Heading>
            </HStack>
            <Box
              height='400px'
              display='flex'
              alignItems='center'
              justifyContent='center'
            >
              <VStack gap={2}>
                <Text color='error' fontSize='lg'>
                  Error loading trends data
                </Text>
                <Text color='fg.muted' fontSize='sm'>
                  {error}
                </Text>
              </VStack>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card.Root width='100%' mt={6} bg='bg.canvas'>
      <Card.Body p={6}>
        <VStack gap={6} align='stretch'>
          {/* Header */}
          <HStack gap={2} align='center'>
            <Heading as='h2' size='lg' color='fg'>
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

          {/* Plotly Chart */}
          <ChartErrorBoundary chartName='Trends Chart' fallbackHeight='500px'>
            <Plot
              data={data.plot_data as Data[]}
              layout={
                {
                  ...data.plot_layout,
                  autosize: true,
                } as Partial<Layout>
              }
              style={{ width: '100%', height: '500px' }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: [
                  'pan2d',
                  'lasso2d',
                  'select2d',
                  'autoScale2d',
                  'hoverClosestCartesian',
                  'hoverCompareCartesian',
                  'toggleSpikelines',
                ],
              }}
            />
          </ChartErrorBoundary>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default TrendsChart;
