import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Link,
} from '@chakra-ui/react';
import { FiExternalLink } from 'react-icons/fi';
import CardScroller from '../../components/shared/CardScroller';
import TrendsChart from './TrendsChart';
import ForecastChart from './ForecastChart';
import { usePage } from '../../context/PageContext';

// TypeScript interfaces
// TODO: Move interfaces to separate types file when project grows
interface RelatedSubject {
  id: string;
  name: string;
  horizonRanking: number;
  slug: string; // URL-friendly identifier for routing
}

interface RelatedAnalysis {
  id: string;
  labId: string;
  title: string;
  description: string;
  status: 'Ready' | 'Coming soon...';
  imageUrl: string;
  createdAt: string; // ISO date string for sorting
}

interface FinancialMetrics {
  stockPrice: number;
  marketCap: number; // in billions
  revenue: number; // in billions
  ebitda: number; // in billions
}

interface Organization {
  id: string; // Added id field for PageContext
  name: string;
  description: string;
  sector: string;
  industry: string;
  country: string;
  city: string;
  employees: number;
  website: string;
  financialMetrics: FinancialMetrics;
  relatedSubjects: RelatedSubject[];
  relatedAnalyses: RelatedAnalysis[];
}

// TODO: Replace with actual financial chart implementation
const FinancialChart: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
}> = ({ title, value, subtitle }) => {
  return (
    <Card.Root>
      <Card.Body p={4}>
        <VStack gap={3} align='stretch'>
          <Heading as='h3' size='md'>
            {title}
          </Heading>
          <Box
            height='200px'
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
                {title} Chart
              </Text>
              <Text color='gray.400' fontSize='sm'>
                D3 Chart Placeholder
              </Text>
            </VStack>
          </Box>
          <VStack gap={1}>
            <Text fontSize='2xl' fontWeight='bold' color='blue.500'>
              {value}
            </Text>
            {subtitle && (
              <Text fontSize='sm' color='gray.600'>
                {subtitle}
              </Text>
            )}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

const Organization: React.FC = () => {
  const { setPageContext, clearPageContext } = usePage();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Related subjects state
  const [sortMethod, setSortMethod] = useState<string>('horizon-high');
  const [filterText, setFilterText] = useState<string>('');

  // Related analyses state
  const [analysisSortMethod, setAnalysisSortMethod] =
    useState<string>('most-recent');
  const [analysisFilterText, setAnalysisFilterText] = useState<string>('');

  // Memoize the page context to prevent infinite re-renders
  const organizationPageContext = useMemo(() => {
    if (!organization) return null;

    return {
      pageType: 'organization' as const,
      pageTitle: `Organization: ${organization.name}`,
      organization: {
        id: organization.id,
        name: organization.name,
        title: organization.name,
      },
    };
  }, [organization]);

  // Set up page context when organization data is loaded
  useEffect(() => {
    if (organizationPageContext) {
      setPageContext(organizationPageContext);
    }

    return () => clearPageContext();
  }, [setPageContext, clearPageContext, organizationPageContext]);

  // TODO: Replace with actual data fetching from API
  useEffect(() => {
    const fetchOrganizationData = async (): Promise<void> => {
      // TODO: Replace setTimeout with actual API call
      setTimeout(() => {
        // TODO: Replace mock data with actual API response
        setOrganization({
          id: 'apple-inc-001', // Added ID for PageContext
          name: 'Apple Inc.',
          description:
            'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, a line of smartphones; Mac, a line of personal computers; iPad, a line of multi-purpose tablets; and wearables, home, and accessories comprising AirPods, Apple TV, Apple Watch, Beats products, and HomePod. It also provides AppleCare support and cloud services; and operates various platforms, including the App Store that allow customers to discover and download applications and digital content, such as books, music, video, games, and podcasts, as well as advertising services include third-party licensing arrangements and its own advertising platforms. In addition, the company offers various subscription-based services, such as Apple Arcade, a game subscription service; Apple Fitness+, a personalized fitness service; Apple Music, which offers users a curated listening experience with on-demand radio stations; Apple News+, a subscription news and magazine service; Apple TV+, which offers exclusive original content; Apple Card, a co-branded credit card; and Apple Pay, a cashless payment service, as well as licenses its intellectual property. The company serves consumers, and small and mid-sized businesses; and the education, enterprise, and government markets. It distributes third-party applications for its products through the App Store. The company also sells its products through its retail and online stores, and direct sales force; and third-party cellular network carriers, wholesalers, retailers, and resellers. Apple Inc. was founded in 1976 and is headquartered in Cupertino, California.',
          sector: 'Technology',
          industry: 'Consumer Electronics',
          country: 'United States',
          city: 'Cupertino',
          employees: 164000,
          website: 'https://www.apple.com',
          financialMetrics: {
            stockPrice: 192.53,
            marketCap: 2980.5,
            revenue: 383.3,
            ebitda: 123.7,
          },
          relatedSubjects: [
            {
              id: '1',
              name: 'Artificial Intelligence',
              horizonRanking: 0.85,
              slug: 'artificial-intelligence',
            },
            {
              id: '2',
              name: 'Machine Learning',
              horizonRanking: 0.95,
              slug: 'machine-learning',
            },
            {
              id: '3',
              name: 'Computer Vision',
              horizonRanking: 0.88,
              slug: 'computer-vision',
            },
            {
              id: '4',
              name: 'Neural Networks',
              horizonRanking: 0.91,
              slug: 'neural-networks',
            },
            {
              id: '5',
              name: 'Mobile Computing',
              horizonRanking: 0.78,
              slug: 'mobile-computing',
            },
            {
              id: '6',
              name: 'Wearable Technology',
              horizonRanking: 0.82,
              slug: 'wearable-technology',
            },
            {
              id: '7',
              name: 'Augmented Reality',
              horizonRanking: 0.76,
              slug: 'augmented-reality',
            },
            {
              id: '8',
              name: 'Cloud Computing',
              horizonRanking: 0.89,
              slug: 'cloud-computing',
            },
          ],
          relatedAnalyses: [
            {
              id: 'analysis-1',
              labId: 'lab-1',
              title: "Apple's AI Strategy in Consumer Electronics",
              description:
                "Analysis of Apple's artificial intelligence initiatives and their impact on the consumer electronics market",
              status: 'Ready',
              imageUrl:
                'https://via.placeholder.com/100x100/007AFF/FFFFFF?text=Apple',
              createdAt: '2024-03-15T10:30:00Z',
            },
            {
              id: 'analysis-2',
              labId: 'lab-2',
              title: 'iPhone Market Dominance and Innovation',
              description:
                "Comprehensive study of iPhone's market position and technological innovations driving consumer adoption",
              status: 'Ready',
              imageUrl:
                'https://via.placeholder.com/100x100/FF3B30/FFFFFF?text=iPhone',
              createdAt: '2024-02-28T14:45:00Z',
            },
            {
              id: 'analysis-3',
              labId: 'lab-1',
              title: 'Apple Services Ecosystem Growth',
              description:
                "Examination of Apple's services revenue growth and ecosystem lock-in effects",
              status: 'Coming soon...',
              imageUrl:
                'https://via.placeholder.com/100x100/34C759/FFFFFF?text=Svc',
              createdAt: '2024-01-20T09:15:00Z',
            },
          ],
        } as Organization);
        setLoading(false);
      }, 1000);
    };

    fetchOrganizationData();
  }, []);

  const handleSubjectClick = (slug: string): void => {
    // TODO: Replace with actual navigation using useNavigate hook
    // Example: navigate(`/subject/${slug}`);
    console.log(`Navigate to: /subject/${slug}`);
  };

  const handleAnalysisClick = (labId: string, analysisId: string): void => {
    // TODO: Replace with actual navigation using useNavigate hook
    // Example: navigate(`/lab/${labId}/analysis/${analysisId}`);
    console.log(`Navigate to: /lab/${labId}/analysis/${analysisId}`);
  };

  // Filter and sort related analyses
  const getFilteredAndSortedAnalyses = (): RelatedAnalysis[] => {
    if (!organization?.relatedAnalyses) return [];

    // Filter by search text
    const filtered = organization.relatedAnalyses.filter(
      (analysis) =>
        analysis.title
          .toLowerCase()
          .includes(analysisFilterText.toLowerCase()) ||
        analysis.description
          .toLowerCase()
          .includes(analysisFilterText.toLowerCase())
    );

    // Sort based on selected method
    switch (analysisSortMethod) {
      case 'most-recent':
        return filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'a-z':
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return filtered.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return filtered;
    }
  };

  // Filter and sort related subjects
  const getFilteredAndSortedSubjects = (): RelatedSubject[] => {
    if (!organization?.relatedSubjects) return [];

    // Filter by search text
    const filtered = organization.relatedSubjects.filter((relatedSubject) =>
      relatedSubject.name.toLowerCase().includes(filterText.toLowerCase())
    );

    // Sort based on selected method
    switch (sortMethod) {
      case 'horizon-high':
        return filtered.sort((a, b) => b.horizonRanking - a.horizonRanking);
      case 'horizon-low':
        return filtered.sort((a, b) => a.horizonRanking - b.horizonRanking);
      case 'a-z':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'z-a':
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return filtered;
    }
  };

  // TODO: Add error handling for failed API calls
  if (loading || !organization) {
    return (
      <Box p={6}>
        {/* TODO: Replace with proper loading component/skeleton */}
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg='gray.50' minHeight='calc(100vh - 64px)'>
      {/* Main Organization Card */}
      <Card.Root width='100%' mb={6}>
        <Card.Body p={6}>
          <Flex justify='space-between' align='flex-start' mb={4}>
            <Heading as='h1' size='xl' flex='1' mr={4}>
              {organization.name}
            </Heading>
          </Flex>
          <Text color='gray.600' lineHeight='1.6' mb={4}>
            {organization.description}
          </Text>

          {/* Organization Details */}
          <SimpleGrid columns={{ base: 2, md: 3 }} gap={4} mt={4}>
            <Box>
              <Text fontSize='sm' fontWeight='medium' color='gray.700'>
                Sector
              </Text>
              <Text fontSize='sm' color='gray.600'>
                {organization.sector}
              </Text>
            </Box>
            <Box>
              <Text fontSize='sm' fontWeight='medium' color='gray.700'>
                Industry
              </Text>
              <Text fontSize='sm' color='gray.600'>
                {organization.industry}
              </Text>
            </Box>
            <Box>
              <Text fontSize='sm' fontWeight='medium' color='gray.700'>
                Country
              </Text>
              <Text fontSize='sm' color='gray.600'>
                {organization.country}
              </Text>
            </Box>
            <Box>
              <Text fontSize='sm' fontWeight='medium' color='gray.700'>
                City
              </Text>
              <Text fontSize='sm' color='gray.600'>
                {organization.city}
              </Text>
            </Box>
            <Box>
              <Text fontSize='sm' fontWeight='medium' color='gray.700'>
                Employees
              </Text>
              <Text fontSize='sm' color='gray.600'>
                {organization.employees.toLocaleString()}
              </Text>
            </Box>
            <Box>
              <Text fontSize='sm' fontWeight='medium' color='gray.700'>
                Website
              </Text>
              <Link
                href={organization.website}
                target='_blank'
                color='blue.600'
                fontSize='sm'
                display='flex'
                alignItems='center'
                gap={1}
              >
                {organization.website.replace('https://', '')}
                <FiExternalLink size={12} />
              </Link>
            </Box>
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      {/* Financial Metrics Charts */}
      <Box mb={6}>
        <Heading as='h2' size='lg' mb={4}>
          Financial Metrics
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
          <FinancialChart
            title='Stock Price'
            value={`$${organization.financialMetrics.stockPrice}`}
            subtitle='Current price per share'
          />
          <FinancialChart
            title='Market Cap'
            value={`$${organization.financialMetrics.marketCap}B`}
            subtitle='Total market value'
          />
          <FinancialChart
            title='Revenue'
            value={`$${organization.financialMetrics.revenue}B`}
            subtitle='Annual revenue'
          />
          <FinancialChart
            title='EBITDA'
            value={`$${organization.financialMetrics.ebitda}B`}
            subtitle='Earnings before interest, taxes, depreciation, and amortization'
          />
        </SimpleGrid>
      </Box>

      {/* Related Subjects and Related Analyses */}
      <HStack gap={6} align='flex-start'>
        {/* Related Subjects Card */}
        <Card.Root flex='1' height='400px'>
          <Card.Body p={6} display='flex' flexDirection='column' height='100%'>
            <VStack gap={4} align='stretch' height='100%'>
              {/* Header */}
              <Heading as='h2' size='lg' flexShrink={0}>
                Related Subjects
              </Heading>

              {/* Controls */}
              <HStack gap={4} align='center' flexShrink={0}>
                <HStack gap={2} align='center'>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='gray.700'
                    whiteSpace='nowrap'
                  >
                    Sort by:
                  </Text>
                  <select
                    value={sortMethod}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setSortMethod(e.target.value)
                    }
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      fontSize: '14px',
                      minWidth: '200px',
                    }}
                  >
                    <option value='horizon-high'>
                      Horizon Rank (High to Low)
                    </option>
                    <option value='horizon-low'>
                      Horizon Rank (Low to High)
                    </option>
                    <option value='a-z'>A-Z</option>
                    <option value='z-a'>Z-A</option>
                  </select>
                </HStack>
                <input
                  placeholder='Filter subjects...'
                  value={filterText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilterText(e.target.value)
                  }
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    flex: '1',
                  }}
                />
              </HStack>

              {/* Divider */}
              <Box height='1px' bg='gray.200' flexShrink={0} />

              {/* Subjects List */}
              <Box
                flex='1'
                overflowY='auto'
                p={2}
                border='1px solid'
                borderColor='gray.100'
                borderRadius='md'
              >
                <Flex wrap='wrap' gap={2}>
                  {getFilteredAndSortedSubjects().map((relatedSubject) => (
                    <Card.Root
                      key={relatedSubject.id}
                      size='sm'
                      variant='outline'
                      cursor='pointer'
                      _hover={{ bg: 'gray.50', borderColor: 'blue.300' }}
                      onClick={() => handleSubjectClick(relatedSubject.slug)}
                      transition='all 0.2s'
                    >
                      <Card.Body p={3}>
                        <HStack gap={2} justify='space-between'>
                          <Text
                            fontSize='sm'
                            fontWeight='medium'
                            color='blue.600'
                          >
                            {relatedSubject.name}
                          </Text>
                          <Box
                            bg='white'
                            color='black'
                            border='1px solid'
                            borderColor='gray.300'
                            fontSize='xs'
                            px={2}
                            py={1}
                            borderRadius='md'
                          >
                            {relatedSubject.horizonRanking.toFixed(2)}
                          </Box>
                        </HStack>
                      </Card.Body>
                    </Card.Root>
                  ))}
                </Flex>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Related Analyses Card */}
        <Card.Root flex='1' height='400px'>
          <Card.Body p={6} display='flex' flexDirection='column' height='100%'>
            <VStack gap={4} align='stretch' height='100%'>
              {/* Header */}
              <Heading as='h2' size='lg' flexShrink={0}>
                Related Analyses
              </Heading>

              {/* Controls */}
              <HStack gap={4} align='center' flexShrink={0}>
                <HStack gap={2} align='center'>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='gray.700'
                    whiteSpace='nowrap'
                  >
                    Sort by:
                  </Text>
                  <select
                    value={analysisSortMethod}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setAnalysisSortMethod(e.target.value)
                    }
                    style={{
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      fontSize: '14px',
                      minWidth: '150px',
                    }}
                  >
                    <option value='most-recent'>Most Recent</option>
                    <option value='oldest'>Oldest</option>
                    <option value='a-z'>A-Z</option>
                    <option value='z-a'>Z-A</option>
                  </select>
                </HStack>
                <input
                  placeholder='Filter analyses...'
                  value={analysisFilterText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAnalysisFilterText(e.target.value)
                  }
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #E2E8F0',
                    fontSize: '14px',
                    flex: '1',
                  }}
                />
              </HStack>

              {/* Divider */}
              <Box height='1px' bg='gray.200' flexShrink={0} />

              {/* Analyses List with CardScroller */}
              <CardScroller height='100%'>
                {getFilteredAndSortedAnalyses().map((analysis) => (
                  <Card.Root
                    key={analysis.id}
                    minWidth='280px'
                    maxWidth='280px'
                    height='100%'
                    variant='outline'
                    cursor='pointer'
                    _hover={{ bg: 'gray.50', borderColor: 'blue.300' }}
                    onClick={() =>
                      handleAnalysisClick(analysis.labId, analysis.id)
                    }
                    transition='all 0.2s'
                  >
                    <Card.Body
                      p={4}
                      height='100%'
                      display='flex'
                      flexDirection='column'
                    >
                      <VStack gap={3} align='stretch' height='100%'>
                        {/* Image and Title Row */}
                        <HStack gap={3} align='flex-start' flexShrink={0}>
                          <Box
                            width='100px'
                            height='100px'
                            borderRadius='md'
                            overflow='hidden'
                            flexShrink={0}
                          >
                            <img
                              src={analysis.imageUrl}
                              alt={analysis.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </Box>
                          <VStack gap={2} align='stretch' flex='1'>
                            <Text
                              fontSize='sm'
                              fontWeight='bold'
                              color='blue.600'
                              lineHeight='1.3'
                            >
                              {analysis.title}
                            </Text>
                            <Box
                              bg={
                                analysis.status === 'Ready'
                                  ? 'green.100'
                                  : 'blue.100'
                              }
                              color={
                                analysis.status === 'Ready'
                                  ? 'green.800'
                                  : 'blue.800'
                              }
                              px={2}
                              py={1}
                              borderRadius='md'
                              fontSize='xs'
                              fontWeight='medium'
                              width='fit-content'
                            >
                              {analysis.status}
                            </Box>
                          </VStack>
                        </HStack>

                        {/* Description */}
                        <Text
                          fontSize='xs'
                          color='gray.600'
                          lineHeight='1.4'
                          overflow='hidden'
                          textOverflow='ellipsis'
                          display='-webkit-box'
                          flex='1'
                          style={{
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {analysis.description}
                        </Text>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                ))}
              </CardScroller>
            </VStack>
          </Card.Body>
        </Card.Root>
      </HStack>

      {/* Trends Chart */}
      <TrendsChart organizationSlug='apple-inc' />

      {/* Forecast Analysis Chart */}
      <ForecastChart organizationSlug='apple-inc' />
    </Box>
  );
};

export default Organization;
