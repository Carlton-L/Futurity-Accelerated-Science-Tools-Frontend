import React, { useCallback } from 'react';
import {
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Field,
  Box,
  Badge,
} from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';

// Types
import type { LabCreationFormData, ValidationResult } from './types';

interface Step1BasicInfoProps {
  formData: LabCreationFormData;
  onFormDataUpdate: (updates: Partial<LabCreationFormData>) => void;
  validation: ValidationResult;
  isFromLabSeed: boolean;
}

const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
  formData,
  onFormDataUpdate,
  validation,
  isFromLabSeed,
}) => {
  // Handle name change
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFormDataUpdate({ name: e.target.value });
    },
    [onFormDataUpdate]
  );

  // Handle summary change
  const handleSummaryChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onFormDataUpdate({ summary: e.target.value });
    },
    [onFormDataUpdate]
  );

  return (
    <VStack gap={8} align='stretch'>
      {/* Header with context */}
      <VStack gap={3} align='start'>
        <HStack gap={3} align='center'>
          <Text
            fontSize='xl'
            fontWeight='semibold'
            color='fg'
            fontFamily='heading'
          >
            Lab Information
          </Text>
          {isFromLabSeed && (
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

        {isFromLabSeed ? (
          <HStack gap={2} align='start'>
            <FiInfo size={16} color='var(--chakra-colors-blue-500)' />
            <Text
              fontSize='sm'
              color='fg.muted'
              fontFamily='body'
              lineHeight='1.5'
            >
              You're creating a lab from a Lab Seed. The data input step (Step
              2) is already populated with subjects and categories. You can
              optionally replace the lab name and summary with data from the Lab
              Seed in the next step.
            </Text>
          </HStack>
        ) : (
          <Text fontSize='sm' color='fg.muted' fontFamily='body'>
            Start by giving your lab a descriptive name and summary. You'll add
            subjects and organize them in the next step.
          </Text>
        )}
      </VStack>

      {/* Form fields */}
      <VStack gap={6} align='stretch' maxW='2xl'>
        {/* Lab name */}
        <Field.Root
          required
          invalid={validation.errors.some((e) => e.includes('name'))}
        >
          <Field.Label
            fontSize='sm'
            fontWeight='medium'
            color='fg'
            fontFamily='heading'
          >
            Lab Name
          </Field.Label>
          <Input
            value={formData.name}
            onChange={handleNameChange}
            placeholder='Enter a descriptive name for your lab...'
            size='lg'
            bg='bg'
            borderColor='border.muted'
            color='fg'
            _placeholder={{ color: 'fg.muted' }}
            _focus={{
              borderColor: 'brand',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
            }}
            fontFamily='body'
            maxLength={100}
          />
          <Field.HelperText fontSize='xs' color='fg.muted' fontFamily='body'>
            Choose a name that clearly describes your research focus or project
          </Field.HelperText>
          {validation.errors.some((e) => e.includes('name')) && (
            <Field.ErrorText fontSize='sm' color='error' fontFamily='body'>
              {validation.errors.find((e) => e.includes('name'))}
            </Field.ErrorText>
          )}

          {/* Character counter */}
          <HStack justify='space-between' mt={1}>
            <Box />
            <Text
              fontSize='xs'
              color={formData.name.length > 80 ? 'warning' : 'fg.muted'}
              fontFamily='mono'
            >
              {formData.name.length}/100
            </Text>
          </HStack>
        </Field.Root>

        {/* Lab summary */}
        <Field.Root>
          <Field.Label
            fontSize='sm'
            fontWeight='medium'
            color='fg'
            fontFamily='heading'
          >
            Lab Summary
            <Text
              as='span'
              fontSize='xs'
              color='fg.muted'
              fontWeight='normal'
              ml={1}
            >
              (Optional)
            </Text>
          </Field.Label>
          <Textarea
            value={formData.summary}
            onChange={handleSummaryChange}
            placeholder='Describe the purpose, goals, and scope of this lab...'
            size='lg'
            rows={4}
            bg='bg'
            borderColor='border.muted'
            color='fg'
            _placeholder={{ color: 'fg.muted' }}
            _focus={{
              borderColor: 'brand',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
            }}
            fontFamily='body'
            maxLength={500}
            resize='vertical'
          />
          <Field.HelperText fontSize='xs' color='fg.muted' fontFamily='body'>
            Help team members understand what this lab is for and what you're
            researching
          </Field.HelperText>

          {/* Character counter */}
          <HStack justify='space-between' mt={1}>
            <Box />
            <Text
              fontSize='xs'
              color={formData.summary.length > 400 ? 'warning' : 'fg.muted'}
              fontFamily='mono'
            >
              {formData.summary.length}/500
            </Text>
          </HStack>
        </Field.Root>
      </VStack>

      {/* Next step preview */}
      <Box
        p={4}
        bg='bg.canvas'
        borderRadius='md'
        borderWidth='1px'
        borderColor='border.muted'
        borderStyle='dashed'
      >
        <VStack gap={2} align='start'>
          <Text
            fontSize='sm'
            fontWeight='medium'
            color='fg'
            fontFamily='heading'
          >
            Next: Data Input & Organization
          </Text>
          <Text fontSize='xs' color='fg.muted' fontFamily='body'>
            {isFromLabSeed
              ? "Your Lab Seed data is already loaded. You'll be able to review and organize the subjects and categories."
              : "You'll add subjects using Lab Seeds, CSV upload, or manual entry, then organize them into categories."}
          </Text>
        </VStack>
      </Box>
    </VStack>
  );
};

export default Step1BasicInfo;
