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
  Separator,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { futurityLabsAPIService } from '../../services/futurityLabsAPIService';
import { labAPIService } from '../../services/labAPIService';
import { labService } from '../../services/labService';
import PhylogenyTree from '../../components/charts/PhylogenyTree';
import type { FuturityLab as FuturityLabType } from './types';
import type { Lab } from '../../services/labService';
import type { PhylogenyData } from '../../components/charts/PhylogenyTree/types';

const FuturityLab: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token, currentTeamspace, user } = useAuth();

  const [lab, setLab] = useState<FuturityLabType | null>(null);
  const [taxonomyData, setTaxonomyData] = useState<PhylogenyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(false);

  useEffect(() => {
    const fetchLabAndTaxonomy = async () => {
      if (!token || !slug) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch the Futurity Lab
        const futurityLab = await futurityLabsAPIService.getFuturityLab(
          slug,
          token
        );
        setLab(futurityLab);

        // After getting the lab, fetch taxonomy data
        await loadTaxonomyData(futurityLab);
      } catch (err) {
        console.error('Failed to fetch Futurity Lab:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load Futurity Lab'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLabAndTaxonomy();
  }, [token, slug]);

  const loadTaxonomyData = async (futurityLab: FuturityLabType) => {
    if (!token) return;

    try {
      setLoadingTaxonomy(true);

      // First, try to find if this Futurity Lab has already been converted to a team lab
      // We'll use the lab's fsid to look for existing converted labs
      // This is a placeholder - you may need to adjust based on your actual API structure

      // For now, let's create mock taxonomy data based on the Futurity Lab info
      // In a real scenario, you'd want to fetch this from an API endpoint
      const phylogenyData = createMockTaxonomyData(futurityLab);
      setTaxonomyData(phylogenyData);
    } catch (err) {
      console.error('Failed to load taxonomy data:', err);
      // Don't set error state here since it's not critical
    } finally {
      setLoadingTaxonomy(false);
    }
  };

  // Create mock taxonomy data - replace this with actual API call
  const createMockTaxonomyData = (
    futurityLab: FuturityLabType
  ): PhylogenyData => {
    // This is a placeholder function. In practice, you'd want to:
    // 1. Check if this Futurity Lab has taxonomy data available
    // 2. Fetch it from an appropriate API endpoint
    // 3. Or create a mapping from Futurity Lab metadata to taxonomy structure

    // For demonstration, creating some sample categories based on lab name/content
    const sampleSubcategories = [
      {
        id: 'emerging-tech',
        name: 'Emerging Technologies',
        items: [
          { id: 'ai-ml', name: 'AI & Machine Learning' },
          { id: 'quantum', name: 'Quantum Computing' },
          { id: 'biotech', name: 'Biotechnology' },
        ],
      },
      {
        id: 'applications',
        name: 'Applications',
        items: [
          { id: 'healthcare', name: 'Healthcare' },
          { id: 'energy', name: 'Clean Energy' },
          { id: 'transport', name: 'Transportation' },
        ],
      },
      {
        id: 'market-sectors',
        name: 'Market Sectors',
        items: [
          { id: 'enterprise', name: 'Enterprise' },
          { id: 'consumer', name: 'Consumer' },
          { id: 'industrial', name: 'Industrial' },
        ],
      },
    ];

    return {
      root: {
        id: futurityLab.ent_fsid,
        name: futurityLab.ent_name,
      },
      subcategories: sampleSubcategories,
    };
  };

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

          {/* Taxonomy Skeleton */}
          <Box>
            <Skeleton height='24px' width='200px' mb='4' />
            <Skeleton height='400px' width='100%' borderRadius='8px' />
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

        {/* Taxonomy Visualization Section */}
        <Box>
          <Text
            fontSize='2xl'
            fontWeight='bold'
            fontFamily='heading'
            color='fg'
            mb='4'
          >
            Lab Taxonomy
          </Text>
          <Text color='fg.secondary' mb='6'>
            Explore the subject taxonomy structure for this lab
          </Text>

          {loadingTaxonomy ? (
            <Box
              display='flex'
              justifyContent='center'
              alignItems='center'
              minH='400px'
            >
              <VStack gap='4'>
                <Spinner size='xl' color='brand' />
                <Text color='fg.secondary'>Loading taxonomy data...</Text>
              </VStack>
            </Box>
          ) : taxonomyData ? (
            <PhylogenyTree
              data={taxonomyData}
              nodeSpacing={80}
              levelSpacing={240}
              itemSpacing={40}
            />
          ) : (
            <Box
              bg='bg.subtle'
              borderRadius='md'
              p='6'
              border='1px solid'
              borderColor='border.muted'
              textAlign='center'
            >
              <Text color='fg.muted' fontSize='lg' mb='2'>
                No taxonomy data available
              </Text>
              <Text color='fg.secondary' fontSize='sm'>
                This lab may not have subjects organized into categories yet.
              </Text>
            </Box>
          )}
        </Box>

        <Separator />

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
