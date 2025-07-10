import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  Skeleton,
  IconButton,
  Dialog,
  Badge,
  Image,
} from '@chakra-ui/react';
import {
  FiExternalLink,
  FiTrash2,
  FiRefreshCw,
  FiAlertCircle,
  FiCalendar,
  FiUser,
  FiTag,
  FiX,
  FiFileText,
  FiZap,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { labService, type FuturityAnalysis } from '../../services/labService';
import TextSummarizerTool from './TextSummarizerTool';
import CorrelationFinderTool from './CorrelationFinderTool';

interface AnalyzeProps {
  labId: string;
  labUniqueID?: string;
}

const Analyze: React.FC<AnalyzeProps> = ({ labId, labUniqueID }) => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [analyses, setAnalyses] = useState<FuturityAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [removingAnalysisId, setRemovingAnalysisId] = useState<string>('');
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState<{
    isOpen: boolean;
    analysis: FuturityAnalysis | null;
  }>({
    isOpen: false,
    analysis: null,
  });

  // Fetch analyses for the lab
  const fetchAnalyses = useCallback(async () => {
    if (!labUniqueID || !token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const analysesData = await labService.getLabAnalyses(labUniqueID, token);
      setAnalyses(analysesData);
    } catch (err) {
      console.error('Failed to fetch analyses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  }, [labUniqueID, token]);

  // Load analyses on component mount
  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  // Handle analysis click - navigate to analysis page
  const handleAnalysisClick = useCallback(
    (analysis: FuturityAnalysis) => {
      navigate(`/futurity-analysis/${analysis.uniqueID}`);
    },
    [navigate]
  );

  // Handle remove analysis
  const handleRemoveAnalysis = useCallback(
    async (analysis: FuturityAnalysis) => {
      if (!labUniqueID || !token) return;

      setRemovingAnalysisId(analysis.uniqueID);
      setConfirmRemoveDialog({ isOpen: false, analysis: null });

      try {
        await labService.removeAnalysisFromLab(
          analysis.uniqueID,
          labUniqueID,
          token
        );
        setAnalyses((prev) =>
          prev.filter((a) => a.uniqueID !== analysis.uniqueID)
        );
      } catch (err) {
        console.error('Failed to remove analysis:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to remove analysis'
        );
      } finally {
        setRemovingAnalysisId('');
      }
    },
    [labUniqueID, token]
  );

  // Get status badge color
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'complete':
      case 'published':
        return 'green';
      case 'in progress':
      case 'draft':
        return 'blue';
      case 'review':
        return 'orange';
      case 'soon':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Parse inventors
  const parseInventors = (inventors?: string) => {
    if (!inventors) return [];
    return inventors
      .split(',')
      .map((inv) => inv.trim())
      .filter(Boolean);
  };

  // Parse tags
  const parseTags = (tags?: string) => {
    if (!tags) return [];
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  };

  if (!labUniqueID) {
    return (
      <VStack gap={4} align='stretch'>
        <Heading as='h2' size='lg' color='fg' fontFamily='heading'>
          Analyze
        </Heading>
        <Card.Root variant='outline' borderColor='red.200'>
          <Card.Body p={4}>
            <HStack>
              <FiAlertCircle color='red' />
              <Text color='red.600' fontSize='sm'>
                Lab unique ID not available. Cannot load analyses.
              </Text>
            </HStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    );
  }

  return (
    <VStack gap={6} align='stretch'>
      {/* Header */}
      <HStack align='center'>
        <VStack gap={1} align='start'>
          <Heading as='h2' size='lg' color='fg' fontFamily='heading'>
            Analyze
          </Heading>
        </VStack>

        <HStack gap={2}>
          <IconButton
            size='md'
            variant='ghost'
            onClick={fetchAnalyses}
            disabled={loading}
            color='fg.muted'
            _hover={{ color: 'brand', bg: 'bg.hover' }}
            aria-label='Refresh analyses'
            title='Refresh analyses'
          >
            <FiRefreshCw
              size={16}
              style={{
                transform: loading ? 'rotate(360deg)' : 'none',
                transition: 'transform 1s linear',
                animation: loading ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </IconButton>
        </HStack>
      </HStack>

      {/* Futurity Analyses Section */}
      <VStack gap={4} align='stretch'>
        <VStack gap={2} align='start'>
          <Heading as='h3' size='md' color='fg' fontFamily='heading'>
            <HStack gap={2}>
              <FiFileText size={20} />
              <Text>Futurity Analyses</Text>
              {analyses.length > 0 && (
                <Badge size='sm' variant='subtle'>
                  {analyses.length}
                </Badge>
              )}
            </HStack>
          </Heading>
          <Text color='fg.muted' fontSize='sm' fontFamily='body'>
            Research analyses associated with this lab
          </Text>
        </VStack>

        {/* Error Display */}
        {error && (
          <Card.Root borderColor='red.200' borderWidth='2px'>
            <Card.Body p={4}>
              <HStack justify='space-between'>
                <HStack>
                  <FiAlertCircle color='red' />
                  <Text color='red.600' fontSize='sm'>
                    {error}
                  </Text>
                </HStack>
                <Button
                  size='xs'
                  variant='ghost'
                  onClick={() => setError('')}
                  color='red.600'
                >
                  <FiX size={12} />
                </Button>
              </HStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Loading State */}
        {loading && (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={4}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card.Root key={i} variant='outline'>
                <Card.Body p={4}>
                  <VStack gap={3} align='stretch'>
                    <Skeleton height='120px' borderRadius='md' />
                    <Skeleton height='20px' width='80%' />
                    <Skeleton height='40px' width='100%' />
                    <HStack justify='space-between'>
                      <Skeleton height='16px' width='60px' />
                      <Skeleton height='16px' width='80px' />
                    </HStack>
                  </VStack>
                </Card.Body>
              </Card.Root>
            ))}
          </Grid>
        )}

        {/* Analyses Grid */}
        {!loading && analyses.length > 0 && (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={4}
          >
            {analyses.map((analysis) => (
              <Card.Root
                key={analysis.uniqueID}
                variant='outline'
                cursor='pointer'
                _hover={{
                  bg: 'bg.hover',
                  borderColor: 'border.hover',
                  transform: 'translateY(-2px)',
                }}
                transition='all 0.2s'
                opacity={removingAnalysisId === analysis.uniqueID ? 0.5 : 1}
                onClick={() => handleAnalysisClick(analysis)}
              >
                <Card.Body p={4}>
                  <VStack gap={3} align='stretch'>
                    {/* Analysis Image */}
                    {analysis.metadata.picture_url ? (
                      <Image
                        src={analysis.metadata.picture_url}
                        alt={analysis.name}
                        height='120px'
                        width='100%'
                        objectFit='cover'
                        borderRadius='md'
                        fallback={
                          <Box
                            height='120px'
                            bg='bg.muted'
                            borderRadius='md'
                            display='flex'
                            alignItems='center'
                            justifyContent='center'
                          >
                            <Text color='fg.muted' fontSize='sm'>
                              No Image
                            </Text>
                          </Box>
                        }
                      />
                    ) : (
                      <Box
                        height='120px'
                        bg='bg.muted'
                        borderRadius='md'
                        display='flex'
                        alignItems='center'
                        justifyContent='center'
                      >
                        <Text color='fg.muted' fontSize='sm'>
                          {analysis.metadata.ent_image || 'No Image'}
                        </Text>
                      </Box>
                    )}

                    {/* Title and Status */}
                    <HStack justify='space-between' align='start'>
                      <Text
                        fontSize='md'
                        fontWeight='medium'
                        color='fg'
                        flex='1'
                        lineHeight='1.3'
                        fontFamily='heading'
                      >
                        {analysis.name}
                      </Text>
                      {analysis.metadata.status && (
                        <Badge
                          colorScheme={getStatusColor(analysis.metadata.status)}
                          size='sm'
                        >
                          {analysis.metadata.status}
                        </Badge>
                      )}
                    </HStack>

                    {/* Description */}
                    <Text
                      fontSize='sm'
                      color='fg.muted'
                      lineHeight='1.4'
                      noOfLines={3}
                      fontFamily='body'
                    >
                      {analysis.metadata.ent_summary}
                    </Text>

                    {/* Inventors */}
                    {analysis.metadata.ent_inventors && (
                      <HStack gap={1}>
                        <FiUser
                          size={12}
                          color='var(--chakra-colors-fg-muted)'
                        />
                        <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                          {parseInventors(analysis.metadata.ent_inventors).join(
                            ', '
                          )}
                        </Text>
                      </HStack>
                    )}

                    {/* Tags */}
                    {analysis.metadata.ent_tags && (
                      <Box>
                        <HStack gap={1} mb={1}>
                          <FiTag
                            size={12}
                            color='var(--chakra-colors-fg-muted)'
                          />
                          <Text
                            fontSize='xs'
                            color='fg.muted'
                            fontFamily='body'
                          >
                            Tags:
                          </Text>
                        </HStack>
                        <Box>
                          {parseTags(analysis.metadata.ent_tags)
                            .slice(0, 3)
                            .map((tag, index) => (
                              <Badge
                                key={index}
                                size='xs'
                                variant='outline'
                                mr={1}
                                mb={1}
                              >
                                {tag}
                              </Badge>
                            ))}
                          {parseTags(analysis.metadata.ent_tags).length > 3 && (
                            <Badge
                              size='xs'
                              variant='outline'
                              colorScheme='gray'
                            >
                              +
                              {parseTags(analysis.metadata.ent_tags).length - 3}
                            </Badge>
                          )}
                        </Box>
                      </Box>
                    )}

                    {/* Footer */}
                    <HStack justify='space-between' align='center' pt={2}>
                      <HStack gap={1}>
                        <FiCalendar
                          size={12}
                          color='var(--chakra-colors-fg-muted)'
                        />
                        <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                          {formatDate(analysis.updatedAt)}
                        </Text>
                      </HStack>

                      <HStack gap={1}>
                        <IconButton
                          size='xs'
                          variant='ghost'
                          color='fg.muted'
                          _hover={{ color: 'brand' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnalysisClick(analysis);
                          }}
                          aria-label='View analysis'
                          disabled={removingAnalysisId === analysis.uniqueID}
                        >
                          <FiExternalLink size={12} />
                        </IconButton>

                        <IconButton
                          size='xs'
                          variant='ghost'
                          color='fg.muted'
                          _hover={{ color: 'red.500' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmRemoveDialog({
                              isOpen: true,
                              analysis: analysis,
                            });
                          }}
                          aria-label='Remove from lab'
                          disabled={removingAnalysisId === analysis.uniqueID}
                          loading={removingAnalysisId === analysis.uniqueID}
                        >
                          <FiTrash2 size={12} />
                        </IconButton>
                      </HStack>
                    </HStack>
                  </VStack>
                </Card.Body>
              </Card.Root>
            ))}
          </Grid>
        )}

        {/* Empty State */}
        {!loading && analyses.length === 0 && !error && (
          <Card.Root
            variant='outline'
            borderStyle='dashed'
            borderColor='border.muted'
          >
            <Card.Body p={8}>
              <VStack gap={3}>
                <Box color='fg.muted'>
                  <FiExternalLink size={48} />
                </Box>
                <Text
                  color='fg.muted'
                  fontSize='lg'
                  fontWeight='medium'
                  fontFamily='heading'
                >
                  No Futurity Analyses
                </Text>
                <Text
                  color='fg.muted'
                  fontSize='sm'
                  textAlign='center'
                  fontFamily='body'
                >
                  No analyses are currently associated with this lab. Analyses
                  can be added from the main Futurity Analysis library.
                </Text>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>

      {/* Analysis Tools Section */}
      <VStack gap={4} align='stretch'>
        <VStack gap={2} align='start'>
          <Heading as='h3' size='md' color='fg' fontFamily='heading'>
            <HStack gap={2}>
              <FiZap size={20} />
              <Text>Analysis Tools</Text>
            </HStack>
          </Heading>
          <Text color='fg.muted' fontSize='sm' fontFamily='body'>
            Use AI-powered tools to analyze and explore data
          </Text>
        </VStack>

        {/* Correlation Finder Tool */}
        <CorrelationFinderTool
          onResultGenerated={(result) => {
            console.log('Correlation finder result:', result);
            // Could potentially save results to lab or show in results panel
          }}
        />

        {/* Text Summarizer Tool */}
        <TextSummarizerTool
          onResultGenerated={(result) => {
            console.log('Text summarizer result:', result);
            // Could potentially save results to lab or show in results panel
          }}
        />
      </VStack>

      {/* Confirm Remove Dialog */}
      <Dialog.Root
        open={confirmRemoveDialog.isOpen}
        onOpenChange={({ open }) =>
          setConfirmRemoveDialog({ isOpen: open, analysis: null })
        }
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg='bg.canvas' borderColor='border.emphasized'>
            <Dialog.Header>
              <Dialog.Title color='fg' fontFamily='heading'>
                Remove Analysis from Lab
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Text color='fg' fontFamily='body'>
                Are you sure you want to remove "
                {confirmRemoveDialog.analysis?.name}" from this lab? This will
                not delete the analysis, only remove its association with this
                lab.
              </Text>
            </Dialog.Body>

            <Dialog.Footer>
              <HStack gap={3}>
                <Button
                  variant='outline'
                  onClick={() =>
                    setConfirmRemoveDialog({ isOpen: false, analysis: null })
                  }
                  color='fg'
                  borderColor='border.emphasized'
                  bg='bg.canvas'
                  _hover={{ bg: 'bg.hover' }}
                  fontFamily='heading'
                >
                  Cancel
                </Button>
                <Button
                  variant='solid'
                  onClick={() => {
                    if (confirmRemoveDialog.analysis) {
                      handleRemoveAnalysis(confirmRemoveDialog.analysis);
                    }
                  }}
                  bg='red.500'
                  color='white'
                  _hover={{ bg: 'red.600' }}
                  fontFamily='heading'
                >
                  Remove from Lab
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Add CSS for refresh button animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </VStack>
  );
};

export default Analyze;
