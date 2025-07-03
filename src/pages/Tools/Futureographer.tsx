import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Textarea,
  Image,
  Skeleton,
  useToast,
  Container,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

const API_BASE_URL = 'https://fast.futurity.science';

const Futureographer: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const toast = useToast();

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description for your image',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setImageData(null);
    setEnhancedPrompt('');

    try {
      const response = await fetch(`${API_BASE_URL}/launch/futuregrapher/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.image_data) {
        setImageData(data.image_data);
        setEnhancedPrompt(data.enhanced_prompt || '');
        setFilename(data.filename || 'futureographer-image.png');
        
        toast({
          title: 'Success',
          description: 'Image generated successfully!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate image',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!imageData) return;

    // Convert base64 to blob
    const base64Data = imageData.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setPrompt('');
    setImageData(null);
    setEnhancedPrompt('');
    setFilename('');
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <VStack gap={2} align="start">
          <HStack>
            <Heading as="h1" size="xl" color="fg" fontFamily="heading">
              Futureographer
            </Heading>
            <Badge colorScheme="purple" size="lg">AI Image Generator</Badge>
          </HStack>
          <Text color="fg.muted" fontSize="lg" fontFamily="body">
            Transform your ideas into stunning visuals with AI-powered image generation
          </Text>
        </VStack>

        {/* Main Content */}
        <Box
          display="grid"
          gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }}
          gap={6}
        >
          {/* Input Section */}
          <Card.Root>
            <Card.Header>
              <Heading as="h2" size="md" color="fg" fontFamily="heading">
                Describe Your Image
              </Heading>
            </Card.Header>
            <Card.Body>
              <VStack gap={4} align="stretch">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the specifics of your image, such as characters, setting, and world..."
                  rows={6}
                  resize="vertical"
                  fontSize="md"
                  fontFamily="body"
                  disabled={loading}
                />
                
                <HStack gap={3}>
                  <Button
                    colorScheme="brand"
                    size="lg"
                    onClick={handleGenerateImage}
                    isLoading={loading}
                    loadingText="Generating..."
                    flex={1}
                    fontFamily="heading"
                  >
                    Generate Image
                  </Button>
                  
                  {imageData && (
                    <IconButton
                      aria-label="Reset"
                      icon={<FiRefreshCw />}
                      size="lg"
                      variant="outline"
                      onClick={handleReset}
                      disabled={loading}
                    />
                  )}
                </HStack>

                {/* Enhanced Prompt Display */}
                {enhancedPrompt && !loading && (
                  <Box
                    p={4}
                    bg="bg.muted"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="border"
                  >
                    <Text fontSize="sm" fontWeight="medium" mb={2} color="fg">
                      Enhanced Prompt:
                    </Text>
                    <Text fontSize="sm" color="fg.muted" fontFamily="body">
                      {enhancedPrompt}
                    </Text>
                  </Box>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Output Section */}
          <Card.Root>
            <Card.Header>
              <HStack justify="space-between">
                <Heading as="h2" size="md" color="fg" fontFamily="heading">
                  Generated Image
                </Heading>
                {imageData && (
                  <IconButton
                    aria-label="Download image"
                    icon={<FiDownload />}
                    size="sm"
                    variant="ghost"
                    onClick={handleDownload}
                  />
                )}
              </HStack>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <VStack gap={4} align="stretch">
                  <Skeleton height="400px" borderRadius="md" />
                  <Skeleton height="20px" width="60%" />
                  <Skeleton height="20px" width="80%" />
                </VStack>
              ) : imageData ? (
                <VStack gap={4} align="stretch">
                  <Image
                    src={imageData}
                    alt="Generated image"
                    borderRadius="md"
                    maxH="500px"
                    objectFit="contain"
                    width="100%"
                  />
                  <Button
                    leftIcon={<FiDownload />}
                    onClick={handleDownload}
                    variant="outline"
                    size="md"
                    width="100%"
                    fontFamily="heading"
                  >
                    Download Image
                  </Button>
                </VStack>
              ) : (
                <Box
                  height="400px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="bg.muted"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="border"
                  borderStyle="dashed"
                >
                  <Text color="fg.muted" fontSize="lg" fontFamily="body">
                    Your generated image will appear here
                  </Text>
                </Box>
              )}
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Instructions */}
        <Card.Root variant="outline">
          <Card.Header>
            <Heading as="h3" size="sm" color="fg" fontFamily="heading">
              How to Use Futureographer
            </Heading>
          </Card.Header>
          <Card.Body>
            <VStack gap={3} align="start">
              <Text fontSize="sm" color="fg.muted" fontFamily="body">
                1. Enter a detailed description of the image you want to create
              </Text>
              <Text fontSize="sm" color="fg.muted" fontFamily="body">
                2. Click "Generate Image" to create your AI-powered artwork
              </Text>
              <Text fontSize="sm" color="fg.muted" fontFamily="body">
                3. Wait for the AI to enhance your prompt and generate the image
              </Text>
              <Text fontSize="sm" color="fg.muted" fontFamily="body">
                4. Download your generated image to use in your projects
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
};

export default Futureographer;