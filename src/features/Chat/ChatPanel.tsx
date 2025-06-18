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
}

type IframeStatus = 'loading' | 'loaded' | 'error' | 'timeout';

export function ChatPanel({ onPageContextChange }: ChatPanelProps) {
  const { pageContext, contextString } = useChatContext();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeStatus, setIframeStatus] = useState<IframeStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadStartTime, setLoadStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [componentKey, setComponentKey] = useState<number>(0); // For component re-mounting
  const [hasTimedOut, setHasTimedOut] = useState<boolean>(false); // Track if timeout occurred
  const timeoutRef = useRef<NodeJS.Timeout>();
  const elapsedTimerRef = useRef<NodeJS.Timeout>();

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

    // Send initial context via postMessage once iframe loads
    sendContextToIframe();
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
    setComponentKey((prev) => prev + 1); // This will re-mount the entire component
    setupLoadTimeout();
  };

  // Setup initial load timeout when component mounts
  useEffect(() => {
    setupLoadTimeout();
    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(elapsedTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentKey]); // Re-run when component re-mounts

  // Check iframe content periodically for errors (only while loading and not timed out)
  useEffect(() => {
    if (iframeStatus !== 'loading' || hasTimedOut) return;

    const interval = setInterval(checkIframeContent, 2000);
    return () => clearInterval(interval);
  }, [iframeStatus, hasTimedOut]);

  // PostMessage method to send context to iframe
  const sendContextToIframe = () => {
    if (iframeRef.current && iframeStatus === 'loaded') {
      const contextData = {
        type: 'PAGE_CONTEXT_UPDATE',
        pageContext: pageContext,
        contextString: contextString,
        timestamp: Date.now(),
      };

      try {
        // Use '*' as target origin to avoid origin mismatch issues
        // In production, you should replace '*' with the actual iframe origin for security
        iframeRef.current.contentWindow?.postMessage(contextData, '*');
        console.log('🖼️ Context sent to iframe via postMessage:', contextData);
      } catch (error) {
        console.error('🖼️ Failed to send context to iframe:', error);
      }
    }
  };

  // Send context updates to iframe when context changes
  useEffect(() => {
    if (iframeStatus === 'loaded') {
      sendContextToIframe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageContext, contextString, iframeStatus]);

  // URL generation methods (kept for potential future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getIframeUrlWithParams = () => {
    const baseUrl = 'https://agents.futurity.science/';
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
  const getIframeUrlWithHash = () => {
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
  const iframeUrl = 'https://agents.futurity.science/'; // Option 3 (use postMessage)

  // Render loading state
  const renderLoadingState = () => (
    <Flex
      height='100%'
      width='100%'
      direction='column'
      align='center'
      justify='center'
      bg='gray.50'
      gap={4}
    >
      <Spinner size='lg' color='blue.500' />
      <VStack gap={2}>
        <Text fontSize='lg' fontWeight='semibold' color='gray.700'>
          Loading AI Chat
        </Text>
        <Text fontSize='sm' color='gray.500' textAlign='center'>
          Connecting to chat service...
        </Text>
        <Text fontSize='xs' color='gray.400'>
          {elapsedTime}s elapsed
        </Text>
      </VStack>
    </Flex>
  );

  // Render error state
  const renderErrorState = () => (
    <Flex
      height='100%'
      width='100%'
      direction='column'
      align='center'
      justify='center'
      bg='red.50'
      gap={4}
      p={6}
    >
      <Icon as={MdError} boxSize={12} color='red.500' />
      <VStack gap={3} textAlign='center'>
        <Text fontSize='lg' fontWeight='semibold' color='red.700'>
          Chat Unavailable
        </Text>
        <Text fontSize='sm' color='red.600' maxW='400px'>
          {errorMessage}
        </Text>
        <Button
          colorScheme='red'
          variant='outline'
          onClick={retryLoad}
          size='sm'
        >
          <MdRefresh style={{ marginRight: '8px' }} />
          Retry
        </Button>
      </VStack>
    </Flex>
  );

  // Render timeout state
  const renderTimeoutState = () => (
    <Flex
      height='100%'
      width='100%'
      direction='column'
      align='center'
      justify='center'
      bg='orange.50'
      gap={4}
      p={6}
    >
      <Icon as={MdWifi} boxSize={12} color='orange.500' />
      <VStack gap={3} textAlign='center'>
        <Text fontSize='lg' fontWeight='semibold' color='orange.700'>
          Connection Timeout
        </Text>
        <Text fontSize='sm' color='orange.600' maxW='400px'>
          {errorMessage}
        </Text>
        <Button
          colorScheme='orange'
          variant='outline'
          onClick={retryLoad}
          size='sm'
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
