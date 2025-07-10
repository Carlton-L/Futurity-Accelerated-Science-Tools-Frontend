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
  Tabs,
  Skeleton,
  Alert,
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from '@chakra-ui/react';
import {
  FiSave,
  FiMail,
  FiArrowLeft,
  FiMoreVertical,
  FiChevronRight,
} from 'react-icons/fi';
import { FaClipboardList, FaChartPie, FaChartLine } from 'react-icons/fa';
import { TbCubePlus } from 'react-icons/tb';
import { HiLightBulb } from 'react-icons/hi';
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

  // Get team permission helpers from auth context
  const { isTeamAdmin, isTeamEditor } = useAuth();

  const [lab, setLab] = useState<LabType | null>(null);
  const [apiLabData, setApiLabData] = useState<ApiLab | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingIndexes, setLoadingIndexes] = useState<boolean>(false); // New state for background loading
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

  // 🚀 OPTIMIZATION 1: Parallel subject index fetching
  const fetchSubjectIndexesParallel = useCallback(
    async (lab: LabType): Promise<LabType> => {
      if (!token) {
        console.log('No token available, skipping subject index fetch');
        return lab;
      }

      console.log(
        '🚀 Fetching indexes for',
        lab.subjects.length,
        'subjects in parallel'
      );
      setLoadingIndexes(true);

      // Create all API calls simultaneously
      const indexPromises = lab.subjects.map(async (subject) => {
        try {
          const subjectFsid = subject.subjectSlug.startsWith('fsid_')
            ? subject.subjectSlug
            : `fsid_${subject.subjectSlug}`;

          const response = await fetch(
            `https://fast.futurity.science/management/subjects/${encodeURIComponent(
              subjectFsid
            )}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            console.warn(
              `Failed to fetch data for subject ${subject.subjectName}: ${response.status}`
            );
            return { subject, indexes: null };
          }

          const subjectData = await response.json();

          // Extract index values
          let horizonRank = undefined;
          let techTransfer = undefined;
          let whiteSpace = undefined;

          if (
            subjectData.indexes &&
            Array.isArray(subjectData.indexes) &&
            subjectData.indexes.length > 0
          ) {
            const firstIndex = subjectData.indexes[0];
            if (firstIndex && typeof firstIndex === 'object') {
              horizonRank = firstIndex.HR;
              techTransfer = firstIndex.TT;
              whiteSpace = firstIndex.WS;
            }
          }

          return {
            subject,
            indexes: { horizonRank, techTransfer, whiteSpace },
          };
        } catch (error) {
          console.error(
            `Error fetching data for subject ${subject.subjectName}:`,
            error
          );
          return { subject, indexes: null };
        }
      });

      // Wait for all API calls to complete
      const results = await Promise.all(indexPromises);

      // Apply results to lab data
      const updatedLab = { ...lab };
      const updatedCategories = [...lab.categories];

      let successfulFetches = 0;

      results.forEach(({ subject, indexes }) => {
        if (indexes) {
          const updatedSubject = {
            ...subject,
            horizonRank: indexes.horizonRank,
            techTransfer: indexes.techTransfer,
            whiteSpace: indexes.whiteSpace,
          };

          // Update in main subjects array
          const subjectIndex = updatedLab.subjects.findIndex(
            (s) => s.id === subject.id
          );
          if (subjectIndex !== -1) {
            updatedLab.subjects[subjectIndex] = updatedSubject;
          }

          // Update in categories
          for (const category of updatedCategories) {
            const categorySubjectIndex = category.subjects.findIndex(
              (s) => s.id === subject.id
            );
            if (categorySubjectIndex !== -1) {
              category.subjects[categorySubjectIndex] = updatedSubject;
              break;
            }
          }

          successfulFetches++;
        }
      });

      updatedLab.categories = updatedCategories;
      setLoadingIndexes(false);

      console.log(
        `✅ Successfully fetched indexes for ${successfulFetches}/${lab.subjects.length} subjects`
      );

      return updatedLab;
    },
    [token]
  );

  // 🚀 OPTIMIZATION 2: Optimized transform function with better data structures
  const transformApiLabToFrontendOptimized = useCallback(
    async (apiLab: ApiLab): Promise<LabType> => {
      console.log('🔄 Transforming API lab data (optimized):', apiLab);

      // Use Map for O(1) category lookups
      const categoryMap = new Map<string, SubjectCategory>();
      const allSubjects: LabSubject[] = [];

      // Initialize uncategorized category
      const uncategorizedCategory: SubjectCategory = {
        id: 'uncategorized',
        name: 'Uncategorized',
        type: 'default',
        subjects: [],
        description: 'Default category for new subjects',
      };
      categoryMap.set('uncategorized', uncategorizedCategory);

      // Process subcategories_map efficiently
      if (apiLab.subcategories_map && Array.isArray(apiLab.subcategories_map)) {
        apiLab.subcategories_map.forEach((subcategoryMap) => {
          const isUncategorized =
            subcategoryMap.subcategory_name.toLowerCase() === 'uncategorized';

          let category: SubjectCategory;
          if (isUncategorized) {
            category = uncategorizedCategory;
          } else {
            category = {
              id: subcategoryMap.subcategory_id,
              name: subcategoryMap.subcategory_name,
              type: 'custom',
              subjects: [],
            };
            categoryMap.set(subcategoryMap.subcategory_id, category);
          }

          // Process subjects in this subcategory
          if (
            subcategoryMap.subjects &&
            Array.isArray(subcategoryMap.subjects)
          ) {
            subcategoryMap.subjects.forEach((apiSubject, subjectIndex) => {
              const subjectSlug = apiSubject.ent_fsid.startsWith('fsid_')
                ? apiSubject.ent_fsid.substring(5)
                : apiSubject.ent_fsid;

              const frontendSubject: LabSubject = {
                id: `subj-${category.id}-${subjectIndex}-${apiSubject.ent_fsid}`,
                subjectId: apiSubject.ent_fsid,
                subjectName: apiSubject.ent_name,
                subjectSlug: subjectSlug,
                addedAt: new Date().toISOString(),
                addedById: 'unknown',
                notes: apiSubject.ent_summary || '',
                categoryId: category.id,
                horizonRank: undefined,
                techTransfer: undefined,
                whiteSpace: undefined,
              };

              allSubjects.push(frontendSubject);
              category.subjects.push(frontendSubject);
            });
          }
        });
      }

      // Convert map to array, ensuring uncategorized is first
      const categories = Array.from(categoryMap.values());
      const uncategorizedIndex = categories.findIndex(
        (cat) => cat.id === 'uncategorized'
      );
      if (uncategorizedIndex > 0) {
        const uncategorized = categories.splice(uncategorizedIndex, 1)[0];
        categories.unshift(uncategorized);
      }

      console.log('Transformed categories:', categories);
      console.log('Total subjects:', allSubjects.length);

      return {
        id: apiLab._id,
        uniqueID: apiLab.uniqueID,
        name: apiLab.ent_name,
        description: apiLab.ent_summary || '',
        teamspaceId: 'unknown',
        createdAt: apiLab.createdAt,
        updatedAt: apiLab.updatedAt,
        isArchived: apiLab.status === 'archived',
        isDeleted: apiLab.status === 'deleted',
        deletedAt: apiLab.status === 'deleted' ? apiLab.updatedAt : null,
        goals: [],
        subjects: allSubjects,
        categories: categories,
        analyses: [],
        includeTerms: apiLab.include_terms || [],
        excludeTerms: apiLab.exclude_terms || [],
        miroUrl: apiLab.miro_board_url,
        knowledgebaseId: apiLab.kbid,
        pictureUrl: apiLab.picture_url,
        thumbnailUrl: apiLab.thumbnail_url,
      };
    },
    []
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

  // 🚀 OPTIMIZATION 4: Memoize expensive calculations
  const labStats = useMemo(() => {
    if (!lab) return { subjects: 0, analyses: 0, goals: 0 };

    return {
      subjects: lab.subjects.length,
      analyses: lab.analyses.length,
      goals: apiLabData?.goals?.length || 0,
    };
  }, [lab, apiLabData]);

  // Set up page context when lab data is loaded or tab changes
  useEffect(() => {
    if (labPageContext) {
      setPageContext(labPageContext);
    }

    return () => clearPageContext();
  }, [setPageContext, clearPageContext, labPageContext]);

  // 🚀 OPTIMIZATION 3: Show UI immediately, load indexes in background
  const fetchLabData = useCallback(async (): Promise<void> => {
    console.log('🚀 Starting optimized lab data fetch for uniqueID:', id);
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
      // Step 1: Fetch lab data
      const apiLabData = await labService.getLabById(id, token);
      console.log('✅ Got lab data from API:', {
        _id: apiLabData._id,
        uniqueID: apiLabData.uniqueID,
        urlParam: id,
      });

      // Step 2: Transform to frontend format (without indexes)
      const transformedLab = await transformApiLabToFrontendOptimized(
        apiLabData
      );
      console.log('✅ Transformed lab data');

      // Step 3: Set lab data immediately (show UI)
      setApiLabData(apiLabData);
      setLab(transformedLab);
      setHeaderForm({
        name: transformedLab.name,
        description: transformedLab.description,
      });
      setLoading(false); // ✨ Stop loading here - UI shows immediately!

      // Step 4: Fetch subject indexes in background (parallel)
      if (transformedLab.subjects.length > 0) {
        console.log('🔄 Fetching subject indexes in background...');
        const labWithIndexes = await fetchSubjectIndexesParallel(
          transformedLab
        );

        // Step 5: Update lab with indexes (triggers re-render with complete data)
        setLab(labWithIndexes);
        console.log('✅ Background index loading complete');
      }
    } catch (error) {
      console.error('❌ Failed to fetch lab:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to load lab data');
      }
      setLoading(false);
    }
  }, [
    id,
    token,
    transformApiLabToFrontendOptimized,
    fetchSubjectIndexesParallel,
  ]);

  useEffect(() => {
    fetchLabData();
  }, [fetchLabData]);

  // Check if current user can edit this lab (team admin or editor)
  const canEditLab = (): boolean => {
    if (!user) return false;

    // Use the auth context helper methods to check team permissions
    // Allow both team admins and editors to edit labs
    return isTeamAdmin() || isTeamEditor();
  };

  // Handle header edit mode toggle
  const handleHeaderEditToggle = (): void => {
    if (isEditingHeader) {
      setHeaderForm({
        name: lab?.name || '',
        description: lab?.description || '',
      });
      setIsEditingHeader(false);
    } else {
      setIsEditingHeader(true);
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
      const updatedLab = await transformApiLabToFrontendOptimized(
        updatedApiLab
      );
      setLab(updatedLab);

      setIsEditingHeader(false);
      setSaving(false);

      console.log('Successfully updated lab info');
    } catch (error) {
      console.error('Failed to update lab:', error);
      setError(error instanceof Error ? error.message : 'Failed to update lab');
      setSaving(false);
    }
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
        const updatedLab = await transformApiLabToFrontendOptimized(
          updatedApiLab
        );
        setLab(updatedLab);

        console.log('Successfully updated lab terms');
      } catch (error) {
        console.error('Failed to update terms:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to update terms'
        );
      }
    },
    [lab, token, id, transformApiLabToFrontendOptimized]
  );

  // Tab configuration with icons
  const tabConfig = [
    { value: 'plan', label: 'Plan', icon: FaClipboardList },
    { value: 'gather', label: 'Gather', icon: TbCubePlus },
    { value: 'analyze', label: 'Analyze', icon: FaChartPie },
    { value: 'forecast', label: 'Forecast', icon: FaChartLine },
    { value: 'invent', label: 'Invent', icon: HiLightBulb },
  ];

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
                <VStack gap={2} align='stretch' flex='1'>
                  <Skeleton height='40px' width='300px' />
                  <Skeleton height='60px' width='100%' />
                </VStack>
                <Box flexShrink={0} ml={4}>
                  <Skeleton height='40px' width='40px' />
                </Box>
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
              <VStack gap={2} align='stretch' flex='1'>
                {/* Title - Editable or Display */}
                {isEditingHeader ? (
                  <Input
                    value={headerForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder='Enter lab name...'
                    size='lg'
                    fontSize='xl'
                    fontWeight='bold'
                    fontFamily='heading'
                    bg='bg.canvas'
                    borderColor='border.emphasized'
                    color='fg'
                    _placeholder={{ color: 'fg.muted' }}
                    _focus={{
                      borderColor: 'brand',
                      boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                    }}
                  />
                ) : (
                  <Heading as='h1' size='xl' fontFamily='heading' color='fg'>
                    {lab.name}
                  </Heading>
                )}

                {/* Description - Editable or Display */}
                {isEditingHeader ? (
                  <Textarea
                    value={headerForm.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder='Enter lab description...'
                    rows={3}
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
                ) : (
                  <Text color='fg.muted' lineHeight='1.6' fontFamily='body'>
                    {lab.description}
                  </Text>
                )}

                {/* Edit Mode Buttons */}
                {isEditingHeader && (
                  <HStack gap={3} mt={2}>
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
                      size='sm'
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
                      size='sm'
                    >
                      <FiSave size={16} />
                      Save Changes
                    </Button>
                  </HStack>
                )}
              </VStack>

              {/* Three-Dot Menu - Only show for team admins and editors and not in edit mode */}
              {canEditLab() && !isEditingHeader && (
                <Box position='relative' flexShrink={0} ml={4}>
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
                    <MenuContent
                      bg='bg.canvas'
                      borderColor='border.emphasized'
                      position='absolute'
                      right={0}
                      top='100%'
                      zIndex={1000}
                      minW='200px'
                    >
                      <MenuItem
                        value='edit-lab'
                        onClick={handleHeaderEditToggle}
                        color='fg'
                        _hover={{ bg: 'bg.hover' }}
                      >
                        Edit lab title and description
                      </MenuItem>
                    </MenuContent>
                  </MenuRoot>
                </Box>
              )}
            </Flex>

            {/* Lab Metadata with loading indicator */}
            <HStack
              gap={6}
              pt={2}
              borderTop='1px solid'
              borderColor='border.muted'
            >
              <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                Subjects: {labStats.subjects}
                {loadingIndexes && (
                  <Text as='span' color='brand' ml={2}>
                    (loading metrics...)
                  </Text>
                )}
              </Text>
              <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                Analyses: {labStats.analyses}
              </Text>
              <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                Goals: {labStats.goals}
              </Text>
            </HStack>
          </VStack>
        </Box>
      </GlassCard>

      {/* Enhanced Sticky Tab Navigation with Icons and Arrows */}
      <Box position='sticky' top='64px' zIndex='10' mb={6}>
        <GlassCard variant='glass' w='100%' bg='bg.canvas'>
          <Box p={4}>
            <Tabs.Root
              value={activeTab}
              onValueChange={(details) => handleTabChange(details.value)}
            >
              <Box position='relative'>
                <Tabs.List>
                  {tabConfig.map((tab, index) => {
                    const IconComponent = tab.icon;

                    return (
                      <React.Fragment key={tab.value}>
                        <Tabs.Trigger
                          value={tab.value}
                          display='flex'
                          alignItems='center'
                          gap={2}
                        >
                          <IconComponent size={16} />
                          {tab.label}
                        </Tabs.Trigger>

                        {/* Arrow between tabs */}
                        {index < tabConfig.length - 1 && (
                          <Box
                            display='flex'
                            alignItems='center'
                            px={2}
                            color='fg.muted'
                            fontSize='xs'
                          >
                            <FiChevronRight size={12} />
                          </Box>
                        )}
                      </React.Fragment>
                    );
                  })}
                </Tabs.List>
              </Box>
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
            loadingIndexes={loadingIndexes} // Pass loading state to show progressive loading
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
    </Box>
  );
};

export default Lab;
