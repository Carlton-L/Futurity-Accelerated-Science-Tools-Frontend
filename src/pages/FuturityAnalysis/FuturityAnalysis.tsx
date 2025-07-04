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
  Menu,
  Portal,
} from '@chakra-ui/react';
import { FiPlus, FiChevronDown } from 'react-icons/fi';
import { TbTestPipe } from 'react-icons/tb';
import { useAuth } from '../../context/AuthContext';
import {
  analysesService,
  type AnalysisWithContent,
} from '../../services/analysesService';
import { labService } from '../../services/labService';
import { useThemedIframe } from '../../hooks/useThemedIframe';

// Lab status tracking interface
interface LabStatus {
  labId: string;
  isChecking: boolean;
  containsAnalysis: boolean;
  isAdding: boolean;
}

const FuturityAnalysis: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { token, currentTeamLabs, currentTeam } = useAuth();

  const [analysis, setAnalysis] = useState<AnalysisWithContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lab management state - tracks individual lab statuses
  const [labStatuses, setLabStatuses] = useState<Map<string, LabStatus>>(
    new Map()
  );

  // Determine if the lab dropdown should show loading state
  const isLabDropdownLoading = () => {
    return currentTeamLabs.some((lab) => getLabStatus(lab.uniqueID).isChecking);
  };

  // Use the themed iframe hook
  const { processedHTML, iframeRef } = useThemedIframe({
    htmlContent: analysis?.analysis || '',
    enabled: !!analysis,
  });

  // Helper function to get lab status
  const getLabStatus = (labId: string): LabStatus => {
    return (
      labStatuses.get(labId) || {
        labId,
        isChecking: false,
        containsAnalysis: false,
        isAdding: false,
      }
    );
  };

  // Helper function to update lab status
  const updateLabStatus = (labId: string, updates: Partial<LabStatus>) => {
    setLabStatuses((prev) => {
      const newMap = new Map(prev);
      const currentStatus = newMap.get(labId) || {
        labId,
        isChecking: false,
        containsAnalysis: false,
        isAdding: false,
      };
      newMap.set(labId, { ...currentStatus, ...updates });
      return newMap;
    });
  };

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

  // Initialize lab statuses and check labs individually
  useEffect(() => {
    const initializeLabStatuses = async () => {
      if (!analysis || !currentTeamLabs.length || !token) {
        setLabStatuses(new Map());
        return;
      }

      // Initialize all labs with checking state
      const initialStatuses = new Map<string, LabStatus>();
      currentTeamLabs.forEach((lab) => {
        initialStatuses.set(lab.uniqueID, {
          labId: lab.uniqueID,
          isChecking: true,
          containsAnalysis: false,
          isAdding: false,
        });
      });
      setLabStatuses(initialStatuses);

      // Check each lab individually and update status as we get results
      const checkPromises = currentTeamLabs.map(async (lab) => {
        try {
          // Get analyses for this lab
          const labAnalyses = await labService.getLabAnalyses(
            lab.uniqueID,
            token
          );

          // Check if current analysis is in this lab
          const containsAnalysis = labAnalyses.some(
            (labAnalysis) => labAnalysis.uniqueID === analysis.uniqueID
          );

          // Update this specific lab's status
          updateLabStatus(lab.uniqueID, {
            isChecking: false,
            containsAnalysis,
          });
        } catch (error) {
          // On error, mark as not checking and not containing analysis
          updateLabStatus(lab.uniqueID, {
            isChecking: false,
            containsAnalysis: false,
          });
        }
      });

      // Wait for all checks to complete (optional - the UI updates as each completes)
      await Promise.allSettled(checkPromises);
    };

    initializeLabStatuses();
  }, [analysis, currentTeamLabs, token]);

  // Add analysis to lab function
  const addAnalysisToLab = async (labUniqueId: string): Promise<boolean> => {
    if (!analysis || !token) return false;

    try {
      updateLabStatus(labUniqueId, { isAdding: true });

      // Make the API call to add analysis to lab
      const url = `https://fast.futurity.science/management/analyses/${analysis.uniqueID}/like?lab_uniqueID=${labUniqueId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to add analysis to lab: ${response.status}`);
      }

      updateLabStatus(labUniqueId, {
        isAdding: false,
        containsAnalysis: true,
      });

      return true;
    } catch (error) {
      console.error('Failed to add analysis to lab:', error);
      updateLabStatus(labUniqueId, { isAdding: false });
      return false;
    }
  };

  const handleAddToLab = async (labUniqueId: string): Promise<void> => {
    if (!analysis) return;

    const labStatus = getLabStatus(labUniqueId);
    if (labStatus.isAdding || labStatus.containsAnalysis) return;

    await addAnalysisToLab(labUniqueId);
  };

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

            {/* Add to Lab Button */}
            <HStack gap='3' flexShrink={0}>
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button
                    size='md'
                    variant='outline'
                    disabled={!currentTeam || currentTeamLabs.length === 0}
                    loading={isLabDropdownLoading()}
                    color='fg'
                  >
                    <FiPlus size={16} />
                    <TbTestPipe size={16} />
                    add to lab
                    <FiChevronDown size={14} />
                  </Button>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content
                      bg='bg.canvas'
                      borderColor='border.emphasized'
                      borderWidth='1px'
                      borderRadius='8px'
                      minW='220px'
                    >
                      <Menu.ItemGroup>
                        <Box p={2}>
                          <Text
                            fontSize='sm'
                            fontWeight='medium'
                            color='fg.secondary'
                            mb={2}
                          >
                            {currentTeam
                              ? `${currentTeam.ent_name} Labs:`
                              : 'Available Labs:'}
                          </Text>
                        </Box>
                      </Menu.ItemGroup>

                      {currentTeamLabs.length > 0 ? (
                        currentTeamLabs.map((lab) => {
                          const labStatus = getLabStatus(lab.uniqueID);

                          return (
                            <Menu.Item
                              key={lab.uniqueID}
                              value={lab.uniqueID}
                              disabled={
                                labStatus.containsAnalysis ||
                                labStatus.isAdding ||
                                labStatus.isChecking
                              }
                              onClick={() =>
                                !labStatus.containsAnalysis &&
                                !labStatus.isAdding &&
                                !labStatus.isChecking &&
                                handleAddToLab(lab.uniqueID)
                              }
                              color={
                                labStatus.containsAnalysis ||
                                labStatus.isAdding ||
                                labStatus.isChecking
                                  ? 'fg.muted'
                                  : 'fg'
                              }
                              fontFamily='body'
                              fontSize='sm'
                              _hover={{
                                bg:
                                  labStatus.containsAnalysis ||
                                  labStatus.isAdding ||
                                  labStatus.isChecking
                                    ? 'transparent'
                                    : 'bg.hover',
                              }}
                            >
                              <HStack justify='space-between' width='100%'>
                                <Text>{lab.ent_name}</Text>
                                {labStatus.isChecking && <Spinner size='xs' />}
                                {labStatus.isAdding &&
                                  !labStatus.isChecking && (
                                    <Text fontSize='xs' color='fg.muted'>
                                      (adding...)
                                    </Text>
                                  )}
                                {labStatus.containsAnalysis &&
                                  !labStatus.isAdding &&
                                  !labStatus.isChecking && (
                                    <Text fontSize='xs' color='success'>
                                      ✓ added
                                    </Text>
                                  )}
                              </HStack>
                            </Menu.Item>
                          );
                        })
                      ) : (
                        <Menu.Item
                          value='no-labs'
                          disabled
                          color='fg.muted'
                          fontSize='sm'
                        >
                          {currentTeam
                            ? 'No labs available in this team'
                            : 'No team selected'}
                        </Menu.Item>
                      )}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            </HStack>
          </HStack>

          {/* Metadata */}
          <HStack gap='6' wrap='wrap' color='fg.secondary' fontSize='sm'>
            <HStack gap='2'>
              <Badge
                size='md'
                variant={getStatusBadgeVariant(analysis.metadata.status)}
                textTransform='capitalize'
                flexShrink={0}
              >
                {analysis.metadata.status}
              </Badge>
            </HStack>

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
          <Button variant='solid' onClick={handleViewAllAnalyses}>
            View More Analyses
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
};

export default FuturityAnalysis;
