import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Text,
  SimpleGrid,
  Card,
  Badge,
  VStack,
  HStack,
  Image,
  AspectRatio,
  Spinner,
  Input,
  Button,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { analysesService, type Analysis } from '../../services/analysesService';

const FuturityAnalysesDirectory: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);
        const allAnalyses = await analysesService.getAnalyses(token);

        // Sort by status (ready first), then by creation date (newest first)
        const sortedAnalyses = allAnalyses.sort((a, b) => {
          const statusPriority = {
            ready: 4,
            published: 3,
            draft: 2,
            soon: 1,
          };

          const aPriority = statusPriority[a.metadata.status] || 0;
          const bPriority = statusPriority[b.metadata.status] || 0;

          if (aPriority !== bPriority) {
            return bPriority - aPriority;
          }

          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setAnalyses(sortedAnalyses);
        setFilteredAnalyses(sortedAnalyses);
      } catch (err) {
        console.error('Failed to fetch analyses:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load analyses'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [token]);

  // Filter analyses based on search term and status
  useEffect(() => {
    let filtered = analyses;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((analysis) => {
        const displayName = analysesService
          .getDisplayName(analysis)
          .toLowerCase();
        const summary = analysis.metadata.ent_summary?.toLowerCase() || '';
        const tags = analysis.metadata.ent_tags?.toLowerCase() || '';
        const authors = analysesService
          .getAuthorsDisplay(analysis)
          .toLowerCase();

        return (
          displayName.includes(search) ||
          summary.includes(search) ||
          tags.includes(search) ||
          authors.includes(search)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (analysis) => analysis.metadata.status === statusFilter
      );
    }

    setFilteredAnalyses(filtered);
  }, [analyses, searchTerm, statusFilter]);

  const handleViewAnalysis = (analysis: Analysis) => {
    navigate(`/futurity-analysis/${analysis.uniqueID}`);
  };

  const getStatusBadgeVariant = (status: string) => {
    return 'subtle'; // Use subtle for all status badges in Chakra UI v3
  };

  const getUniqueStatuses = () => {
    const statuses = analyses.map((a) => a.metadata.status);
    return Array.from(new Set(statuses));
  };

  if (loading) {
    return (
      <Container maxW='7xl' py='8'>
        <VStack gap='6' align='center' justify='center' minH='60vh'>
          <Spinner size='xl' />
          <Text color='fg.secondary'>Loading analyses...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW='7xl' py='8'>
        <Box
          bg='errorSubtle'
          borderRadius='md'
          p='4'
          border='1px solid'
          borderColor='error'
        >
          <Text fontWeight='bold' color='error' mb='2'>
            Error loading analyses
          </Text>
          <Text color='fg.secondary'>{error}</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW='7xl' py='8'>
      <VStack gap='6' align='stretch'>
        {/* Navigation */}
        <HStack gap='2' fontSize='sm' color='fg.secondary'>
          <Text
            as='button'
            onClick={() => navigate('/')}
            _hover={{ color: 'fg' }}
            cursor='pointer'
          >
            Home
          </Text>
          <Text>/</Text>
          <Text color='fg'>Futurity Analyses</Text>
        </HStack>

        {/* Header */}
        <Box>
          <Text
            fontSize='3xl'
            fontWeight='bold'
            fontFamily='heading'
            color='fg'
            mb='2'
          >
            All Futurity Analyses
          </Text>
          <Text color='fg.secondary' fontSize='lg'>
            Explore our comprehensive collection of research analyses and
            insights
          </Text>
        </Box>

        {/* Filters */}
        <HStack gap='4' wrap='wrap'>
          <Box position='relative' maxW='400px' flex='1'>
            <Input
              placeholder='Search analyses...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>

          <HStack gap='2'>
            <Text fontSize='sm' color='fg.muted'>
              Filter:
            </Text>
            <Box>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--chakra-colors-border-emphasized)',
                  backgroundColor: 'var(--chakra-colors-bg-canvas)',
                  color: 'var(--chakra-colors-fg)',
                }}
              >
                <option value='all'>All Status</option>
                {getUniqueStatuses().map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </Box>
          </HStack>
        </HStack>

        {/* Results summary */}
        <Text color='fg.secondary' fontSize='sm'>
          Showing {filteredAnalyses.length} of {analyses.length} analyses
        </Text>

        {/* Analyses Grid */}
        {filteredAnalyses.length === 0 ? (
          <Box textAlign='center' py='12'>
            <Text color='fg.secondary' fontSize='lg' mb='4'>
              {searchTerm || statusFilter !== 'all'
                ? 'No analyses match your search criteria'
                : 'No analyses available'}
            </Text>
            {(searchTerm || statusFilter !== 'all') && (
              <Button
                variant='outline'
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} gap='6'>
            {filteredAnalyses.map((analysis) => (
              <Card.Root
                key={analysis._id}
                variant='outline'
                height='100%'
                cursor='pointer'
                transition='all 0.2s ease'
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                  borderColor: 'brand',
                }}
                onClick={() => handleViewAnalysis(analysis)}
              >
                {analysis.metadata.picture_url && (
                  <AspectRatio ratio={16 / 9}>
                    <Image
                      src={analysis.metadata.picture_url}
                      alt={analysesService.getDisplayName(analysis)}
                      objectFit='cover'
                      borderTopRadius='md'
                    />
                  </AspectRatio>
                )}

                <Card.Body p='6'>
                  <VStack align='stretch' gap='3'>
                    <HStack justify='space-between' align='flex-start'>
                      <Text
                        fontSize='lg'
                        fontWeight='bold'
                        fontFamily='heading'
                        color='fg'
                        lineHeight='1.3'
                        lineClamp={2}
                        flex='1'
                      >
                        {analysesService.getDisplayName(analysis)}
                      </Text>
                      <Badge
                        size='sm'
                        variant={getStatusBadgeVariant(
                          analysis.metadata.status
                        )}
                        textTransform='capitalize'
                        flexShrink={0}
                        ml='2'
                      >
                        {analysis.metadata.status}
                      </Badge>
                    </HStack>

                    {analysis.metadata.ent_summary && (
                      <Text
                        color='fg.secondary'
                        fontSize='sm'
                        lineHeight='1.4'
                        lineClamp={3}
                      >
                        {analysis.metadata.ent_summary}
                      </Text>
                    )}

                    <Box>
                      <Text fontSize='xs' color='fg.muted' mb='1'>
                        Authors
                      </Text>
                      <Text fontSize='sm' color='fg.secondary' lineClamp={1}>
                        {analysesService.getAuthorsDisplay(analysis)}
                      </Text>
                    </Box>

                    {analysis.metadata.ent_start && (
                      <Text fontSize='xs' color='fg.muted'>
                        {analysis.metadata.ent_start}
                      </Text>
                    )}
                  </VStack>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
};

export default FuturityAnalysesDirectory;
