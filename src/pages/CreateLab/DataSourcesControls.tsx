import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Select,
  Input,
  Checkbox,
  Alert,
  Progress,
  Spinner,
} from '@chakra-ui/react';
import {
  FiUpload,
  FiPlus,
  FiCheck,
  FiFile,
  FiDatabase,
  FiEdit3,
} from 'react-icons/fi';

// Types and utils
import type { DataSourceControlsProps } from './types';
import { checkSubjectExists } from './utils';

const DataSourcesControls: React.FC<DataSourceControlsProps> = ({
  formData,
  availableLabSeeds,
  onLabSeedSelect,
  onLabSeedOptionsChange,
  onCSVUpload,
  onManualTermAdd,
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualTermInput, setManualTermInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('uncategorized');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [manualEntryError, setManualEntryError] = useState('');

  // Handle Lab Seed option changes
  const handleReplaceNameChange = useCallback(
    (checked: boolean) => {
      onLabSeedOptionsChange(checked, formData.replaceSummaryFromLabSeed);
    },
    [formData.replaceSummaryFromLabSeed, onLabSeedOptionsChange]
  );

  const handleReplaceSummaryChange = useCallback(
    (checked: boolean) => {
      onLabSeedOptionsChange(formData.replaceTitleFromLabSeed, checked);
    },
    [formData.replaceTitleFromLabSeed, onLabSeedOptionsChange]
  );

  // Handle CSV file selection
  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setUploadError('Please select a CSV file');
        return;
      }

      // Validate file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }

      setUploadError('');
      setUploadProgress(0);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        await onCSVUpload(file);

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Reset progress after a delay
        setTimeout(() => setUploadProgress(0), 2000);
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : 'Upload failed'
        );
        setUploadProgress(0);
      }
    },
    [onCSVUpload]
  );

  // Handle manual term addition with validation
  const handleManualAdd = useCallback(() => {
    if (!manualTermInput.trim()) return;

    // Check if subject already exists
    const existingSubjects = formData.categories.flatMap((cat) => cat.subjects);
    const existsCheck = checkSubjectExists(
      manualTermInput.trim(),
      existingSubjects,
      formData.categories
    );

    if (existsCheck.exists) {
      setManualEntryError(
        `"${manualTermInput.trim()}" already exists in ${
          existsCheck.categoryName
        }`
      );
      return;
    }

    setManualEntryError('');
    onManualTermAdd(manualTermInput.trim(), selectedCategory);
    setManualTermInput('');
  }, [manualTermInput, selectedCategory, onManualTermAdd, formData.categories]);

  // Handle input changes with validation
  const handleManualInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setManualTermInput(value);

      // Clear error when user starts typing
      if (manualEntryError) {
        setManualEntryError('');
      }

      // Check for conflicts as user types
      if (value.trim()) {
        const existingSubjects = formData.categories.flatMap(
          (cat) => cat.subjects
        );
        const existsCheck = checkSubjectExists(
          value.trim(),
          existingSubjects,
          formData.categories
        );

        if (existsCheck.exists) {
          setManualEntryError(
            `"${value.trim()}" already exists in ${existsCheck.categoryName}`
          );
        }
      }
    },
    [manualEntryError, formData.categories]
  );

  const handleManualKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleManualAdd();
      }
    },
    [handleManualAdd]
  );

  return (
    <VStack gap={4} align='stretch'>
      <Text fontSize='md' fontWeight='medium' color='fg' fontFamily='heading'>
        Data Sources
      </Text>

      <VStack gap={4} align='stretch'>
        {/* Lab Seed Selector */}
        <Box>
          <HStack gap={2} mb={2}>
            <FiDatabase size={16} color='var(--chakra-colors-blue-500)' />
            <Text
              fontSize='sm'
              fontWeight='medium'
              color='fg'
              fontFamily='heading'
            >
              Lab Seed
            </Text>
          </HStack>

          <VStack gap={3} align='stretch'>
            <Select.Root
              value={
                formData.selectedLabSeed?.id
                  ? [formData.selectedLabSeed.id]
                  : []
              }
              onValueChange={(details) => {
                const selectedId = details.value[0];
                if (!selectedId) {
                  onLabSeedSelect(undefined);
                  return;
                }
                const selectedLabSeed = availableLabSeeds.find(
                  (seed) => seed.id === selectedId
                );
                if (selectedLabSeed) {
                  onLabSeedSelect(selectedLabSeed);
                }
              }}
              disabled={isLoading}
            >
              <Select.Label>Select a Lab Seed</Select.Label>
              <Select.Trigger
                bg='bg'
                borderColor='border.muted'
                color='fg'
                _focus={{
                  borderColor: 'brand',
                  boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                }}
                fontFamily='body'
              >
                <Select.ValueText placeholder='Select a Lab Seed...' />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Positioner>
                <Select.Content>
                  <Select.ItemGroup>
                    {availableLabSeeds.map((seed) => (
                      <Select.Item key={seed.id} item={seed.id}>
                        <Select.ItemText>
                          {seed.name} ({seed.subjects.length} subjects)
                        </Select.ItemText>
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.ItemGroup>
                </Select.Content>
              </Select.Positioner>
            </Select.Root>

            {formData.selectedLabSeed && (
              <Box
                p={3}
                bg='bg.subtle'
                borderRadius='sm'
                borderWidth='1px'
                borderColor='border.muted'
              >
                <VStack gap={2} align='stretch'>
                  <Text
                    fontSize='xs'
                    fontWeight='medium'
                    color='fg'
                    fontFamily='heading'
                  >
                    Replace lab info with Lab Seed data:
                  </Text>

                  <HStack gap={4}>
                    <Checkbox.Root
                      checked={formData.replaceTitleFromLabSeed}
                      onCheckedChange={(details) =>
                        handleReplaceNameChange(!!details.checked)
                      }
                      disabled={isLoading}
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label fontSize='xs' fontFamily='body'>
                        Replace title
                      </Checkbox.Label>
                    </Checkbox.Root>

                    <Checkbox.Root
                      checked={formData.replaceSummaryFromLabSeed}
                      onCheckedChange={(details) =>
                        handleReplaceSummaryChange(!!details.checked)
                      }
                      disabled={isLoading}
                    >
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Checkbox.Label fontSize='xs' fontFamily='body'>
                        Replace summary
                      </Checkbox.Label>
                    </Checkbox.Root>
                  </HStack>
                </VStack>
              </Box>
            )}
          </VStack>
        </Box>

        {/* CSV Upload */}
        <Box>
          <HStack gap={2} mb={2}>
            <FiFile size={16} color='var(--chakra-colors-green-500)' />
            <Text
              fontSize='sm'
              fontWeight='medium'
              color='fg'
              fontFamily='heading'
            >
              CSV Upload
            </Text>
          </HStack>

          <VStack gap={3} align='stretch'>
            <input
              ref={fileInputRef}
              type='file'
              accept='.csv'
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <Button
              onClick={handleFileSelect}
              variant='outline'
              size='sm'
              disabled={isLoading}
              bg='bg.canvas'
              borderColor='border.emphasized'
              color='fg'
              _hover={{ bg: 'bg.hover' }}
              fontFamily='body'
              justifyContent='flex-start'
            >
              <FiUpload size={14} />
              {uploadProgress > 0 && uploadProgress < 100
                ? 'Uploading...'
                : 'Upload CSV File'}
            </Button>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress.Root value={uploadProgress} size='sm' bg='bg.muted'>
                <Progress.Track>
                  <Progress.Range colorScheme='green' />
                </Progress.Track>
              </Progress.Root>
            )}

            {uploadProgress === 100 && (
              <HStack gap={2}>
                <FiCheck size={14} color='var(--chakra-colors-green-500)' />
                <Text fontSize='xs' color='green.500' fontFamily='body'>
                  CSV uploaded successfully
                </Text>
              </HStack>
            )}

            {uploadError && (
              <Alert.Root status='error' size='sm'>
                <Alert.Indicator />
                <Alert.Description fontSize='xs' fontFamily='body'>
                  {uploadError}
                </Alert.Description>
              </Alert.Root>
            )}

            <Text fontSize='xs' color='fg.muted' fontFamily='body'>
              Expected format: subject_name, subcategory_name (use
              _include/_exclude for filter terms)
            </Text>
          </VStack>
        </Box>

        {/* Manual Input */}
        <Box>
          <HStack gap={2} mb={2}>
            <FiEdit3 size={16} color='var(--chakra-colors-purple-500)' />
            <Text
              fontSize='sm'
              fontWeight='medium'
              color='fg'
              fontFamily='heading'
            >
              Manual Entry
            </Text>
          </HStack>

          <VStack gap={3} align='stretch'>
            <HStack gap={2}>
              <Input
                value={manualTermInput}
                onChange={handleManualInputChange}
                onKeyDown={handleManualKeyPress}
                placeholder='Enter subject or term...'
                size='sm'
                bg='bg'
                borderColor={manualEntryError ? 'red.500' : 'border.muted'}
                color='fg'
                _placeholder={{ color: 'fg.muted' }}
                _focus={{
                  borderColor: manualEntryError ? 'red.500' : 'brand',
                  boxShadow: manualEntryError
                    ? '0 0 0 1px var(--chakra-colors-red-500)'
                    : '0 0 0 1px var(--chakra-colors-brand)',
                }}
                fontFamily='body'
                disabled={isLoading}
                flex='1'
                minW='200px'
              />

              <Select.Root
                value={[selectedCategory]}
                onValueChange={(details) =>
                  setSelectedCategory(details.value[0])
                }
                disabled={isLoading}
              >
                <Select.Trigger
                  bg='bg'
                  borderColor='border.muted'
                  color='fg'
                  _focus={{
                    borderColor: 'brand',
                    boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
                  }}
                  fontFamily='body'
                  minW='140px'
                >
                  <Select.ValueText />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Positioner>
                  <Select.Content
                    bg='bg.canvas'
                    borderColor='border.emphasized'
                    boxShadow='lg'
                  >
                    <Select.ItemGroup>
                      {formData.categories.map((category) => (
                        <Select.Item key={category.id} item={category.id}>
                          <Select.ItemText color='fg' fontFamily='body'>
                            {category.name}
                          </Select.ItemText>
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.ItemGroup>
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>

              <Button
                onClick={handleManualAdd}
                disabled={
                  !manualTermInput.trim() || isLoading || !!manualEntryError
                }
                size='sm'
                variant='solid'
                bg='brand'
                color='white'
                _hover={{ bg: 'brand.hover' }}
                fontFamily='body'
                minW='auto'
                px={3}
              >
                {isLoading ? <Spinner size='xs' /> : <FiPlus size={14} />}
              </Button>
            </HStack>

            {manualEntryError && (
              <Alert.Root status='error' size='sm'>
                <Alert.Indicator />
                <Alert.Description fontSize='xs' fontFamily='body'>
                  {manualEntryError}
                </Alert.Description>
              </Alert.Root>
            )}

            <Text fontSize='xs' color='fg.muted' fontFamily='body'>
              Add individual subjects or terms and assign them to categories
            </Text>
          </VStack>
        </Box>
      </VStack>

      {/* Summary */}
      {(formData.selectedLabSeed ||
        formData.csvData ||
        formData.categories.some((cat) => cat.subjects.length > 0)) && (
        <Box
          p={3}
          bg='bg.subtle'
          borderRadius='sm'
          borderWidth='1px'
          borderColor='border.muted'
        >
          <VStack gap={2} align='start'>
            <Text
              fontSize='xs'
              fontWeight='medium'
              color='fg'
              fontFamily='heading'
            >
              Data Sources Summary:
            </Text>

            <VStack gap={1} align='start'>
              {formData.selectedLabSeed && (
                <HStack gap={2}>
                  <FiDatabase size={12} color='var(--chakra-colors-blue-500)' />
                  <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                    Lab Seed: {formData.selectedLabSeed.name}
                  </Text>
                </HStack>
              )}

              {formData.csvData && (
                <HStack gap={2}>
                  <FiFile size={12} color='var(--chakra-colors-green-500)' />
                  <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                    CSV: {formData.csvData.terms.length} terms uploaded
                  </Text>
                </HStack>
              )}

              {formData.categories.some((cat) =>
                cat.subjects.some((subj) => subj.source === 'manual')
              ) && (
                <HStack gap={2}>
                  <FiEdit3 size={12} color='var(--chakra-colors-purple-500)' />
                  <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                    Manual:{' '}
                    {
                      formData.categories
                        .flatMap((cat) => cat.subjects)
                        .filter((subj) => subj.source === 'manual').length
                    }{' '}
                    terms added
                  </Text>
                </HStack>
              )}
            </VStack>
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default DataSourcesControls;
