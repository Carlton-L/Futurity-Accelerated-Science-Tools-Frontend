import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  IconButton,
  Accordion,
  Badge,
  Skeleton,
} from '@chakra-ui/react';
import {
  FiTarget,
  FiFilter,
  FiEdit,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiAlertCircle,
  FiInfo,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiGlobe,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import {
  labService,
  type ApiLabGoal,
  type Lab as ApiLabResponse,
} from '../../services/labService';
import type { Lab } from './types';
import AddGoalDialog from './AddGoalDialog';

// Term interface for the UI
interface TermItem {
  id: string;
  text: string;
  type: 'include' | 'exclude';
  isLoading?: boolean;
  source: 'api' | 'manual';
}

// Goal interface with loading state
interface GoalItem extends ApiLabGoal {
  id: string;
  isLoading?: boolean;
  isTemporary?: boolean;
}

interface PlanProps {
  labId: string;
  lab?: Lab | null;
  includeTerms: string[];
  excludeTerms: string[];
  onTermsUpdate: (
    includeTerms: string[],
    excludeTerms: string[]
  ) => Promise<void>;
  onRefreshLab?: () => Promise<void>;
}

const Plan: React.FC<PlanProps> = ({
  labId,
  lab,
  includeTerms,
  excludeTerms,
  onTermsUpdate,
  onRefreshLab,
}) => {
  const { token, user } = useAuth();

  // Lab data state
  const [labData, setLabData] = useState<ApiLabResponse | null>(null);
  const [loadingLabData, setLoadingLabData] = useState(false);

  // Goals state with loading management
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ApiLabGoal | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Terms state
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [isAddingTerm, setIsAddingTerm] = useState(false);
  const [newTermText, setNewTermText] = useState('');
  const [newTermType, setNewTermType] = useState<'include' | 'exclude'>(
    'include'
  );
  const [validationError, setValidationError] = useState('');

  // Loading states
  const [savingGoals, setSavingGoals] = useState(false); // Remove this as we're not using it anymore

  // Error states
  const [error, setError] = useState<string>('');

  // Helper function to get readable region names
  const getRegionDisplayName = useCallback((regionValue: string): string => {
    // Map of region values to display names
    const regionNames: Record<string, string> = {
      // Continents
      africa: 'Africa',
      antarctica: 'Antarctica',
      asia: 'Asia',
      europe: 'Europe',
      'north-america': 'North America',
      oceania: 'Oceania',
      'south-america': 'South America',

      // UN Subregions - Africa
      'northern-africa': 'Northern Africa',
      'sub-saharan-africa': 'Sub-Saharan Africa',
      'eastern-africa': 'Eastern Africa',
      'middle-africa': 'Middle Africa',
      'southern-africa': 'Southern Africa',
      'western-africa': 'Western Africa',

      // UN Subregions - Americas
      latam: 'Latin America and the Caribbean',
      caribbean: 'Caribbean',
      'central-america': 'Central America',
      'south-america-un': 'South America',
      'northern-america': 'Northern America',

      // UN Subregions - Asia
      'central-asia': 'Central Asia',
      'eastern-asia': 'Eastern Asia',
      'south-eastern-asia': 'South-Eastern Asia',
      'southern-asia': 'Southern Asia',
      'western-asia': 'Western Asia',

      // UN Subregions - Europe
      'eastern-europe': 'Eastern Europe',
      'northern-europe': 'Northern Europe',
      'southern-europe': 'Southern Europe',
      'western-europe': 'Western Europe',

      // UN Subregions - Oceania
      'australia-new-zealand': 'Australia and New Zealand',
      melanesia: 'Melanesia',
      micronesia: 'Micronesia',
      polynesia: 'Polynesia',

      // Economic/Trade
      eu: 'European Union',
      eea: 'European Economic Area',
      schengen: 'Schengen Area',
      eurozone: 'Eurozone',
      mercosur: 'MERCOSUR',
      'nafta-usmca': 'NAFTA/USMCA',
      asean: 'ASEAN',
      gcc: 'Gulf Cooperation Council',
      efta: 'European Free Trade Association',
      au: 'African Union',
      caricom: 'CARICOM',
      apec: 'APEC',
      saarc: 'SAARC',
      cis: 'Commonwealth of Independent States',

      // Cultural/Linguistic
      anglophone: 'Anglophone World',
      francophone: 'Francophone World',
      lusophone: 'Lusophone World',
      'arab-world': 'Arab World',
      hispanophone: 'Hispanophone World',
      'latin-world': 'Latin World',
      'chinese-cultural': 'Chinese Cultural Sphere',
      'post-soviet': 'Post-Soviet States',

      // Geopolitical
      nato: 'NATO',
      brics: 'BRICS',
      g7: 'G7',
      g20: 'G20',
      'non-aligned': 'Non-Aligned Movement',
      oecd: 'OECD',
      opec: 'OPEC',
      'five-eyes': 'Five Eyes',
      commonwealth: 'Commonwealth of Nations',
      'global-majority': 'Global Majority',
    };

    return regionNames[regionValue] || regionValue;
  }, []);

  // Helper function to format regions for display
  const formatRegionsDisplay = useCallback(
    (regions: string[]): string => {
      if (!regions || regions.length === 0) return '';

      if (regions.length === 1) {
        return getRegionDisplayName(regions[0]);
      }

      if (regions.length === 2) {
        return `${getRegionDisplayName(regions[0])} and ${getRegionDisplayName(
          regions[1]
        )}`;
      }

      if (regions.length <= 3) {
        const lastRegion = regions[regions.length - 1];
        const otherRegions = regions.slice(0, -1);
        return `${otherRegions
          .map(getRegionDisplayName)
          .join(', ')}, and ${getRegionDisplayName(lastRegion)}`;
      }

      // For more than 3 regions, show first few and count
      return `${getRegionDisplayName(regions[0])}, ${getRegionDisplayName(
        regions[1]
      )}, and ${regions.length - 2} more`;
    },
    [getRegionDisplayName]
  );

  // Generate term items from lab data
  const generateTermItems = useCallback(
    (apiLab: ApiLabResponse): TermItem[] => {
      const termItems: TermItem[] = [];

      // Add include terms
      (apiLab.include_terms || []).forEach((term, index) => {
        termItems.push({
          id: `include-${index}-${term}`,
          text: term,
          type: 'include',
          source: 'api',
        });
      });

      // Add exclude terms
      (apiLab.exclude_terms || []).forEach((term, index) => {
        termItems.push({
          id: `exclude-${index}-${term}`,
          text: term,
          type: 'exclude',
          source: 'api',
        });
      });

      return termItems;
    },
    []
  );

  // Generate goal items from lab data
  const generateGoalItems = useCallback(
    (apiLab: ApiLabResponse): GoalItem[] => {
      return (apiLab.goals || []).map((goal, index) => ({
        ...goal,
        id: `goal-${index}-${goal.name}`,
      }));
    },
    []
  );

  // Load lab data from API
  const loadLabData = useCallback(async () => {
    if (!token || !labId) return;

    setLoadingLabData(true);
    setError('');

    try {
      const apiLabData = await labService.getLabById(labId, token);
      setLabData(apiLabData);
      setGoals(generateGoalItems(apiLabData));
      setTerms(generateTermItems(apiLabData));

      console.log('Loaded lab data:', apiLabData);
    } catch (error) {
      console.error('Failed to load lab data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load lab data'
      );
    } finally {
      setLoadingLabData(false);
    }
  }, [token, labId, generateTermItems, generateGoalItems]);

  // Initialize data when component mounts or dependencies change
  useEffect(() => {
    loadLabData();
  }, [loadLabData]);

  // Handle goal form changes with local state management
  const handleSaveGoal = useCallback(
    async (goalToAdd: ApiLabGoal) => {
      if (!token || !labId) return;

      setError('');

      try {
        if (isEditingGoal && editingGoal) {
          // Update existing goal - find the goal by matching content
          const goalIndex = goals.findIndex(
            (g) =>
              g.name === editingGoal.name &&
              g.description === editingGoal.description
          );

          if (goalIndex >= 0) {
            // Set loading state for this specific goal in the background
            setGoals((prev) =>
              prev.map((goal, index) =>
                index === goalIndex ? { ...goal, isLoading: true } : goal
              )
            );

            // Close dialog immediately - save happens in background
            setIsEditingGoal(false);
            setEditingGoal(null);

            // Make API call in background
            const currentLab = await labService.getLabById(labId, token);
            const updatedGoals = (currentLab.goals || []).map((goal) =>
              goal.name === editingGoal.name &&
              goal.description === editingGoal.description
                ? goalToAdd
                : goal
            );

            const updatedLab = await labService.updateLabGoals(
              labId,
              updatedGoals,
              token
            );

            // Update lab data and regenerate goals
            setLabData(updatedLab);
            setGoals(generateGoalItems(updatedLab));
          }
        } else {
          // Add new goal - create temporary goal item for immediate feedback
          const tempGoal: GoalItem = {
            ...goalToAdd,
            id: `temp-${Date.now()}`,
            isLoading: true,
            isTemporary: true,
          };

          setGoals((prev) => [...prev, tempGoal]);

          // Close dialog immediately - save happens in background
          setIsAddingGoal(false);

          // Make API call in background
          const updatedLab = await labService.addLabGoal(
            labId,
            goalToAdd,
            token
          );

          // Update lab data and regenerate goals from API response
          setLabData(updatedLab);
          setGoals(generateGoalItems(updatedLab));
        }

        console.log('Successfully saved goal:', goalToAdd);
      } catch (error) {
        console.error('Failed to save goal:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to save goal'
        );

        // Remove temporary goal on error or reload goals to restore correct state
        if (!isEditingGoal) {
          setGoals((prev) => prev.filter((g) => !g.isTemporary));
        } else {
          // Reload goals to restore correct state
          if (labData) {
            setGoals(generateGoalItems(labData));
          }
        }
      }
    },
    [
      token,
      labId,
      isEditingGoal,
      editingGoal,
      goals,
      generateGoalItems,
      labData,
    ]
  );

  // Handle goal editing
  const handleEditGoal = useCallback((goal: ApiLabGoal) => {
    setEditingGoal(goal);
    setIsEditingGoal(true);
  }, []);

  // Handle goal dialog close
  const handleCloseGoalDialog = useCallback(() => {
    setIsAddingGoal(false);
    setIsEditingGoal(false);
    setEditingGoal(null);
  }, []);

  // Remove goal with local state management
  const handleRemoveGoal = useCallback(
    async (goalToRemove: ApiLabGoal) => {
      if (!token || !labId) return;

      // Find the goal in our local state
      const goalIndex = goals.findIndex(
        (g) =>
          g.name === goalToRemove.name &&
          g.description === goalToRemove.description
      );

      if (goalIndex >= 0) {
        try {
          // Set loading state for this specific goal
          setGoals((prev) =>
            prev.map((goal, index) =>
              index === goalIndex ? { ...goal, isLoading: true } : goal
            )
          );

          const updatedLab = await labService.removeLabGoalByContent(
            labId,
            goalToRemove,
            token
          );

          // Update lab data and regenerate goals
          setLabData(updatedLab);
          setGoals(generateGoalItems(updatedLab));

          console.log('Successfully removed goal:', goalToRemove);
        } catch (error) {
          console.error('Failed to remove goal:', error);
          setError(
            error instanceof Error ? error.message : 'Failed to remove goal'
          );

          // Remove loading state on error
          setGoals((prev) =>
            prev.map((goal, index) =>
              index === goalIndex ? { ...goal, isLoading: false } : goal
            )
          );
        }
      }
    },
    [token, labId, goals, generateGoalItems]
  );

  // Validate new term
  const validateTerm = useCallback(
    (text: string) => {
      const trimmedText = text.trim();

      if (!trimmedText) return '';

      // Check if term already exists
      const termExists = terms.some(
        (term) => term.text.toLowerCase() === trimmedText.toLowerCase()
      );

      if (termExists) {
        return `"${trimmedText}" already exists in your terms list`;
      }

      return '';
    },
    [terms]
  );

  // Handle term addition
  const handleAddTerm = useCallback(async () => {
    if (!newTermText.trim() || !token) return;

    const error = validateTerm(newTermText);
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      // Create temporary term item for immediate UI feedback
      const tempTerm: TermItem = {
        id: `temp-${Date.now()}`,
        text: newTermText.trim(),
        type: newTermType,
        isLoading: true,
        source: 'manual',
      };

      setTerms((prev) => [...prev, tempTerm]);
      setNewTermText('');
      setValidationError('');
      setIsAddingTerm(false);

      // Make API call
      const updatedLab =
        newTermType === 'include'
          ? await labService.addIncludeTerm(labId, newTermText.trim(), token)
          : await labService.addExcludeTerm(labId, newTermText.trim(), token);

      // Update lab data and regenerate terms from API response
      setLabData(updatedLab);
      setTerms(generateTermItems(updatedLab));

      // Call parent callback to update lab context
      if (onTermsUpdate) {
        await onTermsUpdate(
          updatedLab.include_terms || [],
          updatedLab.exclude_terms || []
        );
      }

      console.log('Successfully added term:', newTermText.trim());
    } catch (error) {
      console.error('Failed to add term:', error);
      setError(error instanceof Error ? error.message : 'Failed to add term');

      // Remove the temporary term on error
      setTerms((prev) => prev.filter((t) => !t.id.startsWith('temp-')));
    }
  }, [
    newTermText,
    newTermType,
    token,
    labId,
    validateTerm,
    generateTermItems,
    onTermsUpdate,
  ]);

  // Handle term deletion
  const handleDeleteTerm = useCallback(
    async (termItem: TermItem) => {
      if (!token) return;

      try {
        // Remove from UI immediately
        setTerms((prev) => prev.filter((t) => t.id !== termItem.id));

        // Make API call
        const updatedLab =
          termItem.type === 'include'
            ? await labService.removeIncludeTerm(labId, termItem.text, token)
            : await labService.removeExcludeTerm(labId, termItem.text, token);

        // Update lab data
        setLabData(updatedLab);

        // Call parent callback to update lab context
        if (onTermsUpdate) {
          await onTermsUpdate(
            updatedLab.include_terms || [],
            updatedLab.exclude_terms || []
          );
        }

        console.log('Successfully removed term:', termItem.text);
      } catch (error) {
        console.error('Failed to remove term:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to remove term'
        );

        // Reload lab data to restore correct state
        loadLabData();
      }
    },
    [token, labId, onTermsUpdate, loadLabData]
  );

  // Handle term type toggle
  const handleToggleTermType = useCallback(
    async (termItem: TermItem) => {
      if (!token) return;

      try {
        // Set loading state for this specific term
        setTerms((prev) =>
          prev.map((t) =>
            t.id === termItem.id ? { ...t, isLoading: true } : t
          )
        );

        // Make API call
        const updatedLab = await labService.toggleTermType(
          labId,
          termItem.text,
          termItem.type,
          token
        );

        // Update lab data and regenerate terms from API response
        setLabData(updatedLab);
        setTerms(generateTermItems(updatedLab));

        // Call parent callback to update lab context
        if (onTermsUpdate) {
          await onTermsUpdate(
            updatedLab.include_terms || [],
            updatedLab.exclude_terms || []
          );
        }

        console.log('Successfully toggled term type:', termItem.text);
      } catch (error) {
        console.error('Failed to toggle term type:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to toggle term type'
        );

        // Remove loading state and reload data to restore correct state
        setTerms((prev) =>
          prev.map((t) =>
            t.id === termItem.id ? { ...t, isLoading: false } : t
          )
        );
        loadLabData();
      }
    },
    [token, labId, generateTermItems, onTermsUpdate, loadLabData]
  );

  // Handle input changes with validation
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setNewTermText(value);

      // Clear error when user starts typing
      if (validationError) {
        setValidationError('');
      }

      // Real-time validation
      if (value.trim()) {
        const error = validateTerm(value);
        setValidationError(error);
      }
    },
    [validationError, validateTerm]
  );

  // Handle input key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddTerm();
      } else if (e.key === 'Escape') {
        setNewTermText('');
        setValidationError('');
        setIsAddingTerm(false);
      }
    },
    [handleAddTerm]
  );

  // Get impact level description
  const getImpactDescription = (level: number): string => {
    if (level === 100) return 'Existential Game-Changer';
    if (level >= 90) return 'Civilizational Shifter';
    if (level >= 80) return 'Global Transformer';
    if (level >= 70) return 'Societal Catalyst';
    if (level >= 60) return 'Systemic Improver';
    if (level >= 50) return 'Cultural Shaper';
    if (level >= 40) return 'Wider Reach';
    if (level >= 30) return 'Community Enhancer';
    if (level >= 20) return 'Everyday Convenience';
    if (level >= 10) return 'Niche Value';
    return 'Personal Spark';
  };

  // Display current data
  const includeTermsCount = terms.filter((t) => t.type === 'include').length;
  const excludeTermsCount = terms.filter((t) => t.type === 'exclude').length;

  if (loadingLabData) {
    return (
      <VStack gap={6} align='stretch'>
        <Card.Root
          variant='outline'
          borderColor='border.emphasized'
          bg='bg.canvas'
        >
          <Card.Body p={6}>
            <VStack gap={4} align='stretch'>
              <Skeleton height='32px' width='300px' />
              <Skeleton height='80px' width='100%' />
              <Skeleton height='200px' width='100%' />
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    );
  }

  return (
    <VStack gap={6} align='stretch'>
      {/* Error Display */}
      {error && (
        <Card.Root borderColor='error' borderWidth='2px' bg='bg.canvas'>
          <Card.Body p={4}>
            <HStack>
              <Box color='error'>
                <FiAlertCircle />
              </Box>
              <Text color='error' fontSize='sm'>
                {error}
              </Text>
              <Button
                size='xs'
                variant='ghost'
                onClick={() => setError('')}
                color='error'
              >
                <FiX size={12} />
              </Button>
            </HStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Plan Overview Card */}
      <Card.Root
        variant='outline'
        borderColor='border.emphasized'
        bg='bg.canvas'
      >
        <Card.Body p={6}>
          <VStack gap={4} align='stretch'>
            {/* Header */}
            <HStack justify='space-between' align='start'>
              <VStack gap={1} align='start' flex='1'>
                <Heading as='h2' size='lg' color='fg' fontFamily='heading'>
                  Lab Plan Overview
                </Heading>
                <Text color='fg.muted' fontSize='sm' fontFamily='body'>
                  Define your lab's goals and search parameters
                </Text>
              </VStack>
            </HStack>

            {/* Overview Content */}
            <Accordion.Root collapsible defaultValue={['goals']}>
              {/* Goals Section */}
              <Accordion.Item value='goals'>
                <Accordion.ItemTrigger>
                  <HStack>
                    <FiTarget size={16} />
                    <Text fontWeight='medium'>Goals</Text>
                    <Badge colorScheme='blue' size='sm'>
                      {goals.length}
                    </Badge>
                  </HStack>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <VStack gap={4} align='stretch' pt={2}>
                    {/* Goals List */}
                    {goals.length > 0 && (
                      <VStack gap={3} align='stretch'>
                        <Text fontSize='sm' fontWeight='medium' color='fg'>
                          Lab Goals:
                        </Text>
                        {goals.map((goal, index) => (
                          <Card.Root
                            key={goal.id}
                            variant='outline'
                            size='sm'
                            bg='bg.canvas'
                            borderColor='border.emphasized'
                          >
                            <Card.Body p={4}>
                              {goal.isLoading ? (
                                // Goal loading skeleton
                                <VStack gap={3} align='stretch'>
                                  <Skeleton height='20px' width='70%' />
                                  <Skeleton height='40px' width='100%' />
                                  <HStack gap={4}>
                                    <Skeleton height='16px' width='80px' />
                                    <Skeleton height='16px' width='120px' />
                                  </HStack>
                                </VStack>
                              ) : (
                                <HStack justify='space-between' align='start'>
                                  <VStack gap={3} align='start' flex='1'>
                                    <Text
                                      fontWeight='medium'
                                      color='fg'
                                      fontSize='md'
                                    >
                                      {goal.name}
                                    </Text>
                                    <Text
                                      fontSize='sm'
                                      color='fg.muted'
                                      lineHeight='1.5'
                                    >
                                      {goal.description}
                                    </Text>

                                    {/* Impact Level */}
                                    <HStack gap={2}>
                                      <Text
                                        fontSize='xs'
                                        fontWeight='medium'
                                        color='fg'
                                      >
                                        Impact:
                                      </Text>
                                      <Text
                                        fontSize='xs'
                                        color={{
                                          _light: 'purple.600',
                                          _dark: 'purple.300',
                                        }}
                                      >
                                        {goal.impact_level}% (
                                        {getImpactDescription(
                                          goal.impact_level
                                        )}
                                        )
                                      </Text>
                                    </HStack>

                                    {/* User Groups */}
                                    {goal.user_groups &&
                                      goal.user_groups.length > 0 && (
                                        <VStack gap={1} align='start' w='100%'>
                                          <Text
                                            fontSize='xs'
                                            fontWeight='medium'
                                            color='fg'
                                          >
                                            User Groups (
                                            {goal.user_groups.length}
                                            ):
                                          </Text>
                                          {goal.user_groups.map(
                                            (group, groupIndex) => (
                                              <VStack
                                                key={groupIndex}
                                                gap={1}
                                                align='start'
                                                w='100%'
                                              >
                                                <HStack
                                                  fontSize='xs'
                                                  color='fg.muted'
                                                >
                                                  <Text>•</Text>
                                                  <Text>
                                                    {group.description}
                                                  </Text>
                                                  <Text
                                                    color={{
                                                      _light: 'blue.600',
                                                      _dark: 'blue.300',
                                                    }}
                                                  >
                                                    (
                                                    {parseInt(
                                                      group.size
                                                    ).toLocaleString()}{' '}
                                                    {parseInt(group.size) === 1
                                                      ? 'person'
                                                      : 'people'}
                                                    )
                                                  </Text>
                                                </HStack>
                                                {/* Display regions if they exist */}
                                                {group.regions &&
                                                  group.regions.length > 0 && (
                                                    <HStack
                                                      fontSize='xs'
                                                      color='fg.muted'
                                                      pl={3}
                                                      align='start'
                                                    >
                                                      <Box color='fg'>
                                                        <FiGlobe size={18} />
                                                      </Box>
                                                      <Text
                                                        color={{
                                                          _light: 'green.600',
                                                          _dark: 'green.300',
                                                        }}
                                                      >
                                                        Regions:{' '}
                                                        {formatRegionsDisplay(
                                                          group.regions
                                                        )}
                                                      </Text>
                                                    </HStack>
                                                  )}
                                              </VStack>
                                            )
                                          )}
                                        </VStack>
                                      )}

                                    {/* Problem Statements */}
                                    {goal.problem_statements &&
                                      goal.problem_statements.length > 0 && (
                                        <VStack gap={1} align='start' w='100%'>
                                          <Text
                                            fontSize='xs'
                                            fontWeight='medium'
                                            color='fg'
                                          >
                                            Problem Statements (
                                            {goal.problem_statements.length}):
                                          </Text>
                                          {goal.problem_statements.map(
                                            (statement, statementIndex) => (
                                              <HStack
                                                key={statementIndex}
                                                fontSize='xs'
                                                color='fg.muted'
                                                align='start'
                                              >
                                                <Text>•</Text>
                                                <Text lineHeight='1.4'>
                                                  {statement.description}
                                                </Text>
                                              </HStack>
                                            )
                                          )}
                                        </VStack>
                                      )}
                                  </VStack>

                                  <VStack gap={2}>
                                    <IconButton
                                      size='xs'
                                      variant='ghost'
                                      color='fg'
                                      _hover={{ bg: 'bg.hover' }}
                                      onClick={() => handleEditGoal(goal)}
                                      aria-label='Edit goal'
                                      disabled={goal.isLoading}
                                    >
                                      <FiEdit size={12} />
                                    </IconButton>
                                    <IconButton
                                      size='xs'
                                      variant='ghost'
                                      color='error'
                                      _hover={{ bg: 'errorSubtle' }}
                                      onClick={() => handleRemoveGoal(goal)}
                                      aria-label='Remove goal'
                                      disabled={goal.isLoading}
                                    >
                                      <FiTrash2 size={12} />
                                    </IconButton>
                                  </VStack>
                                </HStack>
                              )}
                            </Card.Body>
                          </Card.Root>
                        ))}
                      </VStack>
                    )}

                    {/* Add Goal Button */}
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setIsAddingGoal(true)}
                      color='fg.muted'
                      borderColor='border.muted'
                      borderStyle='dashed'
                      _hover={{ bg: 'bg.hover' }}
                      mb={4}
                    >
                      <FiPlus size={14} />
                      Add Goal
                    </Button>
                  </VStack>
                </Accordion.ItemContent>
              </Accordion.Item>

              {/* Include/Exclude Terms Section - Creation Style */}
              <Accordion.Item value='terms'>
                <Accordion.ItemTrigger>
                  <HStack>
                    <FiFilter size={16} />
                    <Text fontWeight='medium'>Search Terms</Text>
                    <Badge colorScheme='purple' size='sm'>
                      {includeTermsCount + excludeTermsCount}
                    </Badge>
                  </HStack>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <VStack gap={4} align='stretch' pt={4}>
                    {/* Header with info */}
                    <HStack gap={2} align='start'>
                      <Box color='fg.muted'>
                        <FiInfo size={16} />
                      </Box>
                      <VStack gap={1} align='start' flex='1'>
                        <Text
                          fontSize='sm'
                          color='fg.muted'
                          fontFamily='body'
                          lineHeight='1.5'
                        >
                          Include terms help find relevant content. Exclude
                          terms filter out unwanted results.
                        </Text>
                        <HStack
                          gap={4}
                          fontSize='xs'
                          color='fg.muted'
                          fontFamily='body'
                        >
                          <Text>Include: {includeTermsCount}</Text>
                          <Text>Exclude: {excludeTermsCount}</Text>
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Validation Error */}
                    {validationError && (
                      <Box
                        p={3}
                        bg='errorSubtle'
                        borderColor='error'
                        borderWidth='1px'
                        borderRadius='md'
                      >
                        <HStack>
                          <Box color='error'>
                            <FiAlertCircle />
                          </Box>
                          <Text color='error' fontSize='sm'>
                            {validationError}
                          </Text>
                        </HStack>
                      </Box>
                    )}

                    {/* Terms List */}
                    <VStack gap={3} align='stretch'>
                      {/* Add new term input */}
                      {isAddingTerm ? (
                        <Box
                          p={3}
                          border='1px solid'
                          borderColor={validationError ? 'error' : 'brand'}
                          borderRadius='md'
                          bg='bg.canvas'
                        >
                          <VStack gap={3}>
                            <Input
                              value={newTermText}
                              onChange={handleInputChange}
                              placeholder='Enter term...'
                              size='md'
                              autoFocus
                              bg='bg'
                              borderColor={
                                validationError ? 'error' : 'border.muted'
                              }
                              color='fg'
                              _focus={{
                                borderColor: validationError
                                  ? 'error'
                                  : 'brand',
                                boxShadow: validationError
                                  ? '0 0 0 1px token(colors.error)'
                                  : '0 0 0 1px token(colors.brand)',
                              }}
                              onKeyDown={handleKeyPress}
                              fontFamily='body'
                            />

                            <HStack gap={2} w='100%'>
                              <Button
                                size='sm'
                                variant={
                                  newTermType === 'include'
                                    ? 'solid'
                                    : 'outline'
                                }
                                onClick={() => setNewTermType('include')}
                                flex='1'
                                fontSize='sm'
                                fontFamily='body'
                                color='fg'
                              >
                                Include
                              </Button>
                              <Button
                                size='sm'
                                variant={
                                  newTermType === 'exclude'
                                    ? 'solid'
                                    : 'outline'
                                }
                                onClick={() => setNewTermType('exclude')}
                                flex='1'
                                fontSize='sm'
                                fontFamily='body'
                                color='fg'
                              >
                                Exclude
                              </Button>
                            </HStack>

                            <HStack gap={2} w='100%'>
                              <IconButton
                                size='sm'
                                variant='solid'
                                colorScheme='green'
                                onClick={handleAddTerm}
                                aria-label='Add term'
                                disabled={
                                  !newTermText.trim() || !!validationError
                                }
                                flex='1'
                              >
                                <FiCheck size={14} />
                              </IconButton>
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() => {
                                  setNewTermText('');
                                  setValidationError('');
                                  setIsAddingTerm(false);
                                }}
                                flex='1'
                                fontSize='sm'
                                fontFamily='body'
                                color='fg'
                              >
                                Cancel
                              </Button>
                            </HStack>
                          </VStack>
                        </Box>
                      ) : (
                        <Button
                          size='md'
                          variant='ghost'
                          onClick={() => setIsAddingTerm(true)}
                          justifyContent='flex-start'
                          color='fg.muted'
                          _hover={{ color: 'fg', bg: 'bg.hover' }}
                          fontFamily='body'
                        >
                          <FiPlus size={16} />
                          Add Term
                        </Button>
                      )}

                      {/* Existing terms */}
                      {terms.length > 0 ? (
                        terms.map((term) => (
                          <Box
                            key={term.id}
                            p={3}
                            border='1px solid'
                            borderColor={
                              term.type === 'include' ? 'success' : 'error'
                            }
                            borderRadius='md'
                            bg={
                              term.type === 'include'
                                ? 'successSubtle'
                                : 'errorSubtle'
                            }
                            transition='all 0.2s'
                            opacity={term.isLoading ? 0.7 : 1}
                          >
                            <HStack justify='space-between' align='center'>
                              <HStack gap={3} flex='1' align='center'>
                                {term.isLoading ? (
                                  <Skeleton height='20px' width='20px' />
                                ) : (
                                  <Box
                                    color={
                                      term.type === 'include'
                                        ? 'success'
                                        : 'error'
                                    }
                                  >
                                    {term.type === 'include' ? (
                                      <FiEye size={16} />
                                    ) : (
                                      <FiEyeOff size={16} />
                                    )}
                                  </Box>
                                )}
                                <Text
                                  fontSize='sm'
                                  color='fg'
                                  fontWeight='medium'
                                  fontFamily='body'
                                  flex='1'
                                >
                                  {term.text}
                                </Text>
                              </HStack>

                              <HStack gap={1}>
                                {/* Toggle include/exclude */}
                                {term.isLoading ? (
                                  <Skeleton height='24px' width='24px' />
                                ) : (
                                  <IconButton
                                    size='xs'
                                    variant='ghost'
                                    color='fg.muted'
                                    onClick={() => handleToggleTermType(term)}
                                    aria-label={`Toggle to ${
                                      term.type === 'include'
                                        ? 'exclude'
                                        : 'include'
                                    }`}
                                    title={`Click to ${
                                      term.type === 'include'
                                        ? 'exclude'
                                        : 'include'
                                    } this term`}
                                  >
                                    {term.type === 'include' ? (
                                      <FiEyeOff size={12} />
                                    ) : (
                                      <FiEye size={12} />
                                    )}
                                  </IconButton>
                                )}

                                {/* Delete term */}
                                <IconButton
                                  size='xs'
                                  variant='ghost'
                                  color='error'
                                  onClick={() => handleDeleteTerm(term)}
                                  aria-label='Delete term'
                                  title='Delete this term'
                                >
                                  <FiTrash2 size={12} />
                                </IconButton>
                              </HStack>
                            </HStack>
                          </Box>
                        ))
                      ) : (
                        <Box
                          p={6}
                          textAlign='center'
                          border='2px dashed'
                          borderColor='border.muted'
                          borderRadius='md'
                          bg='bg.subtle'
                        >
                          <VStack gap={3}>
                            <Box color='fg.muted'>
                              <FiFilter size={24} />
                            </Box>
                            <Text
                              color='fg.muted'
                              fontSize='sm'
                              fontFamily='body'
                            >
                              No search terms yet
                            </Text>
                            <Text
                              color='fg.muted'
                              fontSize='xs'
                              fontFamily='body'
                            >
                              Click "Add Term" to get started
                            </Text>
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  </VStack>
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Add/Edit Goal Dialog - Non-blocking, immediate close on save */}
      <AddGoalDialog
        isOpen={isAddingGoal || isEditingGoal}
        onClose={handleCloseGoalDialog}
        onSave={handleSaveGoal}
        initialGoal={editingGoal || undefined}
        isEditing={isEditingGoal}
      />
    </VStack>
  );
};

export default Plan;
