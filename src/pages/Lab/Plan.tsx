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
  Textarea,
  IconButton,
  Accordion,
  Badge,
  Dialog,
  Field,
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
  FiInfo,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { labAPIService } from '../../services/labAPIService';
import type { Lab } from './types';

// Lab Goal interface matching the goals.md structure
interface LabGoal {
  id: string;
  name: string;
  description: string;
  user_groups: Array<{
    description: string;
    size: number;
  }>;
  problem_statements: Array<{
    description: string;
  }>;
  impact_level: number; // 0-100 scale
}

// User info for the Users section
interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'reader';
  joinedAt: string;
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

  // Overview card editing state
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [overviewForm, setOverviewForm] = useState({
    name: lab?.name || '',
    description: lab?.description || '',
  });

  // Goals state
  const [goals, setGoals] = useState<LabGoal[]>([]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<LabGoal>>({
    name: '',
    description: '',
    user_groups: [{ description: '', size: 1 }],
    problem_statements: [{ description: '' }],
    impact_level: 50,
  });

  // Users state
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Terms editing state
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [editingIncludeTerms, setEditingIncludeTerms] = useState<string[]>([]);
  const [editingExcludeTerms, setEditingExcludeTerms] = useState<string[]>([]);

  // Loading states
  const [savingOverview, setSavingOverview] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);

  // Error states
  const [error, setError] = useState<string>('');

  // Initialize data when lab changes
  useEffect(() => {
    if (lab) {
      setOverviewForm({
        name: lab.name,
        description: lab.description,
      });

      // Convert lab goals to our format if they exist
      const labGoals: LabGoal[] =
        lab.goals?.map((goal) => ({
          id: goal.id,
          name: goal.goalStatement || 'Lab Goal',
          description: goal.problemStatement,
          user_groups: goal.targetUserGroups.map((group) => ({
            description: group.name,
            size: group.number,
          })),
          problem_statements: [{ description: goal.problemStatement }],
          impact_level: goal.impactScore,
        })) || [];

      setGoals(labGoals);
      setEditingIncludeTerms([...includeTerms]);
      setEditingExcludeTerms([...excludeTerms]);

      // Load users
      loadLabUsers();
    }
  }, [lab, includeTerms, excludeTerms]);

  // Load lab users
  const loadLabUsers = useCallback(async () => {
    if (!token || !lab) return;

    setLoadingUsers(true);
    try {
      // Mock users data - in real implementation, this would come from API
      const mockUsers: UserInfo[] = [
        {
          id: user?._id || 'current-user',
          name: user?.fullname || 'Current User',
          email: user?.email || 'user@example.com',
          role: lab.adminIds.includes(user?._id || '') ? 'admin' : 'editor',
          joinedAt: new Date().toISOString(),
        },
        // Add more users based on lab.memberIds if available
        ...lab.memberIds.slice(1, 5).map((memberId, index) => ({
          id: memberId,
          name: `Team Member ${index + 1}`,
          email: `member${index + 1}@example.com`,
          role: lab.adminIds.includes(memberId)
            ? 'admin'
            : lab.editorIds.includes(memberId)
            ? 'editor'
            : ('reader' as const),
          joinedAt: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
        })),
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [token, lab, user]);

  // Handle overview form changes
  const handleOverviewChange = (
    field: 'name' | 'description',
    value: string
  ) => {
    setOverviewForm((prev) => ({ ...prev, [field]: value }));
  };

  // Save overview changes
  const handleSaveOverview = useCallback(async () => {
    if (!token || !lab) return;

    setSavingOverview(true);
    setError('');

    try {
      await labAPIService.updateLabInfo(
        lab.id,
        overviewForm.name.trim(),
        overviewForm.description.trim(),
        token
      );

      setIsEditingOverview(false);
      if (onRefreshLab) {
        await onRefreshLab();
      }
    } catch (error) {
      console.error('Failed to save overview:', error);
      setError('Failed to save overview changes');
    } finally {
      setSavingOverview(false);
    }
  }, [token, lab, overviewForm, onRefreshLab]);

  // Handle goal form changes
  const handleNewGoalChange = (field: keyof LabGoal, value: any) => {
    setNewGoal((prev) => ({ ...prev, [field]: value }));
  };

  // Add user group to new goal
  const addUserGroup = () => {
    setNewGoal((prev) => ({
      ...prev,
      user_groups: [...(prev.user_groups || []), { description: '', size: 1 }],
    }));
  };

  // Remove user group from new goal
  const removeUserGroup = (index: number) => {
    setNewGoal((prev) => ({
      ...prev,
      user_groups: (prev.user_groups || []).filter((_, i) => i !== index),
    }));
  };

  // Add problem statement to new goal
  const addProblemStatement = () => {
    setNewGoal((prev) => ({
      ...prev,
      problem_statements: [
        ...(prev.problem_statements || []),
        { description: '' },
      ],
    }));
  };

  // Remove problem statement from new goal
  const removeProblemStatement = (index: number) => {
    setNewGoal((prev) => ({
      ...prev,
      problem_statements: (prev.problem_statements || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  // Save new goal
  const handleSaveGoal = useCallback(async () => {
    if (!newGoal.name?.trim() || !newGoal.description?.trim()) return;

    setSavingGoals(true);
    setError('');

    try {
      const goalToAdd: LabGoal = {
        id: `goal-${Date.now()}`,
        name: newGoal.name.trim(),
        description: newGoal.description.trim(),
        user_groups: newGoal.user_groups || [{ description: '', size: 1 }],
        problem_statements: newGoal.problem_statements || [{ description: '' }],
        impact_level: newGoal.impact_level || 50,
      };

      setGoals((prev) => [...prev, goalToAdd]);
      setIsAddingGoal(false);
      setNewGoal({
        name: '',
        description: '',
        user_groups: [{ description: '', size: 1 }],
        problem_statements: [{ description: '' }],
        impact_level: 50,
      });

      // TODO: Save to API
      console.log('Goal added:', goalToAdd);
    } catch (error) {
      console.error('Failed to save goal:', error);
      setError('Failed to save goal');
    } finally {
      setSavingGoals(false);
    }
  }, [newGoal]);

  // Remove goal
  const handleRemoveGoal = useCallback(async (goalId: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    // TODO: Remove from API
  }, []);

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

  // Add new term
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

  // Save terms
  const handleSaveTerms = useCallback(async () => {
    setSavingTerms(true);
    setError('');

    try {
      const cleanInclude = editingIncludeTerms.filter((term) => term.trim());
      const cleanExclude = editingExcludeTerms.filter((term) => term.trim());

      await onTermsUpdate(cleanInclude, cleanExclude);
      setIsEditingTerms(false);
    } catch (error) {
      console.error('Failed to save terms:', error);
      setError('Failed to save terms');
    } finally {
      setSavingTerms(false);
    }
  }, [editingIncludeTerms, editingExcludeTerms, onTermsUpdate]);

  // Reset terms editing
  const handleCancelTermsEdit = () => {
    setEditingIncludeTerms([...includeTerms]);
    setEditingExcludeTerms([...excludeTerms]);
    setIsEditingTerms(false);
  };

  // Get impact level description
  const getImpactDescription = (level: number): string => {
    if (level >= 90) return 'Existential Game-Changer';
    if (level >= 80) return 'Global Paradigm Shift';
    if (level >= 70) return 'Industry Revolution';
    if (level >= 60) return 'Market Disruption';
    if (level >= 50) return 'Significant Innovation';
    if (level >= 40) return 'Incremental Advancement';
    if (level >= 30) return 'Process Improvement';
    if (level >= 20) return 'Efficiency Gain';
    if (level >= 10) return 'Minor Enhancement';
    return 'Personal Spark';
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'editor':
        return 'blue';
      case 'reader':
        return 'gray';
      default:
        return 'gray';
    }
  };

  if (!lab) {
    return (
      <Box p={6}>
        <Text color='fg.muted'>Loading lab data...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align='stretch'>
      {/* Error Display */}
      {error && (
        <Card.Root borderColor='red.200' borderWidth='2px'>
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
      <Card.Root variant='outline' borderWidth='2px' borderColor='brand.200'>
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

              {!isEditingOverview && (
                <IconButton
                  size='md'
                  variant='ghost'
                  onClick={() => setIsEditingOverview(true)}
                  color='brand'
                  _hover={{ bg: 'brand.50' }}
                  aria-label='Edit overview'
                >
                  <FiEdit size={16} />
                </IconButton>
              )}
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
                    {/* Lab Name and Description */}
                    {isEditingOverview ? (
                      <VStack gap={3} align='stretch'>
                        <Field.Root>
                          <Field.Label>Lab Name</Field.Label>
                          <Input
                            value={overviewForm.name}
                            onChange={(e) =>
                              handleOverviewChange('name', e.target.value)
                            }
                            placeholder='Enter lab name...'
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>Lab Description</Field.Label>
                          <Textarea
                            value={overviewForm.description}
                            onChange={(e) =>
                              handleOverviewChange(
                                'description',
                                e.target.value
                              )
                            }
                            placeholder='Describe the purpose and focus of this lab...'
                            rows={3}
                          />
                        </Field.Root>

                        <HStack>
                          <Button
                            size='sm'
                            onClick={handleSaveOverview}
                            loading={savingOverview}
                            bg='brand'
                            color='white'
                          >
                            <FiSave size={14} />
                            Save Changes
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              setIsEditingOverview(false);
                              setOverviewForm({
                                name: lab.name,
                                description: lab.description,
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        </HStack>
                      </VStack>
                    ) : (
                      <VStack gap={2} align='stretch'>
                        <Text fontSize='lg' fontWeight='medium' color='fg'>
                          {lab.name}
                        </Text>
                        <Text color='fg.muted' lineHeight='1.6'>
                          {lab.description}
                        </Text>
                      </VStack>
                    )}

                    {/* Goals List */}
                    {goals.length > 0 && (
                      <VStack gap={3} align='stretch'>
                        <Text fontSize='sm' fontWeight='medium' color='fg'>
                          Lab Goals:
                        </Text>
                        {goals.map((goal) => (
                          <Card.Root key={goal.id} variant='outline' size='sm'>
                            <Card.Body p={4}>
                              <HStack justify='space-between' align='start'>
                                <VStack gap={2} align='start' flex='1'>
                                  <Text fontWeight='medium' color='fg'>
                                    {goal.name}
                                  </Text>
                                  <Text fontSize='sm' color='fg.muted'>
                                    {goal.description}
                                  </Text>
                                  <HStack gap={4} wrap='wrap'>
                                    <Text fontSize='xs' color='fg.muted'>
                                      Impact: {goal.impact_level}% (
                                      {getImpactDescription(goal.impact_level)})
                                    </Text>
                                    <Text fontSize='xs' color='fg.muted'>
                                      User Groups: {goal.user_groups.length}
                                    </Text>
                                    <Text fontSize='xs' color='fg.muted'>
                                      Problems: {goal.problem_statements.length}
                                    </Text>
                                  </HStack>
                                </VStack>
                                <IconButton
                                  size='xs'
                                  variant='ghost'
                                  color='red.500'
                                  onClick={() => handleRemoveGoal(goal.id)}
                                  aria-label='Remove goal'
                                >
                                  <FiTrash2 size={12} />
                                </IconButton>
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
                      colorScheme='blue'
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
                      {includeTerms.length + excludeTerms.length}
                    </Badge>
                  </HStack>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <VStack gap={4} align='stretch' pt={2}>
                    {!isEditingTerms ? (
                      <>
                        {/* Display Mode */}
                        <Grid templateColumns='1fr 1fr' gap={4}>
                          <VStack gap={2} align='stretch'>
                            <Text
                              fontSize='sm'
                              fontWeight='medium'
                              color='green.600'
                            >
                              Include Terms ({includeTerms.length})
                            </Text>
                            {includeTerms.length > 0 ? (
                              <VStack gap={1} align='stretch'>
                                {includeTerms.map((term, index) => (
                                  <Text
                                    key={index}
                                    fontSize='sm'
                                    color='fg.muted'
                                    p={2}
                                    bg='green.50'
                                    borderRadius='md'
                                  >
                                    {term}
                                  </Text>
                                ))}
                              </VStack>
                            ) : (
                              <Text
                                fontSize='sm'
                                color='fg.muted'
                                fontStyle='italic'
                              >
                                No include terms defined
                              </Text>
                            )}
                          </VStack>

                          <VStack gap={2} align='stretch'>
                            <Text
                              fontSize='sm'
                              fontWeight='medium'
                              color='red.600'
                            >
                              Exclude Terms ({excludeTerms.length})
                            </Text>
                            {excludeTerms.length > 0 ? (
                              <VStack gap={1} align='stretch'>
                                {excludeTerms.map((term, index) => (
                                  <Text
                                    key={index}
                                    fontSize='sm'
                                    color='fg.muted'
                                    p={2}
                                    bg='red.50'
                                    borderRadius='md'
                                  >
                                    {term}
                                  </Text>
                                ))}
                              </VStack>
                            ) : (
                              <Text
                                fontSize='sm'
                                color='fg.muted'
                                fontStyle='italic'
                              >
                                No exclude terms defined
                              </Text>
                            )}
                          </VStack>
                        </Grid>

                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setIsEditingTerms(true)}
                          colorScheme='purple'
                        >
                          <FiEdit size={14} />
                          Edit Terms
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Edit Mode */}
                        <Grid templateColumns='1fr 1fr' gap={4}>
                          <VStack gap={2} align='stretch'>
                            <HStack justify='space-between'>
                              <Text
                                fontSize='sm'
                                fontWeight='medium'
                                color='green.600'
                              >
                                Include Terms
                              </Text>
                              <Button
                                size='xs'
                                onClick={() => addTerm('include')}
                              >
                                <FiPlus size={12} />
                              </Button>
                            </HStack>
                            {editingIncludeTerms.map((term, index) => (
                              <HStack key={index}>
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
                                />
                                <IconButton
                                  size='sm'
                                  variant='ghost'
                                  color='red.500'
                                  onClick={() => removeTerm('include', index)}
                                  aria-label='Remove term'
                                >
                                  <FiX size={12} />
                                </IconButton>
                              </HStack>
                            ))}
                          </VStack>

                          <VStack gap={2} align='stretch'>
                            <HStack justify='space-between'>
                              <Text
                                fontSize='sm'
                                fontWeight='medium'
                                color='red.600'
                              >
                                Exclude Terms
                              </Text>
                              <Button
                                size='xs'
                                onClick={() => addTerm('exclude')}
                              >
                                <FiPlus size={12} />
                              </Button>
                            </HStack>
                            {editingExcludeTerms.map((term, index) => (
                              <HStack key={index}>
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
                                />
                                <IconButton
                                  size='sm'
                                  variant='ghost'
                                  color='red.500'
                                  onClick={() => removeTerm('exclude', index)}
                                  aria-label='Remove term'
                                >
                                  <FiX size={12} />
                                </IconButton>
                              </HStack>
                            ))}
                          </VStack>
                        </Grid>

                        <HStack>
                          <Button
                            size='sm'
                            onClick={handleSaveTerms}
                            loading={savingTerms}
                            bg='brand'
                            color='white'
                          >
                            <FiSave size={14} />
                            Save Terms
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={handleCancelTermsEdit}
                          >
                            Cancel
                          </Button>
                        </HStack>
                      </>
                    )}
                  </VStack>
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Add Goal Dialog */}
      <Dialog.Root
        open={isAddingGoal}
        onOpenChange={({ open }) => setIsAddingGoal(open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW='2xl'
            bg='bg.canvas'
            borderColor='border.emphasized'
          >
            <Dialog.Header>
              <Dialog.Title color='fg' fontFamily='heading'>
                Add New Lab Goal
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton size='sm' variant='ghost'>
                  <FiX />
                </IconButton>
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={4} align='stretch'>
                <Field.Root>
                  <Field.Label>Goal Name</Field.Label>
                  <Input
                    value={newGoal.name || ''}
                    onChange={(e) =>
                      handleNewGoalChange('name', e.target.value)
                    }
                    placeholder='e.g., Reduce fashion waste in luxury market'
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Goal Description</Field.Label>
                  <Textarea
                    value={newGoal.description || ''}
                    onChange={(e) =>
                      handleNewGoalChange('description', e.target.value)
                    }
                    placeholder='Describe what this goal aims to achieve...'
                    rows={3}
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>
                    Impact Level ({newGoal.impact_level || 50}%)
                  </Field.Label>
                  <Text fontSize='xs' color='fg.muted' mb={1}>
                    {getImpactDescription(newGoal.impact_level || 50)}
                  </Text>
                  <Input
                    type='range'
                    min='0'
                    max='100'
                    value={newGoal.impact_level || 50}
                    onChange={(e) =>
                      handleNewGoalChange(
                        'impact_level',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </Field.Root>

                <Field.Root>
                  <HStack justify='space-between' mb={2}>
                    <Field.Label>User Groups</Field.Label>
                    <Button size='xs' onClick={addUserGroup}>
                      <FiPlus size={12} />
                      Add Group
                    </Button>
                  </HStack>
                  <VStack gap={2} align='stretch'>
                    {(newGoal.user_groups || []).map((group, index) => (
                      <HStack key={index}>
                        <Input
                          placeholder='User group description'
                          value={group.description}
                          onChange={(e) => {
                            const updatedGroups = [
                              ...(newGoal.user_groups || []),
                            ];
                            updatedGroups[index] = {
                              ...group,
                              description: e.target.value,
                            };
                            handleNewGoalChange('user_groups', updatedGroups);
                          }}
                          flex='1'
                        />
                        <Input
                          type='number'
                          placeholder='Size'
                          value={group.size}
                          onChange={(e) => {
                            const updatedGroups = [
                              ...(newGoal.user_groups || []),
                            ];
                            updatedGroups[index] = {
                              ...group,
                              size: parseInt(e.target.value) || 1,
                            };
                            handleNewGoalChange('user_groups', updatedGroups);
                          }}
                          w='80px'
                        />
                        <IconButton
                          size='sm'
                          variant='ghost'
                          color='red.500'
                          onClick={() => removeUserGroup(index)}
                          aria-label='Remove group'
                        >
                          <FiX size={12} />
                        </IconButton>
                      </HStack>
                    ))}
                  </VStack>
                </Field.Root>

                <Field.Root>
                  <HStack justify='space-between' mb={2}>
                    <Field.Label>Problem Statements</Field.Label>
                    <Button size='xs' onClick={addProblemStatement}>
                      <FiPlus size={12} />
                      Add Problem
                    </Button>
                  </HStack>
                  <VStack gap={2} align='stretch'>
                    {(newGoal.problem_statements || []).map(
                      (statement, index) => (
                        <HStack key={index}>
                          <Textarea
                            placeholder='Describe a specific problem this goal addresses'
                            value={statement.description}
                            onChange={(e) => {
                              const updatedStatements = [
                                ...(newGoal.problem_statements || []),
                              ];
                              updatedStatements[index] = {
                                description: e.target.value,
                              };
                              handleNewGoalChange(
                                'problem_statements',
                                updatedStatements
                              );
                            }}
                            rows={2}
                            flex='1'
                          />
                          <IconButton
                            size='sm'
                            variant='ghost'
                            color='red.500'
                            onClick={() => removeProblemStatement(index)}
                            aria-label='Remove problem'
                          >
                            <FiX size={12} />
                          </IconButton>
                        </HStack>
                      )
                    )}
                  </VStack>
                </Field.Root>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <HStack gap={3}>
                <Button
                  variant='outline'
                  onClick={() => setIsAddingGoal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveGoal}
                  loading={savingGoals}
                  disabled={
                    !newGoal.name?.trim() || !newGoal.description?.trim()
                  }
                  bg='brand'
                  color='white'
                >
                  <FiSave size={14} />
                  Save Goal
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
  );
};

export default Plan;
