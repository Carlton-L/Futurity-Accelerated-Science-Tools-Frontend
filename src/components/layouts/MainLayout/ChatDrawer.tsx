import { useState } from 'react';
import {
  Drawer,
  CloseButton,
  Portal,
  Dialog,
  Button,
  Text,
} from '@chakra-ui/react';
import { useChatContext } from '../../../context/PageContext';
import { ChatPanel } from '../../../features/Chat/ChatPanel';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDrawer = ({ isOpen, onClose }: ChatDrawerProps) => {
  const { pageContext } = useChatContext();
  const [showCloseWarning, setShowCloseWarning] = useState(false);

  const handleCloseAttempt = () => {
    setShowCloseWarning(true);
  };

  const handleConfirmClose = () => {
    setShowCloseWarning(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseWarning(false);
  };

  return (
    <>
      <Drawer.Root
        placement={'bottom'}
        open={isOpen}
        onOpenChange={(details) => {
          if (!details.open) {
            handleCloseAttempt();
          }
        }}
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content
              borderTopRadius='2xl'
              height='33vh'
              minHeight='588px'
            >
              <Drawer.Header borderBottomWidth='1px'>
                <Drawer.Title>AI Chat - {pageContext.pageTitle}</Drawer.Title>
                <CloseButton size='sm' onClick={handleCloseAttempt} />
              </Drawer.Header>
              <Drawer.Body p={0} height='100%'>
                <ChatPanel />
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      {/* Close Warning Dialog */}
      <Dialog.Root
        open={showCloseWarning}
        onOpenChange={(e) => setShowCloseWarning(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Close Chat</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text>
                Closing the chat will stop the current conversation. Your chat
                history will be lost. Are you sure you want to continue?
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant='outline' onClick={handleCancelClose}>
                Cancel
              </Button>
              <Button colorScheme='red' onClick={handleConfirmClose}>
                Close Chat
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
};

export default ChatDrawer;
