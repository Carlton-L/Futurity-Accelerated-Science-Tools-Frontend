import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Button,
  HStack,
  SimpleGrid,
  Card,
  Heading,
  Stat,
  Spinner,
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
  const [loadingStats, setLoadingStats] = useState(true);
  const [hoveredStatType, setHoveredStatType] = useState<string | null>(null);

  // Hard-coded subject for the featured section
  const featuredSubject = 'computer-vision';
  const featuredSubjectDisplay = 'Computer Vision';

  // Get the correct background color from theme
  const appBgColor = theme.isDark ? '#111111' : '#FAFAFA';

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

  const handleStatCardClick = (statType: string) => {
    // Navigate to subject page - the subject page will handle scrolling to sections
    navigate(`/subject/${featuredSubject}`);
  };

  const handleViewSubject = () => {
    navigate(`/subject/${featuredSubject}`);
  };

  const handleExploreMore = () => {
    // Navigate to a subjects listing page or search page
    // For now, we'll navigate to the whiteboard or a subjects page
    navigate('/whiteboard');
  };

  return (
    <Box>
      <Box mb='6'>
        <HStack justify='space-between' align='center' mb='4'>
          <Box>
            <Text
              fontSize='2xl'
              fontWeight='bold'
              fontFamily='heading'
              color='fg'
              mb='2'
            >
              Featured Subject: {featuredSubjectDisplay}
            </Text>
            <Text color='fg.secondary' fontSize='md'>
              Explore the interconnected world of computer vision research,
              organizations, and innovations
            </Text>
          </Box>
          <HStack gap='3'>
            <Button variant='outline' size='md' onClick={handleExploreMore}>
              Explore More Subjects
            </Button>
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

      {/* Stats Cards */}
      <Box>
        <Text fontSize='lg' fontWeight='medium' color='fg' mb='4'>
          {featuredSubjectDisplay} by the Numbers
        </Text>

        {loadingStats ? (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={4}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card.Root key={i} variant='outline' size='sm' minHeight='80px'>
                <Card.Body
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                >
                  <Spinner size='sm' />
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        ) : stats ? (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={4}>
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
                onClick={() => handleStatCardClick(key)}
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
          </SimpleGrid>
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
