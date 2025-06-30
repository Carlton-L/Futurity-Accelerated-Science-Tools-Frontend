import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Button,
  Flex,
  Skeleton,
  HStack,
  Card,
  Badge,
  Image,
  AspectRatio,
  VStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analysesService, type Analysis } from '../../services/analysesService';

const AnalysesSection: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleAnalyses, setVisibleAnalyses] = useState<Analysis[]>([]);
  const [analysesPerRow, setAnalysesPerRow] = useState(4);
  const [showingAll, setShowingAll] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);
        const allAnalyses = await analysesService.getAnalyses(token);

        // Sort by status (ready first), then by creation date (newest first)
        const sortedAnalyses = allAnalyses.sort((a, b) => {
          // Priority order: ready > published > draft > soon
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

          // If same status, sort by creation date (newest first)
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setAnalyses(sortedAnalyses);
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

  // Calculate how many analyses fit per row based on container width
  useEffect(() => {
    const calculateAnalysesPerRow = () => {
      if (!gridRef.current) return;

      const containerWidth = gridRef.current.offsetWidth;
      const minCardWidth = 320; // Minimum card width for analyses
      const gap = 24; // Gap between cards

      const calculatedAnalysesPerRow = Math.floor(
        (containerWidth + gap) / (minCardWidth + gap)
      );

      const newAnalysesPerRow = Math.max(
        1,
        Math.min(4, calculatedAnalysesPerRow)
      );
      setAnalysesPerRow(newAnalysesPerRow);
    };

    calculateAnalysesPerRow();

    const resizeObserver = new ResizeObserver(calculateAnalysesPerRow);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    window.addEventListener('resize', calculateAnalysesPerRow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateAnalysesPerRow);
    };
  }, [analyses]);

  // Update visible analyses when analyses or analysesPerRow changes
  useEffect(() => {
    if (analyses.length === 0) return;

    if (!showingAll) {
      setVisibleAnalyses(analyses.slice(0, analysesPerRow));
    } else {
      setVisibleAnalyses(analyses);
    }
  }, [analyses, analysesPerRow, showingAll]);

  const handleShowMore = () => {
    if (showingAll) {
      setShowingAll(false);
      setVisibleAnalyses(analyses.slice(0, analysesPerRow));
    } else {
      const currentlyVisible = visibleAnalyses.length;
      const remainingAnalyses = analyses.length - currentlyVisible;
      const nextBatch = Math.min(analysesPerRow, remainingAnalyses);
      const newVisible = analyses.slice(0, currentlyVisible + nextBatch);

      setVisibleAnalyses(newVisible);

      if (newVisible.length === analyses.length) {
        setShowingAll(true);
      }
    }
  };

  const getShowMoreText = () => {
    if (showingAll) {
      return 'Show Less';
    }

    const remainingAnalyses = analyses.length - visibleAnalyses.length;
    const nextBatch = Math.min(analysesPerRow, remainingAnalyses);
    return `Show ${nextBatch} More`;
  };

  const handleViewAnalysis = (analysis: Analysis) => {
    navigate(`/futurity-analysis/${analysis.uniqueID}`);
  };

  const handleViewAllAnalyses = () => {
    navigate('/futurity-analyses');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ready':
      case 'published':
        return 'subtle';
      case 'draft':
        return 'subtle';
      case 'soon':
        return 'subtle';
      default:
        return 'subtle';
    }
  };

  if (loading) {
    return (
      <Box>
        <Box mb='6'>
          <Text
            fontSize='2xl'
            fontWeight='bold'
            fontFamily='heading'
            color='fg'
            mb='2'
          >
            Featured Analyses
          </Text>
          <Text color='fg.secondary' fontSize='md'>
            Explore our research analyses and insights
          </Text>
        </Box>

        <Box pt='1'>
          <Flex wrap='nowrap' gap='6' w='100%' overflowX='hidden'>
            {Array.from({ length: 4 }, (_, index) => (
              <Box
                key={`skeleton-${index}`}
                flex='0 0 auto'
                width='calc(25% - 18px)'
                minWidth='320px'
              >
                <Skeleton height='280px' borderRadius='md' />
              </Box>
            ))}
          </Flex>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (analyses.length === 0) {
    return (
      <Box textAlign='center' py='8'>
        <Text color='fg.secondary'>No analyses available</Text>
      </Box>
    );
  }

  const shouldShowButton = analyses.length > analysesPerRow;

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
              Featured Analyses
            </Text>
            <Text color='fg.secondary' fontSize='md'>
              Explore our research analyses and insights
            </Text>
          </Box>
          <Button variant='outline' size='md' onClick={handleViewAllAnalyses}>
            View All Analyses
          </Button>
        </HStack>
      </Box>

      <Box ref={gridRef} pt='1'>
        <Flex
          wrap={visibleAnalyses.length > analysesPerRow ? 'wrap' : 'nowrap'}
          gap='6'
          w='100%'
          overflowX={
            visibleAnalyses.length > analysesPerRow ? 'visible' : 'hidden'
          }
          mb={shouldShowButton ? '6' : '0'}
        >
          {visibleAnalyses.map((analysis) => (
            <Box
              key={analysis._id}
              flex='0 0 auto'
              width={`calc(${100 / analysesPerRow}% - ${
                ((analysesPerRow - 1) * 24) / analysesPerRow
              }px)`}
              minWidth='320px'
            >
              <Card.Root
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
            </Box>
          ))}
        </Flex>

        {shouldShowButton && (
          <HStack justify='center' gap='4'>
            <Button
              variant='outline'
              size='md'
              onClick={handleShowMore}
              color='fg'
              _hover={{
                color: 'fg',
                bg: 'bg.hover',
              }}
            >
              {getShowMoreText()}
            </Button>
            <Button variant='solid' size='md' onClick={handleViewAllAnalyses}>
              View All Analyses
            </Button>
          </HStack>
        )}
      </Box>
    </Box>
  );
};

export default AnalysesSection;
