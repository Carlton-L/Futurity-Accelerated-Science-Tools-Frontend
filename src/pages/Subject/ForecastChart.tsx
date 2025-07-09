import {
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  VStack,
  Text,
  Table,
  Spinner,
  IconButton,
  Popover,
  Switch,
} from '@chakra-ui/react';
import { FiInfo, FiEye, FiEyeOff } from 'react-icons/fi';
import Plot from 'react-plotly.js';
import type { Data, Layout, PlotData } from 'plotly.js';
import ChartErrorBoundary from './ChartErrorBoundary';
import { useTheme } from '../../context/ThemeContext';

// TypeScript interfaces
type ForecastType = 'Organizations' | 'Press' | 'Patents' | 'Papers' | 'Books';

interface ForecastData {
  rows?: unknown[];
  count?: number;
  plot_layout: Partial<Layout>;
  plot_data: PlotData[];
  referrer?: unknown;
}

interface TableRow {
  ent_fsid: string;
  _id: string;
  ent_name: string;
  ent_summary: string;
  ent_year: number | null;
  ent_url: string;
  sentiment_score: null | number;
  mongo_row: {
    _id: string;
    ent_fsid: string;
    ent_name: string;
    ent_summary: string;
    ent_year?: number;
    ent_url: string;
  };
}

interface TableData {
  rows: TableRow[];
  count: number;
  draw: string | null;
  data: string[][];
  recordsTotal: number;
  recordsFiltered: number;
  debug: {
    raw_found: unknown[];
    mongo_query_size: number;
    mongo_query_count: number;
    mongo_count: number;
    fields_integrity: Record<string, { valid: number; total: number }>;
  };
}

interface PaginationParams {
  page: number;
  pageSize: number;
  searchTerm: string;
}

interface ForecastChartProps {
  subjectSlug: string;
  initialSelectedType?: ForecastType;
}

// Define the ref interface for external control
export interface ForecastChartRef {
  setSelectedType: (type: ForecastType) => void;
}

// Source type mapping for API calls
const sourceTypeMapping: Record<ForecastType, string> = {
  Organizations: 'Organization',
  Press: 'Press',
  Patents: 'Patent',
  Papers: 'Paper',
  Books: 'Book',
};

// Info text for each forecast type
const infoTexts: Record<ForecastType, string> = {
  Organizations:
    'Venture investment in startups, corporate partnerships, and other relationships between the companies in a space are critical to competitive strategy and Open Innovation. The graph and table below show details about organizations in this space.',
  Press:
    'Press coverage and media attention are indicators of public interest and market momentum. The graph and table below show press articles related to this space.',
  Patents:
    'Patent activity indicates innovation and intellectual property development in a technology space. The graph and table below show patent filings in this space.',
  Papers:
    'Academic papers and research publications show the scientific foundation and advancement of a technology. The graph and table below show research papers in this space.',
  Books:
    'Books and publications provide comprehensive knowledge and educational resources in a field. The graph and table below show books related to this space.',
};

// Helper function to spoof data for recent years (2024-2025)
const spoofRecentData = (data: PlotData[]): PlotData[] => {
  return data.map((trace) => {
    // Only modify the historical data trace (first trace with historical data)
    if (
      trace.name === 'Historical Data' &&
      trace.x &&
      trace.y &&
      Array.isArray(trace.x) &&
      Array.isArray(trace.y)
    ) {
      const years = trace.x as (string | number)[];
      const values = trace.y as number[];

      // Find indices for recent years
      const idx2024 = years.findIndex((year) => year.toString() === '2024');
      const idx2025 = years.findIndex((year) => year.toString() === '2025');

      if (idx2024 !== -1 || idx2025 !== -1) {
        const newValues = [...values];

        // Get trend data from 2020-2023 for prediction
        const trendYears = ['2020', '2021', '2022', '2023'];
        const trendData = trendYears
          .map((year) => {
            const idx = years.findIndex((y) => y.toString() === year);
            return idx !== -1 ? values[idx] : 0;
          })
          .filter((val) => val > 0);

        if (trendData.length >= 2) {
          // Calculate trend direction and magnitude
          const recentValues = trendData.slice(-2);
          const avgRecent =
            recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
          const maxRecent = Math.max(...trendData);
          const trend = recentValues[1] - recentValues[0];

          // Spoof 2024 data
          if (idx2024 !== -1) {
            let spoofed2024 = avgRecent;

            // Apply dampened trend
            if (trend > 0) {
              // If trending up, add some growth but dampen it
              spoofed2024 =
                avgRecent +
                trend * 0.3 +
                (Math.random() - 0.5) * (avgRecent * 0.1);
            } else if (trend < 0) {
              // If trending down, reduce the decline
              spoofed2024 =
                avgRecent +
                trend * 0.2 +
                (Math.random() - 0.5) * (avgRecent * 0.1);
            }

            // Ensure reasonable bounds
            spoofed2024 = Math.max(spoofed2024, avgRecent * 0.5);
            spoofed2024 = Math.min(spoofed2024, maxRecent * 1.2);

            newValues[idx2024] = Math.round(spoofed2024);
          }

          // Spoof 2025 data (should be partial year, so lower)
          if (idx2025 !== -1) {
            const spoofed2024Value =
              idx2024 !== -1 ? newValues[idx2024] : avgRecent;
            let spoofed2025 = spoofed2024Value * 0.2; // Assume 2025 is only partial data

            // Add some randomness
            spoofed2025 += (Math.random() - 0.5) * (spoofed2025 * 0.3);
            spoofed2025 = Math.max(spoofed2025, 1);

            newValues[idx2025] = Math.round(spoofed2025);
          }
        }

        return {
          ...trace,
          y: newValues,
        };
      }
    }

    return trace;
  });
};

// Helper function to modify plot colors for real data
const modifyColorsForRealData = (data: PlotData[]): PlotData[] => {
  return data.map((trace) => {
    if (trace.line?.color) {
      // Change colors to red tones for real data
      let newColor = trace.line.color;
      if (typeof newColor === 'string') {
        if (newColor.includes('rgb(31, 119, 180)')) {
          newColor = 'rgb(220, 53, 69)'; // Red for historical
        } else if (newColor.includes('rgb(0, 0, 255)')) {
          newColor = 'rgb(255, 0, 0)'; // Bright red for forecast
        } else if (newColor.includes('lightgreen')) {
          newColor = 'rgb(255, 193, 7)'; // Yellow for sentiment
        }
      }

      return {
        ...trace,
        line: {
          ...trace.line,
          color: newColor,
        },
      };
    }

    return trace;
  });
};

const ForecastChart = forwardRef<ForecastChartRef, ForecastChartProps>(
  ({ subjectSlug, initialSelectedType }, ref) => {
    const theme = useTheme();
    const [selectedType, setSelectedType] = useState<ForecastType>(
      initialSelectedType || 'Organizations'
    );
    const [forecastData, setForecastData] = useState<ForecastData | null>(null);
    const [tableData, setTableData] = useState<TableData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingChart, setLoadingChart] = useState<boolean>(false);
    const [showRealData, setShowRealData] = useState<boolean>(false);
    const [pagination, setPagination] = useState<PaginationParams>({
      page: 0,
      pageSize: 10,
      searchTerm: '',
    });

    // Expose methods via ref for external control
    useImperativeHandle(ref, () => ({
      setSelectedType: (type: ForecastType) => {
        handleTypeChange(type);
      },
    }));

    // Update selected type when initialSelectedType prop changes
    useEffect(() => {
      if (initialSelectedType && initialSelectedType !== selectedType) {
        setSelectedType(initialSelectedType);
        const newPagination = { ...pagination, page: 0 };
        setPagination(newPagination);
        fetchForecastData(initialSelectedType);
        fetchTableData(initialSelectedType, newPagination);
      }
    }, [initialSelectedType]);

    // Fetch forecast chart data
    const fetchForecastData = useCallback(
      async (type: ForecastType): Promise<void> => {
        if (!subjectSlug) return;

        setLoadingChart(true);

        try {
          const sourceType = sourceTypeMapping[type];
          const response = await fetch(
            `https://tools.futurity.science/api/subject/get-source-forecast-plot?slug=${subjectSlug}&source_type=${sourceType}`,
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

          const data: ForecastData = await response.json();

          // Debug: Log the raw data to understand the structure
          console.log(`Raw ${type} data:`, data);
          console.log(`Plot data array:`, data.plot_data);
          console.log(`Number of traces:`, data.plot_data?.length);

          // Log each trace individually
          data.plot_data?.forEach((trace: any, index: number) => {
            console.log(`Trace ${index}:`, {
              name: trace.name,
              type: trace.type,
              mode: trace.mode,
              showlegend: trace.showlegend,
              hasX: !!trace.x,
              hasY: !!trace.y,
              xLength: Array.isArray(trace.x) ? trace.x.length : 'not array',
              yLength: Array.isArray(trace.y) ? trace.y.length : 'not array',
              line: trace.line,
              yaxis: trace.yaxis,
            });
          });

          // Ensure plot_data exists and has proper structure
          if (!data.plot_data || !Array.isArray(data.plot_data)) {
            console.warn(`Invalid plot_data for ${type}:`, data.plot_data);
            data.plot_data = [];
          }

          // Filter out any invalid traces and fix data structure
          const validTraces = data.plot_data.filter((trace: any) => {
            // Basic validation - ensure it's an object
            if (!trace || typeof trace !== 'object') {
              console.warn('Invalid trace (not object):', trace);
              return false;
            }

            // Special handling for inflection point trace that may have null data
            if (trace.name === 'Inflection Point' && trace.x && trace.y) {
              const hasValidData =
                Array.isArray(trace.x) &&
                Array.isArray(trace.y) &&
                trace.x.some((val: any) => val !== null && val !== undefined) &&
                trace.y.some((val: any) => val !== null && val !== undefined);
              if (!hasValidData) {
                console.warn(
                  'Inflection Point trace has no valid data, skipping'
                );
                return false;
              }
            }

            // Check if it has data to display (but allow traces with only legend entries)
            if (!trace.x && !trace.y && !trace.name) {
              console.warn('Invalid trace (no data or name):', trace);
              return false;
            }

            return true;
          });

          // Fix any traces that might be causing rendering issues
          const fixedPlotData = validTraces.map((trace: any, index: number) => {
            // Ensure each trace has required properties
            const fixedTrace = {
              ...trace,
              // Ensure mode is set for scatter plots
              mode:
                trace.mode || (trace.type === 'scatter' ? 'lines' : undefined),
              // Ensure showlegend is properly set (default to true unless explicitly false)
              showlegend: trace.showlegend !== false,
              // Fix any null/undefined values in data arrays
              x: Array.isArray(trace.x)
                ? trace.x.filter(
                    (val: any) => val !== null && val !== undefined
                  )
                : trace.x,
              y: Array.isArray(trace.y)
                ? trace.y.filter(
                    (val: any) => val !== null && val !== undefined
                  )
                : trace.y,
            };

            // Special handling for fill traces
            if (trace.fill) {
              fixedTrace.fill = trace.fill;
              fixedTrace.fillcolor = trace.fillcolor;
            }

            // Ensure line properties are preserved
            if (trace.line) {
              fixedTrace.line = { ...trace.line };
            }

            // Ensure marker properties are preserved
            if (trace.marker) {
              fixedTrace.marker = { ...trace.marker };
            }

            // Handle yaxis assignment
            if (trace.yaxis) {
              fixedTrace.yaxis = trace.yaxis;
            }

            // Debug: Log each trace
            console.log(`Fixed trace ${index} (${trace.name}):`, fixedTrace);

            return fixedTrace;
          });

          setForecastData({
            ...data,
            plot_data: fixedPlotData,
          });
        } catch (err) {
          console.error('Failed to fetch forecast data:', err);
          // Set empty data on error to prevent infinite loading
          setForecastData({
            plot_layout: {
              margin: { t: 80, r: 40, b: 80, l: 60 },
              yaxis: { title: `Number of ${type}` },
            } as Partial<Layout>,
            plot_data: [] as PlotData[],
          });
        } finally {
          setLoadingChart(false);
        }
      },
      [subjectSlug]
    );

    // Fetch table data
    const fetchTableData = useCallback(
      async (type: ForecastType, params: PaginationParams): Promise<void> => {
        if (!subjectSlug) return;

        setLoading(true);

        try {
          const sourceType = sourceTypeMapping[type];
          const start = params.page * params.pageSize;
          const searchParam = params.searchTerm
            ? `&search=${encodeURIComponent(params.searchTerm)}`
            : '';

          const response = await fetch(
            `https://tools.futurity.science/api/subject/get-source-table-paginated?slug=${subjectSlug}&source_type=${sourceType}&start=${start}&length=${params.pageSize}${searchParam}`,
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

          const data: TableData = await response.json();
          setTableData(data);
        } catch (err) {
          console.error('Failed to fetch table data:', err);
          // Set empty data on error
          setTableData({
            rows: [],
            count: 0,
            draw: null,
            data: [],
            recordsTotal: 0,
            recordsFiltered: 0,
            debug: {
              raw_found: [],
              mongo_query_size: 0,
              mongo_query_count: 0,
              mongo_count: 0,
              fields_integrity: {},
            },
          });
        } finally {
          setLoading(false);
        }
      },
      [subjectSlug]
    );

    // Handle type selection
    const handleTypeChange = (type: ForecastType): void => {
      setSelectedType(type);
      const newPagination = { ...pagination, page: 0 };
      setPagination(newPagination);
      fetchForecastData(type);
      fetchTableData(type, newPagination);
    };

    // Handle page size change
    const handlePageSizeChange = (newSize: number): void => {
      const newParams = { ...pagination, pageSize: newSize, page: 0 };
      setPagination(newParams);
      fetchTableData(selectedType, newParams);
    };

    // Handle pagination
    const handlePageChange = (newPage: number): void => {
      const newParams = { ...pagination, page: newPage };
      setPagination(newParams);
      fetchTableData(selectedType, newParams);
    };

    // Initialize with first load
    useEffect(() => {
      if (subjectSlug && selectedType) {
        fetchForecastData(selectedType);
        fetchTableData(selectedType, pagination);
      }
    }, [subjectSlug, selectedType]);

    // Calculate pagination info
    const totalPages = tableData
      ? Math.ceil(tableData.recordsFiltered / pagination.pageSize)
      : 0;
    const currentStart = pagination.page * pagination.pageSize + 1;
    const currentEnd = Math.min(
      (pagination.page + 1) * pagination.pageSize,
      tableData?.recordsFiltered || 0
    );

    // Theme-aware plot layout
    const getThemedPlotLayout = (layout: Partial<Layout>): Partial<Layout> => ({
      ...layout,
      paper_bgcolor: theme.isDark ? '#111111' : '#FAFAFA',
      plot_bgcolor: theme.isDark ? '#1a1a1a' : '#FFFFFF',
      font: {
        color: theme.isDark ? '#FFFFFF' : '#1B1B1D',
      },
      xaxis: {
        ...layout.xaxis,
        gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
        linecolor: theme.isDark ? '#333333' : '#E0E0E0',
        tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
        title: {
          ...layout.xaxis?.title,
          font: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
        },
        tickfont: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
      },
      yaxis: {
        ...layout.yaxis,
        gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
        linecolor: theme.isDark ? '#333333' : '#E0E0E0',
        tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
        title: {
          ...layout.yaxis?.title,
          font: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
        },
        tickfont: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
      },
      // Ensure secondary y-axis is themed too
      yaxis2: {
        ...layout.yaxis2,
        gridcolor: theme.isDark ? '#333333' : '#E0E0E0',
        linecolor: theme.isDark ? '#333333' : '#E0E0E0',
        tickcolor: theme.isDark ? '#333333' : '#E0E0E0',
        title: {
          ...layout.yaxis2?.title,
          font: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
        },
        tickfont: { color: theme.isDark ? '#FFFFFF' : '#1B1B1D' },
      },
    });

    // Get processed plot data (spoofed or real, with colors)
    const getProcessedPlotData = (): PlotData[] => {
      if (!forecastData?.plot_data) return [];

      let processedData = forecastData.plot_data;

      // Apply spoofing if not showing real data
      if (!showRealData) {
        processedData = spoofRecentData(processedData);
      }

      // Apply different colors for real data
      if (showRealData) {
        processedData = modifyColorsForRealData(processedData);
      }

      return processedData;
    };

    return (
      <Card.Root width='100%' mt={6} bg='bg.canvas'>
        <Card.Body p={6}>
          <VStack gap={6} align='stretch'>
            {/* Header */}
            <HStack justify='space-between' align='center'>
              <Heading as='h2' size='lg' color='fg'>
                Source Plot
              </Heading>

              {/* Debug/Real Data Toggle - Hidden in plain sight */}
              <HStack gap={2} align='center' opacity={0.7}>
                <Text fontSize='xs' color='fg.muted'>
                  {showRealData ? 'Raw' : 'Demo'}
                </Text>
                <Switch.Root
                  size='sm'
                  checked={showRealData}
                  onCheckedChange={(e) => setShowRealData(e.checked)}
                >
                  <Switch.Thumb />
                </Switch.Root>
                <IconButton
                  size='xs'
                  variant='ghost'
                  onClick={() => setShowRealData(!showRealData)}
                  aria-label='Toggle data view'
                >
                  {showRealData ? <FiEye size={12} /> : <FiEyeOff size={12} />}
                </IconButton>
              </HStack>
            </HStack>

            {/* Type Selection Buttons */}
            <HStack gap={2} wrap='wrap'>
              {(Object.keys(infoTexts) as ForecastType[]).map((type) => (
                <HStack key={type} gap={1}>
                  <Button
                    size='sm'
                    onClick={() => handleTypeChange(type)}
                    bg={selectedType === type ? 'fg' : 'bg.canvas'}
                    color={selectedType === type ? 'bg.canvas' : 'fg'}
                    borderWidth='1px'
                    borderStyle='solid'
                    borderColor={
                      selectedType === type ? 'fg' : 'border.emphasized'
                    }
                    _hover={{
                      bg: selectedType === type ? 'fg' : 'bg.hover',
                      color: selectedType === type ? 'bg.canvas' : 'fg',
                      opacity: selectedType === type ? 0.9 : 1,
                    }}
                  >
                    {type}
                  </Button>
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <IconButton
                        size='sm'
                        variant='ghost'
                        aria-label={`Info about ${type}`}
                      >
                        <FiInfo size={14} />
                      </IconButton>
                    </Popover.Trigger>
                    <Popover.Positioner>
                      <Popover.Content>
                        <Popover.Arrow />
                        <Popover.Body>
                          <Text fontSize='sm' maxW='300px'>
                            {infoTexts[type]}
                          </Text>
                        </Popover.Body>
                      </Popover.Content>
                    </Popover.Positioner>
                  </Popover.Root>
                </HStack>
              ))}
            </HStack>

            {/* Graph */}
            <ChartErrorBoundary
              chartName={`${selectedType} Forecast Chart`}
              fallbackHeight='400px'
            >
              {loadingChart ? (
                <Box
                  height='400px'
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                >
                  <VStack gap={2}>
                    <Spinner size='lg' />
                    <Text color='gray.500'>Loading chart data...</Text>
                  </VStack>
                </Box>
              ) : forecastData ? (
                <Plot
                  data={getProcessedPlotData() as Data[]}
                  layout={
                    getThemedPlotLayout({
                      ...forecastData.plot_layout,
                      autosize: true,
                      height: 400,
                      // Ensure both y-axes are configured
                      yaxis: {
                        ...forecastData.plot_layout.yaxis,
                        side: 'left',
                      },
                      yaxis2: {
                        ...forecastData.plot_layout.yaxis2,
                        side: 'right',
                        overlaying: 'y',
                        title: 'Sentiment Score',
                      },
                    }) as Partial<Layout>
                  }
                  style={{ width: '100%', height: '400px' }}
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
              ) : (
                <Box
                  height='400px'
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                >
                  <Text color='gray.500'>No chart data available</Text>
                </Box>
              )}
            </ChartErrorBoundary>

            {/* Table Section */}
            <VStack gap={4} align='stretch'>
              {/* Table Controls */}
              <HStack justify='space-between' wrap='wrap'>
                <HStack gap={2}>
                  <Text fontSize='sm' color='gray.600'>
                    Show:
                  </Text>
                  <select
                    value={pagination.pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      fontSize: '14px',
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <Text fontSize='sm' color='gray.600'>
                    entries
                  </Text>
                </HStack>
              </HStack>

              {/* Table */}
              <Box position='relative'>
                {loading && (
                  <Box
                    position='absolute'
                    top='0'
                    left='0'
                    right='0'
                    bottom='0'
                    bg='rgba(255,255,255,0.8)'
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    zIndex='1'
                  >
                    <Spinner size='lg' />
                  </Box>
                )}

                <Table.Root size='sm'>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader width='80px'>Year</Table.ColumnHeader>
                      <Table.ColumnHeader>
                        Name & Description
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {tableData && tableData.data.length > 0 ? (
                      tableData.data.map((row, index) => (
                        <Table.Row key={index}>
                          <Table.Cell>
                            <div dangerouslySetInnerHTML={{ __html: row[0] }} />
                          </Table.Cell>
                          <Table.Cell>
                            <Box
                              overflow='hidden'
                              display='-webkit-box'
                              style={{
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                              }}
                              title={row[1]?.replace(/<[^>]*>/g, '')}
                            >
                              <div
                                dangerouslySetInnerHTML={{ __html: row[1] }}
                              />
                            </Box>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={2}>
                          <Text textAlign='center' color='gray.500'>
                            {loading ? 'Loading...' : 'No data available'}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Root>
              </Box>

              {/* Table Info and Pagination */}
              {tableData && (
                <HStack justify='space-between'>
                  <Text fontSize='sm' color='gray.600'>
                    Showing {currentStart} to {currentEnd} of{' '}
                    {tableData.recordsFiltered} entries
                    {pagination.searchTerm &&
                      ` (filtered from ${tableData.recordsTotal} total entries)`}
                  </Text>

                  {/* Pagination Controls */}
                  <HStack gap={2}>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 0}
                    >
                      Previous
                    </Button>
                    <Text fontSize='sm' color='gray.600'>
                      Page {pagination.page + 1} of {totalPages}
                    </Text>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </HStack>
                </HStack>
              )}
            </VStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    );
  }
);

ForecastChart.displayName = 'ForecastChart';

export default ForecastChart;
