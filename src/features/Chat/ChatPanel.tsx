// Fixed ChatPanel.tsx with debugging
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
import { useChatContext } from '../../context/PageContext';
import type {
  SearchPageContext,
  SubjectPageContext,
  LabPageContext,
  WhiteboardPageContext,
  OrganizationPageContext,
  TeamHomePageContext,
  TeamAdminPageContext,
  LabAdminPageContext,
  IdeaSeedPageContext,
  UserProfilePageContext,
} from '../../context/PageContext/pageTypes';

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

interface ChatPanelProps {
  onPageContextChange?: (pageType: string) => void;
}

export function ChatPanel({ onPageContextChange }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const { sendMessage } = useChatInteract();
  const { messages } = useChatMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { pageContext, contextString } = useChatContext();

  const flatMessages = useMemo(() => {
    return flattenMessages(messages, (m) => m.type.includes('message'));
  }, [messages]);

  // Add debugging useEffect
  useEffect(() => {
    console.log('💬 ChatPanel pageContext:', pageContext);
    console.log('💬 ChatPanel contextString:', contextString);
    console.log('💬 PageContext type:', pageContext.pageType);
    console.log('💬 PageContext title:', pageContext.pageTitle);
  }, [pageContext, contextString]);

  // Notify parent when page context changes (for refresh logic)
  useEffect(() => {
    if (onPageContextChange) {
      onPageContextChange(pageContext.pageType);
    }
  }, [pageContext.pageType, onPageContextChange]);

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

    // Simulate 2-4 second delay
    const delay = Math.random() * 2000 + 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Create a comprehensive fake AI response based on current page context
    let aiResponseText = `Response about ${pageContext.pageTitle}\n\n`;

    // Add context-specific information
    if (pageContext.pageType === 'search') {
      const searchContext = pageContext as SearchPageContext;
      aiResponseText += `I can see you're searching for "${searchContext.searchQuery}". `;
      if (searchContext.exactMatch) {
        aiResponseText += `There's an exact match for the subject "${searchContext.exactMatch.subject.name}" (ID: ${searchContext.exactMatch.subject.id}). `;
      }
      if (searchContext.relatedSubjects?.length > 0) {
        aiResponseText += `I found ${
          searchContext.relatedSubjects.length
        } related subjects: ${searchContext.relatedSubjects
          .map((s) => s.name)
          .join(', ')}. `;
      }
      if (searchContext.organizations?.length > 0) {
        aiResponseText += `There are ${
          searchContext.organizations.length
        } relevant organizations: ${searchContext.organizations
          .map((o) => o.name)
          .join(', ')}. `;
      }
      if (searchContext.analyses?.length > 0) {
        aiResponseText += `I also found ${
          searchContext.analyses.length
        } analyses: ${searchContext.analyses.map((a) => a.title).join(', ')}.`;
      }
    } else if (pageContext.pageType === 'subject') {
      const subjectContext = pageContext as SubjectPageContext;
      aiResponseText += `You're viewing the subject "${subjectContext.subject?.name}" (ID: ${subjectContext.subject?.id}). I can help you with analysis, related research, or connecting this subject to other areas.`;
    } else if (pageContext.pageType === 'lab') {
      const labContext = pageContext as LabPageContext;
      aiResponseText += `You're in the "${labContext.lab?.name}" lab (ID: ${labContext.lab?.id}) on the ${labContext.currentTab} tab. I can assist with lab management, research analysis, or team collaboration.`;
    } else if (pageContext.pageType === 'whiteboard') {
      const whiteboardContext = pageContext as WhiteboardPageContext;
      if (whiteboardContext.drafts?.length > 0) {
        aiResponseText += `I see you have ${whiteboardContext.drafts.length} draft(s) on your whiteboard. `;
        whiteboardContext.drafts.forEach((draft, index) => {
          aiResponseText += `Draft ${index + 1} ("${draft.name}") contains ${
            draft.subjects?.length || 0
          } subjects and ${draft.terms?.length || 0} terms. `;
        });
      } else {
        aiResponseText += `Your whiteboard is currently empty. I can help you brainstorm ideas or organize your research.`;
      }
    } else if (pageContext.pageType === 'organization') {
      const orgContext = pageContext as OrganizationPageContext;
      aiResponseText += `You're viewing the organization "${orgContext.organization?.name}" (ID: ${orgContext.organization?.id}). I can provide insights about this organization or help you research related entities.`;
    } else if (
      pageContext.pageType === 'team-home' ||
      pageContext.pageType === 'team-admin'
    ) {
      const teamContext = pageContext as
        | TeamHomePageContext
        | TeamAdminPageContext;
      aiResponseText += `You're ${
        pageContext.pageType === 'team-admin' ? 'managing' : 'viewing'
      } the team "${teamContext.team?.name}" (ID: ${
        teamContext.team?.id
      }). I can help with team coordination, project management, or collaboration strategies.`;
    } else if (pageContext.pageType === 'lab-admin') {
      const labAdminContext = pageContext as LabAdminPageContext;
      aiResponseText += `You're administering the lab "${labAdminContext.lab?.name}" (ID: ${labAdminContext.lab?.id}). I can assist with user management, lab configuration, or research workflow optimization.`;
    } else if (pageContext.pageType === 'idea-seed') {
      const ideaSeedContext = pageContext as IdeaSeedPageContext;
      aiResponseText += `You're viewing the IdeaSeed "${ideaSeedContext.ideaSeed?.name}" (ID: ${ideaSeedContext.ideaSeed?.id}) from the "${ideaSeedContext.ideaSeed?.labName}" lab. I can help develop this idea further or explore related concepts.`;
    } else if (pageContext.pageType === 'user-profile') {
      const userProfileContext = pageContext as UserProfilePageContext;
      if (userProfileContext.userId) {
        aiResponseText += `You're viewing a user profile (ID: ${userProfileContext.userId}). I can help with profile analysis or user interaction strategies.`;
      } else {
        aiResponseText += `You're viewing your own profile. I can help you optimize your profile or track your research activities.`;
      }
    } else if (pageContext.pageType === 'tutorials') {
      aiResponseText += `You're in the tutorials section. I can guide you through specific features, answer questions about the platform, or recommend learning paths.`;
    } else if (pageContext.pageType === 'org-admin') {
      aiResponseText += `You're in the organization administration panel. I can help with user management, organization settings, or team coordination.`;
    } else if (pageContext.pageType === 'create-lab') {
      aiResponseText += `You're creating a new lab. I can help you plan the lab structure, suggest research methodologies, or recommend team compositions.`;
    } else if (pageContext.pageType === 'team-creation') {
      aiResponseText += `You're creating a new team. I can suggest team structures, help define roles, or recommend collaboration tools.`;
    } else if (pageContext.pageType === 'user-settings') {
      aiResponseText += `You're in your user settings. I can help you optimize your preferences, set up integrations, or configure notifications.`;
    } else {
      aiResponseText += `I can see you're on the ${pageContext.pageType} page. How can I assist you today?`;
    }

    // Add the full context string at the end for debugging
    aiResponseText += `\n\n--- Debug Context ---\n${contextString}`;

    // Create fake AI response message
    const aiMessage = {
      name: 'assistant',
      type: 'assistant_message' as const,
      output: aiResponseText,
    };

    // Send the fake AI message
    sendMessage(aiMessage, []);
    setIsWaitingForResponse(false);
  };

  const handleSendMessage = async () => {
    const content = inputValue.trim();
    if (content && !isWaitingForResponse) {
      const message = {
        name: 'user',
        type: 'user_message' as const,
        output: content,
        // REAL AI INTEGRATION: Add context to the message metadata
        metadata: {
          pageContext: contextString,
          pageType: pageContext.pageType,
          pageTitle: pageContext.pageTitle,
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
          <Text color='white' _dark={{ color: 'white' }} whiteSpace='pre-line'>
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
            placeholder={`Ask about ${pageContext.pageTitle}...`}
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

export default ChatPanel;
