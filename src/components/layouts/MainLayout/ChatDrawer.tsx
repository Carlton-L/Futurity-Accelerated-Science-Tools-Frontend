import { useState } from 'react';
import {
  Drawer,
  CloseButton,
  Portal,
  Button,
  Text,
  Box,
  Flex,
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
              position='relative'
            >
              <Drawer.Header borderBottomWidth='1px'>
                <Drawer.Title>AI Chat - {pageContext.pageTitle}</Drawer.Title>
                <CloseButton size='sm' onClick={handleCloseAttempt} />
              </Drawer.Header>
              <Drawer.Body p={0} height='100%' position='relative'>
                <ChatPanel />

                {/* Close Warning Dialog - Positioned within the drawer */}
                {showCloseWarning && (
                  <>
                    {/* Custom backdrop that only covers the drawer content */}
                    <Box
                      position='absolute'
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      bg='blackAlpha.600'
                      zIndex={1000}
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                    >
                      {/* Dialog content */}
                      <Box
                        bg='white'
                        borderRadius='lg'
                        boxShadow='xl'
                        maxW='md'
                        w='90%'
                        p={6}
                        mx={4}
                      >
                        <Text fontSize='lg' fontWeight='semibold' mb={4}>
                          Close Chat
                        </Text>
                        <Text mb={6} color='gray.600'>
                          Closing the chat will stop the current conversation.
                          Your chat history will be lost. Are you sure you want
                          to continue?
                        </Text>
                        <Flex gap={3} justifyContent='flex-end'>
                          <Button variant='outline' onClick={handleCancelClose}>
                            Cancel
                          </Button>
                          <Button
                            colorPalette='red'
                            onClick={handleConfirmClose}
                          >
                            Close Chat
                          </Button>
                        </Flex>
                      </Box>
                    </Box>
                  </>
                )}
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    </>
  );
};

export default ChatDrawer;
