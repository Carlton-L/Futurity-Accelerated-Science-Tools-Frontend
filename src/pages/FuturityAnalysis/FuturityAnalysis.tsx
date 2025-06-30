import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Text,
  Button,
  HStack,
  VStack,
  Badge,
  Spinner,
  AspectRatio,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import {
  analysesService,
  type AnalysisWithContent,
} from '../../services/analysesService';
import { useThemedIframe } from '../../hooks/useThemedIframe';

const FuturityAnalysis: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [analysis, setAnalysis] = useState<AnalysisWithContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the themed iframe hook
  const { processedHTML, iframeRef } = useThemedIframe({
    htmlContent: analysis?.analysis || '',
    enabled: !!analysis,
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!slug || !token) return;

      try {
        setLoading(true);
        setError(null);
        const analysisData = await analysesService.getAnalysisById(slug, token);
        setAnalysis(analysisData);
      } catch (err) {
        console.error('Failed to fetch analysis:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load analysis'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [slug, token]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleViewAllAnalyses = () => {
    navigate('/futurity-analyses');
  };

  const getStatusBadgeVariant = (status: string) => {
    return 'subtle'; // Use subtle for all status badges in Chakra UI v3
  };

  if (loading) {
    return (
      <Container maxW='7xl' py='8'>
        <VStack gap='6' align='center' justify='center' minH='60vh'>
          <Spinner size='xl' />
          <Text color='fg.secondary'>Loading analysis...</Text>
        </VStack>
      </Container>
    );
  }

  if (error || !analysis) {
    return (
      <Container maxW='7xl' py='8'>
        <VStack gap='6' align='stretch'>
          <Box>
            <Button variant='ghost' size='sm' onClick={handleGoBack} mb='4'>
              ← Back
            </Button>
          </Box>

          <Box
            bg='errorSubtle'
            borderRadius='md'
            p='4'
            border='1px solid'
            borderColor='error'
          >
            <Text fontWeight='bold' color='error' mb='2'>
              Error loading analysis
            </Text>
            <Text color='fg.secondary'>
              {error || 'The requested analysis could not be found.'}
            </Text>
          </Box>

          <HStack justify='center'>
            <Button variant='outline' onClick={handleViewAllAnalyses}>
              View All Analyses
            </Button>
          </HStack>
        </VStack>
      </Container>
    );
  }

  const displayName = analysesService.getDisplayName(analysis);
  const authorsDisplay = analysesService.getAuthorsDisplay(analysis);
  const tags = analysis.metadata.ent_tags
    ? analysesService.formatTags(analysis.metadata.ent_tags)
    : [];

  return (
    <Container maxW='7xl' py='8'>
      <VStack gap='6' align='stretch'>
        {/* Navigation */}
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
              onClick={handleViewAllAnalyses}
              _hover={{ color: 'fg' }}
              cursor='pointer'
            >
              Futurity Analyses
            </Text>
            <Text>/</Text>
            <Text color='fg' lineClamp={1}>
              {displayName}
            </Text>
          </HStack>

          <Button variant='ghost' size='sm' onClick={handleGoBack}>
            ← Back
          </Button>
        </Box>

        {/* Header */}
        <Box>
          <HStack justify='space-between' align='flex-start' mb='4'>
            <VStack align='stretch' gap='3' flex='1'>
              <HStack align='flex-start' gap='3'>
                <Text
                  fontSize='3xl'
                  fontWeight='bold'
                  fontFamily='heading'
                  color='fg'
                  lineHeight='1.2'
                  flex='1'
                >
                  {displayName}
                </Text>
                <Badge
                  size='md'
                  variant={getStatusBadgeVariant(analysis.metadata.status)}
                  textTransform='capitalize'
                  flexShrink={0}
                >
                  {analysis.metadata.status}
                </Badge>
              </HStack>

              {analysis.metadata.ent_summary && (
                <Text
                  fontSize='lg'
                  color='fg.secondary'
                  lineHeight='1.5'
                  maxW='4xl'
                >
                  {analysis.metadata.ent_summary}
                </Text>
              )}
            </VStack>
          </HStack>

          {/* Metadata */}
          <HStack gap='6' wrap='wrap' color='fg.secondary' fontSize='sm'>
            <HStack gap='2'>
              <Text>👥</Text>
              <Text>{authorsDisplay}</Text>
            </HStack>

            {analysis.metadata.ent_start && (
              <HStack gap='2'>
                <Text>📅</Text>
                <Text>{analysis.metadata.ent_start}</Text>
              </HStack>
            )}

            {tags.length > 0 && (
              <HStack gap='2' align='flex-start'>
                <Text>🏷️</Text>
                <Box>
                  <HStack gap='1' wrap='wrap'>
                    {tags.slice(0, 5).map((tag, index) => (
                      <Badge key={index} size='sm' variant='subtle'>
                        {tag}
                      </Badge>
                    ))}
                    {tags.length > 5 && (
                      <Badge size='sm' variant='subtle'>
                        +{tags.length - 5} more
                      </Badge>
                    )}
                  </HStack>
                </Box>
              </HStack>
            )}
          </HStack>
        </Box>

        {/* Analysis Content */}
        <Box>
          <AspectRatio ratio={16 / 10} minH='600px'>
            <iframe
              ref={iframeRef}
              srcDoc={processedHTML}
              width='100%'
              height='100%'
              style={{
                border: '1px solid var(--chakra-colors-border-emphasized)',
                borderRadius: '6px',
                backgroundColor: 'white',
              }}
              title={displayName}
              sandbox='allow-scripts allow-same-origin allow-popups allow-forms'
            />
          </AspectRatio>
        </Box>

        {/* Actions */}
        <HStack justify='center' gap='4' pt='4'>
          <Button variant='outline' onClick={handleViewAllAnalyses}>
            View More Analyses
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
};

export default FuturityAnalysis;
