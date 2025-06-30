import React from 'react';
import { Box, VStack, HStack, Button, Text } from '@chakra-ui/react';
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
            onNextStep={onNextStep} // Add this line
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

  // Get button text
  const getNextButtonText = () => {
    switch (currentStep) {
      case 1:
        return 'Continue to Data Input';
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
      {/* Step header */}
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
            <VStack gap={0} align='start'>
              <Text
                fontSize='lg'
                fontWeight='semibold'
                color='fg'
                fontFamily='heading'
              >
                Step {currentStep}: {stepInfo[currentStep].title}
              </Text>
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

      {/* Navigation buttons */}
      <HStack justify='space-between' align='center'>
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
        </HStack>
      </HStack>
    </VStack>
  );
};

export default LabCreationWizard;
