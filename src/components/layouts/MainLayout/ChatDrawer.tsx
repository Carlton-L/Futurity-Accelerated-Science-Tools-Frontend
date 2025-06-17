// Fixed ChatDrawer.tsx with debugging
import { useState, useEffect } from 'react';
import { Drawer, CloseButton, Portal } from '@chakra-ui/react';
import { useChatContext } from '../../../context/PageContext';
import { ChatPanel } from '../../../features/Chat/ChatPanel';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDrawer = ({ isOpen, onClose }: ChatDrawerProps) => {
  const { pageContext } = useChatContext();
  const [lastPageType, setLastPageType] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0); // Key to force re-mount

  // Track page changes and refresh chat when page type changes
  const handlePageContextChange = (currentPageType: string) => {
    console.log(
      '🗂️ ChatDrawer handlePageContextChange called with:',
      currentPageType
    );
    console.log('🗂️ lastPageType:', lastPageType);

    if (lastPageType !== null && lastPageType !== currentPageType) {
      // Page type changed, refresh the chat component
      setChatKey((prev) => prev + 1);
      console.log(
        `🗂️ Chat refreshed: page changed from ${lastPageType} to ${currentPageType}`
      );
    }
    setLastPageType(currentPageType);
  };

  // Initialize lastPageType when drawer opens
  useEffect(() => {
    console.log(
      '🗂️ ChatDrawer useEffect - isOpen:',
      isOpen,
      'lastPageType:',
      lastPageType,
      'pageContext.pageType:',
      pageContext.pageType
    );

    if (isOpen && lastPageType === null) {
      setLastPageType(pageContext.pageType);
      console.log(
        '🗂️ ChatDrawer initialized lastPageType to:',
        pageContext.pageType
      );
    }
  }, [isOpen, pageContext.pageType, lastPageType]);

  // Debug pageContext changes
  useEffect(() => {
    console.log('🗂️ ChatDrawer pageContext changed:', pageContext);
  }, [pageContext]);

  return (
    <Drawer.Root
      placement={'bottom'}
      open={isOpen}
      onOpenChange={() => onClose()}
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content borderTopRadius='2xl' height='33vh' minHeight='460px'>
            <Drawer.Header borderBottomWidth='1px'>
              <Drawer.Title>AI Chat - {pageContext.pageTitle}</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body p={0} height='100%'>
              <ChatPanel
                key={chatKey} // This forces re-mount when chatKey changes
                onPageContextChange={handlePageContextChange}
              />
            </Drawer.Body>
            <Drawer.Footer borderTopWidth='1px' justifyContent='flex-end'>
              <Drawer.CloseTrigger asChild>
                <CloseButton size='sm' />
              </Drawer.CloseTrigger>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
};

export default ChatDrawer;
