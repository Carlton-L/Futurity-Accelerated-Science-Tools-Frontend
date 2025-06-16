import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  Badge,
  Tabs,
} from '@chakra-ui/react';
import {
  FiBarChart,
  FiTrendingUp,
  FiTarget,
  FiGitBranch,
  FiShare,
  FiDownload,
  FiPlay,
  FiRefreshCw,
} from 'react-icons/fi';

// Mock types - replace with your actual types
interface Subject {
  id: string;
  name: string;
  timeseries: TimeSeries[];
}

interface TimeSeries {
  fsid: string;
  name: string;
  description: string;
  dataPoints: number;
  lastUpdated: string;
}

interface TimeSeriesWithSubject extends TimeSeries {
  subjectName: string;
}

interface ForecastResults {
  series: string[];
  methods: string[];
  accuracy: number;
  confidence: number;
  graphUrl: string;
  predictions: {
    date: string;
    value: number;
    confidence: [number, number];
  }[];
}

interface TriggerResults {
  series: string;
  inflectionPoints: {
    date: string;
    significance: number;
    changeDirection: 'increase' | 'decrease';
  }[];
  possibleTriggers: {
    event: string;
    date: string;
    relevance: number;
  }[];
  graphUrl: string;
}

interface CorrelationResults {
  series1: string;
  series2: string;
  correlation: number;
  pValue: number;
  r2: number;
  graphUrl: string;
  interpretation: string;
}

interface PatternResults {
  series: string;
  matches: {
    fsid: string;
    name: string;
    similarity: number;
    subject: string;
  }[];
  graphUrl: string;
}

interface NetworkResults {
  subjects: string[];
  networkStats: {
    nodes: number;
    edges: number;
    density: number;
    clustering: number;
    centrality: string;
  };
  forecast: {
    predictedNodes: number;
    predictedEdges: number;
    emergingConnections: number;
    confidence: number;
  };
  graphUrl: string;
}

interface ForecastProps {
  labId: string;
}

const Forecast: React.FC<ForecastProps> = ({ labId }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('universal');

  // Universal Forecaster state
  const [selectedTimeSeries, setSelectedTimeSeries] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>(['linear']);
  const [universalResults, setUniversalResults] =
    useState<ForecastResults | null>(null);
  const [universalLoading, setUniversalLoading] = useState<boolean>(false);

  // Trigger Event Finder state
  const [triggerTimeSeries, setTriggerTimeSeries] = useState<string>('');
  const [triggerResults, setTriggerResults] = useState<TriggerResults | null>(
    null
  );
  const [triggerLoading, setTriggerLoading] = useState<boolean>(false);

  // Correlation Finder state
  const [correlationSeries1, setCorrelationSeries1] = useState<string>('');
  const [correlationSeries2, setCorrelationSeries2] = useState<string>('');
  const [correlationResults, setCorrelationResults] =
    useState<CorrelationResults | null>(null);
  const [correlationLoading, setCorrelationLoading] = useState<boolean>(false);

  // Pattern Matching state
  const [patternTimeSeries, setPatternTimeSeries] = useState<string>('');
  const [patternResults, setPatternResults] = useState<PatternResults | null>(
    null
  );
  const [patternLoading, setPatternLoading] = useState<boolean>(false);

  // Network Forecaster state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [networkResults, setNetworkResults] = useState<NetworkResults | null>(
    null
  );
  const [networkLoading, setNetworkLoading] = useState<boolean>(false);

  // Mock data loading
  useEffect(() => {
    const loadSubjects = async () => {
      setLoading(true);

      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock subjects data
      const mockSubjects: Subject[] = [
        {
          id: 'subj-1',
          name: 'Luxury Fashion Trends',
          timeseries: [
            {
              fsid: 'ts-1',
              name: 'Google Search Volume',
              description: 'Monthly search data',
              dataPoints: 24,
              lastUpdated: '2024-03-15',
            },
            {
              fsid: 'ts-2',
              name: 'Social Media Mentions',
              description: 'Weekly mention count',
              dataPoints: 52,
              lastUpdated: '2024-03-14',
            },
          ],
        },
        {
          id: 'subj-2',
          name: 'Sustainable Materials',
          timeseries: [
            {
              fsid: 'ts-3',
              name: 'Market Adoption Rate',
              description: 'Quarterly adoption %',
              dataPoints: 12,
              lastUpdated: '2024-03-10',
            },
            {
              fsid: 'ts-4',
              name: 'Investment Funding',
              description: 'Monthly funding amounts',
              dataPoints: 36,
              lastUpdated: '2024-03-12',
            },
          ],
        },
        {
          id: 'subj-3',
          name: 'Consumer Behavior',
          timeseries: [
            {
              fsid: 'ts-5',
              name: 'Purchase Intent Score',
              description: 'Weekly consumer survey',
              dataPoints: 48,
              lastUpdated: '2024-03-13',
            },
            {
              fsid: 'ts-6',
              name: 'Brand Loyalty Index',
              description: 'Monthly loyalty metrics',
              dataPoints: 18,
              lastUpdated: '2024-03-11',
            },
          ],
        },
      ];

      setSubjects(mockSubjects);
      setLoading(false);
    };

    loadSubjects();
  }, [labId]);

  // Get all timeseries for dropdowns
  const allTimeSeries: TimeSeriesWithSubject[] = subjects.flatMap((subject) =>
    subject.timeseries.map((ts) => ({
      ...ts,
      subjectName: subject.name,
    }))
  );

  // Universal Forecaster handlers
  const handleTimeSeriesToggle = (fsid: string) => {
    setSelectedTimeSeries((prev) =>
      prev.includes(fsid) ? prev.filter((id) => id !== fsid) : [...prev, fsid]
    );
  };

  const handleMethodToggle = (method: string) => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  };

  const runUniversalForecast = async () => {
    if (selectedTimeSeries.length === 0) return;

    setUniversalLoading(true);

    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock results
    setUniversalResults({
      series: selectedTimeSeries,
      methods: selectedMethods,
      accuracy: 0.847,
      confidence: 0.92,
      graphUrl: '/mock-forecast-graph.png',
      predictions: [
        { date: '2024-04-01', value: 125.3, confidence: [118.2, 132.4] },
        { date: '2024-05-01', value: 128.7, confidence: [120.1, 137.3] },
        { date: '2024-06-01', value: 132.1, confidence: [122.5, 141.7] },
      ],
    });

    setUniversalLoading(false);
  };

  // Trigger Event Finder handlers
  const runTriggerAnalysis = async () => {
    if (!triggerTimeSeries) return;

    setTriggerLoading(true);

    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock results
    setTriggerResults({
      series: triggerTimeSeries,
      inflectionPoints: [
        { date: '2024-01-15', significance: 0.89, changeDirection: 'increase' },
        { date: '2024-02-28', significance: 0.72, changeDirection: 'decrease' },
      ],
      possibleTriggers: [
        {
          event: 'Paris Fashion Week Launch',
          date: '2024-01-12',
          relevance: 0.94,
        },
        {
          event: 'Sustainability Report Release',
          date: '2024-02-25',
          relevance: 0.81,
        },
      ],
      graphUrl: '/mock-trigger-graph.png',
    });

    setTriggerLoading(false);
  };

  // Correlation Finder handlers
  const runCorrelationAnalysis = async () => {
    if (!correlationSeries1 || !correlationSeries2) return;

    setCorrelationLoading(true);

    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Mock results
    setCorrelationResults({
      series1: correlationSeries1,
      series2: correlationSeries2,
      correlation: 0.734,
      pValue: 0.003,
      r2: 0.538,
      graphUrl: '/mock-correlation-graph.png',
      interpretation: 'Strong positive correlation',
    });

    setCorrelationLoading(false);
  };

  // Pattern Matching handlers
  const runPatternMatching = async () => {
    if (!patternTimeSeries) return;

    setPatternLoading(true);

    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // Mock results
    setPatternResults({
      series: patternTimeSeries,
      matches: [
        {
          fsid: 'ts-7',
          name: 'Similar Fashion Trend',
          similarity: 0.89,
          subject: 'Historical Data',
        },
        {
          fsid: 'ts-8',
          name: 'Related Market Pattern',
          similarity: 0.76,
          subject: 'Market Research',
        },
        {
          fsid: 'ts-9',
          name: 'Consumer Behavior Match',
          similarity: 0.68,
          subject: 'Consumer Studies',
        },
      ],
      graphUrl: '/mock-pattern-graph.png',
    });

    setPatternLoading(false);
  };

  // Network Forecaster handlers
  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const runNetworkForecast = async () => {
    if (selectedSubjects.length === 0) return;

    setNetworkLoading(true);

    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Mock results
    setNetworkResults({
      subjects: selectedSubjects,
      networkStats: {
        nodes: 47,
        edges: 123,
        density: 0.056,
        clustering: 0.342,
        centrality: 'Luxury Fashion Trends',
      },
      forecast: {
        predictedNodes: 52,
        predictedEdges: 138,
        emergingConnections: 15,
        confidence: 0.78,
      },
      graphUrl: '/mock-network-graph.png',
    });

    setNetworkLoading(false);
  };

  // Utility functions
  const exportResults = (
    results:
      | ForecastResults
      | TriggerResults
      | CorrelationResults
      | PatternResults
      | NetworkResults,
    type: string
  ) => {
    // TODO: Implement actual export functionality
    console.log(`Exporting ${type} results:`, results);
    alert(`${type} results exported! (Mock implementation)`);
  };

  const shareResults = (
    results:
      | ForecastResults
      | TriggerResults
      | CorrelationResults
      | PatternResults
      | NetworkResults,
    type: string
  ) => {
    // TODO: Implement actual sharing functionality
    console.log(`Sharing ${type} results:`, results);
    alert(`${type} results shared! (Mock implementation)`);
  };

  if (loading) {
    return (
      <Box>
        <Card.Root>
          <Card.Body p={6}>
            <Text>Loading forecast tools...</Text>
          </Card.Body>
        </Card.Root>
      </Box>
    );
  }

  return (
    <Box>
      <VStack gap={6} align='stretch'>
        {/* Header */}
        <Card.Root>
          <Card.Body p={6}>
            <Heading as='h2' size='lg' mb={2}>
              Forecast Tools
            </Heading>
            <Text color='gray.600'>
              Analyze time series data, find patterns, and predict future trends
              using advanced forecasting methods.
            </Text>
          </Card.Body>
        </Card.Root>

        {/* Tool Tabs */}
        <Card.Root>
          <Card.Body p={6}>
            <Tabs.Root
              value={activeTab}
              onValueChange={(details) => setActiveTab(details.value)}
            >
              <Tabs.List mb={6}>
                <Tabs.Trigger value='universal'>
                  <FiBarChart size={16} />
                  Universal Forecaster
                </Tabs.Trigger>
                <Tabs.Trigger value='trigger'>
                  <FiTarget size={16} />
                  Trigger Events
                </Tabs.Trigger>
                <Tabs.Trigger value='correlation'>
                  <FiTrendingUp size={16} />
                  Correlation
                </Tabs.Trigger>
                <Tabs.Trigger value='pattern'>
                  <FiGitBranch size={16} />
                  Pattern Matching
                </Tabs.Trigger>
                <Tabs.Trigger value='network'>
                  <FiShare size={16} />
                  Network Forecast
                </Tabs.Trigger>
              </Tabs.List>

              {/* Universal Forecaster */}
              <Tabs.Content value='universal'>
                <VStack gap={6} align='stretch'>
                  <Box>
                    <Heading as='h3' size='md' mb={4}>
                      Universal Forecaster
                    </Heading>
                    <Text color='gray.600' mb={4}>
                      Select time series and forecasting methods to generate
                      predictions.
                    </Text>
                  </Box>

                  <Grid templateColumns='1fr 1fr' gap={6}>
                    {/* Input Section */}
                    <VStack gap={4} align='stretch'>
                      <Box>
                        <Text fontWeight='medium' mb={2}>
                          Select Time Series
                        </Text>
                        <VStack
                          gap={2}
                          align='stretch'
                          maxH='200px'
                          overflowY='auto'
                          p={2}
                          border='1px solid'
                          borderColor='gray.200'
                          borderRadius='md'
                        >
                          {allTimeSeries.map((ts) => (
                            <Button
                              key={ts.fsid}
                              variant={
                                selectedTimeSeries.includes(ts.fsid)
                                  ? 'solid'
                                  : 'outline'
                              }
                              size='sm'
                              onClick={() => handleTimeSeriesToggle(ts.fsid)}
                              justifyContent='flex-start'
                            >
                              <VStack gap={1} align='start'>
                                <Text fontSize='sm' fontWeight='medium'>
                                  {ts.name}
                                </Text>
                                <Text fontSize='xs' color='gray.500'>
                                  {ts.subjectName} • {ts.dataPoints} points
                                </Text>
                              </VStack>
                            </Button>
                          ))}
                        </VStack>
                      </Box>

                      <Box>
                        <Text fontWeight='medium' mb={2}>
                          Forecasting Methods
                        </Text>
                        <VStack gap={2} align='stretch'>
                          {[
                            'linear',
                            'polynomial',
                            'exponential',
                            'arima',
                            'neural',
                          ].map((method) => (
                            <Button
                              key={method}
                              variant={
                                selectedMethods.includes(method)
                                  ? 'solid'
                                  : 'outline'
                              }
                              size='sm'
                              onClick={() => handleMethodToggle(method)}
                              justifyContent='flex-start'
                            >
                              <Text fontSize='sm' textTransform='capitalize'>
                                {method} Regression
                              </Text>
                            </Button>
                          ))}
                        </VStack>
                      </Box>

                      <Button
                        colorScheme='blue'
                        onClick={runUniversalForecast}
                        loading={universalLoading}
                        disabled={selectedTimeSeries.length === 0}
                      >
                        <FiPlay size={16} />
                        Generate Forecast
                      </Button>
                    </VStack>

                    {/* Results Section */}
                    <Box>
                      <Text fontWeight='medium' mb={2}>
                        Results
                      </Text>
                      {universalResults ? (
                        <VStack gap={4} align='stretch'>
                          <Box p={4} bg='gray.50' borderRadius='md'>
                            <HStack justify='space-between' mb={2}>
                              <Text fontSize='sm' fontWeight='medium'>
                                Forecast Accuracy
                              </Text>
                              <Badge colorScheme='green'>
                                {(universalResults.accuracy * 100).toFixed(1)}%
                              </Badge>
                            </HStack>
                            <HStack justify='space-between'>
                              <Text fontSize='sm' fontWeight='medium'>
                                Confidence Level
                              </Text>
                              <Badge colorScheme='blue'>
                                {(universalResults.confidence * 100).toFixed(1)}
                                %
                              </Badge>
                            </HStack>
                          </Box>

                          <Box
                            p={4}
                            border='1px solid'
                            borderColor='gray.200'
                            borderRadius='md'
                          >
                            <Text fontSize='sm' fontWeight='medium' mb={2}>
                              Generated Graph
                            </Text>
                            <Box
                              h='150px'
                              bg='gray.100'
                              borderRadius='md'
                              display='flex'
                              alignItems='center'
                              justifyContent='center'
                            >
                              <Text color='gray.500'>
                                [Forecast Visualization]
                              </Text>
                            </Box>
                          </Box>

                          <HStack>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                exportResults(universalResults, 'Forecast')
                              }
                            >
                              <FiDownload size={14} />
                              Export
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                shareResults(universalResults, 'Forecast')
                              }
                            >
                              <FiShare size={14} />
                              Share
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <Box p={8} textAlign='center' color='gray.500'>
                          <Text>Run forecast to see results</Text>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </VStack>
              </Tabs.Content>

              {/* Trigger Event Finder */}
              <Tabs.Content value='trigger'>
                <VStack gap={6} align='stretch'>
                  <Box>
                    <Heading as='h3' size='md' mb={4}>
                      Trigger Event Finder
                    </Heading>
                    <Text color='gray.600' mb={4}>
                      Find inflection points in time series and identify
                      possible trigger events.
                    </Text>
                  </Box>

                  <Grid templateColumns='1fr 1fr' gap={6}>
                    <VStack gap={4} align='stretch'>
                      <Box>
                        <Text fontWeight='medium' mb={2}>
                          Select Time Series
                        </Text>
                        <Box
                          border='1px solid'
                          borderColor='gray.200'
                          borderRadius='md'
                          p={2}
                        >
                          <Text fontSize='sm' color='gray.500' mb={2}>
                            {triggerTimeSeries
                              ? allTimeSeries.find(
                                  (ts) => ts.fsid === triggerTimeSeries
                                )?.name || 'Unknown'
                              : 'Choose a time series...'}
                          </Text>
                          <VStack
                            gap={1}
                            align='stretch'
                            maxH='120px'
                            overflowY='auto'
                          >
                            {allTimeSeries.map((ts) => (
                              <Button
                                key={ts.fsid}
                                variant={
                                  triggerTimeSeries === ts.fsid
                                    ? 'solid'
                                    : 'ghost'
                                }
                                size='sm'
                                onClick={() => setTriggerTimeSeries(ts.fsid)}
                                justifyContent='flex-start'
                              >
                                <VStack gap={1} align='start'>
                                  <Text fontSize='sm'>{ts.name}</Text>
                                  <Text fontSize='xs' color='gray.500'>
                                    {ts.subjectName}
                                  </Text>
                                </VStack>
                              </Button>
                            ))}
                          </VStack>
                        </Box>
                      </Box>

                      <Button
                        colorScheme='orange'
                        onClick={runTriggerAnalysis}
                        loading={triggerLoading}
                        disabled={!triggerTimeSeries}
                      >
                        <FiTarget size={16} />
                        Find Triggers
                      </Button>
                    </VStack>

                    <Box>
                      <Text fontWeight='medium' mb={2}>
                        Results
                      </Text>
                      {triggerResults ? (
                        <VStack gap={4} align='stretch'>
                          <Box p={4} bg='gray.50' borderRadius='md'>
                            <Text fontSize='sm' fontWeight='medium' mb={2}>
                              Inflection Points Found
                            </Text>
                            {triggerResults.inflectionPoints.map(
                              (
                                point: {
                                  date: string;
                                  significance: number;
                                  changeDirection: 'increase' | 'decrease';
                                },
                                index: number
                              ) => (
                                <HStack
                                  key={index}
                                  justify='space-between'
                                  mb={1}
                                >
                                  <Text fontSize='sm'>{point.date}</Text>
                                  <Badge
                                    colorScheme={
                                      point.changeDirection === 'increase'
                                        ? 'green'
                                        : 'red'
                                    }
                                  >
                                    {point.changeDirection}
                                  </Badge>
                                </HStack>
                              )
                            )}
                          </Box>

                          <Box
                            p={4}
                            border='1px solid'
                            borderColor='gray.200'
                            borderRadius='md'
                          >
                            <Text fontSize='sm' fontWeight='medium' mb={2}>
                              Possible Triggers
                            </Text>
                            {triggerResults.possibleTriggers.map(
                              (
                                trigger: {
                                  event: string;
                                  date: string;
                                  relevance: number;
                                },
                                index: number
                              ) => (
                                <VStack
                                  key={index}
                                  gap={1}
                                  align='start'
                                  mb={2}
                                >
                                  <Text fontSize='sm' fontWeight='medium'>
                                    {trigger.event}
                                  </Text>
                                  <HStack>
                                    <Text fontSize='xs' color='gray.500'>
                                      {trigger.date}
                                    </Text>
                                    <Badge size='sm' colorScheme='blue'>
                                      {(trigger.relevance * 100).toFixed(0)}%
                                      match
                                    </Badge>
                                  </HStack>
                                </VStack>
                              )
                            )}
                          </Box>

                          <HStack>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                exportResults(
                                  triggerResults,
                                  'Trigger Analysis'
                                )
                              }
                            >
                              <FiDownload size={14} />
                              Export
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                shareResults(triggerResults, 'Trigger Analysis')
                              }
                            >
                              <FiShare size={14} />
                              Share
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <Box p={8} textAlign='center' color='gray.500'>
                          <Text>Run analysis to see results</Text>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </VStack>
              </Tabs.Content>

              {/* Correlation Finder */}
              <Tabs.Content value='correlation'>
                <VStack gap={6} align='stretch'>
                  <Box>
                    <Heading as='h3' size='md' mb={4}>
                      Correlation Finder
                    </Heading>
                    <Text color='gray.600' mb={4}>
                      Analyze correlation between two time series and generate
                      statistical insights.
                    </Text>
                  </Box>

                  <Grid templateColumns='1fr 1fr' gap={6}>
                    <VStack gap={4} align='stretch'>
                      <Box>
                        <Text fontWeight='medium' mb={2}>
                          First Time Series
                        </Text>
                        <Box
                          border='1px solid'
                          borderColor='gray.200'
                          borderRadius='md'
                          p={2}
                        >
                          <Text fontSize='sm' color='gray.500' mb={2}>
                            {correlationSeries1
                              ? allTimeSeries.find(
                                  (ts) => ts.fsid === correlationSeries1
                                )?.name || 'Unknown'
                              : 'Choose first series...'}
                          </Text>
                          <VStack
                            gap={1}
                            align='stretch'
                            maxH='120px'
                            overflowY='auto'
                          >
                            {allTimeSeries.map((ts) => (
                              <Button
                                key={ts.fsid}
                                variant={
                                  correlationSeries1 === ts.fsid
                                    ? 'solid'
                                    : 'ghost'
                                }
                                size='sm'
                                onClick={() => setCorrelationSeries1(ts.fsid)}
                                justifyContent='flex-start'
                              >
                                <VStack gap={1} align='start'>
                                  <Text fontSize='sm'>{ts.name}</Text>
                                  <Text fontSize='xs' color='gray.500'>
                                    {ts.subjectName}
                                  </Text>
                                </VStack>
                              </Button>
                            ))}
                          </VStack>
                        </Box>
                      </Box>

                      <Box>
                        <Text fontWeight='medium' mb={2}>
                          Second Time Series
                        </Text>
                        <Box
                          border='1px solid'
                          borderColor='gray.200'
                          borderRadius='md'
                          p={2}
                        >
                          <Text fontSize='sm' color='gray.500' mb={2}>
                            {correlationSeries2
                              ? allTimeSeries.find(
                                  (ts) => ts.fsid === correlationSeries2
                                )?.name || 'Unknown'
                              : 'Choose second series...'}
                          </Text>
                          <VStack
                            gap={1}
                            align='stretch'
                            maxH='120px'
                            overflowY='auto'
                          >
                            {allTimeSeries
                              .filter((ts) => ts.fsid !== correlationSeries1)
                              .map((ts) => (
                                <Button
                                  key={ts.fsid}
                                  variant={
                                    correlationSeries2 === ts.fsid
                                      ? 'solid'
                                      : 'ghost'
                                  }
                                  size='sm'
                                  onClick={() => setCorrelationSeries2(ts.fsid)}
                                  justifyContent='flex-start'
                                >
                                  <VStack gap={1} align='start'>
                                    <Text fontSize='sm'>{ts.name}</Text>
                                    <Text fontSize='xs' color='gray.500'>
                                      {ts.subjectName}
                                    </Text>
                                  </VStack>
                                </Button>
                              ))}
                          </VStack>
                        </Box>
                      </Box>

                      <Button
                        colorScheme='purple'
                        onClick={runCorrelationAnalysis}
                        loading={correlationLoading}
                        disabled={!correlationSeries1 || !correlationSeries2}
                      >
                        <FiTrendingUp size={16} />
                        Analyze Correlation
                      </Button>
                    </VStack>

                    <Box>
                      <Text fontWeight='medium' mb={2}>
                        Results
                      </Text>
                      {correlationResults ? (
                        <VStack gap={4} align='stretch'>
                          <Box p={4} bg='gray.50' borderRadius='md'>
                            <VStack gap={2} align='stretch'>
                              <HStack justify='space-between'>
                                <Text fontSize='sm' fontWeight='medium'>
                                  Correlation
                                </Text>
                                <Badge
                                  colorScheme={
                                    Math.abs(correlationResults.correlation) >
                                    0.7
                                      ? 'green'
                                      : 'orange'
                                  }
                                >
                                  {correlationResults.correlation.toFixed(3)}
                                </Badge>
                              </HStack>
                              <HStack justify='space-between'>
                                <Text fontSize='sm' fontWeight='medium'>
                                  P-Value
                                </Text>
                                <Text fontSize='sm'>
                                  {correlationResults.pValue.toFixed(3)}
                                </Text>
                              </HStack>
                              <HStack justify='space-between'>
                                <Text fontSize='sm' fontWeight='medium'>
                                  R²
                                </Text>
                                <Text fontSize='sm'>
                                  {correlationResults.r2.toFixed(3)}
                                </Text>
                              </HStack>
                              <Text
                                fontSize='sm'
                                color='gray.600'
                                fontStyle='italic'
                              >
                                {correlationResults.interpretation}
                              </Text>
                            </VStack>
                          </Box>

                          <Box
                            p={4}
                            border='1px solid'
                            borderColor='gray.200'
                            borderRadius='md'
                          >
                            <Text fontSize='sm' fontWeight='medium' mb={2}>
                              Correlation Graph
                            </Text>
                            <Box
                              h='150px'
                              bg='gray.100'
                              borderRadius='md'
                              display='flex'
                              alignItems='center'
                              justifyContent='center'
                            >
                              <Text color='gray.500'>
                                [Correlation Visualization]
                              </Text>
                            </Box>
                          </Box>

                          <HStack>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                exportResults(
                                  correlationResults,
                                  'Correlation Analysis'
                                )
                              }
                            >
                              <FiDownload size={14} />
                              Export
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                shareResults(
                                  correlationResults,
                                  'Correlation Analysis'
                                )
                              }
                            >
                              <FiShare size={14} />
                              Share
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <Box p={8} textAlign='center' color='gray.500'>
                          <Text>Run analysis to see results</Text>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </VStack>
              </Tabs.Content>

              {/* Pattern Matching */}
              <Tabs.Content value='pattern'>
                <VStack gap={6} align='stretch'>
                  <Box>
                    <Heading as='h3' size='md' mb={4}>
                      Pattern Matching
                    </Heading>
                    <Text color='gray.600' mb={4}>
                      Find time series with similar patterns to your selected
                      data.
                    </Text>
                  </Box>

                  <Grid templateColumns='1fr 1fr' gap={6}>
                    <VStack gap={4} align='stretch'>
                      <Box>
                        <Text fontWeight='medium' mb={2}>
                          Select Time Series
                        </Text>
                        <Box
                          border='1px solid'
                          borderColor='gray.200'
                          borderRadius='md'
                          p={2}
                        >
                          <Text fontSize='sm' color='gray.500' mb={2}>
                            {patternTimeSeries
                              ? allTimeSeries.find(
                                  (ts) => ts.fsid === patternTimeSeries
                                )?.name || 'Unknown'
                              : 'Choose a time series...'}
                          </Text>
                          <VStack
                            gap={1}
                            align='stretch'
                            maxH='120px'
                            overflowY='auto'
                          >
                            {allTimeSeries.map((ts) => (
                              <Button
                                key={ts.fsid}
                                variant={
                                  patternTimeSeries === ts.fsid
                                    ? 'solid'
                                    : 'ghost'
                                }
                                size='sm'
                                onClick={() => setPatternTimeSeries(ts.fsid)}
                                justifyContent='flex-start'
                              >
                                <VStack gap={1} align='start'>
                                  <Text fontSize='sm'>{ts.name}</Text>
                                  <Text fontSize='xs' color='gray.500'>
                                    {ts.subjectName}
                                  </Text>
                                </VStack>
                              </Button>
                            ))}
                          </VStack>
                        </Box>
                      </Box>

                      <Button
                        colorScheme='teal'
                        onClick={runPatternMatching}
                        loading={patternLoading}
                        disabled={!patternTimeSeries}
                      >
                        <FiGitBranch size={16} />
                        Find Patterns
                      </Button>
                    </VStack>

                    <Box>
                      <Text fontWeight='medium' mb={2}>
                        Results
                      </Text>
                      {patternResults ? (
                        <VStack gap={4} align='stretch'>
                          <Box p={4} bg='gray.50' borderRadius='md'>
                            <Text fontSize='sm' fontWeight='medium' mb={2}>
                              Similar Patterns Found
                            </Text>
                            {patternResults.matches.map(
                              (
                                match: {
                                  fsid: string;
                                  name: string;
                                  similarity: number;
                                  subject: string;
                                },
                                index: number
                              ) => (
                                <VStack
                                  key={index}
                                  gap={1}
                                  align='start'
                                  mb={2}
                                  p={2}
                                  border='1px solid'
                                  borderColor='gray.200'
                                  borderRadius='sm'
                                >
                                  <HStack justify='space-between' w='100%'>
                                    <Text fontSize='sm' fontWeight='medium'>
                                      {match.name}
                                    </Text>
                                    <Badge colorScheme='green'>
                                      {(match.similarity * 100).toFixed(0)}%
                                    </Badge>
                                  </HStack>
                                  <Text fontSize='xs' color='gray.500'>
                                    {match.subject}
                                  </Text>
                                </VStack>
                              )
                            )}
                          </Box>

                          <Box
                            p={4}
                            border='1px solid'
                            borderColor='gray.200'
                            borderRadius='md'
                          >
                            <Text fontSize='sm' fontWeight='medium' mb={2}>
                              Pattern Comparison
                            </Text>
                            <Box
                              h='150px'
                              bg='gray.100'
                              borderRadius='md'
                              display='flex'
                              alignItems='center'
                              justifyContent='center'
                            >
                              <Text color='gray.500'>
                                [Pattern Visualization]
                              </Text>
                            </Box>
                          </Box>

                          <HStack>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                exportResults(
                                  patternResults,
                                  'Pattern Analysis'
                                )
                              }
                            >
                              <FiDownload size={14} />
                              Export
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                shareResults(patternResults, 'Pattern Analysis')
                              }
                            >
                              <FiShare size={14} />
                              Share
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <Box p={8} textAlign='center' color='gray.500'>
                          <Text>Run analysis to see results</Text>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </VStack>
              </Tabs.Content>

              {/* Network Forecaster */}
              <Tabs.Content value='network'>
                <VStack gap={6} align='stretch'>
                  <Box>
                    <Heading as='h3' size='md' mb={4}>
                      Network Forecaster
                    </Heading>
                    <Text color='gray.600' mb={4}>
                      Analyze subject relationships and forecast network
                      evolution using graph analysis.
                    </Text>
                  </Box>

                  <Grid templateColumns='1fr 1fr' gap={6}>
                    <VStack gap={4} align='stretch'>
                      <Box>
                        <Text fontWeight='medium' mb={2}>
                          Select Subjects
                        </Text>
                        <VStack
                          gap={2}
                          align='stretch'
                          maxH='200px'
                          overflowY='auto'
                          p={2}
                          border='1px solid'
                          borderColor='gray.200'
                          borderRadius='md'
                        >
                          {subjects.map((subject) => (
                            <Button
                              key={subject.id}
                              variant={
                                selectedSubjects.includes(subject.id)
                                  ? 'solid'
                                  : 'outline'
                              }
                              size='sm'
                              onClick={() => handleSubjectToggle(subject.id)}
                              justifyContent='flex-start'
                            >
                              <VStack gap={1} align='start'>
                                <Text fontSize='sm' fontWeight='medium'>
                                  {subject.name}
                                </Text>
                                <Text fontSize='xs' color='gray.500'>
                                  {subject.timeseries.length} time series
                                </Text>
                              </VStack>
                            </Button>
                          ))}
                        </VStack>
                      </Box>

                      <Button
                        colorScheme='cyan'
                        onClick={runNetworkForecast}
                        loading={networkLoading}
                        disabled={selectedSubjects.length === 0}
                      >
                        <FiShare size={16} />
                        Analyze Network
                      </Button>
                    </VStack>

                    <Box>
                      <Text fontWeight='medium' mb={2}>
                        Results
                      </Text>
                      {networkResults ? (
                        <VStack gap={4} align='stretch'>
                          <Box p={4} bg='gray.50' borderRadius='md'>
                            <Text fontSize='sm' fontWeight='medium' mb={2}>
                              Current Network Stats
                            </Text>
                            <Grid templateColumns='1fr 1fr' gap={2}>
                              <Text fontSize='xs'>
                                Nodes: {networkResults.networkStats.nodes}
                              </Text>
                              <Text fontSize='xs'>
                                Edges: {networkResults.networkStats.edges}
                              </Text>
                              <Text fontSize='xs'>
                                Density: {networkResults.networkStats.density}
                              </Text>
                              <Text fontSize='xs'>
                                Clustering:{' '}
                                {networkResults.networkStats.clustering}
                              </Text>
                            </Grid>
                            <Text fontSize='xs' mt={2}>
                              Central Node:{' '}
                              <Badge size='sm'>
                                {networkResults.networkStats.centrality}
                              </Badge>
                            </Text>
                          </Box>

                          <Box p={4} bg='blue.50' borderRadius='md'>
                            <Text fontSize='sm' fontWeight='medium' mb={2}>
                              Network Forecast
                            </Text>
                            <VStack gap={1} align='stretch'>
                              <HStack justify='space-between'>
                                <Text fontSize='xs'>Predicted Nodes</Text>
                                <Text fontSize='xs' fontWeight='medium'>
                                  {networkResults.forecast.predictedNodes}
                                </Text>
                              </HStack>
                              <HStack justify='space-between'>
                                <Text fontSize='xs'>Predicted Edges</Text>
                                <Text fontSize='xs' fontWeight='medium'>
                                  {networkResults.forecast.predictedEdges}
                                </Text>
                              </HStack>
                              <HStack justify='space-between'>
                                <Text fontSize='xs'>Emerging Connections</Text>
                                <Badge size='sm' colorScheme='green'>
                                  {networkResults.forecast.emergingConnections}
                                </Badge>
                              </HStack>
                              <HStack justify='space-between'>
                                <Text fontSize='xs'>Confidence</Text>
                                <Badge size='sm' colorScheme='blue'>
                                  {(
                                    networkResults.forecast.confidence * 100
                                  ).toFixed(0)}
                                  %
                                </Badge>
                              </HStack>
                            </VStack>
                          </Box>

                          <Box
                            p={4}
                            border='1px solid'
                            borderColor='gray.200'
                            borderRadius='md'
                          >
                            <Text fontSize='sm' fontWeight='medium' mb={2}>
                              Network Visualization
                            </Text>
                            <Box
                              h='150px'
                              bg='gray.100'
                              borderRadius='md'
                              display='flex'
                              alignItems='center'
                              justifyContent='center'
                            >
                              <Text color='gray.500'>
                                [Network Graph Visualization]
                              </Text>
                            </Box>
                          </Box>

                          <HStack>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                exportResults(
                                  networkResults,
                                  'Network Analysis'
                                )
                              }
                            >
                              <FiDownload size={14} />
                              Export
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                shareResults(networkResults, 'Network Analysis')
                              }
                            >
                              <FiShare size={14} />
                              Share
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <Box p={8} textAlign='center' color='gray.500'>
                          <Text>Run analysis to see results</Text>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </VStack>
              </Tabs.Content>
            </Tabs.Root>
          </Card.Body>
        </Card.Root>

        {/* Quick Actions Card */}
        <Card.Root>
          <Card.Body p={6}>
            <Heading as='h3' size='md' mb={4}>
              Quick Actions
            </Heading>
            <HStack gap={4} wrap='wrap'>
              <Button size='sm' variant='outline' colorScheme='gray'>
                <FiRefreshCw size={14} />
                Refresh Data
              </Button>
              <Button size='sm' variant='outline' colorScheme='gray'>
                <FiDownload size={14} />
                Export All Results
              </Button>
              <Button size='sm' variant='outline' colorScheme='gray'>
                <FiShare size={14} />
                Share Lab Forecasts
              </Button>
            </HStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default Forecast;
