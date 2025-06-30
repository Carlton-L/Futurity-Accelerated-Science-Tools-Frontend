import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Alert,
  createToaster,
} from '@chakra-ui/react';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';

// Context and services
import { useAuth } from '../../context/AuthContext';

// Components
import LabCreationWizard from './LabCreationWizard';
import LabCreationSuccessModal from './LabCreationSuccessModal';

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

// Updated API request interface to match the actual endpoint
interface CreateLabAPIRequest {
  ent_name: string;
  team_id: string;
  ent_summary?: string;
  picture_url?: string;
  thumbnail_url?: string;
  subject_fsids: string[];
  new_subject_terms: string[];
  exclude_terms: string[];
  include_terms: string[];
  goals: unknown[];
  metadata: Record<string, unknown>;
}

interface CreateLabAPIResponse {
  uniqueID: string;
  ent_name: string;
  ent_fsid: string;
  _id: string;
  kbid: string;
  metadata: {
    kbid: string;
    miro_board_url: string;
    ent_summary?: string;
    picture_url?: string;
    thumbnail_url?: string;
    subject_fsids: string[];
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

const CreateLab: React.FC<CreateLabProps> = ({
  teamspaceId: propTeamspaceId,
  initialLabSeed,
}) => {
  const navigate = useNavigate();
  const { token, user, currentTeam } = useAuth();

  // Create toaster instance
  const toaster = createToaster({
    placement: 'top',
  });

  // Get team ID from current team context
  const teamspaceId = propTeamspaceId || currentTeam?.uniqueID || '';

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

  // Success modal state
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    labData?: CreateLabAPIResponse;
  }>({
    isOpen: false,
  });

  const [error, setError] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

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
  }, [formData.categories, formData.processTerms]);

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

  // Transform form data to match the actual API format
  const transformToAPIFormat = useCallback(
    (formData: LabCreationFormData): CreateLabAPIRequest => {
      // Get all manually entered or CSV imported terms (not from Lab Seeds)
      const newSubjectTerms = formData.categories
        .flatMap((cat) => cat.subjects)
        .filter(
          (subject) =>
            subject.source === 'manual' ||
            subject.source === 'csv' ||
            subject.isNewTerm
        )
        .map((subject) => subject.subjectName);

      // Get Lab Seed subjects (these would be subject_fsids when implemented)
      const labSeedSubjects = formData.categories
        .flatMap((cat) => cat.subjects)
        .filter(
          (subject) => subject.source === 'lab_seed' && subject.subjectSlug
        )
        .map((subject) => subject.subjectSlug!);

      return {
        ent_name: formData.name.trim(),
        team_id: teamspaceId, // Using currentTeam.uniqueID from auth context
        ent_summary: formData.summary.trim() || undefined,
        picture_url: undefined,
        thumbnail_url: undefined,
        subject_fsids: labSeedSubjects, // Lab Seed subjects (when implemented)
        new_subject_terms: newSubjectTerms, // Manual/CSV terms
        exclude_terms: formData.excludeTerms.map((term) => term.text),
        include_terms: formData.includeTerms.map((term) => term.text),
        goals: [],
        metadata: {},
      };
    },
    [teamspaceId]
  );

  // Handle lab creation with the correct API endpoint
  const handleCreateLab = useCallback(async () => {
    if (!token || !user) {
      setError('Missing authentication information');
      return;
    }

    if (!teamspaceId || !currentTeam) {
      setError('No team selected. Please select a team before creating a lab.');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Transform form data to API format
      const apiData = transformToAPIFormat(formData);

      console.log('Creating lab with data:', apiData); // Debug log

      // Make API call to the correct endpoint
      const response = await fetch(
        'https://fast.futurity.science/management/labs/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(apiData),
        }
      );

      console.log('API Response status:', response.status, response.statusText); // Debug log

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error Response:', errorData); // Debug log
        throw new Error(
          `Failed to create lab: ${response.status} ${response.statusText} - ${errorData}`
        );
      }

      const result: CreateLabAPIResponse = await response.json();
      console.log('API Success Response:', result); // Debug log

      // Show success toast
      toaster.create({
        title: 'Lab Created Successfully!',
        description: `"${result.ent_name}" is being set up. Check the Labs menu to see when it's ready.`,
        type: 'success',
        duration: 6000,
      });

      // Show success modal
      setSuccessModal({
        isOpen: true,
        labData: result,
      });
    } catch (error) {
      console.error('Lab creation failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create lab';

      setError(errorMessage);

      // Show error toast
      toaster.create({
        title: 'Lab Creation Failed',
        description: errorMessage,
        type: 'error',
        duration: 10000,
      });
    } finally {
      setIsCreating(false);
    }
  }, [
    token,
    user,
    teamspaceId,
    currentTeam,
    formData,
    transformToAPIFormat,
    toaster,
  ]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (initialLabSeed) {
      // If we came from a Lab Seed, go back to whiteboard
      navigate('/whiteboard');
    } else {
      // Otherwise go back to homepage or labs list
      navigate('/');
    }
  }, [navigate, initialLabSeed]);

  // Handle success modal close
  const handleSuccessModalClose = useCallback(() => {
    setSuccessModal({ isOpen: false });
    navigate('/'); // Go back to homepage
  }, [navigate]);

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

        {/* No team warning */}
        {!currentTeam && (
          <Alert.Root status='warning'>
            <Alert.Indicator />
            <Alert.Title>No Team Selected</Alert.Title>
            <Alert.Description fontFamily='body'>
              Please select a team from the navbar before creating a lab. Labs
              must be associated with a team.
            </Alert.Description>
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
          isCreating={isCreating}
          validation={validation}
          initialLabSeed={initialLabSeed}
        />

        {/* Success Modal */}
        <LabCreationSuccessModal
          isOpen={successModal.isOpen}
          labData={successModal.labData}
          onClose={handleSuccessModalClose}
        />
      </VStack>
    </Container>
  );
};

export default CreateLab;
