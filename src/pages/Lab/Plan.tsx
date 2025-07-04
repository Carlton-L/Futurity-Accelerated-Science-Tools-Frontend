import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  Input,
  IconButton,
  Accordion,
  Badge,
  Field,
  Skeleton,
} from '@chakra-ui/react';
import {
  FiTarget,
  FiUsers,
  FiFilter,
  FiEdit,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiAlertCircle,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import {
  labService,
  type ApiLabGoal,
  type Lab as ApiLabResponse,
} from '../../services/labService';
import {
  relationshipService,
  type TeamUser,
} from '../../services/relationshipService';
import type { Lab } from './types';
import AddGoalDialog from './AddGoalDialog';

// User info for the Users section
interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedAt: string;
  pictureUrl?: string;
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

  // Overview card editing state
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState({
    name: '',
    description: '',
  });

  // Goals state
  const [goals, setGoals] = useState<ApiLabGoal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ApiLabGoal | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Terms editing state - simplified since always in edit mode
  const [editingIncludeTerms, setEditingIncludeTerms] = useState<string[]>([]);
  const [editingExcludeTerms, setEditingExcludeTerms] = useState<string[]>([]);

  // Loading states
  const [savingOverview, setSavingOverview] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);

  // Error states
  const [error, setError] = useState<string>('');

  // Load lab data from API
  const loadLabData = useCallback(async () => {
    if (!token || !labId) return;

    setLoadingLabData(true);
    setError('');

    try {
      const apiLabData = await labService.getLabById(labId, token);
      setLabData(apiLabData);

      // Update local state with API data
      setOverviewForm({
        name: apiLabData.ent_name,
        description: apiLabData.ent_summary || '', // Fixed: Handle undefined summary
      });

      setGoals(apiLabData.goals || []);
      // FIXED: Handle undefined include/exclude terms safely
      setEditingIncludeTerms([...(apiLabData.include_terms || [])]);
      setEditingExcludeTerms([...(apiLabData.exclude_terms || [])]);

      console.log('Loaded lab data:', apiLabData);
    } catch (error) {
      console.error('Failed to load lab data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load lab data'
      );
    } finally {
      setLoadingLabData(false);
    }
  }, [token, labId]);

  // Load lab users from relationship service
  const loadLabUsers = useCallback(async () => {
    if (!token || !lab?.teamspaceId) return;

    setLoadingUsers(true);
    try {
      const teamData = await relationshipService.getTeamUsers(
        lab.teamspaceId,
        token
      );

      const userInfos: UserInfo[] = teamData.users.map(
        (teamUser: TeamUser) => ({
          id: teamUser.uniqueID,
          name: teamUser.profile.fullname || 'Unknown User',
          email: teamUser.email,
          role:
            (teamUser.team_relationships[0] as 'admin' | 'editor' | 'viewer') ||
            'viewer',
          joinedAt: teamUser.createdAt,
          pictureUrl: teamUser.profile.picture_url || undefined,
        })
      );

      setUsers(userInfos);
      console.log('Loaded team users:', userInfos);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load team members');
    } finally {
      setLoadingUsers(false);
    }
  }, [token, lab?.teamspaceId]);

  // Initialize data when component mounts or dependencies change
  useEffect(() => {
    loadLabData();
  }, [loadLabData]);

  useEffect(() => {
    loadLabUsers();
  }, [loadLabUsers]);

  // Handle overview form changes
  const handleOverviewChange = (
    field: 'name' | 'description',
    value: string
  ) => {
    setOverviewForm((prev) => ({ ...prev, [field]: value }));
  };

  // Save overview changes
  const handleSaveOverview = useCallback(async () => {
    if (!token || !labId) return;

    setSavingOverview(true);
    setError('');

    try {
      const updatedLab = await labService.updateLabInfo(
        labId,
        overviewForm.name.trim(),
        overviewForm.description.trim(),
        token
      );

      setLabData(updatedLab);
      setIsEditingOverview(false);

      if (onRefreshLab) {
        await onRefreshLab();
      }

      console.log('Successfully updated lab overview');
    } catch (error) {
      console.error('Failed to save overview:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save overview changes'
      );
    } finally {
      setSavingOverview(false);
    }
  }, [token, labId, overviewForm, onRefreshLab]);

  // Handle goal form changes - now handled by AddGoalDialog
  const handleSaveGoal = useCallback(
    async (goalToAdd: ApiLabGoal) => {
      if (!token || !labId) return;

      setSavingGoals(true);
      setError('');

      try {
        let updatedLab;

        if (isEditingGoal && editingGoal) {
          // Update existing goal
          const currentLab = await labService.getLabById(labId, token);
          const updatedGoals = (currentLab.goals || []).map((goal) =>
            goal.name === editingGoal.name &&
            goal.description === editingGoal.description
              ? goalToAdd
              : goal
          );
          updatedLab = await labService.updateLabGoals(
            labId,
            updatedGoals,
            token
          );
        } else {
          // Add new goal
          updatedLab = await labService.addLabGoal(labId, goalToAdd, token);
        }

        setLabData(updatedLab);
        setGoals(updatedLab.goals || []);
        setIsAddingGoal(false);
        setIsEditingGoal(false);
        setEditingGoal(null);

        if (onRefreshLab) {
          await onRefreshLab();
        }

        console.log('Successfully saved goal:', goalToAdd);
      } catch (error) {
        console.error('Failed to save goal:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to save goal'
        );
      } finally {
        setSavingGoals(false);
      }
    },
    [token, labId, onRefreshLab, isEditingGoal, editingGoal]
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

  // Remove goal
  const handleRemoveGoal = useCallback(
    async (goalToRemove: ApiLabGoal) => {
      if (!token || !labId) return;

      setSavingGoals(true);
      setError('');

      try {
        const updatedLab = await labService.removeLabGoalByContent(
          labId,
          goalToRemove,
          token
        );

        setLabData(updatedLab);
        setGoals(updatedLab.goals || []);

        if (onRefreshLab) {
          await onRefreshLab();
        }

        console.log('Successfully removed goal:', goalToRemove);
      } catch (error) {
        console.error('Failed to remove goal:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to remove goal'
        );
      } finally {
        setSavingGoals(false);
      }
    },
    [token, labId, onRefreshLab]
  );

  // Handle terms editing
  const handleTermChange = (
    type: 'include' | 'exclude',
    index: number,
    value: string
  ) => {
    if (type === 'include') {
      setEditingIncludeTerms((prev) =>
        prev.map((term, i) => (i === index ? value : term))
      );
    } else {
      setEditingExcludeTerms((prev) =>
        prev.map((term, i) => (i === index ? value : term))
      );
    }
  };

  // Add new term to existing terms list
  const addTerm = (type: 'include' | 'exclude') => {
    if (type === 'include') {
      setEditingIncludeTerms((prev) => [...prev, '']);
    } else {
      setEditingExcludeTerms((prev) => [...prev, '']);
    }
  };

  // Remove term
  const removeTerm = (type: 'include' | 'exclude', index: number) => {
    if (type === 'include') {
      setEditingIncludeTerms((prev) => prev.filter((_, i) => i !== index));
    } else {
      setEditingExcludeTerms((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Save terms changes - MISSING FUNCTION ADDED
  const handleSaveTerms = useCallback(async () => {
    if (!token || !labId || !onTermsUpdate) return;

    setSavingTerms(true);
    setError('');

    try {
      // Filter out empty terms
      const filteredIncludeTerms = editingIncludeTerms
        .map((term) => term.trim())
        .filter((term) => term !== '');
      const filteredExcludeTerms = editingExcludeTerms
        .map((term) => term.trim())
        .filter((term) => term !== '');

      // Call the parent's terms update function
      await onTermsUpdate(filteredIncludeTerms, filteredExcludeTerms);

      console.log('Successfully updated terms');
    } catch (error) {
      console.error('Failed to save terms:', error);
      setError(error instanceof Error ? error.message : 'Failed to save terms');
    } finally {
      setSavingTerms(false);
    }
  }, [token, labId, editingIncludeTerms, editingExcludeTerms, onTermsUpdate]);

  // Cancel terms editing - MISSING FUNCTION ADDED
  const handleCancelTermsEdit = useCallback(() => {
    // Reset editing terms to current lab data
    const currentIncludeTerms = labData?.include_terms || includeTerms || [];
    const currentExcludeTerms = labData?.exclude_terms || excludeTerms || [];

    setEditingIncludeTerms([...currentIncludeTerms]);
    setEditingExcludeTerms([...currentExcludeTerms]);
    setError('');
  }, [labData, includeTerms, excludeTerms]);

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

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'editor':
        return 'blue';
      case 'viewer':
        return 'gray';
      default:
        return 'gray';
    }
  };

  // Display current data (preference: labData from API, fallback to props) - FIXED: Handle undefined safely
  const displayLabName = labData?.ent_name || lab?.name || 'Loading...';
  const displayLabDescription = labData?.ent_summary || lab?.description || '';
  const displayIncludeTerms = labData?.include_terms || includeTerms || [];
  const displayExcludeTerms = labData?.exclude_terms || excludeTerms || [];
  const displayGoals = labData?.goals || goals;

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
        <Card.Root borderColor='red.200' borderWidth='2px' bg='bg.canvas'>
          <Card.Body p={4}>
            <HStack>
              <FiAlertCircle color='red' />
              <Text color='red.600' fontSize='sm'>
                {error}
              </Text>
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
                  Define your lab's goals, team, and search parameters
                </Text>
              </VStack>
            </HStack>

            {/* Overview Content - Remove lab name and description editing */}
            <Accordion.Root collapsible defaultValue={['goals']}>
              {/* Goals Section */}
              <Accordion.Item value='goals'>
                <Accordion.ItemTrigger>
                  <HStack>
                    <FiTarget size={16} />
                    <Text fontWeight='medium'>Goals</Text>
                    <Badge colorScheme='blue' size='sm'>
                      {displayGoals.length}
                    </Badge>
                  </HStack>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <VStack gap={4} align='stretch' pt={2}>
                    {/* Goals List */}
                    {displayGoals.length > 0 && (
                      <VStack gap={3} align='stretch'>
                        <Text fontSize='sm' fontWeight='medium' color='fg'>
                          Lab Goals:
                        </Text>
                        {displayGoals.map((goal, index) => (
                          <Card.Root
                            key={`${goal.name}-${index}`}
                            variant='outline'
                            size='sm'
                            bg='bg.canvas'
                            borderColor='border.emphasized'
                          >
                            <Card.Body p={4}>
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
                                      {getImpactDescription(goal.impact_level)})
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
                                          User Groups ({goal.user_groups.length}
                                          ):
                                        </Text>
                                        {goal.user_groups.map(
                                          (group, groupIndex) => (
                                            <HStack
                                              key={groupIndex}
                                              fontSize='xs'
                                              color='fg.muted'
                                            >
                                              <Text>•</Text>
                                              <Text>{group.description}</Text>
                                              <Text
                                                color={{
                                                  _light: 'blue.600',
                                                  _dark: 'blue.300',
                                                }}
                                              >
                                                ({group.size.toLocaleString()}{' '}
                                                {group.size === 1
                                                  ? 'person'
                                                  : 'people'}
                                                )
                                              </Text>
                                            </HStack>
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
                                  >
                                    <FiEdit size={12} />
                                  </IconButton>
                                  <IconButton
                                    size='xs'
                                    variant='ghost'
                                    color='red.500'
                                    _hover={{ bg: 'red.50' }}
                                    onClick={() => handleRemoveGoal(goal)}
                                    aria-label='Remove goal'
                                    loading={savingGoals}
                                  >
                                    <FiTrash2 size={12} />
                                  </IconButton>
                                </VStack>
                              </HStack>
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

              {/* Users Section */}
              <Accordion.Item value='users'>
                <Accordion.ItemTrigger>
                  <HStack>
                    <FiUsers size={16} />
                    <Text fontWeight='medium'>Team Members</Text>
                    <Badge colorScheme='green' size='sm'>
                      {users.length}
                    </Badge>
                  </HStack>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <VStack gap={3} align='stretch' pt={2}>
                    {loadingUsers ? (
                      <Text fontSize='sm' color='fg.muted'>
                        Loading team members...
                      </Text>
                    ) : users.length > 0 ? (
                      users.map((user) => (
                        <HStack
                          key={user.id}
                          justify='space-between'
                          p={3}
                          bg='bg.subtle'
                          borderRadius='md'
                        >
                          <VStack gap={1} align='start'>
                            <Text fontSize='sm' fontWeight='medium' color='fg'>
                              {user.name}
                            </Text>
                            <Text fontSize='xs' color='fg.muted'>
                              {user.email}
                            </Text>
                            <Text fontSize='xs' color='fg.muted'>
                              Joined{' '}
                              {new Date(user.joinedAt).toLocaleDateString()}
                            </Text>
                          </VStack>
                          <Badge
                            colorScheme={getRoleBadgeColor(user.role)}
                            size='sm'
                          >
                            {user.role}
                          </Badge>
                        </HStack>
                      ))
                    ) : (
                      <Text fontSize='sm' color='fg.muted'>
                        No team members found
                      </Text>
                    )}
                  </VStack>
                </Accordion.ItemContent>
              </Accordion.Item>

              {/* Include/Exclude Terms Section */}
              <Accordion.Item value='terms'>
                <Accordion.ItemTrigger>
                  <HStack>
                    <FiFilter size={16} />
                    <Text fontWeight='medium'>Search Terms</Text>
                    <Badge colorScheme='purple' size='sm'>
                      {displayIncludeTerms.length + displayExcludeTerms.length}
                    </Badge>
                  </HStack>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <VStack gap={4} align='stretch' pt={2}>
                    {/* Always in "edit" mode - no toggle needed */}
                    <VStack gap={4} align='stretch'>
                      <HStack gap={2} align='center'>
                        <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                          These terms affect search results and analysis in this
                          lab
                        </Text>
                      </HStack>

                      <Grid templateColumns='1fr 1fr' gap={6}>
                        {/* Include Terms Management */}
                        <VStack gap={3} align='stretch'>
                          <HStack justify='space-between' align='center'>
                            <Text
                              fontSize='sm'
                              fontWeight='medium'
                              color='success'
                              fontFamily='heading'
                            >
                              Include Terms
                            </Text>
                            <Badge
                              colorScheme='green'
                              size='sm'
                              variant='subtle'
                            >
                              {editingIncludeTerms.length}
                            </Badge>
                          </HStack>

                          <VStack gap={2} align='stretch'>
                            {editingIncludeTerms.length > 0 ? (
                              editingIncludeTerms.map((term, index) => (
                                <HStack key={index} gap={2}>
                                  <Input
                                    size='sm'
                                    value={term}
                                    onChange={(e) =>
                                      handleTermChange(
                                        'include',
                                        index,
                                        e.target.value
                                      )
                                    }
                                    placeholder='Enter include term...'
                                    bg='bg.canvas'
                                    borderColor='success'
                                    color='fg'
                                    _placeholder={{ color: 'fg.muted' }}
                                    _focus={{
                                      borderColor: 'success',
                                      boxShadow:
                                        '0 0 0 1px var(--chakra-colors-success)',
                                    }}
                                    fontFamily='body'
                                  />
                                  <IconButton
                                    size='sm'
                                    variant='ghost'
                                    color='fg.muted'
                                    _hover={{ color: 'error', bg: 'bg.hover' }}
                                    onClick={() => removeTerm('include', index)}
                                    aria-label='Remove term'
                                  >
                                    <FiX size={14} />
                                  </IconButton>
                                </HStack>
                              ))
                            ) : (
                              <Box
                                p={4}
                                textAlign='center'
                                border='2px dashed'
                                borderColor='border.muted'
                                borderRadius='md'
                                bg='bg.subtle'
                                cursor='pointer'
                                _hover={{
                                  borderColor: 'border.emphasized',
                                  bg: 'bg.hover',
                                }}
                                onClick={() => addTerm('include')}
                                transition='all 0.2s'
                              >
                                <VStack gap={2}>
                                  <Box color='fg.muted'>
                                    <FiPlus size={20} />
                                  </Box>
                                  <Text
                                    color='fg.muted'
                                    fontSize='sm'
                                    fontFamily='body'
                                  >
                                    Add include term
                                  </Text>
                                </VStack>
                              </Box>
                            )}
                          </VStack>

                          {/* Add button if terms exist */}
                          {editingIncludeTerms.length > 0 && (
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => addTerm('include')}
                              color='success'
                              borderColor='success'
                              borderStyle='dashed'
                              _hover={{ bg: 'bg.hover' }}
                            >
                              <FiPlus size={14} />
                              Add Include Term
                            </Button>
                          )}
                        </VStack>

                        {/* Exclude Terms Management */}
                        <VStack gap={3} align='stretch'>
                          <HStack justify='space-between' align='center'>
                            <Text
                              fontSize='sm'
                              fontWeight='medium'
                              color='error'
                              fontFamily='heading'
                            >
                              Exclude Terms
                            </Text>
                            <Badge colorScheme='red' size='sm' variant='subtle'>
                              {editingExcludeTerms.length}
                            </Badge>
                          </HStack>

                          <VStack gap={2} align='stretch'>
                            {editingExcludeTerms.length > 0 ? (
                              editingExcludeTerms.map((term, index) => (
                                <HStack key={index} gap={2}>
                                  <Input
                                    size='sm'
                                    value={term}
                                    onChange={(e) =>
                                      handleTermChange(
                                        'exclude',
                                        index,
                                        e.target.value
                                      )
                                    }
                                    placeholder='Enter exclude term...'
                                    bg='bg.canvas'
                                    borderColor='error'
                                    color='fg'
                                    _placeholder={{ color: 'fg.muted' }}
                                    _focus={{
                                      borderColor: 'error',
                                      boxShadow:
                                        '0 0 0 1px var(--chakra-colors-error)',
                                    }}
                                    fontFamily='body'
                                  />
                                  <IconButton
                                    size='sm'
                                    variant='ghost'
                                    color='fg.muted'
                                    _hover={{ color: 'error', bg: 'bg.hover' }}
                                    onClick={() => removeTerm('exclude', index)}
                                    aria-label='Remove term'
                                  >
                                    <FiX size={14} />
                                  </IconButton>
                                </HStack>
                              ))
                            ) : (
                              <Box
                                p={4}
                                textAlign='center'
                                border='2px dashed'
                                borderColor='border.muted'
                                borderRadius='md'
                                bg='bg.subtle'
                                cursor='pointer'
                                _hover={{
                                  borderColor: 'border.emphasized',
                                  bg: 'bg.hover',
                                }}
                                onClick={() => addTerm('exclude')}
                                transition='all 0.2s'
                              >
                                <VStack gap={2}>
                                  <Box color='fg.muted'>
                                    <FiPlus size={20} />
                                  </Box>
                                  <Text
                                    color='fg.muted'
                                    fontSize='sm'
                                    fontFamily='body'
                                  >
                                    Add exclude term
                                  </Text>
                                </VStack>
                              </Box>
                            )}
                          </VStack>

                          {/* Add button if terms exist */}
                          {editingExcludeTerms.length > 0 && (
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => addTerm('exclude')}
                              color='error'
                              borderColor='error'
                              borderStyle='dashed'
                              _hover={{ bg: 'bg.hover' }}
                            >
                              <FiPlus size={14} />
                              Add Exclude Term
                            </Button>
                          )}
                        </VStack>
                      </Grid>

                      {/* Action Buttons */}
                      <HStack gap={3} pt={2}>
                        <Button
                          size='md'
                          onClick={handleSaveTerms}
                          loading={savingTerms}
                          bg='brand'
                          color='white'
                          _hover={{ bg: 'brand.hover' }}
                          fontFamily='heading'
                        >
                          <FiSave size={16} />
                          Save Terms
                        </Button>
                        <Button
                          size='md'
                          variant='outline'
                          onClick={handleCancelTermsEdit}
                          color='fg'
                          borderColor='border.emphasized'
                          _hover={{ bg: 'bg.hover' }}
                          fontFamily='heading'
                        >
                          Cancel
                        </Button>
                      </HStack>
                    </VStack>
                  </VStack>
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Add/Edit Goal Dialog */}
      <AddGoalDialog
        isOpen={isAddingGoal || isEditingGoal}
        onClose={handleCloseGoalDialog}
        onSave={handleSaveGoal}
        saving={savingGoals}
        initialGoal={editingGoal || undefined}
        isEditing={isEditingGoal}
      />
    </VStack>
  );
};

export default Plan;
