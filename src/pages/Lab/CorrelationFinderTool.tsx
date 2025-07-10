import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Alert,
  Badge,
  Skeleton,
  Spinner,
  Checkbox,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiSearch,
  FiRefreshCw,
  FiAlertCircle,
  FiInfo,
  FiBarChart,
  FiX,
} from 'react-icons/fi';
import Plot from 'react-plotly.js';
import { useAuth } from '../../context/AuthContext';
import {
  toolsService,
  type TimeseriesItem,
  type CorrelationFinderResponse,
} from '../../services/toolsService';

interface CorrelationFinderToolProps {
  onResultGenerated?: (
    result: CorrelationFinderResponse & {
      series1: TimeseriesItem;
      series2: TimeseriesItem;
      forecastYears: number;
    }
  ) => void;
}

const CorrelationFinderTool: React.FC<CorrelationFinderToolProps> = ({
  onResultGenerated,
}) => {
  const { token } = useAuth();

  // State for available timeseries
  const [availableSeries, setAvailableSeries] = useState<TimeseriesItem[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(false);
  const [seriesError, setSeriesError] = useState('');

  // State for selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries1, setSelectedSeries1] = useState<TimeseriesItem | null>(
    null
  );
  const [selectedSeries2, setSelectedSeries2] = useState<TimeseriesItem | null>(
    null
  );
  const [forecastYears, setForecastYears] = useState(5);

  // State for analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<CorrelationFinderResponse | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  // Filtered series based on search
  const filteredSeries = useMemo(() => {
    return toolsService.filterTimeseries(availableSeries, searchQuery);
  }, [availableSeries, searchQuery]);

  // Load available timeseries on mount
  useEffect(() => {
    loadAvailableSeries(false);
  }, []);

  // Load available timeseries
  const loadAvailableSeries = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!token) return;

      setIsLoadingSeries(true);
      setSeriesError('');

      try {
        const series = await toolsService.getAvailableTimeseries(
          token,
          forceRefresh
        );
        setAvailableSeries(series);
      } catch (err) {
        console.error('Failed to load available timeseries:', err);
        setSeriesError(
          err instanceof Error
            ? err.message
            : 'Failed to load available timeseries'
        );
      } finally {
        setIsLoadingSeries(false);
      }
    },
    [token]
  );

  // Handle refresh cache
  const handleRefreshCache = useCallback(() => {
    loadAvailableSeries(true);
  }, [loadAvailableSeries]);

  // Handle series selection with automatic slot assignment
  const handleSeriesSelect = useCallback(
    (series: TimeseriesItem, isChecked: boolean) => {
      if (!isChecked) {
        // Uncheck - remove from whichever slot it's in
        if (selectedSeries1?.ent_fsid === series.ent_fsid) {
          setSelectedSeries1(null);
        }
        if (selectedSeries2?.ent_fsid === series.ent_fsid) {
          setSelectedSeries2(null);
        }
        return;
      }

      // Check - assign to first available slot
      if (!selectedSeries1) {
        setSelectedSeries1(series);
      } else if (!selectedSeries2) {
        setSelectedSeries2(series);
      } else {
        // Both slots filled, replace the first one and shift
        setSelectedSeries1(selectedSeries2);
        setSelectedSeries2(series);
      }
    },
    [selectedSeries1, selectedSeries2]
  );

  // Handle clear selection
  const handleClearSelection = useCallback((position: 1 | 2) => {
    if (position === 1) {
      setSelectedSeries1(null);
    } else {
      setSelectedSeries2(null);
    }
  }, []);

  // Handle run analysis
  const handleRunAnalysis = useCallback(async () => {
    if (!selectedSeries1 || !selectedSeries2 || !token) return;

    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult(null);

    try {
      const result = await toolsService.runCorrelationAnalysis(
        selectedSeries1.ent_fsid,
        selectedSeries2.ent_fsid,
        forecastYears,
        token
      );

      setAnalysisResult(result);

      // Notify parent component
      if (onResultGenerated) {
        onResultGenerated({
          ...result,
          series1: selectedSeries1,
          series2: selectedSeries2,
          forecastYears,
        });
      }
    } catch (err) {
      console.error('Correlation analysis failed:', err);
      setAnalysisError(
        err instanceof Error
          ? err.message
          : 'Failed to run correlation analysis'
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    selectedSeries1,
    selectedSeries2,
    forecastYears,
    token,
    onResultGenerated,
  ]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    setSelectedSeries1(null);
    setSelectedSeries2(null);
    setAnalysisResult(null);
    setAnalysisError('');
    setSearchQuery('');
  }, []);

  // Get correlation sentiment color
  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return 'green';
    if (abs >= 0.5) return 'blue';
    if (abs >= 0.3) return 'orange';
    return 'gray';
  };

  const canRunAnalysis = selectedSeries1 && selectedSeries2 && !isAnalyzing;

  return (
    <Card.Root variant='outline'>
      <Card.Header>
        <HStack gap={3} align='center'>
          <Box color='fg' fontSize='lg'>
            <FiTrendingUp />
          </Box>
          <VStack gap={1} align='start' flex='1'>
            <Heading size='md' color='fg' fontFamily='heading'>
              Correlation Finder
            </Heading>
            <Text fontSize='sm' color='fg.muted' fontFamily='body'>
              Discover correlations between different timeseries datasets
            </Text>
          </VStack>
          {toolsService.hasCachedAvailableSeries() && (
            <Button
              size='xs'
              variant='ghost'
              onClick={handleRefreshCache}
              disabled={isLoadingSeries}
              color='fg.muted'
              _hover={{ color: 'brand', bg: 'bg.hover' }}
              fontFamily='heading'
              title='Refresh cached timeseries'
            >
              <FiRefreshCw size={12} />
            </Button>
          )}
        </HStack>
      </Card.Header>

      <Card.Body>
        <VStack gap={6} align='stretch'>
          {/* Info Banner */}
          <Alert.Root status='info' variant='subtle'>
            <Alert.Indicator>
              <FiInfo />
            </Alert.Indicator>
            <Alert.Description fontSize='sm' fontFamily='body'>
              Select two different timeseries to analyze their correlation. The
              tool will identify overlapping time periods, calculate correlation
              coefficients, and provide forecasts for both series.
            </Alert.Description>
          </Alert.Root>

          {/* Available Series Loading/Error */}
          {isLoadingSeries && (
            <VStack gap={2}>
              <HStack gap={2} align='center'>
                <Spinner size='sm' color='brand' />
                <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                  Loading available timeseries...
                </Text>
              </HStack>
              <Skeleton height='40px' borderRadius='md' />
              <Skeleton height='60px' borderRadius='md' />
            </VStack>
          )}

          {seriesError && (
            <Alert.Root status='error'>
              <Alert.Indicator>
                <FiAlertCircle />
              </Alert.Indicator>
              <Alert.Description fontSize='sm' fontFamily='body'>
                {seriesError}
              </Alert.Description>
            </Alert.Root>
          )}

          {/* Series Selection */}
          {!isLoadingSeries && availableSeries.length > 0 && (
            <VStack gap={4} align='stretch'>
              {/* Search */}
              <VStack gap={2} align='stretch'>
                <HStack justify='space-between' align='center'>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='fg'
                    fontFamily='heading'
                  >
                    Search Timeseries ({availableSeries.length} available)
                  </Text>
                  {(selectedSeries1 || selectedSeries2) && (
                    <Button
                      size='xs'
                      variant='ghost'
                      onClick={handleClearAll}
                      color='fg.muted'
                      _hover={{ color: 'red.500', bg: 'bg.hover' }}
                      fontFamily='heading'
                    >
                      Clear All
                    </Button>
                  )}
                </HStack>

                <HStack gap={2}>
                  <Box position='relative' flex='1'>
                    <FiSearch
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--chakra-colors-fg-muted)',
                      }}
                    />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder='Search by name, metric, units, or location...'
                      pl='40px'
                      bg='bg.canvas'
                      borderColor='border.emphasized'
                      _focus={{
                        borderColor: 'brand',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                      }}
                      fontFamily='body'
                      fontSize='sm'
                    />
                  </Box>
                  <Text
                    fontSize='sm'
                    color='fg.muted'
                    fontFamily='body'
                    whiteSpace='nowrap'
                  >
                    {filteredSeries.length} results
                  </Text>
                </HStack>
              </VStack>

              {/* Selected Series Display - Always Visible */}
              <VStack gap={3} align='stretch'>
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  color='fg'
                  fontFamily='heading'
                >
                  Selected Series
                </Text>

                <HStack gap={3} align='stretch' wrap='wrap'>
                  {/* Series 1 Slot */}
                  <Box
                    flex='1'
                    minW='280px'
                    p={3}
                    bg={selectedSeries1 ? 'blue.50' : 'bg.muted'}
                    borderRadius='md'
                    borderWidth='1px'
                    borderColor={selectedSeries1 ? 'blue.200' : 'border.muted'}
                    _dark={{
                      bg: selectedSeries1 ? 'blue.900/20' : 'bg.muted',
                      borderColor: selectedSeries1
                        ? 'blue.400/40'
                        : 'border.muted',
                    }}
                  >
                    <VStack gap={2} align='stretch'>
                      <HStack justify='space-between' align='center'>
                        <Text
                          fontSize='xs'
                          fontWeight='medium'
                          color='fg.muted'
                          fontFamily='body'
                        >
                          SERIES 1
                        </Text>
                        {selectedSeries1 && (
                          <Button
                            size='xs'
                            variant='ghost'
                            onClick={() => handleClearSelection(1)}
                            color='fg.muted'
                            _hover={{ color: 'red.500' }}
                          >
                            <FiX size={12} />
                          </Button>
                        )}
                      </HStack>
                      {selectedSeries1 ? (
                        <VStack gap={1} align='start'>
                          <Text
                            fontSize='sm'
                            fontWeight='medium'
                            color='fg'
                            fontFamily='body'
                          >
                            {selectedSeries1.ent_name || 'Unknown Series'}
                          </Text>
                          <Text
                            fontSize='xs'
                            color='fg.muted'
                            fontFamily='body'
                          >
                            {selectedSeries1.metric || 'Unknown metric'} (
                            {selectedSeries1.units || 'Unknown units'}) -{' '}
                            {selectedSeries1.ent_place || 'Unknown location'}
                          </Text>
                          <Badge size='xs' variant='outline' colorScheme='blue'>
                            {selectedSeries1.ent_metric_type || 'Unknown type'}
                          </Badge>
                        </VStack>
                      ) : (
                        <Text
                          fontSize='sm'
                          color='fg.muted'
                          fontFamily='body'
                          fontStyle='italic'
                        >
                          Select first timeseries...
                        </Text>
                      )}
                    </VStack>
                  </Box>

                  {/* Series 2 Slot */}
                  <Box
                    flex='1'
                    minW='280px'
                    p={3}
                    bg={selectedSeries2 ? 'green.50' : 'bg.muted'}
                    borderRadius='md'
                    borderWidth='1px'
                    borderColor={selectedSeries2 ? 'green.200' : 'border.muted'}
                    _dark={{
                      bg: selectedSeries2 ? 'green.900/20' : 'bg.muted',
                      borderColor: selectedSeries2
                        ? 'green.400/40'
                        : 'border.muted',
                    }}
                  >
                    <VStack gap={2} align='stretch'>
                      <HStack justify='space-between' align='center'>
                        <Text
                          fontSize='xs'
                          fontWeight='medium'
                          color='fg.muted'
                          fontFamily='body'
                        >
                          SERIES 2
                        </Text>
                        {selectedSeries2 && (
                          <Button
                            size='xs'
                            variant='ghost'
                            onClick={() => handleClearSelection(2)}
                            color='fg.muted'
                            _hover={{ color: 'red.500' }}
                          >
                            <FiX size={12} />
                          </Button>
                        )}
                      </HStack>
                      {selectedSeries2 ? (
                        <VStack gap={1} align='start'>
                          <Text
                            fontSize='sm'
                            fontWeight='medium'
                            color='fg'
                            fontFamily='body'
                          >
                            {selectedSeries2.ent_name || 'Unknown Series'}
                          </Text>
                          <Text
                            fontSize='xs'
                            color='fg.muted'
                            fontFamily='body'
                          >
                            {selectedSeries2.metric || 'Unknown metric'} (
                            {selectedSeries2.units || 'Unknown units'}) -{' '}
                            {selectedSeries2.ent_place || 'Unknown location'}
                          </Text>
                          <Badge
                            size='xs'
                            variant='outline'
                            colorScheme='green'
                          >
                            {selectedSeries2.ent_metric_type || 'Unknown type'}
                          </Badge>
                        </VStack>
                      ) : (
                        <Text
                          fontSize='sm'
                          color='fg.muted'
                          fontFamily='body'
                          fontStyle='italic'
                        >
                          Select second timeseries...
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </HStack>
              </VStack>

              {/* Analysis Options */}
              {(selectedSeries1 || selectedSeries2) && (
                <HStack gap={4} align='end'>
                  <VStack gap={1} align='start'>
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color='fg'
                      fontFamily='heading'
                    >
                      Forecast Years
                    </Text>
                    <Input
                      type='number'
                      value={forecastYears}
                      onChange={(e) =>
                        setForecastYears(parseInt(e.target.value) || 5)
                      }
                      min={1}
                      max={20}
                      size='sm'
                      width='100px'
                      bg='bg.canvas'
                      borderColor='border.emphasized'
                      _focus={{
                        borderColor: 'brand',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                      }}
                      fontFamily='body'
                    />
                  </VStack>

                  <Button
                    onClick={handleRunAnalysis}
                    disabled={!canRunAnalysis}
                    loading={isAnalyzing}
                    loadingText='Analyzing...'
                    bg='brand'
                    color='white'
                    _hover={{ opacity: 0.9 }}
                    fontFamily='heading'
                  >
                    <HStack gap={2}>
                      <FiBarChart size={16} />
                      <Text>
                        {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                      </Text>
                    </HStack>
                  </Button>
                </HStack>
              )}

              {/* Available Series List */}
              {filteredSeries.length > 0 && (
                <VStack gap={2} align='stretch'>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='fg'
                    fontFamily='heading'
                  >
                    Available Timeseries
                  </Text>

                  <Box
                    maxHeight='300px'
                    overflowY='auto'
                    borderWidth='1px'
                    borderColor='border.muted'
                    borderRadius='md'
                    bg='bg.canvas'
                  >
                    {filteredSeries.slice(0, 50).map((series, index) => {
                      // Create a unique key combining fsid and index to handle potential duplicates
                      const uniqueKey = `${series.ent_fsid}_${index}`;
                      const isSelected =
                        selectedSeries1?.ent_fsid === series.ent_fsid ||
                        selectedSeries2?.ent_fsid === series.ent_fsid;

                      return (
                        <HStack
                          key={uniqueKey}
                          p={3}
                          borderBottomWidth={
                            index < Math.min(filteredSeries.length, 50) - 1
                              ? '1px'
                              : '0'
                          }
                          borderBottomColor='border.muted'
                          _hover={{ bg: 'bg.hover' }}
                          cursor='pointer'
                          justify='space-between'
                          align='center'
                          onClick={() =>
                            handleSeriesSelect(series, !isSelected)
                          }
                        >
                          <VStack gap={1} align='start' flex='1'>
                            <Text
                              fontSize='sm'
                              fontWeight='medium'
                              color='fg'
                              fontFamily='body'
                            >
                              {series.ent_name || 'Unknown Series'}
                            </Text>
                            <Text
                              fontSize='xs'
                              color='fg.muted'
                              fontFamily='body'
                            >
                              {series.metric || 'Unknown metric'} (
                              {series.units || 'Unknown units'}) -{' '}
                              {series.ent_place || 'Unknown location'}
                            </Text>
                            <Badge size='xs' variant='outline'>
                              {series.ent_metric_type || 'Unknown type'}
                            </Badge>
                          </VStack>

                          <Checkbox.Root
                            checked={isSelected}
                            onCheckedChange={(details) => {
                              handleSeriesSelect(series, details.checked);
                            }}
                            colorPalette='brand'
                            size='md'
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Root>
                        </HStack>
                      );
                    })}

                    {filteredSeries.length > 50 && (
                      <Box
                        p={3}
                        textAlign='center'
                        borderTopWidth='1px'
                        borderTopColor='border.muted'
                      >
                        <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                          Showing first 50 results. Use search to narrow down
                          options.
                        </Text>
                      </Box>
                    )}
                  </Box>
                </VStack>
              )}

              {filteredSeries.length === 0 && searchQuery && (
                <Alert.Root status='warning'>
                  <Alert.Indicator>
                    <FiAlertCircle />
                  </Alert.Indicator>
                  <Alert.Description fontSize='sm' fontFamily='body'>
                    No timeseries found matching "{searchQuery}". Try a
                    different search term.
                  </Alert.Description>
                </Alert.Root>
              )}
            </VStack>
          )}

          {/* Analysis Error */}
          {analysisError && (
            <Alert.Root status='error'>
              <Alert.Indicator>
                <FiAlertCircle />
              </Alert.Indicator>
              <Alert.Description fontSize='sm' fontFamily='body'>
                {analysisError}
              </Alert.Description>
            </Alert.Root>
          )}

          {/* Analysis Results */}
          {analysisResult && selectedSeries1 && selectedSeries2 && (
            <VStack gap={4} align='stretch'>
              <Text
                fontSize='sm'
                fontWeight='medium'
                color='fg'
                fontFamily='heading'
              >
                Correlation Analysis Results
              </Text>

              <HStack gap={4} wrap='wrap'>
                {/* Correlation Score */}
                <Box
                  p={4}
                  bg='bg.muted'
                  borderRadius='md'
                  borderWidth='1px'
                  borderColor='border.muted'
                  minW='200px'
                >
                  <VStack gap={2} align='center'>
                    <Text
                      fontSize='xs'
                      fontWeight='medium'
                      color='fg.muted'
                      fontFamily='heading'
                    >
                      CORRELATION
                    </Text>
                    <Text
                      fontSize='2xl'
                      fontWeight='bold'
                      color={`${getCorrelationColor(
                        analysisResult.correlation
                      )}.500`}
                      fontFamily='heading'
                    >
                      {toolsService.formatCorrelation(
                        analysisResult.correlation
                      )}
                    </Text>
                    <Badge
                      size='sm'
                      colorScheme={getCorrelationColor(
                        analysisResult.correlation
                      )}
                    >
                      {toolsService.getCorrelationSentiment(
                        analysisResult.correlation_interpretation || ''
                      )}
                    </Badge>
                  </VStack>
                </Box>

                {/* Analysis Details */}
                <VStack gap={2} align='start' flex='1'>
                  <Text fontSize='sm' color='fg' fontFamily='body'>
                    {analysisResult.correlation_interpretation ||
                      'No interpretation available'}
                  </Text>
                  <HStack
                    gap={4}
                    fontSize='xs'
                    color='fg.muted'
                    fontFamily='body'
                  >
                    <Text>
                      Years analyzed: {analysisResult.overlapping_years || 0}
                    </Text>
                    <Text>•</Text>
                    <Text>
                      Period: {analysisResult.year_range?.start || 'Unknown'}-
                      {analysisResult.year_range?.end || 'Unknown'}
                    </Text>
                    <Text>•</Text>
                    <Text>
                      Forecast:{' '}
                      {toolsService.formatForecastYears(
                        Object.values(analysisResult.forecast || {})[0]
                          ?.years || []
                      )}
                    </Text>
                  </HStack>
                </VStack>
              </HStack>

              {/* Plot Display */}
              {analysisResult && analysisResult.plot && (
                <Box>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='fg'
                    fontFamily='heading'
                    mb={3}
                  >
                    Correlation Plot
                  </Text>
                  <Box
                    borderRadius='md'
                    borderWidth='1px'
                    borderColor='border.muted'
                    overflow='hidden'
                    bg='bg.canvas'
                  >
                    {(() => {
                      try {
                        const plotData = JSON.parse(analysisResult.plot);
                        return (
                          <Plot
                            data={plotData.data || []}
                            layout={{
                              ...plotData.layout,
                              autosize: true,
                              margin: { l: 60, r: 60, t: 60, b: 60 },
                              paper_bgcolor: 'rgba(0,0,0,0)',
                              plot_bgcolor: 'rgba(0,0,0,0)',
                              font: {
                                family: 'JetBrains Mono, monospace',
                                size: 12,
                              },
                            }}
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
                              responsive: true,
                            }}
                            style={{ width: '100%', height: '500px' }}
                            useResizeHandler={true}
                          />
                        );
                      } catch (error) {
                        console.error('Failed to parse plot data:', error);
                        return (
                          <Box p={6} textAlign='center'>
                            <VStack gap={2}>
                              <FiBarChart
                                size={32}
                                color='var(--chakra-colors-fg-muted)'
                              />
                              <Text
                                fontSize='sm'
                                color='fg.muted'
                                fontFamily='body'
                              >
                                Failed to display correlation plot
                              </Text>
                              <Text
                                fontSize='xs'
                                color='fg.muted'
                                fontFamily='body'
                              >
                                Plot data may be malformed
                              </Text>
                            </VStack>
                          </Box>
                        );
                      }
                    })()}
                  </Box>
                </Box>
              )}
            </VStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default CorrelationFinderTool;
