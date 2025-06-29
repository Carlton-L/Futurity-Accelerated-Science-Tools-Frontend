import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Alert,
} from '@chakra-ui/react';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';

// Context and services
import { useAuth } from '../../context/AuthContext';

// Components
import LabCreationWizard from './LabCreationWizard';
import LabCreationLoadingModal from './LabCreationLoadingModal';

// Types and utils
import type {
  LabCreationFormData,
  CreateLabStep,
  WizardState,
  WhiteboardLabSeed,
} from './types';
import {
  createDefaultFormData,
  validateAllSteps,
  calculateProcessingTime,
} from './utils';

interface CreateLabProps {
  teamspaceId?: string;
  initialLabSeed?: WhiteboardLabSeed; // If coming from whiteboard
}

interface CreateLabAPIRequest {
  ent_name: string;
  team_id: string;
  ent_summary?: string;
  picture_url?: string;
  thumbnail_url?: string;
  subcategories: string[];
  subjects: string[];
  new_terms: string[];
  exclude_terms: string[];
  include_terms: string[];
  goals: any[];
  metadata: Record<string, any>;
}

interface CreateLabAPIResponse {
  success?: boolean;
  lab_id?: string;
  id?: string;
  ent_id?: string;
  message?: string;
  error?: string;
  [key: string]: any; // Allow for any additional fields
}

const CreateLab: React.FC<CreateLabProps> = ({
  teamspaceId: propTeamspaceId,
  initialLabSeed,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuth();

  // Get teamspace ID from props or URL params
  const teamspaceId = propTeamspaceId || searchParams.get('teamspace_id') || '';

  // State management
  const [formData, setFormData] = useState<LabCreationFormData>(() => {
    const defaultData = createDefaultFormData();

    // If we have an initial Lab Seed, populate step 2
    if (initialLabSeed) {
      return {
        ...defaultData,
        // Don't auto-populate name/summary - let user decide in step 1
        // Mark step 2 as populated since we have Lab Seed data
      };
    }

    return defaultData;
  });

  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 1,
    steps: {
      1: { completed: false, populated: false, hasError: false },
      2: { completed: false, populated: !!initialLabSeed, hasError: false },
      3: { completed: false, populated: false, hasError: false },
    },
    canProceed: false,
    isFromLabSeed: !!initialLabSeed,
  });

  // Loading modal state
  const [loadingModal, setLoadingModal] = useState<{
    isOpen: boolean;
    stage: 'creating' | 'processing' | 'completed' | 'error';
    message: string;
    progress: number;
    errorMessage?: string;
  }>({
    isOpen: false,
    stage: 'creating',
    message: '',
    progress: 0,
  });

  const [error, setError] = useState<string>('');

  // Validation
  const validation = validateAllSteps(formData);
  const currentStepValidation =
    validation[`step${wizardState.currentStep}` as keyof typeof validation];

  // Check if we can proceed to next step
  useEffect(() => {
    const canProceed = currentStepValidation.isValid;
    setWizardState((prev) => ({
      ...prev,
      canProceed,
      steps: {
        ...prev.steps,
        [wizardState.currentStep]: {
          ...prev.steps[wizardState.currentStep],
          hasError: !canProceed,
        },
      },
    }));
  }, [currentStepValidation.isValid, wizardState.currentStep]);

  // Update estimated processing time when form data changes
  useEffect(() => {
    const estimatedTime = calculateProcessingTime(formData);
    setFormData((prev) => ({
      ...prev,
      estimatedProcessingTime: estimatedTime,
    }));
  }, [formData.categories, formData.processTerms, setFormData]);

  // Handle step navigation
  const handleStepChange = useCallback(
    (step: CreateLabStep) => {
      if (step < wizardState.currentStep || wizardState.steps[step].completed) {
        setWizardState((prev) => ({ ...prev, currentStep: step }));
      }
    },
    [wizardState.currentStep, wizardState.steps]
  );

  const handleNextStep = useCallback(() => {
    if (!wizardState.canProceed) return;

    const currentStep = wizardState.currentStep;
    const nextStep = (currentStep + 1) as CreateLabStep;

    // Mark current step as completed
    setWizardState((prev) => ({
      ...prev,
      currentStep: nextStep <= 3 ? nextStep : currentStep,
      steps: {
        ...prev.steps,
        [currentStep]: {
          ...prev.steps[currentStep],
          completed: true,
        },
      },
    }));
  }, [wizardState.canProceed, wizardState.currentStep]);

  const handlePreviousStep = useCallback(() => {
    const currentStep = wizardState.currentStep;
    const prevStep = (currentStep - 1) as CreateLabStep;

    if (prevStep >= 1) {
      setWizardState((prev) => ({ ...prev, currentStep: prevStep }));
    }
  }, [wizardState.currentStep]);

  // Handle form data updates
  const handleFormDataUpdate = useCallback(
    (updates: Partial<LabCreationFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }));
      setError(''); // Clear any previous errors
    },
    []
  );

  // Transform form data to API format
  const transformToAPIFormat = useCallback(
    (formData: LabCreationFormData): CreateLabAPIRequest => {
      // Get all new terms (subjects that need processing)
      const newTerms = formData.categories
        .flatMap((cat) => cat.subjects)
        .filter((subject) => subject.isNewTerm)
        .map((subject) => subject.subjectName);

      // Get existing subjects (those with ent_fsid)
      const existingSubjects = formData.categories
        .flatMap((cat) => cat.subjects)
        .filter((subject) => !subject.isNewTerm && subject.subjectSlug)
        .map((subject) => subject.subjectSlug!);

      // Get custom category names
      const subcategories = formData.categories
        .filter((cat) => cat.type === 'custom' && cat.subjects.length > 0)
        .map((cat) => cat.name);

      return {
        ent_name: formData.name.trim(),
        team_id: teamspaceId || 'ef3a7358-2cbf-4e6a-adf3-b0f640f60f47', // Fallback team ID
        ent_summary: formData.summary.trim() || undefined,
        subcategories,
        subjects: existingSubjects,
        new_terms: newTerms,
        exclude_terms: formData.excludeTerms.map((term) => term.text),
        include_terms: formData.includeTerms.map((term) => term.text),
        goals: [],
        metadata: {},
      };
    },
    [teamspaceId]
  );

  // Handle lab creation with loading modal
  const handleCreateLab = useCallback(async () => {
    if (!token || !user) {
      setError('Missing authentication information');
      return;
    }

    // Show loading modal
    setLoadingModal({
      isOpen: true,
      stage: 'creating',
      message: 'Setting up your lab...',
      progress: 10,
    });

    try {
      // Transform form data to API format
      const apiData = transformToAPIFormat(formData);

      // Update progress
      setLoadingModal((prev) => ({
        ...prev,
        message: 'Sending lab data...',
        progress: 30,
      }));

      console.log('Creating lab with data:', apiData); // Debug log

      // Make API call
      const response = await fetch(
        'http://fast.futurity.science/management/labs/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(apiData),
        }
      );

      // Update progress
      setLoadingModal((prev) => ({
        ...prev,
        message: 'Processing response...',
        progress: 70,
      }));

      console.log('API Response status:', response.status, response.statusText); // Debug log

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData); // Debug log
        throw new Error(
          `Failed to create lab: ${response.status} ${response.statusText} - ${errorData}`
        );
      }

      const result = await response.json();
      console.log('API Success Response:', result); // Debug log

      // The API might not return a "success" field, so let's check for lab_id or similar
      if (result.error) {
        throw new Error(result.error);
      }

      // If we get here, assume success (API returned 200/201 and parsed JSON)
      const labId = result.lab_id || result.id || result.ent_id;

      // Simulate processing time if there are new terms
      const hasNewTerms = formData.categories
        .flatMap((cat) => cat.subjects)
        .some((subject) => subject.isNewTerm);

      if (hasNewTerms && formData.processTerms) {
        setLoadingModal((prev) => ({
          ...prev,
          stage: 'processing',
          message: 'Processing new terms...',
          progress: 80,
        }));

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setLoadingModal((prev) => ({
          ...prev,
          progress: 95,
        }));
      }

      // Show success
      setLoadingModal((prev) => ({
        ...prev,
        stage: 'completed',
        message: 'Lab created successfully!',
        progress: 100,
      }));

      // Navigate after showing success
      setTimeout(() => {
        if (labId) {
          console.log('Navigating to lab:', labId); // Debug log
          navigate(`/lab/${labId}`);
        } else {
          console.log('No lab ID, navigating to labs list'); // Debug log
          navigate(`/teamspace/${teamspaceId}/labs`);
        }
      }, 2000);
    } catch (error) {
      console.error('Lab creation failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create lab';

      setLoadingModal({
        isOpen: true,
        stage: 'error',
        message: 'Failed to create lab',
        progress: 0,
        errorMessage,
      });

      // Auto-close error modal after 10 seconds (increased from 5)
      setTimeout(() => {
        setLoadingModal((prev) => ({ ...prev, isOpen: false }));
      }, 10000);
    }
  }, [token, user, formData, transformToAPIFormat, navigate, teamspaceId]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (initialLabSeed) {
      // If we came from a Lab Seed, go back to whiteboard
      navigate('/whiteboard');
    } else {
      // Otherwise go back to labs list
      navigate(`/teamspace/${teamspaceId}/labs`);
    }
  }, [navigate, initialLabSeed, teamspaceId]);

  return (
    <Container maxW='6xl' py={6}>
      <VStack gap={6} align='stretch'>
        {/* Header */}
        <HStack justify='space-between' align='center'>
          <HStack gap={4}>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleBack}
              color='fg.muted'
              _hover={{ color: 'fg', bg: 'bg.hover' }}
              fontFamily='heading'
            >
              <FiArrowLeft size={16} />
              Back
            </Button>

            <VStack gap={0} align='start'>
              <Heading size='lg' color='fg' fontFamily='heading'>
                Create New Lab
                {initialLabSeed && (
                  <Text as='span' fontSize='md' color='fg.muted' ml={2}>
                    from Lab Seed
                  </Text>
                )}
              </Heading>

              <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                {wizardState.isFromLabSeed
                  ? 'Set up your lab using the selected Lab Seed as a foundation'
                  : 'Build your research lab by organizing subjects and setting research parameters'}
              </Text>
            </VStack>
          </HStack>

          {/* Step indicator */}
          <HStack gap={2}>
            {[1, 2, 3].map((step) => (
              <Box
                key={step}
                w={8}
                h={8}
                borderRadius='full'
                bg={
                  wizardState.steps[step as CreateLabStep].completed
                    ? 'brand'
                    : wizardState.currentStep === step
                    ? 'brand'
                    : 'bg.muted'
                }
                color={
                  wizardState.steps[step as CreateLabStep].completed ||
                  wizardState.currentStep === step
                    ? 'white'
                    : 'fg.muted'
                }
                display='flex'
                alignItems='center'
                justifyContent='center'
                fontSize='sm'
                fontWeight='medium'
                fontFamily='body'
                cursor={
                  step < wizardState.currentStep ||
                  wizardState.steps[step as CreateLabStep].completed
                    ? 'pointer'
                    : 'default'
                }
                onClick={() => {
                  if (
                    step < wizardState.currentStep ||
                    wizardState.steps[step as CreateLabStep].completed
                  ) {
                    handleStepChange(step as CreateLabStep);
                  }
                }}
                _hover={
                  step < wizardState.currentStep ||
                  wizardState.steps[step as CreateLabStep].completed
                    ? { bg: 'brand.hover' }
                    : {}
                }
              >
                {wizardState.steps[step as CreateLabStep].completed ? (
                  <FiCheck size={14} />
                ) : (
                  step
                )}
              </Box>
            ))}
          </HStack>
        </HStack>

        {/* Error display */}
        {error && (
          <Alert.Root status='error'>
            <Alert.Indicator />
            <Alert.Title>Error</Alert.Title>
            <Alert.Description fontFamily='body'>{error}</Alert.Description>
          </Alert.Root>
        )}

        {/* Validation warnings */}
        {currentStepValidation.warnings.length > 0 && (
          <Alert.Root status='warning'>
            <Alert.Indicator />
            <Alert.Title>Recommendations:</Alert.Title>
            <Alert.Description fontFamily='body'>
              <VStack gap={1} align='start'>
                {currentStepValidation.warnings.map((warning, index) => (
                  <Text key={index} fontSize='sm'>
                    • {warning}
                  </Text>
                ))}
              </VStack>
            </Alert.Description>
          </Alert.Root>
        )}

        {/* Main wizard */}
        <LabCreationWizard
          currentStep={wizardState.currentStep}
          formData={formData}
          onFormDataUpdate={handleFormDataUpdate}
          onNextStep={handleNextStep}
          onPreviousStep={handlePreviousStep}
          onCreateLab={handleCreateLab}
          canProceed={wizardState.canProceed}
          isCreating={loadingModal.isOpen}
          validation={validation}
          initialLabSeed={initialLabSeed}
        />

        {/* Lab Creation Loading Modal */}
        <LabCreationLoadingModal
          isOpen={loadingModal.isOpen}
          stage={loadingModal.stage}
          message={loadingModal.message}
          progress={loadingModal.progress}
          errorMessage={loadingModal.errorMessage}
        />
      </VStack>
    </Container>
  );
};

export default CreateLab;
