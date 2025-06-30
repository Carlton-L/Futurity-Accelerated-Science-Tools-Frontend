import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  Image,
  Badge,
  Button,
  Spinner,
  VStack,
  HStack,
  Container,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { futurityLabsAPIService } from '../../services/futurityLabsAPIService';
import { labAPIService } from '../../services/labAPIService';
import type { FuturityLab as FuturityLabType } from './types';

const FuturityLab: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token, currentTeamspace, user } = useAuth();

  const [lab, setLab] = useState<FuturityLabType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const fetchLab = async () => {
      if (!token || !slug) return;

      try {
        setLoading(true);
        setError(null);
        const futurityLab = await futurityLabsAPIService.getFuturityLab(
          slug,
          token
        );
        setLab(futurityLab);
      } catch (err) {
        console.error('Failed to fetch Futurity Lab:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load Futurity Lab'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLab();
  }, [token, slug]);

  const handleConvertToLab = async () => {
    if (!lab || !currentTeamspace || !user || !token) {
      console.error('Missing required data for conversion:', {
        lab: !!lab,
        currentTeamspace: !!currentTeamspace,
        user: !!user,
        token: !!token,
      });
      alert(
        'Unable to convert lab. Please ensure you are logged in and have selected a team.'
      );
      return;
    }

    try {
      setConverting(true);

      // Create the lab using the API service
      const result = await labAPIService.createLabFromFuturity(
        lab,
        currentTeamspace._id,
        user.guid || user._id, // Use guid if available, fallback to _id
        user._id,
        token
      );

      console.log('Lab created successfully:', result);

      // Navigate to the new lab
      navigate(`/lab/${result._id}`);
    } catch (error) {
      console.error('Failed to convert Futurity Lab:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to convert lab';
      alert(`Error converting lab: ${errorMessage}`);
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <Container maxW='6xl' py='8'>
        <VStack gap='8' align='stretch'>
          {/* Header Skeleton */}
          <Box>
            <Skeleton height='32px' width='120px' mb='4' />

            <HStack gap='4' align='start'>
              <VStack gap='4' align='start' flex='1'>
                <Box>
                  <HStack gap='3' mb='3'>
                    <Skeleton height='24px' width='60px' borderRadius='full' />
                    <Skeleton height='24px' width='80px' borderRadius='full' />
                  </HStack>

                  <Skeleton height='48px' width='400px' mb='4' />
                </Box>

                <SkeletonText noOfLines={3} spacing='4' skeletonHeight='20px' />
              </VStack>
            </HStack>
          </Box>

          {/* Image Skeleton */}
          <Skeleton height='400px' width='100%' borderRadius='8px' />

          {/* Actions Skeleton */}
          <Box>
            <HStack gap='4'>
              <Skeleton height='48px' width='200px' borderRadius='md' />
            </HStack>
            <Skeleton height='16px' width='300px' mt='2' />
          </Box>

          {/* Additional Info Skeleton */}
          <Box>
            <Skeleton height='16px' width='200px' mb='2' />
            <Skeleton height='16px' width='180px' />
          </Box>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW='6xl' py='8'>
        <Box
          bg='errorSubtle'
          borderRadius='md'
          p='6'
          border='1px solid'
          borderColor='error'
        >
          <Text fontWeight='bold' color='error' fontSize='lg' mb='2'>
            Error loading Futurity Lab
          </Text>
          <Text color='fg.secondary' mb='4'>
            {error}
          </Text>
        </Box>
        <Button mt='4' onClick={() => navigate('/')} variant='outline'>
          Back to Home
        </Button>
      </Container>
    );
  }

  if (!lab) {
    return (
      <Container maxW='6xl' py='8'>
        <Box
          bg='bg.muted'
          borderRadius='md'
          p='6'
          border='1px solid'
          borderColor='border.muted'
        >
          <Text fontWeight='bold' color='fg' fontSize='lg' mb='2'>
            Futurity Lab not found
          </Text>
          <Text color='fg.secondary' mb='4'>
            The requested Futurity Lab could not be found.
          </Text>
        </Box>
        <Button mt='4' onClick={() => navigate('/')} variant='outline'>
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW='6xl' py='8'>
      <VStack gap='8' align='stretch'>
        {/* Header */}
        <Box>
          <HStack gap='2' fontSize='sm' color='fg.secondary' mb='4'>
            <Text
              as='button'
              onClick={() => navigate('/')}
              _hover={{ color: 'fg' }}
              cursor='pointer'
            >
              Home
            </Text>
            <Text>/</Text>
            <Text
              as='button'
              onClick={() => navigate('/futuritylabs')}
              _hover={{ color: 'fg' }}
              cursor='pointer'
            >
              Futurity Labs
            </Text>
            <Text>/</Text>
            <Text color='fg' lineClamp={1}>
              {lab.ent_name}
            </Text>
          </HStack>

          <Button onClick={() => navigate(-1)} variant='ghost' size='sm' mb='4'>
            ← Back
          </Button>

          <HStack gap='4' align='start'>
            <VStack gap='4' align='start' flex='1'>
              <Box>
                <HStack gap='3' mb='3'>
                  <Badge
                    colorScheme={lab.free_lab === 1 ? 'green' : 'orange'}
                    variant='solid'
                    fontSize='sm'
                  >
                    {lab.free_lab === 1 ? 'FREE' : 'PREMIUM'}
                  </Badge>
                  <Badge
                    variant='outline'
                    colorScheme='blue'
                    fontSize='sm'
                    textTransform='uppercase'
                  >
                    {lab.lab_code}
                  </Badge>
                </HStack>

                <Text
                  fontSize='4xl'
                  fontWeight='bold'
                  fontFamily='heading'
                  color='fg'
                  lineHeight='1.2'
                  mb='4'
                >
                  {lab.ent_name}
                </Text>
              </Box>

              <Text
                fontSize='lg'
                color='fg.secondary'
                lineHeight='1.6'
                maxW='3xl'
              >
                {lab.ent_summary}
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Image */}
        {(lab.picture_url || lab.thumb_url) && (
          <Box>
            <Image
              src={lab.picture_url || lab.thumb_url}
              alt={lab.ent_name}
              w='100%'
              maxH='400px'
              objectFit='cover'
              borderRadius='8px'
              border='1px solid'
              borderColor='border.emphasized'
            />
          </Box>
        )}

        {/* Actions */}
        <Box>
          <HStack gap='4'>
            <Button
              onClick={handleConvertToLab}
              variant='solid'
              size='lg'
              disabled={lab.visible === 0 || converting || !currentTeamspace}
              isLoading={converting}
              loadingText='Converting...'
            >
              Convert to Team Lab
            </Button>
          </HStack>

          {lab.visible === 0 && (
            <Text color='fg.muted' fontSize='sm' mt='2'>
              This lab is currently not available for conversion.
            </Text>
          )}

          {!currentTeamspace && (
            <Text color='fg.muted' fontSize='sm' mt='2'>
              Please select a team to convert this lab.
            </Text>
          )}
        </Box>

        {/* Additional Info */}
        <Box>
          <Text fontSize='sm' color='fg.muted'>
            Lab ID: {lab.ent_fsid}
          </Text>
          {lab.ent_authors && lab.ent_authors.length > 0 && (
            <Text fontSize='sm' color='fg.muted' mt='1'>
              Authors: {lab.ent_authors.length} contributor(s)
            </Text>
          )}
        </Box>
      </VStack>
    </Container>
  );
};

export default FuturityLab;
