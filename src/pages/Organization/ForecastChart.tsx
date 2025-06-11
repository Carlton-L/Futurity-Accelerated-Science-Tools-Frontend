import React, { useState, useCallback } from 'react';
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

// TypeScript interfaces
type OrganizationForecastType =
  | 'Organizations'
  | 'Press'
  | 'Patents'
  | 'Papers'
  | 'Books';

interface OrganizationPlotLayout {
  legend: { orientation: string };
  xaxis: unknown[];
  yaxis: { title: string };
  margin: { t: number; r: number; b: number; l: number };
  shapes: Array<{
    type: string;
    x0: string;
    x1: string;
    y0: number;
    y1: number;
    xref: string;
    yref: string;
    line: { color: string; width: number };
  }>;
}

interface OrganizationPlotDataItem {
  mode?: string;
  type: string;
  x: string[] | null[];
  y: number[] | null[];
  name: string;
  line?: {
    color: string;
    width: number;
    dash?: string;
  };
  showlegend?: boolean;
  fill?: string;
  fillcolor?: string;
}

interface OrganizationForecastData {
  rows: unknown[];
  count: number;
  plot_layout: OrganizationPlotLayout;
  plot_data: OrganizationPlotDataItem[];
}

interface OrganizationTableRow {
  ent_fsid: string;
  _id: string;
  ent_name: string;
  ent_summary: string;
  ent_year: number;
  ent_url: string;
  sentiment_score: null | number;
  mongo_row: {
    _id: string;
    ent_fsid: string;
    ent_name: string;
    ent_summary: string;
    ent_year: number;
    ent_url: string;
  };
}

interface OrganizationTableData {
  rows: OrganizationTableRow[];
  count: number;
  draw: string;
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

interface OrganizationPaginationParams {
  page: number;
  pageSize: number;
  searchTerm: string;
}

interface ForecastChartProps {
  organizationSlug: string;
  initialData?: Record<OrganizationForecastType, OrganizationForecastData>;
}

// Mock forecast data structure for organization
const mockOrganizationForecastData: Record<
  OrganizationForecastType,
  OrganizationForecastData
> = {
  Press: {
    rows: [],
    count: 0,
    plot_layout: {
      legend: { orientation: 'h' },
      xaxis: [],
      yaxis: { title: 'Number of Press articles mentioning Apple' },
      margin: { t: 80, r: 40, b: 80, l: 60 },
      shapes: [
        {
          type: 'line',
          x0: '2020',
          x1: '2020',
          y0: 0,
          y1: 1,
          xref: 'x',
          yref: 'paper',
          line: { color: 'red', width: 1 },
        },
      ],
    },
    plot_data: [],
  },
  Patents: {
    rows: [],
    count: 0,
    plot_layout: {
      legend: { orientation: 'h' },
      xaxis: [],
      yaxis: { title: 'Number of Apple Patents' },
      margin: { t: 80, r: 40, b: 80, l: 60 },
      shapes: [
        {
          type: 'line',
          x0: '2017',
          x1: '2017',
          y0: 0,
          y1: 1,
          xref: 'x',
          yref: 'paper',
          line: { color: 'red', width: 1 },
        },
      ],
    },
    plot_data: [],
  },
  Organizations: {
    rows: [],
    count: 0,
    plot_layout: {
      legend: { orientation: 'h' },
      xaxis: [],
      yaxis: { title: 'Number of Organizations related to Apple' },
      margin: { t: 80, r: 40, b: 80, l: 60 },
      shapes: [],
    },
    plot_data: [],
  },
  Papers: {
    rows: [],
    count: 0,
    plot_layout: {
      legend: { orientation: 'h' },
      xaxis: [],
      yaxis: { title: 'Number of Papers mentioning Apple' },
      margin: { t: 80, r: 40, b: 80, l: 60 },
      shapes: [],
    },
    plot_data: [],
  },
  Books: {
    rows: [],
    count: 0,
    plot_layout: {
      legend: { orientation: 'h' },
      xaxis: [],
      yaxis: { title: 'Number of Books about Apple' },
      margin: { t: 80, r: 40, b: 80, l: 60 },
      shapes: [],
    },
    plot_data: [],
  },
};

// Info text for each organization forecast type
const organizationInfoTexts: Record<OrganizationForecastType, string> = {
  Organizations:
    "Partner companies, suppliers, competitors, and other organizations in Apple's ecosystem. The graph and table below show details about organizations connected to **Apple Inc.**",
  Press:
    'News articles, press releases, and media coverage about Apple. The graph and table below show press mentions and coverage of **Apple Inc.**',
  Patents:
    "Patent applications and grants filed by Apple. The graph and table below show Apple's patent activity and intellectual property development.",
  Papers:
    'Academic papers, research publications, and technical documents mentioning Apple. The graph and table below show research related to **Apple Inc.**',
  Books:
    'Books, publications, and case studies about Apple. The graph and table below show books and comprehensive resources about **Apple Inc.**',
};

// Placeholder Graph Component
const OrganizationForecastGraph: React.FC<{
  data: OrganizationForecastData;
  type: OrganizationForecastType;
}> = ({ data, type }) => {
  return (
    <Box
      height='400px'
      bg='gray.50'
      border='1px solid'
      borderColor='gray.200'
      borderRadius='md'
      display='flex'
      alignItems='center'
      justifyContent='center'
    >
      <VStack gap={2}>
        <Text color='gray.500' fontSize='lg'>
          {type} Forecast Graph
        </Text>
        <Text color='gray.400' fontSize='sm'>
          D3 Graph Component (Placeholder)
        </Text>
        <Text color='gray.400' fontSize='xs'>
          Y-axis: {data.plot_layout.yaxis.title}
        </Text>
      </VStack>
    </Box>
  );
};

const ForecastChart: React.FC<ForecastChartProps> = ({
  organizationSlug: _organizationSlug, // eslint-disable-line @typescript-eslint/no-unused-vars
  initialData = mockOrganizationForecastData,
}) => {
  const [selectedType, setSelectedType] =
    useState<OrganizationForecastType>('Press');
  const [tableData, setTableData] = useState<OrganizationTableData | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<OrganizationPaginationParams>({
    page: 0,
    pageSize: 10,
    searchTerm: '',
  });
  const [searchInput, setSearchInput] = useState<string>('');

  // TODO: Replace with actual API call
  const fetchTableData = useCallback(
    async (
      type: OrganizationForecastType,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _params: OrganizationPaginationParams
    ): Promise<void> => {
      setLoading(true);

      // Simulate API call
      setTimeout(() => {
        // Mock table data based on the provided examples
        const mockData: OrganizationTableData = {
          rows: [],
          count: 0,
          draw: '1',
          data: [
            [
              '<div style="width: 55px;">2025</div>',
              '<div class="name-div"><a href="#" target="_blank">Sample Apple Article</a> <small class="text-muted">Sample description about Apple for demo purposes.</small></div>',
            ],
          ],
          recordsTotal: type === 'Press' ? 1249 : 1658,
          recordsFiltered: type === 'Press' ? 1249 : 1658,
          debug: {
            raw_found: [],
            mongo_query_size: 100,
            mongo_query_count: 1,
            mongo_count: 10,
            fields_integrity: {
              _id: { valid: 10, total: 10 },
              ent_fsid: { valid: 10, total: 10 },
              ent_name: { valid: 10, total: 10 },
              ent_summary: { valid: 10, total: 10 },
              ent_year: { valid: 10, total: 10 },
              ent_url: { valid: 10, total: 10 },
            },
          },
        };

        setTableData(mockData);
        setLoading(false);
      }, 500);
    },
    []
  );

  // Handle type selection
  const handleTypeChange = (type: OrganizationForecastType): void => {
    setSelectedType(type);
    setPagination((prev) => ({ ...prev, page: 0 }));
    fetchTableData(type, { ...pagination, page: 0 });
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

  // Initialize with first load
  React.useEffect(() => {
    fetchTableData(selectedType, pagination);
  }, [fetchTableData, selectedType, pagination]);

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
            {(
              Object.keys(organizationInfoTexts) as OrganizationForecastType[]
            ).map((type) => (
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
                          {organizationInfoTexts[type]}
                        </Text>
                      </Popover.Body>
                    </Popover.Content>
                  </Popover.Positioner>
                </Popover.Root>
              </HStack>
            ))}
          </HStack>

          {/* Graph */}
          <OrganizationForecastGraph
            data={initialData[selectedType]}
            type={selectedType}
          />

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
                  {tableData ? (
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
                          No data available
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Root>
            </Box>

            {/* Table Info */}
            {tableData && (
              <HStack justify='space-between'>
                <Text fontSize='sm' color='gray.600'>
                  Showing {pagination.page * pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (pagination.page + 1) * pagination.pageSize,
                    tableData.recordsFiltered
                  )}{' '}
                  of {tableData.recordsFiltered} entries
                  {pagination.searchTerm &&
                    ` (filtered from ${tableData.recordsTotal} total entries)`}
                </Text>

                {/* TODO: Add pagination controls */}
                <Text fontSize='sm' color='gray.400'>
                  Pagination controls - TODO
                </Text>
              </HStack>
            )}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default ForecastChart;
