import React from 'react';
import { Box, VStack, HStack, Button, Text, Badge } from '@chakra-ui/react';
import { FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi';

// Step components
import Step1BasicInfo from './Step1BasicInfo';
import Step2DataInput from './Step2DataInput';
import Step3Review from './Step3Review';

// Types
import type {
  CreateLabStep,
  LabCreationFormData,
  StepValidation,
  WhiteboardLabSeed,
} from './types';

interface LabCreationWizardProps {
  currentStep: CreateLabStep;
  formData: LabCreationFormData;
  onFormDataUpdate: (updates: Partial<LabCreationFormData>) => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onCreateLab: () => void;
  canProceed: boolean;
  isCreating: boolean;
  validation: StepValidation;
  initialLabSeed?: WhiteboardLabSeed;
  isLabSeedProcessed?: boolean;
}

const LabCreationWizard: React.FC<LabCreationWizardProps> = ({
  currentStep,
  formData,
  onFormDataUpdate,
  onNextStep,
  onPreviousStep,
  onCreateLab,
  canProceed,
  isCreating,
  validation,
  initialLabSeed,
  isLabSeedProcessed,
}) => {
  // Step titles and descriptions
  const stepInfo = {
    1: {
      title: 'Lab Basics & Initial Source',
      description: 'Set up your lab name and description',
    },
    2: {
      title: 'Data Input & Organization',
      description: 'Add subjects and organize them into categories',
    },
    3: {
      title: 'Review & Create',
      description: 'Review your lab configuration and create',
    },
  };

  // Check if lab has any data populated
  const hasPopulatedData = () => {
    const totalSubjects = formData.categories.reduce(
      (sum, cat) => sum + cat.subjects.length,
      0
    );
    const totalTerms =
      formData.includeTerms.length + formData.excludeTerms.length;
    return totalSubjects > 0 || totalTerms > 0;
  };

  // Get data summary for badges
  const getDataSummary = () => {
    const totalSubjects = formData.categories.reduce(
      (sum, cat) => sum + cat.subjects.length,
      0
    );
    const totalTerms =
      formData.includeTerms.length + formData.excludeTerms.length;

    if (totalSubjects === 0 && totalTerms === 0) return null;

    const parts = [];
    if (totalSubjects > 0) parts.push(`${totalSubjects}`);
    if (totalTerms > 0) parts.push(`${totalTerms}T`);

    return parts.join('+');
  };

  // Check if lab is empty for step 2 button text
  const isLabEmpty = () => {
    const totalSubjects = formData.categories.reduce(
      (sum, cat) => sum + cat.subjects.length,
      0
    );
    const totalTerms =
      formData.includeTerms.length + formData.excludeTerms.length;
    return totalSubjects === 0 && totalTerms === 0;
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1BasicInfo
            formData={formData}
            onFormDataUpdate={onFormDataUpdate}
            validation={validation.step1}
            isFromLabSeed={!!initialLabSeed}
          />
        );
      case 2:
        return (
          <Step2DataInput
            formData={formData}
            onFormDataUpdate={onFormDataUpdate}
            validation={validation.step2}
            initialLabSeed={initialLabSeed}
            onNextStep={onNextStep}
            isLabSeedProcessed={isLabSeedProcessed}
          />
        );
      case 3:
        return (
          <Step3Review
            formData={formData}
            onFormDataUpdate={onFormDataUpdate}
            validation={validation.step3}
            onCreateLab={onCreateLab}
            isCreating={isCreating}
          />
        );
      default:
        return null;
    }
  };

  // Get button text with enhanced logic
  const getNextButtonText = () => {
    switch (currentStep) {
      case 1:
        return hasPopulatedData()
          ? 'Continue to Data Input'
          : 'Continue to Data Input';
      case 2:
        return isLabEmpty()
          ? 'Continue without subjects'
          : 'Continue to Review';
      case 3:
        return 'Create Lab';
      default:
        return 'Next';
    }
  };

  const getPreviousButtonText = () => {
    switch (currentStep) {
      case 2:
        return 'Back to Basics';
      case 3:
        return 'Back to Data Input';
      default:
        return 'Previous';
    }
  };

  return (
    <VStack gap={6} align='stretch'>
      {/* Step header - enhanced with data indication */}
      <Box
        p={6}
        bg='bg.canvas'
        borderRadius='md'
        borderWidth='1px'
        borderColor='border.emphasized'
      >
        <VStack gap={2} align='start'>
          <HStack gap={3} align='center'>
            <Box
              w={8}
              h={8}
              borderRadius='full'
              bg='brand'
              color='white'
              display='flex'
              alignItems='center'
              justifyContent='center'
              fontSize='sm'
              fontWeight='medium'
              fontFamily='body'
            >
              {currentStep}
            </Box>
            <VStack gap={0} align='start' flex='1'>
              <HStack gap={3} align='center'>
                <Text
                  fontSize='lg'
                  fontWeight='semibold'
                  color='fg'
                  fontFamily='heading'
                >
                  Step {currentStep}: {stepInfo[currentStep].title}
                </Text>

                {/* Data indication badges */}
                {currentStep === 2 && hasPopulatedData() && (
                  <Badge
                    colorScheme='green'
                    variant='subtle'
                    fontSize='xs'
                    fontFamily='body'
                  >
                    {getDataSummary()} items
                  </Badge>
                )}

                {initialLabSeed && currentStep === 2 && (
                  <Badge
                    colorScheme='blue'
                    variant='subtle'
                    fontSize='xs'
                    fontFamily='body'
                  >
                    From Lab Seed
                  </Badge>
                )}
              </HStack>

              <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                {stepInfo[currentStep].description}
              </Text>
            </VStack>
          </HStack>

          {/* Progress indicator for current step */}
          {currentStep === 2 && (
            <Box w='100%' mt={2}>
              <Text fontSize='xs' color='fg.muted' mb={1} fontFamily='body'>
                {initialLabSeed
                  ? 'Lab Seed data populated'
                  : isLabEmpty()
                  ? 'Empty lab mode'
                  : 'Manual data entry mode'}
              </Text>
              <Box
                w='100%'
                h='2px'
                bg='bg.muted'
                borderRadius='full'
                overflow='hidden'
              >
                <Box
                  w={initialLabSeed ? '100%' : isLabEmpty() ? '0%' : '50%'}
                  h='100%'
                  bg='brand'
                  transition='all 0.3s'
                />
              </Box>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Step content */}
      <Box
        minH='500px'
        p={6}
        bg='bg.canvas'
        borderRadius='md'
        borderWidth='1px'
        borderColor='border.emphasized'
      >
        {renderStepContent()}
      </Box>

      {/* Navigation buttons - enhanced with data indicators */}
      <HStack justify='space-between' align='center'>
        <HStack gap={2}>
          <Button
            variant='ghost'
            onClick={onPreviousStep}
            disabled={currentStep === 1 || isCreating}
            color='fg.muted'
            _hover={{ color: 'fg', bg: 'bg.hover' }}
            fontFamily='heading'
          >
            <FiArrowLeft size={16} />
            {getPreviousButtonText()}
          </Button>

          {/* Data indicator for previous step button when going back to data input */}
          {currentStep === 3 && hasPopulatedData() && (
            <Badge
              colorScheme='green'
              variant='subtle'
              fontSize='xs'
              fontFamily='body'
            >
              {getDataSummary()} items
            </Badge>
          )}
        </HStack>

        <HStack gap={3}>
          {/* Step completion indicators */}
          <HStack gap={1}>
            {[1, 2, 3].map((step) => (
              <Box
                key={step}
                w={2}
                h={2}
                borderRadius='full'
                bg={
                  step < currentStep
                    ? 'brand'
                    : step === currentStep
                    ? 'brand'
                    : 'bg.muted'
                }
                transition='all 0.2s'
              />
            ))}
          </HStack>

          <HStack gap={2}>
            <Button
              onClick={currentStep === 3 ? onCreateLab : onNextStep}
              disabled={!canProceed || isCreating}
              variant={currentStep === 3 ? 'solid' : 'outline'}
              bg={currentStep === 3 ? 'brand' : 'bg.canvas'}
              color={currentStep === 3 ? 'white' : 'brand'}
              borderColor='brand'
              _hover={{
                bg: currentStep === 3 ? 'brand.hover' : 'bg.hover',
                borderColor: 'brand.hover',
              }}
              fontFamily='heading'
              minW='160px'
            >
              {currentStep === 3 ? (
                <>
                  <FiCheck size={16} />
                  Create Lab
                </>
              ) : (
                <>
                  {getNextButtonText()}
                  <FiArrowRight size={16} />
                </>
              )}
            </Button>

            {/* Data indicator for next step button */}
            {(currentStep === 1 || currentStep === 2) && hasPopulatedData() && (
              <Badge
                colorScheme='green'
                variant='subtle'
                fontSize='xs'
                fontFamily='body'
              >
                {getDataSummary()}
              </Badge>
            )}
          </HStack>
        </HStack>
      </HStack>
    </VStack>
  );
};

export default LabCreationWizard;
