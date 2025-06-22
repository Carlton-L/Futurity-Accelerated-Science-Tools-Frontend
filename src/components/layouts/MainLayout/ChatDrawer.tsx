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
              bg='bg.canvas'
              borderColor='border.emphasized'
              borderWidth='1px'
              borderBottomWidth='0'
            >
              <Drawer.Header
                borderBottomWidth='1px'
                borderBottomColor='border.muted'
                bg='bg.canvas'
              >
                <Drawer.Title color='fg' fontFamily='heading'>
                  AI Chat - {pageContext.pageTitle}
                </Drawer.Title>
                <CloseButton
                  size='sm'
                  onClick={handleCloseAttempt}
                  color='fg'
                  bg='bg.canvas'
                  _hover={{
                    bg: 'bg.hover',
                  }}
                />
              </Drawer.Header>
              <Drawer.Body
                p={0}
                height='100%'
                position='relative'
                bg='bg.canvas'
              >
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
                      bg='rgba(0, 0, 0, 0.6)'
                      zIndex={1000}
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                    >
                      {/* Dialog content */}
                      <Box
                        bg='bg.canvas'
                        borderRadius='lg'
                        boxShadow='xl'
                        maxW='md'
                        w='90%'
                        p={6}
                        mx={4}
                        borderWidth='1px'
                        borderColor='border.emphasized'
                      >
                        <Text
                          fontSize='lg'
                          fontWeight='semibold'
                          mb={4}
                          color='fg'
                          fontFamily='heading'
                        >
                          Close Chat
                        </Text>
                        <Text
                          mb={6}
                          color='fg.secondary'
                          fontFamily='body'
                          lineHeight='1.6'
                        >
                          Closing the chat will stop the current conversation.
                          Your chat history will be lost. Are you sure you want
                          to continue?
                        </Text>
                        <Flex gap={3} justifyContent='flex-end'>
                          <Button
                            variant='outline'
                            onClick={handleCancelClose}
                            borderColor='border.emphasized'
                            color='fg'
                            bg='bg.canvas'
                            _hover={{
                              bg: 'bg.hover',
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            bg='error'
                            color='white'
                            onClick={handleConfirmClose}
                            _hover={{
                              opacity: 0.9,
                            }}
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
