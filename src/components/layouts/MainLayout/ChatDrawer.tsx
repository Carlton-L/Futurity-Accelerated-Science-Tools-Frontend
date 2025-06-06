import { Drawer, CloseButton, Portal, Box } from '@chakra-ui/react';
import { ChatPanel } from '../../../features/Chat/ChatPanel';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatDrawer = ({ isOpen, onClose }: ChatDrawerProps) => {
  return (
    <Drawer.Root
      placement={'bottom'}
      open={isOpen}
      onOpenChange={(e) => onClose()}
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content borderTopRadius='2xl' height='33vh' minHeight='460px'>
            <Drawer.Header borderBottomWidth='1px'>
              <Drawer.Title>AI Chat</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body p={0} height='100%'>
              <ChatPanel />
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
