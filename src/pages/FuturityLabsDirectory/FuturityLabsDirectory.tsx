import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  SimpleGrid,
  Spinner,
  Container,
  Heading,
  VStack,
  Input,
  HStack,
  Button,
  Skeleton,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { futurityLabsAPIService } from '../../services/futurityLabsAPIService';
import FuturityLabCard from '../FuturityLab/FuturityLabCard';
import type { FuturityLab } from '../FuturityLab/types';

const FuturityLabsDirectory: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [labs, setLabs] = useState<FuturityLab[]>([]);
  const [filteredLabs, setFilteredLabs] = useState<FuturityLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'position'>('position');

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
        setFilteredLabs(sortedLabs);
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

  // Filter and sort labs
  useEffect(() => {
    let filtered = labs.filter(
      (lab) =>
        lab.ent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lab.ent_summary?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort the filtered results
    if (sortBy === 'name') {
      filtered = filtered.sort((a, b) => a.ent_name.localeCompare(b.ent_name));
    } else {
      filtered = filtered.sort((a, b) => {
        if (a.visible !== b.visible) {
          return b.visible - a.visible; // visible labs first
        }
        return a.position - b.position;
      });
    }

    setFilteredLabs(filtered);
  }, [labs, searchTerm, sortBy]);

  const handleBackToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Container maxW='7xl' py='8'>
        <VStack gap='8' align='stretch'>
          {/* Header */}
          <Box>
            <Button variant='ghost' onClick={handleBackToHome} mb='4'>
              <FiArrowLeft />
              Back to Home
            </Button>
            <Heading as='h1' size='2xl' mb='2'>
              All Futurity Labs
            </Heading>
            <Text color='fg.secondary' fontSize='lg'>
              Explore all our research areas and discover new insights
            </Text>
          </Box>

          {/* Search and Filter Controls - Skeleton */}
          <HStack gap='4' wrap='wrap'>
            <Box flex='1' minW='300px'>
              <Skeleton height='48px' borderRadius='md' />
            </Box>
            <Box minW='200px'>
              <Skeleton height='48px' borderRadius='md' />
            </Box>
          </HStack>

          {/* Results Count - Skeleton */}
          <Box>
            <Skeleton height='20px' width='150px' />
          </Box>

          {/* Labs Grid - Skeleton */}
          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
            gap='6'
            w='100%'
          >
            {Array.from({ length: 12 }, (_, index) => (
              <Skeleton
                key={`skeleton-${index}`}
                height='200px'
                borderRadius='md'
                startColor='bg.muted'
                endColor='bg.hover'
              />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW='7xl' py='8'>
        <VStack gap='8' align='stretch'>
          <Box>
            <Button variant='ghost' onClick={handleBackToHome} mb='4'>
              <FiArrowLeft />
              Back to Home
            </Button>
            <Heading as='h1' size='2xl' mb='2'>
              All Futurity Labs
            </Heading>
          </Box>

          <Box
            bg='errorSubtle'
            borderRadius='lg'
            p='6'
            border='1px solid'
            borderColor='error'
            textAlign='center'
          >
            <Text fontWeight='bold' color='error' mb='2' fontSize='lg'>
              Error loading Futurity Labs
            </Text>
            <Text color='fg.secondary'>{error}</Text>
          </Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW='7xl' py='8'>
      <VStack gap='8' align='stretch'>
        {/* Header */}
        <Box>
          <Button variant='ghost' onClick={handleBackToHome} mb='4'>
            <FiArrowLeft />
            Back to Home
          </Button>
          <Heading as='h1' size='2xl' mb='2'>
            All Futurity Labs
          </Heading>
          <Text color='fg.secondary' fontSize='lg'>
            Explore all our research areas and discover new insights
          </Text>
        </Box>

        {/* Search and Filter Controls */}
        <HStack gap='4' wrap='wrap'>
          <Box flex='1' minW='300px' position='relative'>
            <Box
              position='absolute'
              left='3'
              top='50%'
              transform='translateY(-50%)'
              zIndex='1'
            >
              <FiSearch color='gray' />
            </Box>
            <Input
              placeholder='Search labs by name or description...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size='lg'
              pl='10'
            />
          </Box>
          <Box minW='200px'>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'position')}
              style={{
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '16px',
                width: '100%',
                backgroundColor: 'var(--chakra-colors-bg-canvas)',
                color: 'var(--chakra-colors-fg)',
              }}
            >
              <option value='position'>Sort by Recommended</option>
              <option value='name'>Sort by Name</option>
            </select>
          </Box>
        </HStack>

        {/* Results Count */}
        <Box>
          <Text color='fg.secondary'>
            {searchTerm
              ? `${filteredLabs.length} of ${labs.length} labs found`
              : `${labs.length} labs total`}
          </Text>
        </Box>

        {/* Labs Grid */}
        {filteredLabs.length > 0 ? (
          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
            gap='6'
            w='100%'
          >
            {filteredLabs.map((lab) => (
              <FuturityLabCard key={lab._id} lab={lab} />
            ))}
          </SimpleGrid>
        ) : (
          <Box textAlign='center' py='12'>
            <Text color='fg.secondary' fontSize='lg'>
              {searchTerm
                ? `No labs found matching "${searchTerm}"`
                : 'No Futurity Labs available'}
            </Text>
            {searchTerm && (
              <Button
                variant='outline'
                onClick={() => setSearchTerm('')}
                mt='4'
              >
                Clear Search
              </Button>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default FuturityLabsDirectory;
