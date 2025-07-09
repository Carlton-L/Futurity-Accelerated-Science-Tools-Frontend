import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Textarea,
  Alert,
} from '@chakra-ui/react';
import {
  FiType,
  FiZap,
  FiCopy,
  FiCheck,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { toolsService } from '../../services/toolsService';

interface TextSummarizerToolProps {
  onResultGenerated?: (result: { input: string; summary: string }) => void;
}

const TextSummarizerTool: React.FC<TextSummarizerToolProps> = ({
  onResultGenerated,
}) => {
  const { token } = useAuth();

  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Handle text summarization
  const handleSummarize = useCallback(async () => {
    if (!inputText.trim()) {
      setError('Please enter text to summarize');
      return;
    }

    if (!token) {
      setError('Authentication required. Please log in again.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const result = await toolsService.summarizeText(inputText, token);
      setSummary(result.summary);

      // Notify parent component
      if (onResultGenerated) {
        onResultGenerated({
          input: inputText,
          summary: result.summary,
        });
      }
    } catch (err) {
      console.error('Text summarization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to summarize text');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, token, onResultGenerated]);

  // Handle copy summary
  const handleCopySummary = useCallback(async () => {
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
    }
  }, [summary]);

  // Handle clear
  const handleClear = useCallback(() => {
    setInputText('');
    setSummary('');
    setError('');
    setCopied(false);
  }, []);

  const characterCount = inputText.length;
  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  return (
    <Card.Root variant='outline'>
      <Card.Header>
        <HStack gap={3} align='center'>
          <Box color='brand' fontSize='lg'>
            <FiType />
          </Box>
          <VStack gap={1} align='start' flex='1'>
            <Heading size='md' color='fg' fontFamily='heading'>
              Text Summarizer
            </Heading>
            <Text fontSize='sm' color='fg.muted' fontFamily='body'>
              Generate concise summaries of long text content
            </Text>
          </VStack>
        </HStack>
      </Card.Header>

      <Card.Body>
        <VStack gap={4} align='stretch'>
          {/* Info Banner */}
          <Alert.Root status='info' variant='subtle'>
            <Alert.Indicator>
              <FiInfo />
            </Alert.Indicator>
            <Alert.Description fontSize='sm' fontFamily='body'>
              This tool uses AI to create concise summaries while preserving key
              information and context. Works best with structured text like
              articles, reports, or documentation.
            </Alert.Description>
          </Alert.Root>

          {/* Input Section */}
          <VStack gap={3} align='stretch'>
            <VStack gap={1} align='start'>
              <Text
                fontSize='sm'
                fontWeight='medium'
                color='fg'
                fontFamily='heading'
              >
                Text to Summarize
              </Text>
              <HStack gap={2} fontSize='xs' color='fg.muted'>
                <Text fontFamily='body'>{characterCount} characters</Text>
                <Text fontFamily='body'>•</Text>
                <Text fontFamily='body'>{wordCount} words</Text>
              </HStack>
            </VStack>

            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder='Paste or type the text you want to summarize here. This could be an article, report, research paper, or any long-form content...'
              minHeight='160px'
              maxHeight='300px'
              resize='vertical'
              bg='bg.canvas'
              borderColor='border.emphasized'
              _focus={{
                borderColor: 'brand',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand)',
              }}
              fontFamily='body'
              fontSize='sm'
              lineHeight='1.5'
            />

            <HStack justify='space-between'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleClear}
                disabled={!inputText && !summary}
                bg='bg.canvas'
                borderColor='border.emphasized'
                color='fg'
                _hover={{ bg: 'bg.hover' }}
                fontFamily='heading'
              >
                Clear
              </Button>

              <Button
                onClick={handleSummarize}
                disabled={!inputText.trim() || isLoading}
                loading={isLoading}
                loadingText='Summarizing...'
                size='sm'
                bg='brand'
                color='white'
                _hover={{ opacity: 0.9 }}
                fontFamily='heading'
              >
                <HStack gap={2}>
                  <FiZap size={14} />
                  <Text>{isLoading ? 'Summarizing...' : 'Summarize Text'}</Text>
                </HStack>
              </Button>
            </HStack>
          </VStack>

          {/* Error Display */}
          {error && (
            <Alert.Root status='error'>
              <Alert.Indicator>
                <FiAlertCircle />
              </Alert.Indicator>
              <Alert.Description fontSize='sm' fontFamily='body'>
                {error}
              </Alert.Description>
            </Alert.Root>
          )}

          {/* Summary Results */}
          {summary && (
            <VStack gap={3} align='stretch'>
              <HStack justify='space-between' align='center'>
                <Text
                  fontSize='sm'
                  fontWeight='medium'
                  color='fg'
                  fontFamily='heading'
                >
                  Summary
                </Text>
                <Button
                  size='xs'
                  variant='ghost'
                  onClick={handleCopySummary}
                  color='fg.muted'
                  _hover={{ color: 'brand', bg: 'bg.hover' }}
                  fontFamily='heading'
                >
                  <HStack gap={1}>
                    {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
                    <Text>{copied ? 'Copied!' : 'Copy'}</Text>
                  </HStack>
                </Button>
              </HStack>

              <Box
                p={4}
                bg='bg.muted'
                borderRadius='md'
                borderWidth='1px'
                borderColor='border.muted'
              >
                <Text
                  fontSize='sm'
                  lineHeight='1.6'
                  color='fg'
                  fontFamily='body'
                  whiteSpace='pre-wrap'
                >
                  {summary}
                </Text>
              </Box>

              {/* Summary Stats */}
              <HStack gap={4} fontSize='xs' color='fg.muted' fontFamily='body'>
                <Text>
                  Summary: {summary.length} characters (
                  {summary.trim().split(/\s+/).length} words)
                </Text>
                <Text>•</Text>
                <Text>
                  Compression:{' '}
                  {((1 - summary.length / inputText.length) * 100).toFixed(1)}%
                </Text>
              </HStack>
            </VStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export default TextSummarizerTool;
