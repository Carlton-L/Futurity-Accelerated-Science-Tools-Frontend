import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Button,
  HStack,
  Flex,
  Card,
  Heading,
  Stat,
  Spinner,
  SkeletonText,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import NetworkGraph, {
  type NetworkGraphRef,
} from '../Subject/NetworkGraph/NetworkGraph';

// TypeScript interfaces for the stats data
interface SubjectStats {
  organizations: number;
  press: number;
  patents: number;
  papers: number;
  books: number;
  relatedDocs: number;
}

// Interface for subject data from API
interface SubjectData {
  _id: string;
  ent_name: string;
  ent_fsid: string;
  ent_summary: string;
  indexes?: Array<{
    HR?: number;
    TT?: number;
    WS?: number;
  }>;
}

// Map stat types to network graph node types for highlighting
const networkNodeTypeMapping: { [key: string]: string } = {
  organizations: 'Organization',
  press: 'Press',
  patents: 'Patent',
  papers: 'Paper',
  books: 'Book',
};

const FeaturedSubjectSection: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const networkGraphRef = useRef<NetworkGraphRef>(null);

  // State for stats and loading
  const [stats, setStats] = useState<SubjectStats | null>(null);
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingSubject, setLoadingSubject] = useState(true);
  const [hoveredStatType, setHoveredStatType] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Hard-coded subject for the featured section
  const featuredSubject = 'digital_twin';
  const featuredSubjectDisplay = 'Digital Twin';

  // Get the correct background color from theme
  const appBgColor = theme.isDark ? '#111111' : '#FAFAFA';

  // Fetch subject data for summary and details
  useEffect(() => {
    const fetchSubjectData = async () => {
      try {
        setLoadingSubject(true);
        const response = await fetch(
          `https://tools.futurity.science/api/subject/view?slug=${featuredSubject}`,
          {
            headers: {
              Authorization: 'Bearer xE8C9T4QGRcbnUoZPrjkyI5mOVjKJAiJ',
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data: SubjectData = await response.json();
          setSubjectData(data);
        }
      } catch (error) {
        console.error('Failed to fetch subject data:', error);
      } finally {
        setLoadingSubject(false);
      }
    };

    fetchSubjectData();
  }, []);

  // Fetch stats for the featured subject
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const response = await fetch(
          `https://tools.futurity.science/api/subject/get-counts?slug=${featuredSubject}`,
          {
            headers: {
              Authorization: 'Bearer xE8C9T4QGRcbnUoZPrjkyI5mOVjKJAiJ',
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStats({
            organizations: data.counts.Organization,
            press: data.counts.Press,
            patents: data.counts.Patent,
            papers: data.counts.Paper,
            books: data.counts.Book,
            relatedDocs: data.counts.Documents,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats for featured subject:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Handle stat card interactions
  const handleStatCardHover = (statType: string | null) => {
    setHoveredStatType(statType);

    // Highlight nodes in network graph if there's a corresponding node type
    if (
      statType &&
      networkNodeTypeMapping[statType] &&
      networkGraphRef.current
    ) {
      networkGraphRef.current.highlightNodesByType(
        networkNodeTypeMapping[statType]
      );
    } else if (networkGraphRef.current) {
      networkGraphRef.current.highlightNodesByType(null);
    }
  };

  const handleStatCardClick = () => {
    // Navigate to subject page - the subject page will handle scrolling to sections
    navigate(`/subject/${featuredSubject}`);
  };

  const handleViewSubject = () => {
    navigate(`/subject/${featuredSubject}`);
  };

  // Function to truncate text to approximately 3 lines
  const getTruncatedSummary = (
    text: string,
    maxLength: number = 200
  ): string => {
    if (text.length <= maxLength) return text;
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 0
      ? truncated.substring(0, lastSpace) + '...'
      : truncated + '...';
  };

  const shouldShowExpandButton = (text: string): boolean => {
    return text && text.length > 200;
  };

  return (
    <Box>
      <Box mb='6'>
        <HStack justify='space-between' align='center' mb='4'>
          <Box flex='1' mr='4'>
            <Text
              fontSize='2xl'
              fontWeight='bold'
              fontFamily='heading'
              color='fg'
              mb='2'
            >
              Featured Subject: {featuredSubjectDisplay}
            </Text>

            {/* Subject Summary with loading state */}
            {loadingSubject ? (
              <Box>
                <SkeletonText noOfLines={3} skeletonHeight='4' />
              </Box>
            ) : subjectData?.ent_summary ? (
              <Box>
                <Text
                  color='fg.secondary'
                  fontSize='md'
                  lineHeight='1.6'
                  mb={shouldShowExpandButton(subjectData.ent_summary) ? 2 : 0}
                >
                  {isExpanded
                    ? subjectData.ent_summary
                    : getTruncatedSummary(subjectData.ent_summary)}
                </Text>

                {shouldShowExpandButton(subjectData.ent_summary) && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setIsExpanded(!isExpanded)}
                    color='brand'
                    p='0'
                    minH='auto'
                    h='auto'
                    fontWeight='medium'
                    _hover={{
                      color: 'brand.hover',
                      bg: 'transparent',
                    }}
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </Button>
                )}
              </Box>
            ) : (
              <Text color='fg.secondary' fontSize='md'>
                {/* Show loading or error state instead of hardcoded text */}
                {loadingSubject
                  ? 'Loading subject details...'
                  : 'Subject summary unavailable'}
              </Text>
            )}
          </Box>

          <HStack gap='3' flexShrink={0}>
            <Button variant='solid' size='md' onClick={handleViewSubject}>
              View {featuredSubjectDisplay}
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Network Graph Container */}
      <Box
        height='500px'
        borderRadius='md'
        overflow='hidden'
        border='1px solid'
        borderColor='border.emphasized'
        bg='bg.canvas'
        position='relative'
      >
        <NetworkGraph
          ref={networkGraphRef}
          params={{ subject: featuredSubject }}
          backgroundColor={appBgColor}
          hoveredNodeType={
            hoveredStatType
              ? networkNodeTypeMapping[hoveredStatType]
              : undefined
          }
        />
      </Box>

      {/* Stats Cards - Single Row */}
      <Box mt='6'>
        {loadingStats ? (
          <Flex gap={4} wrap='nowrap' overflowX='auto'>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card.Root
                key={i}
                variant='outline'
                size='sm'
                minHeight='80px'
                minWidth='120px'
                flex='1'
              >
                <Card.Body
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                >
                  <Spinner size='sm' />
                </Card.Body>
              </Card.Root>
            ))}
          </Flex>
        ) : stats ? (
          <Flex gap={4} wrap='nowrap' overflowX='auto'>
            {[
              {
                key: 'organizations',
                label: 'Organizations',
                value: stats.organizations,
              },
              { key: 'press', label: 'Press', value: stats.press },
              {
                key: 'patents',
                label: 'Patents',
                value: stats.patents,
              },
              {
                key: 'papers',
                label: 'Papers',
                value: stats.papers,
              },
              { key: 'books', label: 'Books', value: stats.books },
              {
                key: 'relatedDocs',
                label: 'Related Docs',
                value: stats.relatedDocs,
              },
            ].map(({ key, label, value }) => (
              <Card.Root
                key={key}
                variant='outline'
                size='sm'
                minHeight='80px'
                minWidth='120px'
                flex='1'
                cursor='pointer'
                transition='all 0.2s ease'
                bg={hoveredStatType === key ? 'fg' : 'bg.canvas'}
                color={hoveredStatType === key ? 'bg.canvas' : 'fg'}
                transform={
                  hoveredStatType === key ? 'translateY(-2px)' : 'none'
                }
                boxShadow={hoveredStatType === key ? 'lg' : 'none'}
                onMouseEnter={() => handleStatCardHover(key)}
                onMouseLeave={() => handleStatCardHover(null)}
                onClick={() => handleStatCardClick()}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
              >
                <Card.Body
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                >
                  <Box textAlign='center' width='100%'>
                    <Stat.Root>
                      <Stat.Label>
                        <Heading
                          as='h4'
                          size='sm'
                          mb={2}
                          color='inherit'
                          transition='color 0.2s ease'
                        >
                          {label}
                        </Heading>
                      </Stat.Label>
                      <Stat.ValueText
                        fontSize='xl'
                        fontWeight='bold'
                        color='inherit'
                        transition='color 0.2s ease'
                      >
                        {value?.toLocaleString()}
                      </Stat.ValueText>
                    </Stat.Root>
                  </Box>
                </Card.Body>
              </Card.Root>
            ))}
          </Flex>
        ) : (
          <Text color='fg.muted' fontSize='sm'>
            Stats unavailable
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default FeaturedSubjectSection;
