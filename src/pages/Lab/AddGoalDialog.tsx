import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Input,
  Textarea,
  IconButton,
  Dialog,
  Field,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FiEdit, FiSave, FiX, FiPlus, FiCheck } from 'react-icons/fi';
import type { ApiLabGoal } from '../../services/labService';

// Logarithmic population scale helper
const createLogScale = () => {
  const scale = [];

  // 1-10 (quarters: 2.5, 5, 7.5)
  scale.push(1, 3, 5, 8, 10);

  // 10-100 (quarters: 25, 50, 75)
  scale.push(25, 50, 75, 100);

  // 100-1K (quarters: 250, 500, 750)
  scale.push(250, 500, 750, 1000);

  // 1K-10K (quarters: 2.5K, 5K, 7.5K)
  scale.push(2500, 5000, 7500, 10000);

  // 10K-100K (quarters: 25K, 50K, 75K)
  scale.push(25000, 50000, 75000, 100000);

  // 100K-1M (quarters: 250K, 500K, 750K)
  scale.push(250000, 500000, 750000, 1000000);

  // 1M-10M (quarters: 2.5M, 5M, 7.5M)
  scale.push(2500000, 5000000, 7500000, 10000000);

  // 10M-100M (quarters: 25M, 50M, 75M)
  scale.push(25000000, 50000000, 75000000, 100000000);

  // 100M-1B (quarters: 250M, 500M, 750M)
  scale.push(250000000, 500000000, 750000000, 1000000000);

  // 1B-8B (quarters: ~2.5B, ~5B, ~7.5B, 8B - Earth's population)
  scale.push(2500000000, 5000000000, 7500000000, 8000000000);

  return scale;
};

const POPULATION_SCALE = createLogScale();

// Impact levels for the stepped slider (11 steps: 1, 10, 20, ..., 100)
const IMPACT_LEVELS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const formatPopulation = (value: number): string => {
  if (value === 1) return '1 person';
  if (value === 8000000000) return '8 billion people (the whole world)';
  if (value < 1000) return `${value} people`;
  if (value < 1000000)
    return `${(value / 1000).toFixed(
      value % 1000 === 0 ? 0 : 1
    )} thousand people`;
  if (value < 1000000000)
    return `${(value / 1000000).toFixed(
      value % 1000000 === 0 ? 0 : 1
    )} million people`;
  return `${(value / 1000000000).toFixed(
    value % 1000000000 === 0 ? 0 : 1
  )} billion people`;
};

const getImpactDescription = (
  level: number
): { title: string; description: string } => {
  if (level === 1)
    return {
      title: 'Personal Spark',
      description:
        'Impacts a few individuals on a personal level. Sparks joy, ease, or expression. Small but meaningful.',
    };
  if (level === 10)
    return {
      title: 'Niche Value',
      description:
        'Helps a specific group with particular needs or interests. Deep, focused usefulness over mass appeal.',
    };
  if (level === 20)
    return {
      title: 'Everyday Convenience',
      description:
        'Improves daily life in small ways for a limited audience. Adds ease, saves time, or removes friction.',
    };
  if (level === 30)
    return {
      title: 'Community Enhancer',
      description:
        'Supports a team, neighborhood, or local group. Encourages connection, access, or collaboration.',
    };
  if (level === 40)
    return {
      title: 'Wider Reach',
      description:
        'Addresses common needs across regions or demographics. Broadly useful in everyday contexts.',
    };
  if (level === 50)
    return {
      title: 'Cultural Shaper',
      description:
        'Influences how people think, create, or interact. Shifts norms, aesthetics, education, or behavior.',
    };
  if (level === 60)
    return {
      title: 'Systemic Improver',
      description:
        'Enhances large-scale systems like health, mobility, or governance. Improves fairness, access, or efficiency.',
    };
  if (level === 70)
    return {
      title: 'Societal Catalyst',
      description:
        'Drives national or international change. Impacts laws, economies, or ecosystems at scale.',
    };
  if (level === 80)
    return {
      title: 'Global Transformer',
      description:
        'Tackles global challenges. Affects millions across multiple sectors (e.g. clean energy, global education).',
    };
  if (level === 90)
    return {
      title: 'Civilizational Shifter',
      description:
        "Alters humanity's trajectory. Transforms how we live, govern, or relate to the planet.",
    };
  if (level === 100)
    return {
      title: 'Existential Game-Changer',
      description:
        'Prevents extinction, enables interstellar life, or redefines human potential. Think: AI alignment, climate reversal, or post-scarcity breakthroughs.',
    };

  // Fallback for values between steps
  if (level < 10) return getImpactDescription(1);
  if (level < 20) return getImpactDescription(10);
  if (level < 30) return getImpactDescription(20);
  if (level < 40) return getImpactDescription(30);
  if (level < 50) return getImpactDescription(40);
  if (level < 60) return getImpactDescription(50);
  if (level < 70) return getImpactDescription(60);
  if (level < 80) return getImpactDescription(70);
  if (level < 90) return getImpactDescription(80);
  if (level < 100) return getImpactDescription(90);
  return getImpactDescription(100);
};

// Custom Slider Component since Chakra UI v3 might not have Slider
interface CustomSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  label?: string;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step,
  label,
}) => {
  return (
    <VStack gap={2} align='stretch' w='100%'>
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: `linear-gradient(to right, var(--chakra-colors-brand) 0%, var(--chakra-colors-brand) ${
            ((value - min) / (max - min)) * 100
          }%, var(--chakra-colors-gray-200) ${
            ((value - min) / (max - min)) * 100
          }%, var(--chakra-colors-gray-200) 100%)`,
          outline: 'none',
          appearance: 'none',
        }}
      />
      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--chakra-colors-brand);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--chakra-colors-brand);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </VStack>
  );
};

// User Group component with OK/Cancel editing
interface UserGroupItemProps {
  group: { description: string; size: number };
  index: number;
  isEditing: boolean;
  onChange: (
    index: number,
    field: 'description' | 'size',
    value: string | number
  ) => void;
  onRemove: (index: number) => void;
  onConfirm: (index: number) => void;
  onCancel: (index: number) => void;
  onEdit: (index: number) => void;
  canRemove: boolean;
}

const UserGroupItem: React.FC<UserGroupItemProps> = ({
  group,
  index,
  isEditing,
  onChange,
  onRemove,
  onConfirm,
  onCancel,
  onEdit,
  canRemove,
}) => {
  const scaleIndex = POPULATION_SCALE.findIndex((val) => val >= group.size);
  const currentScaleIndex =
    scaleIndex === -1 ? POPULATION_SCALE.length - 1 : scaleIndex;

  const handleSliderChange = useCallback(
    (value: number) => {
      const newSize = POPULATION_SCALE[value] || 1;
      onChange(index, 'size', newSize);
    },
    [index, onChange]
  );

  if (isEditing) {
    return (
      <VStack gap={4} align='stretch' w='100%' p={4} bg='bg' borderRadius='md'>
        <Input
          placeholder='Describe the user group (e.g., "Urban professionals in developing countries")'
          value={group.description}
          onChange={(e) => onChange(index, 'description', e.target.value)}
          size='lg'
          w='100%'
          bg='bg.canvas'
          borderColor='border.emphasized'
          color='fg'
          _placeholder={{ color: 'fg.muted' }}
          _focus={{
            borderColor: 'brand',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
          }}
        />

        <VStack gap={3} align='stretch' w='100%'>
          <Text fontSize='sm' fontWeight='medium' color='fg'>
            Group Size: {formatPopulation(group.size)}
          </Text>
          <CustomSlider
            value={currentScaleIndex}
            onChange={handleSliderChange}
            min={0}
            max={POPULATION_SCALE.length - 1}
            step={1}
          />
          <HStack justify='space-between' fontSize='xs' color='fg.muted'>
            <Text>1 person</Text>

            <Text>everyone</Text>
          </HStack>
        </VStack>

        <HStack justify='space-between'>
          <HStack gap={2}>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onConfirm(index)}
              disabled={!group.description.trim()}
              color='fg'
              borderColor='border.emphasized'
              _hover={{ bg: 'bg.hover' }}
            >
              <FiCheck size={14} />
              OK
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => onCancel(index)}
              color='fg'
              _hover={{ bg: 'bg.hover' }}
            >
              Cancel
            </Button>
          </HStack>
          {canRemove && (
            <Button
              size='sm'
              variant='ghost'
              onClick={() => onRemove(index)}
              color='red.500'
              _hover={{ bg: 'red.50' }}
            >
              Delete
            </Button>
          )}
        </HStack>
      </VStack>
    );
  }

  return (
    <HStack justify='space-between' p={3} bg='bg' borderRadius='md' w='100%'>
      <VStack gap={1} align='start' flex='1'>
        <Text fontSize='sm' fontWeight='medium' color='fg'>
          {group.description}
        </Text>
        <Text fontSize='xs' color='fg.muted'>
          Size: {formatPopulation(group.size)}
        </Text>
      </VStack>
      <HStack gap={2}>
        <IconButton
          size='sm'
          variant='ghost'
          color='fg'
          _hover={{ bg: 'bg.hover' }}
          onClick={() => onEdit(index)}
          aria-label='Edit group'
        >
          <FiEdit size={14} />
        </IconButton>
        {canRemove && (
          <IconButton
            size='sm'
            variant='ghost'
            color='red.500'
            _hover={{ bg: 'red.50' }}
            onClick={() => onRemove(index)}
            aria-label='Remove group'
          >
            <FiX size={14} />
          </IconButton>
        )}
      </HStack>
    </HStack>
  );
};

// Problem Statement component with OK/Cancel editing
interface ProblemStatementItemProps {
  statement: { description: string };
  index: number;
  isEditing: boolean;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onConfirm: (index: number) => void;
  onCancel: (index: number) => void;
  onEdit: (index: number) => void;
  canRemove: boolean;
}

const ProblemStatementItem: React.FC<ProblemStatementItemProps> = ({
  statement,
  index,
  isEditing,
  onChange,
  onRemove,
  onConfirm,
  onCancel,
  onEdit,
  canRemove,
}) => {
  if (isEditing) {
    return (
      <VStack gap={3} align='stretch' w='100%' p={4} bg='bg' borderRadius='md'>
        <Textarea
          placeholder='Describe a specific problem this goal addresses...'
          value={statement.description}
          onChange={(e) => onChange(index, e.target.value)}
          rows={3}
          w='100%'
          bg='bg.canvas'
          borderColor='border.emphasized'
          color='fg'
          _placeholder={{ color: 'fg.muted' }}
          _focus={{
            borderColor: 'brand',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
          }}
        />

        <HStack justify='space-between'>
          <HStack gap={2}>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onConfirm(index)}
              disabled={!statement.description.trim()}
              color='fg'
              borderColor='border.emphasized'
              _hover={{ bg: 'bg.hover' }}
            >
              <FiCheck size={14} />
              OK
            </Button>
            <Button
              size='sm'
              variant='ghost'
              onClick={() => onCancel(index)}
              color='fg'
              _hover={{ bg: 'bg.hover' }}
            >
              Cancel
            </Button>
          </HStack>
          {canRemove && (
            <Button
              size='sm'
              variant='ghost'
              onClick={() => onRemove(index)}
              color='red.500'
              _hover={{ bg: 'red.50' }}
            >
              Delete
            </Button>
          )}
        </HStack>
      </VStack>
    );
  }

  return (
    <HStack justify='space-between' p={3} bg='bg' borderRadius='md' w='100%'>
      <Text fontSize='sm' color='fg' flex='1' lineHeight='1.4'>
        {statement.description}
      </Text>
      <HStack gap={2}>
        <IconButton
          size='sm'
          variant='ghost'
          color='fg'
          _hover={{ bg: 'bg.hover' }}
          onClick={() => onEdit(index)}
          aria-label='Edit statement'
        >
          <FiEdit size={14} />
        </IconButton>
        {canRemove && (
          <IconButton
            size='sm'
            variant='ghost'
            color='red.500'
            _hover={{ bg: 'red.50' }}
            onClick={() => onRemove(index)}
            aria-label='Remove statement'
          >
            <FiX size={14} />
          </IconButton>
        )}
      </HStack>
    </HStack>
  );
};

interface AddGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: ApiLabGoal) => void;
  saving: boolean;
  initialGoal?: ApiLabGoal; // For editing existing goals
  isEditing?: boolean;
}

const AddGoalDialog: React.FC<AddGoalDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  saving,
  initialGoal,
  isEditing = false,
}) => {
  const [newGoal, setNewGoal] = useState<ApiLabGoal>(
    () =>
      initialGoal || {
        name: '',
        description: '',
        user_groups: [{ description: '', size: 1 }],
        problem_statements: [{ description: '' }],
        impact_level: 1, // Start at 1 (Personal Spark)
      }
  );

  // Track which items are being edited - only edit the last item initially
  const [editingUserGroups, setEditingUserGroups] = useState<Set<number>>(
    () => {
      if (initialGoal) {
        // When editing, nothing is in edit mode initially
        return new Set();
      }
      return new Set([0]);
    }
  );

  const [editingProblemStatements, setEditingProblemStatements] = useState<
    Set<number>
  >(() => {
    if (initialGoal) {
      // When editing, nothing is in edit mode initially
      return new Set();
    }
    return new Set([0]);
  });

  const resetForm = useCallback(() => {
    const defaultGoal = {
      name: '',
      description: '',
      user_groups: [{ description: '', size: 1 }],
      problem_statements: [{ description: '' }],
      impact_level: 1, // Start at 1 (Personal Spark)
    };
    setNewGoal(defaultGoal);
    setEditingUserGroups(new Set([0]));
    setEditingProblemStatements(new Set([0]));
  }, []);

  // Reset form when dialog opens with new data
  React.useEffect(() => {
    if (isOpen) {
      if (initialGoal) {
        setNewGoal(initialGoal);
        setEditingUserGroups(new Set());
        setEditingProblemStatements(new Set());
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialGoal, resetForm]);

  // Validation logic
  const hasValidUserGroups = newGoal.user_groups.some((group) =>
    group.description.trim()
  );
  const canSaveGoal =
    newGoal.name.trim() && newGoal.description.trim() && hasValidUserGroups;

  const handleSave = useCallback(() => {
    if (!newGoal.name.trim() || !newGoal.description.trim()) return;

    const goalToAdd: ApiLabGoal = {
      name: newGoal.name.trim(),
      description: newGoal.description.trim(),
      user_groups: newGoal.user_groups.filter((group) =>
        group.description.trim()
      ),
      problem_statements: newGoal.problem_statements.filter((stmt) =>
        stmt.description.trim()
      ),
      impact_level: newGoal.impact_level,
    };

    onSave(goalToAdd);
    if (!isEditing) {
      resetForm();
    }
  }, [newGoal, onSave, resetForm, isEditing]);

  const handleClose = useCallback(() => {
    if (!isEditing) {
      resetForm();
    }
    onClose();
  }, [resetForm, onClose, isEditing]);

  // User Group Management
  const addUserGroup = useCallback(() => {
    setNewGoal((prev) => ({
      ...prev,
      user_groups: [...prev.user_groups, { description: '', size: 1 }],
    }));

    // Set the new group to editing mode
    setEditingUserGroups((prev) => {
      const newSet = new Set(prev);
      newSet.add(newGoal.user_groups.length);
      return newSet;
    });
  }, [newGoal.user_groups.length]);

  const updateUserGroup = useCallback(
    (index: number, field: 'description' | 'size', value: string | number) => {
      setNewGoal((prev) => ({
        ...prev,
        user_groups: prev.user_groups.map((group, i) =>
          i === index ? { ...group, [field]: value } : group
        ),
      }));
    },
    []
  );

  const editUserGroup = useCallback((index: number) => {
    setEditingUserGroups((prev) => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  }, []);

  const confirmUserGroup = useCallback((index: number) => {
    setEditingUserGroups((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  const cancelUserGroup = useCallback(
    (index: number) => {
      // If it's a new group being added, remove it
      if (newGoal.user_groups[index].description === '') {
        setNewGoal((prev) => ({
          ...prev,
          user_groups: prev.user_groups.filter((_, i) => i !== index),
        }));
      }

      setEditingUserGroups((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    },
    [newGoal.user_groups]
  );

  const removeUserGroup = useCallback((index: number) => {
    setNewGoal((prev) => ({
      ...prev,
      user_groups: prev.user_groups.filter((_, i) => i !== index),
    }));
    setEditingUserGroups((prev) => {
      const newSet = new Set<number>(prev);
      newSet.delete(index);
      // Adjust indices for remaining items
      const adjustedSet = new Set<number>();
      for (const editIndex of newSet) {
        adjustedSet.add(editIndex > index ? editIndex - 1 : editIndex);
      }
      return adjustedSet;
    });
  }, []);

  // Problem Statement Management
  const addProblemStatement = useCallback(() => {
    setNewGoal((prev) => ({
      ...prev,
      problem_statements: [...prev.problem_statements, { description: '' }],
    }));

    // Set the new statement to editing mode
    setEditingProblemStatements((prev) => {
      const newSet = new Set(prev);
      newSet.add(newGoal.problem_statements.length);
      return newSet;
    });
  }, [newGoal.problem_statements.length]);

  const editProblemStatement = useCallback((index: number) => {
    setEditingProblemStatements((prev) => {
      const newSet = new Set(prev);
      newSet.add(index);
      return newSet;
    });
  }, []);

  const updateProblemStatement = useCallback((index: number, value: string) => {
    setNewGoal((prev) => ({
      ...prev,
      problem_statements: prev.problem_statements.map((stmt, i) =>
        i === index ? { description: value } : stmt
      ),
    }));
  }, []);

  const confirmProblemStatement = useCallback((index: number) => {
    setEditingProblemStatements((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  const cancelProblemStatement = useCallback(
    (index: number) => {
      // If it's a new statement being added, remove it
      if (newGoal.problem_statements[index].description === '') {
        setNewGoal((prev) => ({
          ...prev,
          problem_statements: prev.problem_statements.filter(
            (_, i) => i !== index
          ),
        }));
      }

      setEditingProblemStatements((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    },
    [newGoal.problem_statements]
  );

  const removeProblemStatement = useCallback((index: number) => {
    setNewGoal((prev) => ({
      ...prev,
      problem_statements: prev.problem_statements.filter((_, i) => i !== index),
    }));
    setEditingProblemStatements((prev) => {
      const newSet = new Set<number>(prev);
      newSet.delete(index);
      // Adjust indices for remaining items
      const adjustedSet = new Set<number>();
      for (const editIndex of newSet) {
        adjustedSet.add(editIndex > index ? editIndex - 1 : editIndex);
      }
      return adjustedSet;
    });
  }, []);

  // Impact level handling with stepped slider - find the exact index
  const currentImpactIndex = IMPACT_LEVELS.indexOf(newGoal.impact_level);
  const impactSliderIndex = currentImpactIndex !== -1 ? currentImpactIndex : 0;

  const handleImpactChange = useCallback((value: number) => {
    const newImpactLevel = IMPACT_LEVELS[value] || 1;
    setNewGoal((prev) => ({ ...prev, impact_level: newImpactLevel }));
  }, []);

  const impactInfo = getImpactDescription(newGoal.impact_level);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={({ open }) => !open && handleClose()}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content
          maxW='4xl'
          w='90vw'
          maxH='90vh'
          bg='bg.canvas'
          borderColor='border.emphasized'
        >
          <Dialog.Header>
            <Dialog.Title color='fg' fontFamily='heading'>
              {isEditing ? 'Edit Lab Goal' : 'Add New Lab Goal'}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <IconButton
                size='sm'
                variant='ghost'
                onClick={handleClose}
                color='fg'
                _hover={{ bg: 'bg.hover' }}
                disabled={saving}
              >
                <FiX />
              </IconButton>
            </Dialog.CloseTrigger>
          </Dialog.Header>

          {saving ? (
            // Loading State - Replace entire dialog content
            <Box p={8}>
              <Center>
                <VStack gap={6} textAlign='center'>
                  <Spinner
                    size='xl'
                    color='brand'
                    thickness='4px'
                    speed='0.65s'
                  />
                  <VStack gap={2}>
                    <Text
                      fontSize='lg'
                      fontWeight='medium'
                      color='fg'
                      fontFamily='heading'
                    >
                      {isEditing ? 'Updating Lab Goal' : 'Adding New Lab Goal'}
                    </Text>
                    <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                      Please wait while we save your goal to the lab...
                    </Text>
                  </VStack>
                </VStack>
              </Center>
            </Box>
          ) : (
            // Normal Form Content
            <>
              <Dialog.Body maxH='calc(90vh - 140px)' overflowY='auto'>
                <VStack gap={8} align='stretch' w='100%'>
                  {/* Goal Name */}
                  <Field.Root w='100%'>
                    <Field.Label color='fg'>Goal Name</Field.Label>
                    <Input
                      value={newGoal.name}
                      onChange={(e) =>
                        setNewGoal((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder='e.g., Reduce fashion waste in luxury market'
                      size='lg'
                      w='100%'
                      bg='bg.canvas'
                      borderColor='border.emphasized'
                      color='fg'
                      _placeholder={{ color: 'fg.muted' }}
                      _focus={{
                        borderColor: 'brand',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                      }}
                    />
                  </Field.Root>

                  {/* Goal Description */}
                  <Field.Root w='100%'>
                    <Field.Label color='fg'>Goal Description</Field.Label>
                    <Textarea
                      value={newGoal.description}
                      onChange={(e) =>
                        setNewGoal((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder='Describe what this goal aims to achieve...'
                      rows={4}
                      size='lg'
                      w='100%'
                      bg='bg.canvas'
                      borderColor='border.emphasized'
                      color='fg'
                      _placeholder={{ color: 'fg.muted' }}
                      _focus={{
                        borderColor: 'brand',
                        boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                      }}
                    />
                  </Field.Root>

                  {/* Impact Level - Slider first, then description */}
                  <Field.Root w='100%'>
                    <Field.Label color='fg'>
                      Impact Level ({newGoal.impact_level}%)
                    </Field.Label>
                    <VStack gap={4} align='stretch' w='100%'>
                      <CustomSlider
                        value={impactSliderIndex}
                        onChange={handleImpactChange}
                        min={0}
                        max={IMPACT_LEVELS.length - 1}
                        step={1}
                      />
                      <VStack gap={0} align='start' w='100%'>
                        <Text fontSize='lg' fontWeight='bold' color='fg'>
                          {impactInfo.title}
                        </Text>
                        <Text fontSize='sm' color='fg.muted' lineHeight='1.4'>
                          {impactInfo.description}
                        </Text>
                      </VStack>
                    </VStack>
                  </Field.Root>

                  {/* User Groups */}
                  <Field.Root w='100%'>
                    <Field.Label color='fg'>User Groups</Field.Label>
                    <VStack gap={4} align='stretch' w='100%'>
                      {newGoal.user_groups.map((group, index) => (
                        <UserGroupItem
                          key={index}
                          group={group}
                          index={index}
                          isEditing={editingUserGroups.has(index)}
                          onChange={updateUserGroup}
                          onRemove={removeUserGroup}
                          onConfirm={confirmUserGroup}
                          onCancel={cancelUserGroup}
                          onEdit={editUserGroup}
                          canRemove={true}
                        />
                      ))}
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={addUserGroup}
                        color='fg.muted'
                        borderColor='border.muted'
                        borderStyle='dashed'
                        _hover={{ bg: 'bg.hover' }}
                      >
                        <FiPlus size={12} />
                        <Text ml={2}>Add Another Group</Text>
                      </Button>
                    </VStack>
                  </Field.Root>

                  {/* Problem Statements */}
                  <Field.Root w='100%'>
                    <Field.Label color='fg'>Problem Statements</Field.Label>
                    <VStack gap={4} align='stretch' w='100%'>
                      {newGoal.problem_statements.map((statement, index) => (
                        <ProblemStatementItem
                          key={index}
                          statement={statement}
                          index={index}
                          isEditing={editingProblemStatements.has(index)}
                          onChange={updateProblemStatement}
                          onRemove={removeProblemStatement}
                          onConfirm={confirmProblemStatement}
                          onCancel={cancelProblemStatement}
                          onEdit={editProblemStatement}
                          canRemove={true}
                        />
                      ))}
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={addProblemStatement}
                        color='fg.muted'
                        borderColor='border.muted'
                        borderStyle='dashed'
                        _hover={{ bg: 'bg.hover' }}
                      >
                        <FiPlus size={12} />
                        <Text ml={2}>Add Another Problem</Text>
                      </Button>
                    </VStack>
                  </Field.Root>
                </VStack>
              </Dialog.Body>

              <Dialog.Footer>
                <VStack gap={3} align='stretch' w='100%'>
                  {!hasValidUserGroups && (
                    <Text fontSize='sm' color='red.500' textAlign='center'>
                      Please add at least one user group to save this goal.
                    </Text>
                  )}
                  <HStack gap={3} justify='center'>
                    <Button
                      variant='outline'
                      onClick={handleClose}
                      color='fg'
                      borderColor='border.emphasized'
                      _hover={{ bg: 'bg.hover' }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!canSaveGoal || saving}
                      bg='brand'
                      color='white'
                      _hover={{ bg: 'brand.hover' }}
                    >
                      <FiSave size={14} />
                      {isEditing ? 'Update Goal' : 'Save Goal'}
                    </Button>
                  </HStack>
                </VStack>
              </Dialog.Footer>
            </>
          )}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default AddGoalDialog;
