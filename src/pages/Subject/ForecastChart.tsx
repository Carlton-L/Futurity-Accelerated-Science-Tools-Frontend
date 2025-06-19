import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  VStack,
  Text,
  Input,
  Table,
  Spinner,
  IconButton,
  Popover,
} from '@chakra-ui/react';
import { FiInfo, FiSearch } from 'react-icons/fi';
import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';
import ChartErrorBoundary from './ChartErrorBoundary';

// TypeScript interfaces
type ForecastType = 'Organizations' | 'Press' | 'Patents' | 'Papers' | 'Books';

interface ForecastData {
  rows?: any[];
  count?: number;
  plot_layout: Partial<Layout>;
  plot_data: Partial<Data>[];
  referrer?: any;
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
    raw_found: any[];
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

const ForecastChart: React.FC<ForecastChartProps> = ({ subjectSlug }) => {
  const [selectedType, setSelectedType] = useState<ForecastType>('Press');
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingChart, setLoadingChart] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 0,
    pageSize: 10,
    searchTerm: '',
  });
  const [searchInput, setSearchInput] = useState<string>('');

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
        setForecastData(data);
      } catch (err) {
        console.error('Failed to fetch forecast data:', err);
        // Set empty data on error to prevent infinite loading
        setForecastData({
          plot_layout: {
            margin: { t: 80, r: 40, b: 80, l: 60 },
            yaxis: { title: `Number of ${type}` },
          } as Partial<Layout>,
          plot_data: [] as Partial<Data>[],
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

  // Handle search
  const handleSearch = (): void => {
    const newParams = { ...pagination, page: 0, searchTerm: searchInput };
    setPagination(newParams);
    fetchTableData(selectedType, newParams);
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
    if (subjectSlug) {
      fetchForecastData(selectedType);
      fetchTableData(selectedType, pagination);
    }
  }, [subjectSlug, fetchForecastData, fetchTableData, selectedType]);

  // Calculate pagination info
  const totalPages = tableData
    ? Math.ceil(tableData.recordsFiltered / pagination.pageSize)
    : 0;
  const currentStart = pagination.page * pagination.pageSize + 1;
  const currentEnd = Math.min(
    (pagination.page + 1) * pagination.pageSize,
    tableData?.recordsFiltered || 0
  );

  return (
    <Card.Root width='100%' mt={6}>
      <Card.Body p={6}>
        <VStack gap={6} align='stretch'>
          {/* Header */}
          <Heading as='h2' size='lg'>
            Forecast Analysis
          </Heading>

          {/* Type Selection Buttons */}
          <HStack gap={2} wrap='wrap'>
            {(Object.keys(infoTexts) as ForecastType[]).map((type) => (
              <HStack key={type} gap={1}>
                <Button
                  size='sm'
                  variant={selectedType === type ? 'solid' : 'outline'}
                  colorScheme={selectedType === type ? 'blue' : 'gray'}
                  onClick={() => handleTypeChange(type)}
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
                data={forecastData.plot_data as Data[]}
                layout={
                  {
                    ...forecastData.plot_layout,
                    autosize: true,
                    height: 400,
                  } as Partial<Layout>
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
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
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

              <HStack gap={2}>
                <Text fontSize='sm' color='gray.600'>
                  Search:
                </Text>
                <Input
                  size='sm'
                  placeholder='Enter search term...'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  maxW='200px'
                />
                <IconButton
                  size='sm'
                  variant='outline'
                  onClick={handleSearch}
                  aria-label='Search'
                >
                  <FiSearch size={14} />
                </IconButton>
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
                    <Table.ColumnHeader>Name & Description</Table.ColumnHeader>
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
                          <div dangerouslySetInnerHTML={{ __html: row[1] }} />
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
};

export default ForecastChart;
