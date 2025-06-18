import { Box } from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useChatContext } from '../../context/PageContext';

interface ChatPanelProps {
  onPageContextChange?: (pageType: string) => void;
}

export function ChatPanel({ onPageContextChange }: ChatPanelProps) {
  const { pageContext, contextString } = useChatContext();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Notify parent when page context changes (for refresh logic)
  useEffect(() => {
    if (onPageContextChange) {
      onPageContextChange(pageContext.pageType);
    }
  }, [pageContext.pageType, onPageContextChange]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIframeLoaded(true);
    console.log('🖼️ ChatPanel iframe loaded');

    // Option 3: Send initial context via postMessage once iframe loads
    sendContextToIframe();
  };

  // Option 3: PostMessage method to send context to iframe
  const sendContextToIframe = () => {
    if (iframeRef.current && iframeLoaded) {
      const contextData = {
        type: 'PAGE_CONTEXT_UPDATE',
        pageContext: pageContext,
        contextString: contextString,
        timestamp: Date.now(),
      };

      try {
        iframeRef.current.contentWindow?.postMessage(
          contextData,
          'https://agents.futurity.science'
        );
        console.log('🖼️ Context sent to iframe via postMessage:', contextData);
      } catch (error) {
        console.error('🖼️ Failed to send context to iframe:', error);
      }
    }
  };

  // Send context updates to iframe when context changes
  useEffect(() => {
    if (iframeLoaded) {
      sendContextToIframe();
    }
  }, [pageContext, contextString, iframeLoaded]);

  // Option 1: URL Parameters approach
  const getIframeUrlWithParams = () => {
    const baseUrl = 'https://agents.futurity.science/';
    const params = new URLSearchParams();

    // Add page context as URL parameters
    params.set('pageType', pageContext.pageType);
    params.set('pageTitle', encodeURIComponent(pageContext.pageTitle));

    // Add specific context based on page type
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
      // Add more cases as needed
    }

    // Option: Add full context as encoded JSON (be careful of URL length limits)
    // params.set('context', encodeURIComponent(JSON.stringify(pageContext)));

    return `${baseUrl}?${params.toString()}`;
  };

  // Option 2: Fragment/Hash approach
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

  return (
    <Box height='100%' width='100%'>
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        width='100%'
        height='100%'
        style={{
          border: 'none',
          borderRadius: '0',
        }}
        onLoad={handleIframeLoad}
        title='AI Chat'
        // Security attributes
        sandbox='allow-scripts allow-same-origin allow-forms allow-popups'
        allow='clipboard-read; clipboard-write'
      />
    </Box>
  );
}

export default ChatPanel;
