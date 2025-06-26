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
  Link,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { futurityLabsAPIService } from '../../services/futurityLabsAPIService';
import type { FuturityLab } from './types';

const FuturityLab: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [lab, setLab] = useState<FuturityLab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleConvertToLab = () => {
    // TODO: Implement conversion to team lab
    console.log('Converting Futurity Lab to team lab:', lab);
    // For now, just show an alert or navigate somewhere
    alert('Lab conversion feature coming soon!');
  };

  if (loading) {
    return (
      <Container maxW='6xl' py='8'>
        <Box textAlign='center' py='12'>
          <Spinner size='xl' color='brand.500' />
          <Text mt='6' color='fg.secondary' fontSize='lg'>
            Loading Futurity Lab...
          </Text>
        </Box>
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
          <Button
            onClick={() => navigate('/')}
            variant='ghost'
            size='sm'
            mb='4'
          >
            ← Back to Home
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
              disabled={lab.visible === 0}
            >
              Convert to Team Lab
            </Button>

            {lab.ent_url && (
              <Link
                href={lab.ent_url}
                isExternal
                _hover={{ textDecoration: 'none' }}
              >
                <Button variant='outline' size='lg'>
                  View Original
                </Button>
              </Link>
            )}
          </HStack>

          {lab.visible === 0 && (
            <Text color='fg.muted' fontSize='sm' mt='2'>
              This lab is currently not available for conversion.
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
