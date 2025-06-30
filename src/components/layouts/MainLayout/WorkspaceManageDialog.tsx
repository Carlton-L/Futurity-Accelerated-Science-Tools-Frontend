import React from 'react';
import { Dialog, Button, Text, VStack, HStack } from '@chakra-ui/react';
import { LuMail, LuExternalLink } from 'react-icons/lu';

interface WorkspaceManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const WorkspaceManageDialog: React.FC<WorkspaceManageDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const handleContactSupport = () => {
    window.open(
      'mailto:fasthelp@futurity.systems?subject=Workspace Management Request',
      '_blank'
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW='500px'>
          <Dialog.Header>
            <Dialog.Title fontFamily='heading'>
              Workspace Management
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <VStack gap={4} align='stretch'>
              <Text fontFamily='body' lineHeight='1.6'>
                To manage your workspace settings, add new users, or modify
                workspace permissions, please reach out to our FAST support
                team.
              </Text>
              <Text fontFamily='body' lineHeight='1.6' color='fg.secondary'>
                Our team will help you with:
              </Text>
              <VStack align='start' gap={2} pl={4}>
                <Text fontFamily='body' fontSize='sm'>
                  • Adding new users to your workspace
                </Text>
                <Text fontFamily='body' fontSize='sm'>
                  • Modifying user permissions
                </Text>
                <Text fontFamily='body' fontSize='sm'>
                  • Workspace settings and billing
                </Text>
                <Text fontFamily='body' fontSize='sm'>
                  • Creating additional workspaces
                </Text>
              </VStack>
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <HStack gap={3}>
              <Dialog.CloseTrigger asChild>
                <Button variant='outline' fontFamily='body'>
                  Close
                </Button>
              </Dialog.CloseTrigger>
              <Button
                onClick={handleContactSupport}
                bg='brand'
                color='white'
                fontFamily='body'
                _hover={{ bg: 'brand.hover' }}
              >
                <LuMail size={16} />
                Contact FAST Support
                <LuExternalLink size={14} />
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default WorkspaceManageDialog;
