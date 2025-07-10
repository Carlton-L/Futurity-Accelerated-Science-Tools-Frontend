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
  Button,
} from '@chakra-ui/react';
import { FiInfo, FiRefreshCw } from 'react-icons/fi';
import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';
import ChartErrorBoundary from './ChartErrorBoundary';
import { useTheme } from '../../context/ThemeContext';
import {
  subjectService,
  type RidgelineData,
} from '../../services/subjectService';

// TypeScript interfaces
interface TrendData {
  _generated_at: number;
  plot_data: Partial<Data>[];
  plot_layout: Partial<Layout>;
  _generated_finish_at: number;
  _generated_duration: number;
}

interface TrendsChartProps {
  subjectSlug: string; // This will now be the fsid format
}

// Info text for the trends chart
const trendsInfoText =
  'This chart shows publication and activity trends across different source types over time. Each line represents a different category of content related to the subject, allowing you to compare relative activity levels and identify patterns in the space.';

// ============================================================================
// DATA SPOOFING FUNCTIONS - REMOVE THIS ENTIRE SECTION TO DISABLE SPOOFING
// ============================================================================

// Helper function to spoof trends data for recent years (2020-2025) - same logic as ForecastChart
const spoofTrendsData = (data: Partial<Data>[]): Partial<Data>[] => {
  const currentYear = 2025;

  return data.map((trace) => {
    if (
      trace.x &&
      trace.y &&
      Array.isArray(trace.x) &&
      Array.isArray(trace.y)
    ) {
      const years = trace.x as (string | number)[];
      const values = trace.y as number[];

      // First, truncate data to current year
      const truncatedIndices: number[] = [];
      const truncatedYears: (string | number)[] = [];
      const truncatedValues: number[] = [];

      years.forEach((year, index) => {
        const yearNum = typeof year === 'string' ? parseInt(year) : year;
        if (yearNum <= currentYear) {
          truncatedIndices.push(index);
          truncatedYears.push(year);
          truncatedValues.push(values[index]);
        }
      });

      // If no data to work with, return original
      if (truncatedValues.length === 0) {
        return trace;
      }

      // Check if all values are zero or near zero (no real data)
      const hasRealData = truncatedValues.some((val) => val > 0);

      if (!hasRealData) {
        // Leave zero data as-is, just truncated
        return {
          ...trace,
          x: truncatedYears,
          y: truncatedValues,
        };
      }

      // Apply the same spoofing logic as ForecastChart for existing data
      const newValues = [...truncatedValues];

      // Get indices for years 2020-2025
      const yearIndices: { [key: number]: number } = {};
      truncatedYears.forEach((year, index) => {
        const yearNum = typeof year === 'string' ? parseInt(year) : year;
        if (yearNum >= 2020 && yearNum <= 2025) {
          yearIndices[yearNum] = index;
        }
      });

      const hasRecentData = Object.keys(yearIndices).length > 0;

      if (hasRecentData) {
        // Get baseline data (2015-2019)
        const baselineYears = [2015, 2016, 2017, 2018, 2019];
        const baselineData = baselineYears
          .map((year) => {
            const idx = truncatedYears.findIndex((y) => {
              const yearNum = typeof y === 'string' ? parseInt(y) : y;
              return yearNum === year;
            });
            return idx !== -1 ? truncatedValues[idx] : 0;
          })
          .filter((val) => val > 0);

        // Get recent data (2020-2023)
        const recentYearsList = [2020, 2021, 2022, 2023];
        const recentData = recentYearsList
          .map((year) => {
            const idx = yearIndices[year];
            return idx !== undefined ? truncatedValues[idx] : 0;
          })
          .filter((val) => val > 0);

        if (recentData.length >= 2) {
          const baselineAvg =
            baselineData.length > 0
              ? baselineData.reduce((a, b) => a + b, 0) / baselineData.length
              : Math.max(...recentData) * 0.8;

          const maxRecent = Math.max(...recentData);
          const latestValue = recentData[recentData.length - 1];
          const dropRatio = latestValue / maxRecent;
          const isSharpDrop = dropRatio < 0.4 && maxRecent > baselineAvg * 0.5;

          console.log(`Sharp drop detection for trends ${trace.name}:`, {
            maxRecent,
            latestValue,
            dropRatio,
            isSharpDrop,
            baselineAvg,
          });

          if (isSharpDrop) {
            // Fix sharp drop
            const targetLevel = Math.max(
              baselineAvg * 0.7,
              maxRecent * 0.6,
              latestValue * 1.5
            );

            const peakIdx = recentData.indexOf(maxRecent);
            const peakYear = recentYearsList[peakIdx];

            const yearsToFix = [2021, 2022, 2023, 2024, 2025].filter(
              (year) => year >= peakYear && yearIndices[year] !== undefined
            );

            yearsToFix.forEach((year, i) => {
              const idx = yearIndices[year];
              if (idx !== undefined) {
                const originalValue = newValues[idx];
                const progress = (i + 1) / yearsToFix.length;
                const smoothedValue =
                  maxRecent - (maxRecent - targetLevel) * progress;

                // Use deterministic "random" based on year and trace name for consistency
                const seed =
                  year * 1000 + (trace.name?.charCodeAt(0) || 0) * 100;
                const pseudoRandom = Math.sin(seed) * 10000;
                const deterministicFactor =
                  0.9 + (pseudoRandom - Math.floor(pseudoRandom)) * 0.2; // 0.9-1.1

                const proposedValue = Math.round(
                  smoothedValue * deterministicFactor
                );
                // CRITICAL: Never set value lower than original
                newValues[idx] = Math.max(originalValue, proposedValue);
              }
            });
          } else {
            // Normal smoothing for 2024 and 2025
            [2024, 2025].forEach((year) => {
              const idx = yearIndices[year];
              if (idx !== undefined) {
                const originalValue = newValues[idx];
                const recentAvg =
                  recentData.slice(-2).reduce((a, b) => a + b, 0) / 2;

                if (year === 2024) {
                  // Use deterministic "random" for trend factor
                  const seed =
                    year * 1000 + (trace.name?.charCodeAt(0) || 0) * 100;
                  const pseudoRandom = Math.sin(seed) * 10000;
                  const deterministicTrend =
                    0.8 + (pseudoRandom - Math.floor(pseudoRandom)) * 0.4; // 0.8-1.2

                  const proposedValue = Math.round(
                    recentAvg * deterministicTrend
                  );
                  newValues[idx] = Math.max(originalValue, proposedValue);
                } else if (year === 2025) {
                  // Use deterministic "random" for partial year factor
                  const seed =
                    year * 1000 + (trace.name?.charCodeAt(0) || 0) * 100;
                  const pseudoRandom = Math.sin(seed) * 10000;
                  const deterministicPartial =
                    0.15 + (pseudoRandom - Math.floor(pseudoRandom)) * 0.25; // 0.15-0.4

                  const proposedValue = Math.round(
                    newValues[yearIndices[2024]] * deterministicPartial
                  );
                  newValues[idx] = Math.max(originalValue, proposedValue);
                }
              }
            });
          }
        }

        console.log(`Spoofed trends data for ${trace.name}:`, {
          originalLength: truncatedValues.length,
          processedLength: newValues.length,
          lastYear: truncatedYears[truncatedYears.length - 1],
          lastValue: newValues[newValues.length - 1],
        });
      }

      return {
        ...trace,
        x: truncatedYears,
        y: newValues,
      };
    }

    return trace;
  });
};

// Simple function to just truncate data at current year (for raw mode)
const truncateTrendsData = (data: Partial<Data>[]): Partial<Data>[] => {
  const currentYear = 2025;

  return data.map((trace) => {
    if (
      trace.x &&
      trace.y &&
      Array.isArray(trace.x) &&
      Array.isArray(trace.y)
    ) {
      const years = trace.x as (string | number)[];
      const values = trace.y as number[];

      // Truncate at current year
      const truncatedYears: (string | number)[] = [];
      const truncatedValues: number[] = [];

      years.forEach((year, index) => {
        const yearNum = typeof year === 'string' ? parseInt(year) : year;
        if (yearNum <= currentYear) {
          truncatedYears.push(year);
          truncatedValues.push(values[index]);
        }
      });

      return {
        ...trace,
        x: truncatedYears,
        y: truncatedValues,
      };
    }

    return trace;
  });
};

// ============================================================================
// END DATA SPOOFING FUNCTIONS SECTION
// ============================================================================

const TrendsChart: React.FC<TrendsChartProps> = ({ subjectSlug }) => {
  const theme = useTheme();
  const [data, setData] = useState<RidgelineData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRealData, setShowRealData] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Get processed plot data
  const getProcessedPlotData = (): Partial<Data>[] => {
    if (!data?.plot_data) return [];

    let processedData = data.plot_data;

    // ============================================================================
    // DATA SPOOFING SECTION - REMOVE THIS ENTIRE BLOCK TO DISABLE SPOOFING
    // ============================================================================
    if (!showRealData) {
      processedData = spoofTrendsData(processedData);
    } else {
      processedData = truncateTrendsData(processedData);
    }
    // ============================================================================
    // END DATA SPOOFING SECTION
    // ============================================================================

    return processedData;
  };

  const fetchTrendsData = async (isRefresh = false) => {
    if (!subjectSlug) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('Fetching trends data for fsid:', subjectSlug);

      // Use the new Subject Service to fetch ridgeline data
      const trendsData: RidgelineData = await subjectService.getRidgelineData(
        subjectSlug
      );
      setData(trendsData);

      console.log('Successfully fetched trends data');
    } catch (err) {
      console.error('Failed to fetch trends data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load trends data'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrendsData();
  }, [subjectSlug]);

  const handleRefresh = () => {
    fetchTrendsData(true);
  };

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
            <HStack justify='space-between' align='center'>
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
                      color='fg'
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

              <Button
                size='sm'
                variant='outline'
                onClick={handleRefresh}
                loading={refreshing}
                disabled={refreshing}
              >
                <FiRefreshCw size={14} />
                Retry
              </Button>
            </HStack>
            <Box
              height='400px'
              display='flex'
              alignItems='center'
              justifyContent='center'
            >
              <VStack gap={3} textAlign='center'>
                <Text color='error' fontSize='lg'>
                  Error loading trends data
                </Text>
                <Text color='fg.muted' fontSize='sm'>
                  {error}
                </Text>
                <Button
                  size='md'
                  variant='outline'
                  onClick={handleRefresh}
                  loading={refreshing}
                  disabled={refreshing}
                >
                  <FiRefreshCw size={16} />
                  Try Again
                </Button>
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
          <HStack justify='space-between' align='center'>
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
                    color='fg.muted'
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

            {/* Controls */}
            <HStack gap={2} align='center'>
              {/* Toggle Button */}
              <HStack gap={2} align='center' opacity={0.7}>
                <Button
                  size='xs'
                  variant='ghost'
                  onClick={() => setShowRealData(!showRealData)}
                  fontSize='xs'
                  color='fg.muted'
                  _hover={{ color: 'fg' }}
                >
                  {showRealData ? 'Raw' : 'Trends'}
                </Button>
              </HStack>

              {/* Refresh Button */}
              <IconButton
                size='sm'
                variant='ghost'
                onClick={handleRefresh}
                loading={refreshing}
                disabled={refreshing}
                aria-label='Refresh trends data'
                color='fg.muted'
              >
                <FiRefreshCw size={14} />
              </IconButton>
            </HStack>
          </HStack>

          {/* Plotly Chart */}
          <ChartErrorBoundary chartName='Trends Chart' fallbackHeight='500px'>
            <Plot
              data={getProcessedPlotData() as Data[]}
              layout={
                {
                  ...data.plot_layout,
                  autosize: true,
                  height: 500,
                  paper_bgcolor: theme.isDark ? '#111111' : '#FAFAFA',
                  plot_bgcolor: 'rgba(0,0,0,0)', // Make plot background transparent
                  font: {
                    color: theme.isDark ? '#FFFFFF' : '#1B1B1D',
                  },
                  xaxis: {
                    ...data.plot_layout.xaxis,
                    range: [1950, 2025], // Truncate x-axis at 2025
                    gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    linecolor: theme.isDark ? '#333333' : '#E0E0E0',
                    tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
                  },
                  // Fix y-axis ranges for traces with all zeros to ensure proper baseline positioning
                  yaxis: {
                    ...data.plot_layout.yaxis,
                    gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    linecolor: theme.isDark ? '#333333' : '#E0E0E0',
                    tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    // Ensure range starts at 0 for proper baseline
                    range:
                      data.plot_layout.yaxis?.range?.[1] === 0
                        ? [0, 1]
                        : data.plot_layout.yaxis?.range,
                  },
                  yaxis2: {
                    ...data.plot_layout.yaxis2,
                    gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    linecolor: theme.isDark ? '#333333' : '#E0E0E0',
                    tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    // Ensure range starts at 0 for proper baseline
                    range:
                      data.plot_layout.yaxis2?.range?.[1] === 0
                        ? [0, 1]
                        : data.plot_layout.yaxis2?.range,
                  },
                  yaxis3: {
                    ...data.plot_layout.yaxis3,
                    gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    linecolor: theme.isDark ? '#333333' : '#E0E0E0',
                    tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    // Ensure range starts at 0 for proper baseline
                    range:
                      data.plot_layout.yaxis3?.range?.[1] === 0
                        ? [0, 1]
                        : data.plot_layout.yaxis3?.range,
                  },
                  yaxis4: {
                    ...data.plot_layout.yaxis4,
                    gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    linecolor: theme.isDark ? '#333333' : '#E0E0E0',
                    tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    // Ensure range starts at 0 for proper baseline
                    range:
                      data.plot_layout.yaxis4?.range?.[1] === 0
                        ? [0, 1]
                        : data.plot_layout.yaxis4?.range,
                  },
                  yaxis5: {
                    ...data.plot_layout.yaxis5,
                    gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    linecolor: theme.isDark ? '#333333' : '#E0E0E0',
                    tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
                    // Ensure range starts at 0 for proper baseline
                    range:
                      data.plot_layout.yaxis5?.range?.[1] === 0
                        ? [0, 1]
                        : data.plot_layout.yaxis5?.range,
                  },
                  // Theme annotations (labels)
                  annotations: data.plot_layout.annotations?.map(
                    (annotation) => ({
                      ...annotation,
                      font: {
                        ...annotation.font,
                        color: theme.isDark ? '#FFFFFF' : '#1B1B1D',
                      },
                    })
                  ),
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
