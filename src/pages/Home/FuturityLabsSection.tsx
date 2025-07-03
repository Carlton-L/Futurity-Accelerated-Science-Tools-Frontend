import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, Button, Flex, Skeleton, HStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { labService } from '../../services/labService';
import FuturityLabCard from '../FuturityLab/FuturityLabCard';
import type { FuturityLab } from '../../services/labService';

const FuturityLabsSection: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [labs, setLabs] = useState<FuturityLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleLabs, setVisibleLabs] = useState<FuturityLab[]>([]);
  const [labsPerRow, setLabsPerRow] = useState(4);
  const [showingAll, setShowingAll] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLabs = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);
        const futurityLabs = await labService.getFuturityLabs(token);
        setLabs(futurityLabs);
      } catch (err) {
        console.error('Failed to fetch Futurity Labs:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load Futurity Labs'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, [token]);

  // Calculate how many labs fit per row based on container width
  useEffect(() => {
    const calculateLabsPerRow = () => {
      if (!gridRef.current) return;

      const containerWidth = gridRef.current.offsetWidth;
      const minCardWidth = 280; // Minimum card width
      const gap = 24; // Gap between cards (6 * 4px = 24px in Chakra)

      // Calculate how many cards can fit in one row
      const calculatedLabsPerRow = Math.floor(
        (containerWidth + gap) / (minCardWidth + gap)
      );

      // Ensure at least 1 lab per row, max 4
      const newLabsPerRow = Math.max(1, Math.min(4, calculatedLabsPerRow));
      setLabsPerRow(newLabsPerRow);
    };

    // Initial calculation
    calculateLabsPerRow();

    // Create ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(calculateLabsPerRow);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    // Fallback for window resize
    window.addEventListener('resize', calculateLabsPerRow);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateLabsPerRow);
    };
  }, [labs]); // Add labs as dependency to recalculate when labs are loaded

  // Update visible labs when labs or labsPerRow changes
  useEffect(() => {
    if (labs.length === 0) return;

    // Always update visible labs when labsPerRow changes or when labs first load
    if (!showingAll) {
      setVisibleLabs(labs.slice(0, labsPerRow));
    } else {
      setVisibleLabs(labs);
    }
  }, [labs, labsPerRow]); // This will run when labsPerRow is calculated

  const handleShowMore = () => {
    console.log('Show More clicked!', {
      showingAll,
      visibleLabs: visibleLabs.length,
      totalLabs: labs.length,
      labsPerRow,
    });

    if (showingAll) {
      console.log('Resetting to first row');
      setShowingAll(false);
      setVisibleLabs(labs.slice(0, labsPerRow));
    } else {
      const currentlyVisible = visibleLabs.length;
      const remainingLabs = labs.length - currentlyVisible;
      const nextBatch = Math.min(labsPerRow, remainingLabs);
      const newVisible = labs.slice(0, currentlyVisible + nextBatch);

      console.log('Adding more labs', {
        currentlyVisible,
        remainingLabs,
        nextBatch,
        newVisibleCount: newVisible.length,
      });

      setVisibleLabs(newVisible);

      // If we're showing all labs now, update the state
      if (newVisible.length === labs.length) {
        console.log('Now showing all labs');
        setShowingAll(true);
      }
    }
  };

  const getShowMoreText = () => {
    if (showingAll) {
      return 'Show Less';
    }

    const remainingLabs = labs.length - visibleLabs.length;
    const nextBatch = Math.min(labsPerRow, remainingLabs);
    return `Show ${nextBatch} More`;
  };

  const handleViewAllLabs = () => {
    navigate('/futuritylabs');
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
            Futurity Labs
          </Text>
          <Text color='fg.secondary' fontSize='md'>
            Explore our research areas and discover new insights
          </Text>
        </Box>

        <Box pt='1'>
          <Flex wrap='nowrap' gap='6' w='100%' overflowX='hidden'>
            {/* Show skeleton loaders for the expected number of cards */}
            {Array.from({ length: 4 }, (_, index) => (
              <Box
                key={`skeleton-${index}`}
                flex='0 0 auto'
                width='calc(25% - 18px)' // Assume 4 cards initially
                minWidth='280px'
              >
                <Skeleton height='400px' borderRadius='md' />
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
          Error loading Futurity Labs
        </Text>
        <Text color='fg.secondary'>{error}</Text>
      </Box>
    );
  }

  if (labs.length === 0) {
    return (
      <Box textAlign='center' py='8'>
        <Text color='fg.secondary'>No Futurity Labs available</Text>
      </Box>
    );
  }

  const shouldShowButton = labs.length > labsPerRow;

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
          Futurity Labs
        </Text>
        <Text color='fg.secondary' fontSize='md'>
          Explore our research areas and discover new insights
        </Text>
      </Box>

      <Box ref={gridRef} pt='1'>
        <Flex
          wrap={visibleLabs.length > labsPerRow ? 'wrap' : 'nowrap'}
          gap='6'
          w='100%'
          overflowX={visibleLabs.length > labsPerRow ? 'visible' : 'hidden'}
          mb={shouldShowButton ? '6' : '0'}
        >
          {visibleLabs.map((lab) => (
            <Box
              key={lab._id}
              flex='0 0 auto'
              width={`calc(${100 / labsPerRow}% - ${
                ((labsPerRow - 1) * 24) / labsPerRow
              }px)`}
              minWidth='280px'
            >
              <FuturityLabCard lab={lab} />
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
            <Button variant='solid' size='md' onClick={handleViewAllLabs}>
              View All Labs
            </Button>
          </HStack>
        )}
      </Box>
    </Box>
  );
};

export default FuturityLabsSection;
