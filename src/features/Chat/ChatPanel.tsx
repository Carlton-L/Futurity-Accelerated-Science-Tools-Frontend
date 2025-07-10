import {
  Box,
  Flex,
  Text,
  Spinner,
  Button,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../../context/PageContext';
import { MdError, MdRefresh, MdWifi } from 'react-icons/md';

interface ChatPanelProps {
  onPageContextChange?: (pageType: string) => void;
  isOpen?: boolean; // Add prop to track if panel is open
}

type IframeStatus = 'loading' | 'loaded' | 'error' | 'timeout';

export function ChatPanel({ onPageContextChange, isOpen = true }: ChatPanelProps) {
  const { pageContext, contextString } = useChatContext();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeStatus, setIframeStatus] = useState<IframeStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadStartTime, setLoadStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [componentKey, setComponentKey] = useState<number>(0); // For component re-mounting
  const [hasTimedOut, setHasTimedOut] = useState<boolean>(false); // Track if timeout occurred
  const [iframeUrl, setIframeUrl] = useState<string>(''); // For unique iframe URL
  const timeoutRef = useRef<NodeJS.Timeout>();
  const elapsedTimerRef = useRef<NodeJS.Timeout>();
  const hasIframeLoadedRef = useRef<boolean>(false); // Track if iframe has ever loaded
  const lastSentMessageRef = useRef<string>(''); // Track last sent message to avoid duplicates

  // Notify parent when page context changes (for refresh logic)
  useEffect(() => {
    if (onPageContextChange) {
      onPageContextChange(pageContext.pageType);
    }
  }, [pageContext.pageType, onPageContextChange]);

  // Handle iframe load success
  const handleIframeLoad = () => {
    // Ignore load events if we've already timed out or are in error state
    if (hasTimedOut || iframeStatus === 'timeout' || iframeStatus === 'error') {
      console.log(
        '🖼️ Ignoring iframe load - already timed out or in error state'
      );
      return;
    }

    console.log('🖼️ ChatPanel iframe loaded successfully');
    setIframeStatus('loaded');
    setErrorMessage('');
    clearTimeout(timeoutRef.current);
    clearInterval(elapsedTimerRef.current);
    hasIframeLoadedRef.current = true;

    // Send context immediately when iframe loads
    setTimeout(() => {
      console.log('🖼️ Iframe loaded, sending initial message...');
      sendContextMessage();
    }, 200); // Small delay to ensure iframe is fully ready
  };

  // Handle iframe load error
  const handleIframeError = () => {
    // Only process error if we haven't already timed out
    if (hasTimedOut || iframeStatus === 'timeout') {
      console.log('🖼️ Ignoring iframe error - already timed out');
      return;
    }

    console.error('🖼️ ChatPanel iframe failed to load');
    setIframeStatus('error');
    setErrorMessage(
      'Failed to load chat service. The server may be unavailable.'
    );
    clearTimeout(timeoutRef.current);
    clearInterval(elapsedTimerRef.current);
  };

  // Set up timeout for slow loading
  const setupLoadTimeout = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(elapsedTimerRef.current);
    setLoadStartTime(Date.now());
    setElapsedTime(0);
    setHasTimedOut(false); // Reset timeout flag

    // Start elapsed time counter
    elapsedTimerRef.current = setInterval(() => {
      setElapsedTime(Math.round((Date.now() - loadStartTime) / 1000));
    }, 1000);

    // Set a timeout for slow loading (10 seconds)
    timeoutRef.current = setTimeout(() => {
      if (iframeStatus === 'loading') {
        console.warn('🖼️ ChatPanel iframe load timeout');
        setIframeStatus('timeout');
        setHasTimedOut(true); // Mark as timed out
        setErrorMessage(
          'Chat service is taking too long to respond. The server may be experiencing issues.'
        );
        clearInterval(elapsedTimerRef.current);

        // Remove the iframe src to stop loading
        if (iframeRef.current) {
          iframeRef.current.src = 'about:blank';
        }
      }
    }, 10000); // Changed to 10 seconds as mentioned
  };

  // Monitor iframe document state (additional error detection)
  const checkIframeContent = () => {
    if (!iframeRef.current || hasTimedOut) return;

    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        // Check if the document contains error indicators
        const body = iframeDoc.body;
        if (body) {
          const bodyText = body.innerText.toLowerCase();

          // Check for common error messages
          if (bodyText.includes('404') || bodyText.includes('not found')) {
            setIframeStatus('error');
            setErrorMessage(
              'Chat service not found (404). Please try again later.'
            );
          } else if (
            bodyText.includes('502') ||
            bodyText.includes('bad gateway')
          ) {
            setIframeStatus('error');
            setErrorMessage(
              'Chat service unavailable (502). Server may be down.'
            );
          } else if (
            bodyText.includes('503') ||
            bodyText.includes('service unavailable')
          ) {
            setIframeStatus('error');
            setErrorMessage(
              'Chat service temporarily unavailable (503). Please try again later.'
            );
          } else if (
            bodyText.includes('504') ||
            bodyText.includes('gateway timeout')
          ) {
            setIframeStatus('error');
            setErrorMessage(
              'Chat service timeout (504). Server is not responding.'
            );
          } else if (
            bodyText.includes('500') ||
            bodyText.includes('internal server error')
          ) {
            setIframeStatus('error');
            setErrorMessage(
              'Chat service error (500). Please try again later.'
            );
          }
        }
      }
    } catch {
      // Cross-origin restrictions prevent access - this is normal for external iframes
      console.log(
        '🖼️ Cannot access iframe content (cross-origin) - this is expected'
      );
    }
  };

  // Retry loading by re-mounting the component
  const retryLoad = () => {
    console.log('🖼️ Retrying iframe load via component re-mount');
    setIframeStatus('loading');
    setErrorMessage('');
    setIframeReady(false); // Reset ready state
    setComponentKey((prev) => prev + 1); // This will re-mount the entire component
    setupLoadTimeout();
  };

  // Setup initial load timeout when component mounts
  useEffect(() => {
    setupLoadTimeout();
    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(elapsedTimerRef.current);
      clearTimeout(readyTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentKey]); // Re-run when component re-mounts

  // Check iframe content periodically for errors (only while loading and not timed out)
  useEffect(() => {
    if (iframeStatus !== 'loading' || hasTimedOut) return;

    const interval = setInterval(checkIframeContent, 2000);
    return () => clearInterval(interval);
  }, [iframeStatus, hasTimedOut]);

  // Generate the AI chat context message based on current page
  const generateChatMessage = () => {
    // Debug logging to help identify the issue
    console.log('🔍 Debug - pageContext:', pageContext);
    console.log('🔍 Debug - pageContext.pageType:', pageContext.pageType);
    if (pageContext.pageType === 'subject') {
      console.log(
        '🔍 Debug - subject data:',
        'subject' in pageContext ? pageContext.subject : 'NO SUBJECT DATA'
      );
    }

    // Get human-readable page description
    const getPageDescription = () => {
      switch (pageContext.pageType) {
        case 'subject':
          return 'snapshot page';
        case 'lab':
          if ('lab' in pageContext && pageContext.lab) {
            return `Lab page for ${pageContext.lab.name} (${pageContext.currentTab} tab)`;
          }
          return 'Lab page';
        case 'search':
          if ('searchQuery' in pageContext) {
            return `Search results for "${pageContext.searchQuery}"`;
          }
          return 'Search page';
        case 'organization':
          if ('organization' in pageContext && pageContext.organization) {
            return `Organization page for ${pageContext.organization.name}`;
          }
          return 'Organization page';
        case 'whiteboard':
          return 'My Whiteboard page';
        case 'team-home':
          if ('team' in pageContext && pageContext.team) {
            return `Team page for ${pageContext.team.name}`;
          }
          return 'Team page';
        case 'team-admin':
          if ('team' in pageContext && pageContext.team) {
            return `Team admin page for ${pageContext.team.name}`;
          }
          return 'Team admin page';
        case 'user-profile':
          return 'User profile page';
        case 'create-lab':
          return 'Create lab page';
        case 'lab-admin':
          if ('lab' in pageContext && pageContext.lab) {
            return `Lab admin page for ${pageContext.lab.name}`;
          }
          return 'Lab admin page';
        case 'idea-seed':
          if ('ideaSeed' in pageContext && pageContext.ideaSeed) {
            return `IdeaSeed page for ${pageContext.ideaSeed.name}`;
          }
          return 'IdeaSeed page';
        case 'unknown':
          return pageContext.pageTitle || 'Current page';
        default:
          return pageContext.pageTitle || 'Current page';
      }
    };

    // Determine mode and subject data
    if (
      pageContext.pageType === 'subject' &&
      'subject' in pageContext &&
      pageContext.subject
    ) {
      // Expert mode for subject pages
      const message = {
        mode: 'expert' as const,
        subject: pageContext.subject.name,
        subject_fsid: pageContext.subject.fsid || pageContext.subject.id, // Use fsid if available, fallback to id
        page: getPageDescription(),
      };
      console.log('🔍 Debug - Generated EXPERT message:', message);
      return message;
    } else {
      // Full agency mode for all other pages
      const message = {
        mode: 'full-agency' as const,
        subject: '',
        subject_fsid: '',
        page: getPageDescription(),
      };
      console.log('🔍 Debug - Generated FULL-AGENCY message:', message);
      return message;
    }
  };

  // Send context message to iframe
  const sendContextMessage = () => {
    console.log('🖼️ sendContextMessage called');
    console.log('🖼️ - iframeRef.current:', !!iframeRef.current);
    console.log('🖼️ - pageContext.pageType:', pageContext.pageType);
    console.log('🖼️ - iframeStatus:', iframeStatus);
    
    if (!iframeRef.current) {
      console.log('🖼️ Cannot send message - iframe ref not available');
      return;
    }

    // Remove the check for 'unknown' - we should always send a message
    // even if the page type is unknown

    const message = generateChatMessage();
    const messageString = 'Client: ' + JSON.stringify(message);

    // Avoid sending duplicate messages only if we're sure the last one was received
    if (messageString === lastSentMessageRef.current && iframeStatus === 'loaded') {
      console.log('🖼️ Skipping duplicate message (iframe already loaded with this message)');
      return;
    }

    try {
      // Check if contentWindow exists
      if (!iframeRef.current.contentWindow) {
        console.error('🖼️ Iframe contentWindow not available');
        return;
      }
      
      // Send the message
      iframeRef.current.contentWindow.postMessage(messageString, '*');
      lastSentMessageRef.current = messageString;
      console.log('🖼️ ✅ Context message sent to iframe:', messageString);
      console.log('🖼️ - Target origin: *');
      console.log('🖼️ - Iframe src:', iframeRef.current.src);
    } catch (error) {
      console.error('🖼️ ❌ Failed to send context to iframe:', error);
    }
  };

  // Force send message when panel opens
  useEffect(() => {
    if (!isOpen) {
      // Reset last sent message when panel closes
      lastSentMessageRef.current = '';
      return;
    }

    // Panel just opened - force send message after a delay
    console.log('🖼️ Panel opened, scheduling message send...');
    console.log('🖼️ Current pageContext:', pageContext);
    
    // Try multiple times to ensure message is sent
    const attempts = [50, 200, 500, 1000, 2000]; // milliseconds - start earlier
    const timers: NodeJS.Timeout[] = [];
    
    attempts.forEach((delay) => {
      const timer = setTimeout(() => {
        console.log(`🖼️ Attempting to send message (${delay}ms delay)...`);
        sendContextMessage();
      }, delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isOpen]); // Only depend on isOpen to trigger when panel opens/closes

  // Send message when context changes (while panel is open)
  useEffect(() => {
    if (!isOpen) return;
    
    // Context changed while panel is open - send message regardless of page type
    console.log('🖼️ Context changed while panel open, sending message...');
    const timer = setTimeout(() => {
      sendContextMessage();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [pageContext, isOpen]);

  // Send message when iframe loads
  useEffect(() => {
    if (iframeStatus === 'loaded' && isOpen) {
      console.log('🖼️ Iframe loaded while panel open, sending message...');
      sendContextMessage();
    }
  }, [iframeStatus, isOpen]);

  // Add an event listener to receive messages from the iframe for debugging
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // IMPORTANT: Check the origin for security, but log all for debugging.
      console.log('📬 Message received from iframe:', {
        origin: event.origin,
        data: event.data,
      });
    };

    window.addEventListener('message', handleMessage);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    // By creating a unique URL on each mount (or remount via componentKey),
    // we force the iframe to reload and trigger the onLoad event, bypassing browser caching issues.
    const baseUrl = 'https://agents.futurity.science/';
    const uniqueUrl = `${baseUrl}?timestamp=${Date.now()}`;
    setIframeUrl(uniqueUrl);
    console.log(`🖼️ Setting iframe URL to: ${uniqueUrl}`);
  }, [componentKey]);

  // URL generation methods (kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getIframeUrlWithParams = () => {
    const baseUrl =  'https://agents.futurity.science/'; //'https://agents.futurity.science/';
    const params = new URLSearchParams();

    params.set('pageType', pageContext.pageType);
    params.set('pageTitle', encodeURIComponent(pageContext.pageTitle));

    switch (pageContext.pageType) {
      case 'search':
        if ('searchQuery' in pageContext) {
          params.set(
            'searchQuery',
            encodeURIComponent(pageContext.searchQuery)
          );
        }
        break;
      case 'subject':
        if ('subject' in pageContext && pageContext.subject) {
          params.set('subjectId', pageContext.subject.id);
          params.set(
            'subjectName',
            encodeURIComponent(pageContext.subject.name)
          );
        }
        break;
      case 'lab':
        if ('lab' in pageContext && pageContext.lab) {
          params.set('labId', pageContext.lab.id);
          params.set('labName', encodeURIComponent(pageContext.lab.name));
          params.set('currentTab', pageContext.currentTab);
        }
        break;
      case 'organization':
        if ('organization' in pageContext && pageContext.organization) {
          params.set('orgId', pageContext.organization.id);
          params.set(
            'orgName',
            encodeURIComponent(pageContext.organization.name)
          );
        }
        break;
    }

    return `${baseUrl}?${params.toString()}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getIframeUrlWithHash = () => {
    // const baseUrl = 'https://agents.futurity.science/';
    const baseUrl = 'https://agents.futurity.science/';
    
    const contextHash = encodeURIComponent(
      JSON.stringify({
        pageType: pageContext.pageType,
        pageTitle: pageContext.pageTitle,
        contextString: contextString,
      })
    );

    return `${baseUrl}#context=${contextHash}`;
  };

  // Choose which URL approach to use
  // const iframeUrl = getIframeUrlWithParams(); // Option 1
  // const iframeUrl = getIframeUrlWithHash(); // Option 2
  // const iframeUrl = 'https://agents.futurity.science/'; // Option 3 (use postMessage)


  // Render loading state - FIXED to use theme tokens
  const renderLoadingState = () => (
    <Flex
      height='100%'
      width='100%'
      direction='column'
      align='center'
      justify='center'
      bg='bg.canvas' // Use theme background
      gap={4}
    >
      <Spinner size='lg' color='brand' />
      <VStack gap={2}>
        <Text
          fontSize='lg'
          fontWeight='semibold'
          color='fg'
          fontFamily='heading'
        >
          Loading AI Chat
        </Text>
        <Text
          fontSize='sm'
          color='fg.secondary'
          textAlign='center'
          fontFamily='body'
        >
          Connecting to chat service...
        </Text>
        <Text fontSize='xs' color='fg.muted' fontFamily='body'>
          {elapsedTime}s elapsed
        </Text>
      </VStack>
    </Flex>
  );

  // Render error state - FIXED to use theme tokens
  const renderErrorState = () => (
    <Flex
      height='100%'
      width='100%'
      direction='column'
      align='center'
      justify='center'
      bg='bg.canvas' // Use theme background instead of red.50
      gap={4}
      p={6}
    >
      <Icon as={MdError} boxSize={12} color='error' />
      <VStack gap={3} textAlign='center'>
        <Text
          fontSize='lg'
          fontWeight='semibold'
          color='error'
          fontFamily='heading'
        >
          Chat Unavailable
        </Text>
        <Text fontSize='sm' color='fg.secondary' maxW='400px' fontFamily='body'>
          {errorMessage}
        </Text>
        <Button
          variant='outline'
          onClick={retryLoad}
          size='sm'
          borderColor='border.emphasized'
          color='fg'
          bg='bg.canvas'
          _hover={{
            bg: 'bg.hover',
          }}
        >
          <MdRefresh style={{ marginRight: '8px' }} />
          Retry
        </Button>
      </VStack>
    </Flex>
  );

  // Render timeout state - FIXED to use theme tokens
  const renderTimeoutState = () => (
    <Flex
      height='100%'
      width='100%'
      direction='column'
      align='center'
      justify='center'
      bg='bg.canvas' // Use theme background instead of orange.50
      gap={4}
      p={6}
    >
      <Icon as={MdWifi} boxSize={12} color='warning' />
      <VStack gap={3} textAlign='center'>
        <Text
          fontSize='lg'
          fontWeight='semibold'
          color='warning'
          fontFamily='heading'
        >
          Connection Timeout
        </Text>
        <Text fontSize='sm' color='fg.secondary' maxW='400px' fontFamily='body'>
          {errorMessage}
        </Text>
        <Button
          variant='outline'
          onClick={retryLoad}
          size='sm'
          borderColor='border.emphasized'
          color='fg'
          bg='bg.canvas'
          _hover={{
            bg: 'bg.hover',
          }}
        >
          <MdRefresh style={{ marginRight: '8px' }} />
          Try Again
        </Button>
      </VStack>
    </Flex>
  );

  return (
    <Box height='100%' width='100%' position='relative' key={componentKey}>
      {/* Status overlay - shown when not loaded */}
      {iframeStatus !== 'loaded' && (
        <Box
          position='absolute'
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={10}
        >
          {iframeStatus === 'loading' && renderLoadingState()}
          {iframeStatus === 'error' && renderErrorState()}
          {iframeStatus === 'timeout' && renderTimeoutState()}
        </Box>
      )}

      {/* Iframe - always present but hidden when not loaded */}
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        width='100%'
        height='100%'
        style={{
          border: 'none',
          borderRadius: '0',
          visibility: iframeStatus === 'loaded' ? 'visible' : 'hidden',
        }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title='AI Chat'
        sandbox='allow-scripts allow-same-origin allow-forms allow-popups'
        allow='clipboard-read; clipboard-write'
      />
    </Box>
  );
}

export default ChatPanel;
