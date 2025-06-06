import {
  Button,
  Input,
  Box,
  Flex,
  Text,
  VStack,
  Spinner,
} from '@chakra-ui/react';
import { useChatInteract, useChatMessages } from '@chainlit/react-client';
import type { IStep } from '@chainlit/react-client';
import { useMemo, useState, useEffect, useRef } from 'react';
import { usePage } from '../../context/PageContext';

function flattenMessages(
  messages: IStep[],
  condition: (node: IStep) => boolean
): IStep[] {
  return messages.reduce((acc: IStep[], node) => {
    if (condition(node)) {
      acc.push(node);
    }
    if (node.steps?.length) {
      acc.push(...flattenMessages(node.steps, condition));
    }
    return acc;
  }, []);
}

export function ChatPanel() {
  const [inputValue, setInputValue] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const { sendMessage } = useChatInteract();
  const { messages } = useChatMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getContextMessage } = usePage();

  const flatMessages = useMemo(() => {
    return flattenMessages(messages, (m) => m.type.includes('message'));
  }, [messages]);

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [flatMessages, isWaitingForResponse]);

  // Refocus input after AI response
  useEffect(() => {
    if (!isWaitingForResponse) {
      // Small delay to ensure the input is enabled before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isWaitingForResponse]);

  // FAKE AI BEHAVIOR - Replace this entire function with real AI integration
  const simulateAIResponse = async () => {
    setIsWaitingForResponse(true);

    // Simulate 4 second delay
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Get current page context for the response
    const contextInfo = getContextMessage();

    // Create fake AI response message with context
    const aiMessage = {
      name: 'assistant',
      type: 'assistant_message' as const,
      output: `AI response regarding ${contextInfo}`,
    };

    // Send the fake AI message
    sendMessage(aiMessage, []);
    setIsWaitingForResponse(false);
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (content && !isWaitingForResponse) {
      // Get current page context to include with the message
      const contextInfo = getContextMessage();

      const message = {
        name: 'user',
        type: 'user_message' as const,
        output: content,
        // REAL AI INTEGRATION: Add context to the message metadata
        // You might want to structure this differently based on how chainlit expects context
        metadata: {
          pageContext: contextInfo,
        },
      };
      sendMessage(message, []);
      setInputValue('');

      // FAKE AI BEHAVIOR - Remove this line when implementing real AI
      await simulateAIResponse();
    }
  };

  const renderMessage = (message: IStep) => {
    const dateOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };
    const date = new Date(message.createdAt).toLocaleTimeString(
      undefined,
      dateOptions
    );

    return (
      <Flex
        key={message.id}
        direction='column'
        align='start'
        gap={4}
        bg={message.name === 'user' ? 'black' : '#0005e9'}
        p={3}
        rounded='md'
        borderWidth='1px'
        borderColor='gray.200'
      >
        <Box w='20' fontSize='sm' color='green' flexShrink={0}>
          {message.name}
        </Box>
        <Box flex='1'>
          <Text color='white' _dark={{ color: 'white' }}>
            {message.output}
          </Text>
          <Text fontSize='xs' color='gray' mt={1}>
            {date}
          </Text>
        </Box>
      </Flex>
    );
  };

  return (
    <Flex direction='column' bg='#1a1a1a' height='100%'>
      <Box flex='1' overflowY='scroll' p={6}>
        <VStack gap={4} align='stretch'>
          {flatMessages.map((message) => renderMessage(message))}

          {/* Loading indicator when waiting for AI response */}
          {isWaitingForResponse && (
            <Flex
              direction='row'
              align='center'
              gap={3}
              bg='#0005e9'
              p={3}
              rounded='md'
              borderWidth='1px'
              borderColor='gray.200'
            >
              <Box w='20' fontSize='sm' color='green' flexShrink={0}>
                assistant
              </Box>
              <Flex align='center' gap={2}>
                <Spinner size='sm' color='white' />
                <Text color='white' fontSize='sm'>
                  Thinking...
                </Text>
              </Flex>
            </Flex>
          )}

          {/* Invisible div to scroll to */}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>
      <Box borderTopWidth='1px' p={4} bg='white' _dark={{ bg: 'gray.800' }}>
        <Flex gap={2}>
          <Input
            ref={inputRef}
            autoFocus
            flex='1'
            id='message-input'
            placeholder='Type a message'
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isWaitingForResponse) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isWaitingForResponse}
          />
          <Button
            onClick={handleSendMessage}
            type='submit'
            disabled={isWaitingForResponse}
            loading={isWaitingForResponse}
            color='white'
          >
            {isWaitingForResponse ? 'Sending...' : 'Send'}
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
}
