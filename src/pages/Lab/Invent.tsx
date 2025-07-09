import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Textarea,
  Image,
  Select,
  Slider,
  Skeleton,
  Accordion,
} from '@chakra-ui/react';
import {
  FiFileText,
  FiImage,
  FiPlay,
  FiDownload,
  FiShare,
  FiRefreshCw,
  FiX,
  FiInfo,
  FiAlertCircle,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toolsService } from '../../services/toolsService';

// Types
interface Subject {
  id: string;
  name: string;
  description: string;
}

interface IdeaSeed {
  id: string;
  name: string;
  description: string;
  relatedSubjects: string[];
  consequences?: string[];
  improvements?: string[];
  stories?: string[];
  personas?: string[];
  roadmap?: string[];
  createdAt: string;
}

interface FutureStoryResult {
  story: string;
  error: string | null;
  formatOption: string;
  yearRange: [number, number];
  storyDetails: string;
  customPrompt?: string;
}

interface FutureImageResult {
  success: boolean;
  enhanced_prompt: string;
  used_prompt: string;
  filename: string;
  image_data: string;
  message: string;
  error: string | null;
  originalPrompt: string;
}

interface InventProps {
  labId: string;
}

const Invent: React.FC<InventProps> = ({ labId }) => {
  const { token } = useAuth();

  const [ideaSeeds, setIdeaSeeds] = useState<IdeaSeed[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Future Stories state
  const [storyDetails, setStoryDetails] = useState<string>('');
  const [formatOption, setFormatOption] = useState<
    | 'future_journalist'
    | 'microfiction'
    | 'aidvertising'
    | 'social_media'
    | 'screenplay_pitch'
    | 'custom'
  >('future_journalist');
  const [yearRange, setYearRange] = useState<[number, number]>([2030, 2050]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [storyResult, setStoryResult] = useState<FutureStoryResult | null>(
    null
  );
  const [generatingStory, setGeneratingStory] = useState<boolean>(false);

  // Futuregrapher state
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [imageResult, setImageResult] = useState<FutureImageResult | null>(
    null
  );
  const [generatingImage, setGeneratingImage] = useState<boolean>(false);

  // Format options for Future Stories
  const formatOptions = [
    { value: 'future_journalist', label: 'Future Journalist Article' },
    { value: 'microfiction', label: 'Microfiction (Short Story)' },
    { value: 'aidvertising', label: 'Future Advertisement' },
    { value: 'social_media', label: 'Social Media Post' },
    { value: 'screenplay_pitch', label: 'Screenplay Pitch' },
    { value: 'custom', label: 'Custom Format' },
  ];

  // Mock data loading
  useEffect(() => {
    const loadInventData = async () => {
      setLoading(true);

      // TODO: Replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock idea seeds
      const mockIdeaSeeds: IdeaSeed[] = [
        {
          id: 'idea-1',
          name: 'Smart Fabric Authentication',
          description: 'Blockchain-enabled fabric tags for luxury authenticity',
          relatedSubjects: ['subj-1', 'subj-4'],
          consequences: ['Reduced counterfeiting', 'Higher consumer trust'],
          createdAt: '2024-03-15T10:30:00Z',
        },
        {
          id: 'idea-2',
          name: 'Circular Fashion Platform',
          description:
            'Digital marketplace for luxury item lifecycle management',
          relatedSubjects: ['subj-2', 'subj-3'],
          improvements: ['Subscription model', 'AR try-on feature'],
          createdAt: '2024-03-14T14:20:00Z',
        },
      ];

      setIdeaSeeds(mockIdeaSeeds);
      setLoading(false);
    };

    loadInventData();
  }, [labId]);

  // Generate Future Story
  const handleGenerateFutureStory = useCallback(async () => {
    if (!storyDetails.trim() || !token) return;

    setGeneratingStory(true);
    setError('');

    try {
      const result = await toolsService.generateFutureStory(
        storyDetails,
        formatOption,
        yearRange,
        formatOption === 'custom' ? customPrompt : null,
        token
      );

      setStoryResult({
        ...result,
        formatOption,
        yearRange,
        storyDetails,
        customPrompt: formatOption === 'custom' ? customPrompt : undefined,
      });

      console.log('Future story generated successfully');
    } catch (error) {
      console.error('Failed to generate future story:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to generate story'
      );
    } finally {
      setGeneratingStory(false);
    }
  }, [storyDetails, formatOption, yearRange, customPrompt, token]);

  // Generate Future Image
  const handleGenerateFutureImage = useCallback(async () => {
    if (!imagePrompt.trim() || !token) return;

    setGeneratingImage(true);
    setError('');

    try {
      const result = await toolsService.generateFutureImage(imagePrompt, token);

      setImageResult({
        ...result,
        originalPrompt: imagePrompt,
      });

      console.log('Future image generated successfully');
    } catch (error) {
      console.error('Failed to generate future image:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to generate image'
      );
    } finally {
      setGeneratingImage(false);
    }
  }, [imagePrompt, token]);

  // Download image
  const handleDownloadImage = useCallback(() => {
    if (!imageResult?.image_data || !imageResult?.filename) return;

    try {
      toolsService.downloadImageFromBase64(
        imageResult.image_data,
        imageResult.filename
      );
    } catch (error) {
      console.error('Failed to download image:', error);
      setError('Failed to download image');
    }
  }, [imageResult]);

  // Share story
  const handleShareStory = useCallback(() => {
    if (!storyResult?.story) return;

    if (navigator.share) {
      navigator.share({
        title: 'Future Story',
        text: storyResult.story,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(storyResult.story);
      alert('Story copied to clipboard!');
    }
  }, [storyResult]);

  // Format story text for display
  const formatStoryText = useCallback((story: string) => {
    // Convert markdown-style formatting to HTML-like display
    return story
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .split('\n')
      .map((line, index) => (
        <Text
          key={index}
          mb={line.trim() ? 2 : 1}
          dangerouslySetInnerHTML={{ __html: line }}
        />
      ));
  }, []);

  if (loading) {
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

      {/* Header */}
      <HStack align='center'>
        <VStack gap={1} align='start'>
          <Heading as='h2' size='lg' color='fg' fontFamily='heading'>
            Invention Tools
          </Heading>
        </VStack>

        <HStack gap={2}>
          <Button
            size='md'
            variant='ghost'
            onClick={() => window.location.reload()}
            disabled={loading}
            color='fg.muted'
            _hover={{ color: 'brand', bg: 'bg.hover' }}
          >
            <FiRefreshCw size={16} />
          </Button>
        </HStack>
      </HStack>

      {/* Info about IdeaSeeds */}
      <Card.Root variant='outline' borderColor='border.muted' bg='bg.canvas'>
        <Card.Body p={4}>
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
                Create compelling stories and images to bring your ideas to
                life. Future tools will integrate with IdeaSeeds for enhanced
                workflows.
              </Text>
              <HStack gap={4} fontSize='xs' color='fg.muted' fontFamily='body'>
                <Text>Available Tools: 2</Text>
                <Text>IdeaSeeds: {ideaSeeds.length}</Text>
              </HStack>
            </VStack>
          </HStack>
        </Card.Body>
      </Card.Root>

      {/* Future Stories Section */}
      <VStack gap={4} align='stretch'>
        <VStack gap={2} align='start'>
          <Heading as='h3' size='md' color='fg' fontFamily='heading'>
            <HStack gap={2}>
              <FiFileText size={20} />
              <Text>Future Stories</Text>
              <Badge colorScheme='green' size='sm'>
                Available
              </Badge>
            </HStack>
          </Heading>
          <Text color='fg.muted' fontSize='sm' fontFamily='body'>
            Generate compelling narratives set in future scenarios. Perfect for
            exploring the human impact of your innovations.
          </Text>
        </VStack>

        <Card.Root
          variant='outline'
          borderColor='border.emphasized'
          bg='bg.canvas'
        >
          <Card.Body p={6}>
            <VStack gap={4} align='stretch'>
              {/* Story Details Input */}
              <VStack gap={2} align='stretch'>
                <Text fontSize='sm' fontWeight='medium' color='fg'>
                  Story Details
                </Text>
                <Textarea
                  value={storyDetails}
                  onChange={(e) => setStoryDetails(e.target.value)}
                  placeholder='Describe your future scenario (e.g., "an autonomous plant robot sells an NFT piece for one million euros")'
                  minH='100px'
                  bg='bg'
                  borderColor='border.muted'
                  color='fg'
                  _focus={{
                    borderColor: 'brand',
                    boxShadow: '0 0 0 1px token(colors.brand)',
                  }}
                  fontFamily='body'
                />
              </VStack>

              {/* Format Selection */}
              <VStack gap={2} align='stretch'>
                <Text fontSize='sm' fontWeight='medium' color='fg'>
                  Story Format
                </Text>
                <Select.Root
                  value={[formatOption]}
                  onValueChange={(details) =>
                    setFormatOption(
                      details.value[0] as
                        | 'future_journalist'
                        | 'microfiction'
                        | 'aidvertising'
                        | 'social_media'
                        | 'screenplay_pitch'
                        | 'custom'
                    )
                  }
                >
                  <Select.Trigger
                    bg='bg'
                    borderColor='border.muted'
                    color='fg'
                    _focus={{
                      borderColor: 'brand',
                      boxShadow: '0 0 0 1px token(colors.brand)',
                    }}
                  >
                    <Select.ValueText placeholder='Select format'>
                      {formatOptions.find((opt) => opt.value === formatOption)
                        ?.label || 'Select format'}
                    </Select.ValueText>
                  </Select.Trigger>
                  <Select.Content>
                    {formatOptions.map((option) => (
                      <Select.Item key={option.value} item={option.value}>
                        <Select.ItemText>{option.label}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
                <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                  {toolsService.getFormatOptionDescription(formatOption)}
                </Text>
              </VStack>

              {/* Custom Prompt (only for custom format) */}
              {formatOption === 'custom' && (
                <VStack gap={2} align='stretch'>
                  <Text fontSize='sm' fontWeight='medium' color='fg'>
                    Custom Prompt
                  </Text>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder='Enter your custom story format instructions...'
                    minH='80px'
                    bg='bg'
                    borderColor='border.muted'
                    color='fg'
                    _focus={{
                      borderColor: 'brand',
                      boxShadow: '0 0 0 1px token(colors.brand)',
                    }}
                    fontFamily='body'
                  />
                </VStack>
              )}

              {/* Year Range */}
              <VStack gap={2} align='stretch'>
                <Text fontSize='sm' fontWeight='medium' color='fg'>
                  Year Range: {yearRange[0]} - {yearRange[1]}
                </Text>
                <Slider.Root
                  value={yearRange}
                  onValueChange={(details) =>
                    setYearRange(details.value as [number, number])
                  }
                  min={new Date().getFullYear()}
                  max={2100}
                  step={1}
                >
                  <Slider.Track>
                    <Slider.Range />
                  </Slider.Track>
                  <Slider.Thumb index={0} />
                  <Slider.Thumb index={1} />
                </Slider.Root>
                <HStack justify='space-between' fontSize='xs' color='fg.muted'>
                  <Text>{new Date().getFullYear()}</Text>
                  <Text>2100</Text>
                </HStack>
              </VStack>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateFutureStory}
                loading={generatingStory}
                disabled={
                  !storyDetails.trim() ||
                  (formatOption === 'custom' && !customPrompt.trim())
                }
                colorScheme='blue'
                size='md'
              >
                <FiPlay size={16} />
                Generate Future Story
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Story Result */}
        {storyResult && (
          <Card.Root
            variant='outline'
            bg='bg.canvas'
            borderColor='border.muted'
          >
            <Card.Body p={4}>
              <VStack gap={4} align='stretch'>
                <HStack justify='space-between' align='start'>
                  <VStack gap={1} align='start' flex='1'>
                    <Text fontSize='sm' fontWeight='medium' color='fg'>
                      Generated Story
                    </Text>
                    <Text fontSize='xs' color='fg.muted'>
                      Format:{' '}
                      {toolsService.getFormatOptionDisplayName(
                        storyResult.formatOption
                      )}{' '}
                      • Years: {storyResult.yearRange[0]}-
                      {storyResult.yearRange[1]}
                    </Text>
                  </VStack>
                  <HStack gap={2}>
                    <Button
                      size='xs'
                      variant='outline'
                      onClick={handleShareStory}
                    >
                      <FiShare size={12} />
                      Share
                    </Button>
                  </HStack>
                </HStack>

                {storyResult.error ? (
                  <Text color='error' fontSize='sm'>
                    Error: {storyResult.error}
                  </Text>
                ) : (
                  <Box
                    maxH='400px'
                    overflowY='auto'
                    p={4}
                    bg='bg.subtle'
                    borderRadius='md'
                    border='1px solid'
                    borderColor='border.muted'
                  >
                    <VStack gap={2} align='stretch'>
                      {formatStoryText(storyResult.story)}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>

      {/* Futuregrapher Section */}
      <VStack gap={4} align='stretch'>
        <VStack gap={2} align='start'>
          <Heading as='h3' size='md' color='fg' fontFamily='heading'>
            <HStack gap={2}>
              <FiImage size={20} />
              <Text>Futuregrapher</Text>
              <Badge colorScheme='green' size='sm'>
                Available
              </Badge>
            </HStack>
          </Heading>
          <Text color='fg.muted' fontSize='sm' fontFamily='body'>
            Generate AI-powered images of future scenarios. Create visual
            representations of your innovative concepts.
          </Text>
        </VStack>

        <Card.Root
          variant='outline'
          borderColor='border.emphasized'
          bg='bg.canvas'
        >
          <Card.Body p={6}>
            <VStack gap={4} align='stretch'>
              {/* Image Prompt Input */}
              <VStack gap={2} align='stretch'>
                <Text fontSize='sm' fontWeight='medium' color='fg'>
                  Image Prompt
                </Text>
                <Textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder='Describe the future scene you want to visualize (e.g., "A futuristic city with flying cars and green energy systems")'
                  minH='100px'
                  bg='bg'
                  borderColor='border.muted'
                  color='fg'
                  _focus={{
                    borderColor: 'brand',
                    boxShadow: '0 0 0 1px token(colors.brand)',
                  }}
                  fontFamily='body'
                />
              </VStack>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateFutureImage}
                loading={generatingImage}
                disabled={!imagePrompt.trim()}
                colorScheme='blue'
                size='md'
              >
                <FiPlay size={16} />
                Generate Future Image
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Image Result */}
        {imageResult && (
          <Card.Root
            variant='outline'
            bg='bg.canvas'
            borderColor='border.muted'
          >
            <Card.Body p={4}>
              <VStack gap={4} align='stretch'>
                <HStack justify='space-between' align='start'>
                  <VStack gap={1} align='start' flex='1'>
                    <Text fontSize='sm' fontWeight='medium' color='fg'>
                      Generated Image
                    </Text>
                    <Text fontSize='xs' color='fg.muted'>
                      {imageResult.filename}
                    </Text>
                  </VStack>
                  <HStack gap={2}>
                    <Button
                      size='xs'
                      variant='outline'
                      onClick={handleDownloadImage}
                      disabled={!imageResult.image_data}
                    >
                      <FiDownload size={12} />
                      Download
                    </Button>
                  </HStack>
                </HStack>

                {imageResult.error ? (
                  <Text color='error' fontSize='sm'>
                    Error: {imageResult.error}
                  </Text>
                ) : (
                  <VStack gap={3} align='stretch'>
                    {/* Enhanced Prompt */}
                    <Box>
                      <Text fontSize='xs' fontWeight='medium' color='fg' mb={1}>
                        Enhanced Prompt:
                      </Text>
                      <Text
                        fontSize='xs'
                        color='fg.muted'
                        p={2}
                        bg='bg.subtle'
                        borderRadius='md'
                      >
                        {imageResult.enhanced_prompt.replace(/"/g, '')}
                      </Text>
                    </Box>

                    {/* Generated Image */}
                    {imageResult.image_data && (
                      <Box>
                        <Image
                          src={`data:image/png;base64,${imageResult.image_data}`}
                          alt='Generated future image'
                          maxW='100%'
                          maxH='500px'
                          objectFit='contain'
                          borderRadius='md'
                          border='1px solid'
                          borderColor='border.muted'
                        />
                      </Box>
                    )}
                  </VStack>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>

      {/* Commented out - future tool categories layout */}
      {/*
      <Card.Root>
        <Card.Body p={6}>
          <Tabs.Root
            value={activeTab}
            onValueChange={(details) => setActiveTab(details.value)}
          >
            <Tabs.List mb={6}>
              <Tabs.Trigger value='generation'>
                <FiCpu size={16} />
                Idea Generation
              </Tabs.Trigger>
              <Tabs.Trigger value='enhancement'>
                <FiTrendingUp size={16} />
                Enhancement
              </Tabs.Trigger>
              <Tabs.Trigger value='visualization'>
                <FiImage size={16} />
                Visualization
              </Tabs.Trigger>
              <Tabs.Trigger value='implementation'>
                <FiMap size={16} />
                Implementation
              </Tabs.Trigger>
            </Tabs.List>
            
            // Tool content would go here
          </Tabs.Root>
        </Card.Body>
      </Card.Root>
      */}
    </VStack>
  );
};

export default Invent;
