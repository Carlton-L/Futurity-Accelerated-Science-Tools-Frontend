import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Textarea,
  IconButton,
  Dialog,
  Tabs,
  Skeleton,
  Alert,
} from '@chakra-ui/react';
import {
  FiEdit,
  FiSave,
  FiX,
  FiSettings,
  FiMail,
  FiArrowLeft,
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePage } from '../../context/PageContext';
import GlassCard from '../../components/shared/GlassCard';
import type {
  Lab as LabType,
  ApiLabData,
  SubjectData,
  AnalysisData,
} from './types';
import { ApiTransformUtils } from './types';
import type { LabTab } from '../../context/PageContext/pageTypes';
import Plan from './Plan';
import Gather from './Gather';
import Analyze from './Analyze';
import Forecast from './Forecast';
import Invent from './Invent';
import { labAPIService } from '../../services/labAPIService';

const Lab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { setPageContext, clearPageContext } = usePage();

  const [lab, setLab] = useState<LabType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
  }>({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState<boolean>(false);

  // Changed default tab to 'plan' and updated valid tabs
  const [activeTab, setActiveTab] = useState<LabTab>('plan');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  // Real API functions for fetching related data
  const fetchSubjectData = useCallback(
    async (objectId: string): Promise<SubjectData> => {
      try {
        // Try real API first if token is available
        if (token) {
          try {
            const response = await fetch(
              `https://tools.futurity.science/api/subject/${objectId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              return await response.json();
            }
          } catch (apiError) {
            console.warn(
              'Subject API failed, falling back to mock data:',
              apiError
            );
          }
        }

        // Fallback to mock data
        const { mockFetchSubjectData } = await import('./mockData');
        return await mockFetchSubjectData(objectId);
      } catch (error) {
        console.error('Failed to fetch subject data:', error);
        // Return default subject data if both API and mock fail
        return {
          _id: objectId,
          Google_hitcounts: 0,
          Papers_hitcounts: 0,
          Books_hitcounts: 0,
          Gnews_hitcounts: 0,
          Related_terms: '',
          wikipedia_definition: '',
          wiktionary_definition: '',
          FST: '',
          labs: '',
          wikipedia_url: '',
          ent_name: 'Unknown Subject',
          ent_fsid: 'unknown',
          ent_summary: 'Subject data not found',
        };
      }
    },
    [token]
  );

  const fetchAnalysisData = useCallback(
    async (objectId: string): Promise<AnalysisData> => {
      try {
        // Try real API first if token is available
        if (token) {
          try {
            const response = await fetch(
              `https://tools.futurity.science/api/analysis/${objectId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (response.ok) {
              return await response.json();
            }
          } catch (apiError) {
            console.warn(
              'Analysis API failed, falling back to mock data:',
              apiError
            );
          }
        }

        // Fallback to mock data
        const { mockFetchAnalysisData } = await import('./mockData');
        return await mockFetchAnalysisData(objectId);
      } catch (error) {
        console.error('Failed to fetch analysis data:', error);
        // Return default analysis data if both API and mock fail
        return {
          id: objectId,
          title: 'Unknown Analysis',
          description: 'Analysis data not found',
          status: 'Unknown',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdById: 'unknown',
        };
      }
    },
    [token]
  );

  // Memoize the page context to prevent infinite re-renders
  const labPageContext = useMemo(() => {
    if (!lab) return null;

    return {
      pageType: 'lab' as const,
      pageTitle: `Lab: ${lab.name}`,
      lab: {
        id: lab.id,
        name: lab.name,
        title: lab.name,
      },
      currentTab: activeTab,
    };
  }, [lab, activeTab]);

  // Set up page context when lab data is loaded or tab changes
  useEffect(() => {
    if (labPageContext) {
      setPageContext(labPageContext);
    }

    return () => clearPageContext();
  }, [setPageContext, clearPageContext, labPageContext]);

  // Fetch lab data with real API
  const fetchLabData = useCallback(async (): Promise<void> => {
    console.log('Starting to fetch lab data for id:', id);
    setLoading(true);
    setError(null);

    if (!id) {
      setError('Missing lab ID');
      setLoading(false);
      return;
    }

    try {
      let apiLabData: ApiLabData | undefined;
      let useRealAPI = false;

      // Try to fetch from real API first if token is available
      if (token) {
        try {
          // Fixed: Use the correct endpoint with query parameter
          const response = await fetch(
            `https://tools.futurity.science/api/lab/view?lab_id=${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            // Use real API data
            apiLabData = await response.json();
            useRealAPI = true;
            console.log('Successfully fetched lab data from API');
          } else if (response.status === 401) {
            setError('Session expired. Please log in again.');
            setLoading(false);
            return;
          } else if (response.status === 403) {
            setError('You do not have permission to access this lab.');
            setLoading(false);
            return;
          } else {
            // API failed, will fallback to mock data
            console.warn(
              `API responded with ${response.status}, falling back to mock data`
            );
          }
        } catch (apiError) {
          // Network error or other API issue, will fallback to mock data
          console.warn(
            'API request failed, falling back to mock data:',
            apiError
          );
        }
      }

      // Fallback to mock data if API didn't work or no token
      if (!useRealAPI || !apiLabData) {
        console.log('Using mock data for lab ID:', id);

        // Import mock data
        const { mockFetchLabData } = await import('./mockData');

        try {
          apiLabData = await mockFetchLabData(id);
          console.log('Successfully loaded mock lab data');
        } catch (mockError) {
          console.error('Mock data also failed:', mockError);
          setError(`Lab with ID "${id}" not found. Please check the URL.`);
          setLoading(false);
          return;
        }
      }

      // Ensure we have data before proceeding
      if (!apiLabData) {
        setError('No lab data available');
        setLoading(false);
        return;
      }

      // Transform API data to frontend format
      const transformedLab = await ApiTransformUtils.transformLab(
        apiLabData,
        id, // Use the actual lab ID from the URL
        fetchSubjectData,
        fetchAnalysisData
      );

      setLab(transformedLab);
      setEditForm({
        name: transformedLab.name,
        description: transformedLab.description,
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch lab:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load lab data'
      );
      setLoading(false);
    }
  }, [id, token, fetchSubjectData, fetchAnalysisData]);

  useEffect(() => {
    fetchLabData();
  }, [fetchLabData]);

  // Check if current user is admin of this lab
  const isLabAdmin = (): boolean => {
    if (!user || !lab) return false;
    return lab.adminIds.includes(user._id);
  };

  // Handle edit mode toggle
  const handleEditToggle = (): void => {
    if (isEditing) {
      setEditForm({
        name: lab?.name || '',
        description: lab?.description || '',
      });
      setIsEditing(false);
      setIsEditDialogOpen(false);
    } else {
      setIsEditing(true);
      setIsEditDialogOpen(true);
    }
  };

  // Handle form input changes
  const handleInputChange = (
    field: 'name' | 'description',
    value: string
  ): void => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save changes using real API
  const handleSave = async (): Promise<void> => {
    if (!lab || !token) return;

    setSaving(true);

    try {
      // Use the real API service to update lab info
      const updatedApiData = await labAPIService.updateLabInfo(
        lab.id,
        editForm.name.trim(),
        editForm.description.trim(),
        token
      );

      // Transform the response back to frontend format
      const updatedLab = await ApiTransformUtils.transformLab(
        updatedApiData,
        lab.id,
        fetchSubjectData,
        fetchAnalysisData
      );

      setLab(updatedLab);
      setIsEditing(false);
      setSaving(false);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update lab:', error);
      setError(error instanceof Error ? error.message : 'Failed to update lab');
      setSaving(false);
    }
  };

  // Handle navigation to lab admin settings
  const handleNavigateToSettings = (): void => {
    navigate(`/lab/${id}/admin`);
  };

  // Handle tab change with proper typing - updated to include 'plan'
  const handleTabChange = (value: string): void => {
    const validTabs: LabTab[] = [
      'plan',
      'gather',
      'analyze',
      'forecast',
      'invent',
    ];
    if (validTabs.includes(value as LabTab)) {
      setActiveTab(value as LabTab);
    }
  };

  // Handle archived lab state
  const handleArchivedLabActions = () => {
    // TODO: Get team ID from lab data or context
    const teamId = lab?.teamspaceId || 'default-team';
    navigate(`/team/${teamId}/labs`);
  };

  // Handle contact for deleted lab
  const handleContactFAST = () => {
    const subject = encodeURIComponent('Deleted Lab Recovery Request');
    const body = encodeURIComponent(
      `Hi FAST Team,\n\nI need help recovering a deleted lab:\n\nLab ID: ${id}\nLab Name: ${
        lab?.name || 'Unknown'
      }\nDeleted At: ${
        lab?.deletedAt || 'Unknown'
      }\n\nPlease help me restore this lab if possible.\n\nThanks!`
    );
    window.location.href = `mailto:fasthelp@futurity.systems?subject=${subject}&body=${body}`;
  };

  // Handle terms update for Plan tab
  const handleTermsUpdate = useCallback(
    async (includeTerms: string[], excludeTerms: string[]) => {
      if (!lab) return;

      // Update local state optimistically
      setLab((prev) => (prev ? { ...prev, includeTerms, excludeTerms } : null));
    },
    [lab]
  );

  // Error handling
  if (error) {
    return (
      <Box position='relative' bg='bg' minHeight='calc(100vh - 64px)'>
        <Box
          p={6}
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='400px'
        >
          <VStack gap={4} textAlign='center'>
            <Text fontSize='xl' color='red.500'>
              Error Loading Lab
            </Text>
            <Text color='gray.600'>{error}</Text>
            <Button onClick={() => window.location.reload()} colorScheme='blue'>
              Reload Page
            </Button>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={6} bg='bg' minHeight='calc(100vh - 64px)' color='fg'>
        {/* Header skeleton */}
        <GlassCard variant='outline' w='100%' mb={6} bg='bg.canvas'>
          <Box p={6}>
            <VStack gap={4} align='stretch'>
              <Flex justify='space-between' align='flex-start'>
                <VStack gap={2} align='stretch' flex='1' mr={4}>
                  <Skeleton height='40px' width='300px' />
                  <Skeleton height='60px' width='100%' />
                </VStack>
                <HStack gap={2}>
                  <Skeleton height='40px' width='100px' />
                  <Skeleton height='40px' width='40px' />
                </HStack>
              </Flex>
              <HStack
                gap={6}
                pt={2}
                borderTop='1px solid'
                borderColor='border.muted'
              >
                <Skeleton height='20px' width='80px' />
                <Skeleton height='20px' width='80px' />
                <Skeleton height='20px' width='80px' />
              </HStack>
            </VStack>
          </Box>
        </GlassCard>

        {/* Tab navigation skeleton */}
        <Box position='sticky' top='64px' zIndex='10' mb={6}>
          <GlassCard variant='glass' w='100%' bg='bg.canvas'>
            <Box p={4}>
              <HStack gap={4}>
                <Skeleton height='32px' width='60px' />
                <Skeleton height='32px' width='80px' />
                <Skeleton height='32px' width='80px' />
                <Skeleton height='32px' width='80px' />
                <Skeleton height='32px' width='80px' />
              </HStack>
            </Box>
          </GlassCard>
        </Box>

        {/* Content skeleton */}
        <VStack gap={4} align='stretch'>
          <Skeleton height='200px' width='100%' />
          <Skeleton height='300px' width='100%' />
        </VStack>
      </Box>
    );
  }

  if (!lab) {
    return (
      <Box p={6} bg='bg' minHeight='calc(100vh - 64px)' color='fg'>
        <GlassCard variant='glass' p={6} bg='bg.canvas'>
          <Text>Lab not found</Text>
        </GlassCard>
      </Box>
    );
  }

  // Handle archived lab display
  if (lab.isArchived && !lab.isDeleted) {
    return (
      <Box p={6} bg='bg' minHeight='calc(100vh - 64px)' color='fg'>
        <VStack gap={6} align='center' justify='center' minH='400px'>
          <Alert.Root status='warning' maxW='500px'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Lab Archived</Alert.Title>
              <Alert.Description>
                This lab has been archived and is no longer active.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>

          <VStack gap={3} textAlign='center'>
            <Text fontSize='lg' fontWeight='medium' color='fg'>
              {lab.name}
            </Text>
            <Text color='fg.muted' maxW='400px'>
              {lab.description}
            </Text>
          </VStack>

          <Button onClick={handleArchivedLabActions} colorScheme='blue'>
            <FiArrowLeft size={16} />
            Back to Labs
          </Button>
        </VStack>
      </Box>
    );
  }

  // Handle deleted lab display
  if (lab.isDeleted) {
    return (
      <Box p={6} bg='bg' minHeight='calc(100vh - 64px)' color='fg'>
        <VStack gap={6} align='center' justify='center' minH='400px'>
          <Alert.Root status='error' maxW='500px'>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Lab Deleted</Alert.Title>
              <Alert.Description>
                This lab has been deleted. If this was an accident, please
                contact FAST for help.
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>

          <VStack gap={3} textAlign='center'>
            <Text fontSize='lg' fontWeight='medium' color='fg'>
              {lab.name}
            </Text>
            <Text color='fg.muted' maxW='400px'>
              {lab.description}
            </Text>
            {lab.deletedAt && (
              <Text fontSize='sm' color='fg.muted'>
                Deleted on {new Date(lab.deletedAt).toLocaleDateString()}
              </Text>
            )}
          </VStack>

          <Button onClick={handleContactFAST} colorScheme='red'>
            <FiMail size={16} />
            Contact FAST
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6} bg='bg' minHeight='calc(100vh - 64px)' color='fg'>
      {/* Main Lab Card */}
      <GlassCard variant='outline' w='100%' mb={6} bg='bg.canvas'>
        <Box p={6}>
          <VStack gap={4} align='stretch'>
            {/* Header with Title and Actions */}
            <Flex justify='space-between' align='flex-start'>
              <VStack gap={2} align='stretch' flex='1' mr={4}>
                <Heading as='h1' size='xl' fontFamily='heading' color='fg'>
                  {lab.name}
                </Heading>
                <Text color='fg.muted' lineHeight='1.6' fontFamily='body'>
                  {lab.description}
                </Text>
              </VStack>

              <HStack gap={2}>
                {/* Edit Lab Button - Only show for admins */}
                {isLabAdmin() && (
                  <Button
                    size='md'
                    variant='outline'
                    onClick={handleEditToggle}
                  >
                    <FiEdit size={16} />
                    Edit Lab
                  </Button>
                )}

                {/* Lab Settings Button - Only show for admins */}
                {isLabAdmin() && (
                  <IconButton
                    size='md'
                    variant='ghost'
                    onClick={handleNavigateToSettings}
                    aria-label='Lab Settings'
                  >
                    <FiSettings size={16} />
                  </IconButton>
                )}
              </HStack>
            </Flex>

            {/* Lab Metadata */}
            <HStack
              gap={6}
              pt={2}
              borderTop='1px solid'
              borderColor='border.muted'
            >
              <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                Members: {lab.memberIds.length}
              </Text>
              <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                Subjects: {lab.subjects.length}
              </Text>
              <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                Analyses: {lab.analyses.length}
              </Text>
              <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                Goals: {lab.goals.length}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </GlassCard>

      {/* Sticky Tab Navigation - Updated with Plan tab first */}
      <Box position='sticky' top='64px' zIndex='10' mb={6}>
        <GlassCard variant='glass' w='100%' bg='bg.canvas'>
          <Box p={4}>
            <Tabs.Root
              value={activeTab}
              onValueChange={(details) => handleTabChange(details.value)}
            >
              <Tabs.List>
                <Tabs.Trigger value='plan'>Plan</Tabs.Trigger>
                <Tabs.Trigger value='gather'>Gather</Tabs.Trigger>
                <Tabs.Trigger value='analyze'>Analyze</Tabs.Trigger>
                <Tabs.Trigger value='forecast'>Forecast</Tabs.Trigger>
                <Tabs.Trigger value='invent'>Invent</Tabs.Trigger>
              </Tabs.List>
            </Tabs.Root>
          </Box>
        </GlassCard>
      </Box>

      {/* Tab Content */}
      <Box>
        {activeTab === 'plan' && (
          <Plan
            labId={lab.id}
            lab={lab}
            includeTerms={lab.includeTerms || []}
            excludeTerms={lab.excludeTerms || []}
            onTermsUpdate={handleTermsUpdate}
            onRefreshLab={fetchLabData}
          />
        )}
        {activeTab === 'gather' && (
          <Gather
            labId={lab.id}
            // Remove includeTerms and excludeTerms since they're now handled in Plan tab
            // includeTerms={lab.includeTerms || []}
            // excludeTerms={lab.excludeTerms || []}
            categories={lab.categories || []}
            // Remove onTermsUpdate since terms are now handled in Plan tab
            // onTermsUpdate={(includeTerms, excludeTerms) => {
            //   setLab((prev) =>
            //     prev ? { ...prev, includeTerms, excludeTerms } : null
            //   );
            // }}
            onCategoriesUpdate={(categories) => {
              setLab((prev) => (prev ? { ...prev, categories } : null));
            }}
            onRefreshLab={fetchLabData}
          />
        )}
        {activeTab === 'analyze' && <Analyze labId={lab.id} />}
        {activeTab === 'forecast' && <Forecast labId={lab.id} />}
        {activeTab === 'invent' && <Invent labId={lab.id} />}
      </Box>

      {/* Edit Dialog */}
      <Dialog.Root
        open={isEditDialogOpen}
        onOpenChange={({ open }) => setIsEditDialogOpen(open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg='bg.canvas' borderColor='border.emphasized'>
            <Dialog.Header>
              <Dialog.Title fontFamily='heading' color='fg'>
                Edit Lab Details
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton size='sm' variant='ghost'>
                  <FiX />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align='stretch'>
                <Box>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    mb={2}
                    fontFamily='heading'
                    color='fg'
                  >
                    Lab Name
                  </Text>
                  <Input
                    value={editForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder='Enter lab name...'
                    bg='bg'
                    borderColor='border.muted'
                    color='fg'
                    _placeholder={{ color: 'fg.muted' }}
                    _focus={{
                      borderColor: 'brand',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                    }}
                  />
                </Box>

                <Box>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    mb={2}
                    fontFamily='heading'
                    color='fg'
                  >
                    Lab Description
                  </Text>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder='Enter lab description...'
                    rows={6}
                    resize='vertical'
                    bg='bg'
                    borderColor='border.muted'
                    color='fg'
                    _placeholder={{ color: 'fg.muted' }}
                    _focus={{
                      borderColor: 'brand',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                    }}
                  />
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <HStack gap={3}>
                <Button
                  variant='outline'
                  onClick={handleEditToggle}
                  disabled={saving}
                  color='fg'
                  borderColor='border.emphasized'
                  bg='bg.canvas'
                  _hover={{
                    bg: 'bg.hover',
                  }}
                  fontFamily='heading'
                >
                  Cancel
                </Button>
                <Button
                  variant='solid'
                  onClick={handleSave}
                  loading={saving}
                  bg='brand'
                  color='white'
                  _hover={{
                    bg: 'brand.hover',
                  }}
                  fontFamily='heading'
                >
                  <FiSave size={16} />
                  Save Changes
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
};

export default Lab;
