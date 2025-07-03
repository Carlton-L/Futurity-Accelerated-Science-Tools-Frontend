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
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
  Field,
} from '@chakra-ui/react';
import {
  FiEdit,
  FiSave,
  FiX,
  FiSettings,
  FiMail,
  FiArrowLeft,
  FiMoreVertical,
} from 'react-icons/fi';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePage } from '../../context/PageContext';
import GlassCard from '../../components/shared/GlassCard';
import type { Lab as LabType, SubjectCategory, LabSubject } from './types';
import type { LabTab } from '../../context/PageContext/pageTypes';
import Plan from './Plan';
import Gather from './Gather';
import Analyze from './Analyze';
import Forecast from './Forecast';
import Invent from './Invent';
import { labService, type Lab as ApiLab } from '../../services/labService';

const Lab: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { setPageContext, clearPageContext } = usePage();

  const [lab, setLab] = useState<LabType | null>(null);
  const [apiLabData, setApiLabData] = useState<ApiLab | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingHeader, setIsEditingHeader] = useState<boolean>(false);
  const [headerForm, setHeaderForm] = useState<{
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

  // Transform API lab data to frontend format using new subcategories_map structure
  const transformApiLabToFrontend = useCallback((apiLab: ApiLab): LabType => {
    console.log('Transforming API lab data:', apiLab);

    // Initialize categories array with default uncategorized
    const categories: SubjectCategory[] = [];

    // Add default uncategorized category first
    const uncategorizedCategory: SubjectCategory = {
      id: 'uncategorized',
      name: 'Uncategorized',
      type: 'default',
      subjects: [],
      description: 'Default category for new subjects',
    };

    // Process subcategories_map to create categories and subjects
    const allSubjects: LabSubject[] = [];

    if (apiLab.subcategories_map && Array.isArray(apiLab.subcategories_map)) {
      apiLab.subcategories_map.forEach((subcategoryMap, index) => {
        // Determine if this is the uncategorized category
        const isUncategorized =
          subcategoryMap.subcategory_name.toLowerCase() === 'uncategorized';

        // Create category object
        const category: SubjectCategory = {
          id: isUncategorized ? 'uncategorized' : subcategoryMap.subcategory_id,
          name: subcategoryMap.subcategory_name,
          type: isUncategorized ? 'default' : 'custom',
          subjects: [],
          description: isUncategorized
            ? 'Default category for new subjects'
            : undefined,
        };

        // Process subjects in this subcategory
        if (subcategoryMap.subjects && Array.isArray(subcategoryMap.subjects)) {
          subcategoryMap.subjects.forEach((apiSubject, subjectIndex) => {
            // Parse slug from ent_fsid by removing fsid_ prefix
            const subjectSlug = apiSubject.ent_fsid.startsWith('fsid_')
              ? apiSubject.ent_fsid.substring(5)
              : apiSubject.ent_fsid;

            const frontendSubject: LabSubject = {
              id: `subj-${index}-${subjectIndex}-${apiSubject.ent_fsid}`,
              subjectId: apiSubject.ent_fsid, // Use ent_fsid as the ID for association
              subjectName: apiSubject.ent_name,
              subjectSlug: subjectSlug,
              addedAt: new Date().toISOString(),
              addedById: 'unknown',
              notes: apiSubject.ent_summary || '',
              categoryId: category.id,
              // Add index data if available
              horizonRank: apiSubject.indexes?.[0]?.HR,
              techTransfer: apiSubject.indexes?.[0]?.TT,
              whiteSpace: apiSubject.indexes?.[0]?.WS,
            };

            allSubjects.push(frontendSubject);
            category.subjects.push(frontendSubject);
          });
        }

        // Add category to list (replace uncategorized if this is the uncategorized category)
        if (isUncategorized) {
          // Update the uncategorized category with subjects
          uncategorizedCategory.subjects = category.subjects;
        } else {
          categories.push(category);
        }
      });
    }

    // Always ensure uncategorized is first in the list
    categories.unshift(uncategorizedCategory);

    console.log('Transformed categories:', categories);
    console.log('Transformed subjects:', allSubjects);

    return {
      id: apiLab._id,
      uniqueID: apiLab.uniqueID,
      name: apiLab.ent_name,
      description: apiLab.ent_summary || '',
      teamspaceId: 'unknown', // Not provided in new API - will need to get from context
      createdAt: apiLab.createdAt,
      updatedAt: apiLab.updatedAt,
      isArchived: apiLab.status === 'archived',
      isDeleted: apiLab.status === 'deleted',
      deletedAt: apiLab.status === 'deleted' ? apiLab.updatedAt : null,
      adminIds: ['current-user'], // TODO: Get from team management API
      editorIds: [],
      memberIds: ['current-user'],
      goals: [], // TODO: Transform API goals to frontend format
      subjects: allSubjects,
      categories: categories,
      analyses: [], // Will be loaded separately
      includeTerms: apiLab.include_terms || [],
      excludeTerms: apiLab.exclude_terms || [],
      miroUrl: apiLab.miro_board_url,
      knowledgebaseId: apiLab.kbid,
      pictureUrl: apiLab.picture_url,
      thumbnailUrl: apiLab.thumbnail_url,
    };
  }, []);

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
    console.log('Starting to fetch lab data for uniqueID:', id);
    setLoading(true);
    setError(null);

    if (!id) {
      setError('Missing lab unique ID');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    try {
      // Use the enhanced lab service with the uniqueID from URL params
      const apiLabData = await labService.getLabById(id, token);
      console.log('Successfully fetched lab data from API:', {
        _id: apiLabData._id,
        uniqueID: apiLabData.uniqueID,
        urlParam: id,
      });

      // Store the raw API data
      setApiLabData(apiLabData);

      // Transform API data to frontend format
      const transformedLab = transformApiLabToFrontend(apiLabData);
      console.log('Transformed lab IDs:', {
        frontendId: transformedLab.id,
        uniqueID: transformedLab.uniqueID,
        urlParam: id,
      });

      setLab(transformedLab);
      setHeaderForm({
        name: transformedLab.name,
        description: transformedLab.description,
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch lab:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to load lab data');
      }
      setLoading(false);
    }
  }, [id, token, transformApiLabToFrontend]);

  useEffect(() => {
    fetchLabData();
  }, [fetchLabData]);

  // Check if current user is admin of this lab
  const isLabAdmin = (): boolean => {
    if (!user || !lab) return false;
    return lab.adminIds.includes(user._id);
  };

  // Handle header edit mode toggle
  const handleHeaderEditToggle = (): void => {
    if (isEditingHeader) {
      setHeaderForm({
        name: lab?.name || '',
        description: lab?.description || '',
      });
      setIsEditingHeader(false);
      setIsEditDialogOpen(false);
    } else {
      setIsEditingHeader(true);
      setIsEditDialogOpen(true);
    }
  };

  // Handle form input changes
  const handleInputChange = (
    field: 'name' | 'description',
    value: string
  ): void => {
    setHeaderForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save changes using real API
  const handleSave = async (): Promise<void> => {
    if (!lab || !token || !id) return;

    setSaving(true);

    try {
      // Use the enhanced lab service to update using uniqueID
      const updatedApiLab = await labService.updateLabInfo(
        lab.uniqueID || id, // Use uniqueID first, fallback to URL param
        headerForm.name.trim(),
        headerForm.description.trim(),
        token
      );

      // Update both the API data and transformed lab
      setApiLabData(updatedApiLab);
      const updatedLab = transformApiLabToFrontend(updatedApiLab);
      setLab(updatedLab);

      setIsEditingHeader(false);
      setSaving(false);
      setIsEditDialogOpen(false);

      console.log('Successfully updated lab info');
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
      if (!lab || !token || !id) return;

      try {
        // Update via API using the uniqueID (from URL params) not the MongoDB _id
        const updatedApiLab = await labService.updateLabTerms(
          lab.uniqueID || id, // Use uniqueID first, fallback to URL param
          includeTerms,
          excludeTerms,
          token
        );

        // Update both the API data and transformed lab
        setApiLabData(updatedApiLab);
        const updatedLab = transformApiLabToFrontend(updatedApiLab);
        setLab(updatedLab);

        console.log('Successfully updated lab terms');
      } catch (error) {
        console.error('Failed to update terms:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to update terms'
        );
      }
    },
    [lab, token, id, transformApiLabToFrontend]
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
      {/* Main Lab Card with Three-Dot Menu */}
      <GlassCard
        variant='outline'
        w='100%'
        mb={6}
        bg='bg.canvas'
        borderColor='border.emphasized'
      >
        <Box p={6}>
          <VStack gap={4} align='stretch'>
            {/* Header with Title and Three-Dot Menu */}
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
                {/* Lab Settings Button - Only show for admins */}
                {isLabAdmin() && (
                  <IconButton
                    size='md'
                    variant='ghost'
                    onClick={handleNavigateToSettings}
                    aria-label='Lab Settings'
                    color='fg'
                    _hover={{ bg: 'bg.hover' }}
                  >
                    <FiSettings size={16} />
                  </IconButton>
                )}

                {/* Three-Dot Menu - Only show for admins */}
                {isLabAdmin() && (
                  <MenuRoot>
                    <MenuTrigger asChild>
                      <IconButton
                        size='md'
                        variant='ghost'
                        aria-label='Lab Options'
                        color='fg.muted'
                        _hover={{ bg: 'bg.hover' }}
                      >
                        <FiMoreVertical size={16} />
                      </IconButton>
                    </MenuTrigger>
                    <MenuContent bg='bg.canvas' borderColor='border.emphasized'>
                      <MenuItem
                        onClick={handleHeaderEditToggle}
                        color='fg'
                        _hover={{ bg: 'bg.hover' }}
                      >
                        <FiEdit size={14} />
                        Edit lab title and description
                      </MenuItem>
                    </MenuContent>
                  </MenuRoot>
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
                Goals: {apiLabData?.goals?.length || 0}
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

      {/* Tab Content - Pass uniqueID instead of id */}
      <Box>
        {activeTab === 'plan' && (
          <Plan
            labId={lab.uniqueID || id || ''} // Use uniqueID first, fallback to URL param
            lab={lab}
            includeTerms={apiLabData?.include_terms || lab.includeTerms || []}
            excludeTerms={apiLabData?.exclude_terms || lab.excludeTerms || []}
            onTermsUpdate={handleTermsUpdate}
            onRefreshLab={fetchLabData}
          />
        )}
        {activeTab === 'gather' && (
          <Gather
            labId={lab.uniqueID || id || ''} // Use uniqueID first, fallback to URL param
            labName={lab.name}
            categories={lab.categories || []}
            onCategoriesUpdate={(categories) => {
              setLab((prev) => (prev ? { ...prev, categories } : null));
            }}
            onRefreshLab={fetchLabData}
          />
        )}
        {activeTab === 'analyze' && (
          <Analyze
            labId={lab.uniqueID || id || ''}
            labUniqueID={lab.uniqueID}
          />
        )}
        {activeTab === 'forecast' && (
          <Forecast labId={lab.uniqueID || id || ''} />
        )}
        {activeTab === 'invent' && <Invent labId={lab.uniqueID || id || ''} />}
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
                <IconButton
                  size='sm'
                  variant='ghost'
                  color='fg'
                  _hover={{ bg: 'bg.hover' }}
                >
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
                    value={headerForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder='Enter lab name...'
                    bg='bg.canvas'
                    borderColor='border.emphasized'
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
                    value={headerForm.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder='Enter lab description...'
                    rows={6}
                    resize='vertical'
                    bg='bg.canvas'
                    borderColor='border.emphasized'
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
                  onClick={handleHeaderEditToggle}
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
