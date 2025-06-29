import React, { useState, useEffect } from 'react';
import { Box, Text, SimpleGrid, Spinner } from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { futurityLabsAPIService } from '../../services/futurityLabsAPIService';
import FuturityLabCard from '../FuturityLab/FuturityLabCard';
import type { FuturityLab } from '../FuturityLab/types';

const FuturityLabsSection: React.FC = () => {
  const { token } = useAuth();
  const [labs, setLabs] = useState<FuturityLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLabs = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setError(null);
        const futurityLabs = await futurityLabsAPIService.listFuturityLabs(
          token
        );

        // Sort by position and visible status (visible labs first, then by position)
        const sortedLabs = futurityLabs.sort((a, b) => {
          if (a.visible !== b.visible) {
            return b.visible - a.visible; // visible labs first
          }
          return a.position - b.position;
        });

        setLabs(sortedLabs);
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

  if (loading) {
    return (
      <Box textAlign='center' py='8'>
        <Spinner size='lg' color='brand.500' />
        <Text mt='4' color='fg.secondary'>
          Loading Futurity Labs...
        </Text>
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

      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap='6' w='100%'>
        {labs.map((lab) => (
          <FuturityLabCard key={lab._id} lab={lab} />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default FuturityLabsSection;
