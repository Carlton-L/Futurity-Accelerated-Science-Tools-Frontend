import React from 'react';
import {
  Dialog,
  Text,
  VStack,
  HStack,
  Progress,
  Spinner,
  Box,
  Button,
} from '@chakra-ui/react';
import {
  FiCheck,
  FiLayers,
  FiAlertCircle,
  FiAlertTriangle,
} from 'react-icons/fi';

interface LabCreationLoadingModalProps {
  isOpen: boolean;
  stage: 'creating' | 'processing' | 'completed' | 'error';
  message: string;
  progress: number;
  errorMessage?: string;
  onClose?: () => void;
}

const LabCreationLoadingModal: React.FC<LabCreationLoadingModalProps> = ({
  isOpen,
  stage,
  message,
  progress,
  errorMessage,
  onClose,
}) => {
  const getStageIcon = () => {
    switch (stage) {
      case 'completed':
        return <FiCheck size={32} color='var(--chakra-colors-success)' />;
      case 'error':
        return <FiAlertCircle size={32} color='var(--chakra-colors-error)' />;
      default:
        return <Spinner size='xl' color='brand' />;
    }
  };

  const getStageColor = () => {
    switch (stage) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'brand';
    }
  };

  const getStageTitle = () => {
    switch (stage) {
      case 'creating':
        return 'Creating Lab';
      case 'processing':
        return 'Processing Lab Data';
      case 'completed':
        return 'Lab Created Successfully!';
      case 'error':
        return 'Creation Failed';
      default:
        return 'Creating Lab';
    }
  };

  const showCloseButton = stage === 'error' && onClose;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={() => {}}
      closeOnInteractOutside={false}
      closeOnEscape={false}
    >
      <Dialog.Backdrop
        bg='blackAlpha.700'
        zIndex={1500}
        backdropFilter='blur(4px)'
      />
      <Dialog.Positioner zIndex={1501}>
        <Dialog.Content
          bg='bg.canvas'
          borderColor='border.emphasized'
          maxW='md'
          w='90vw'
          zIndex={1502}
          boxShadow='2xl'
          borderWidth='1px'
        >
          <Dialog.Header>
            <HStack gap={3} align='center'>
              <FiLayers size={20} color='var(--chakra-colors-brand)' />
              <Dialog.Title color='fg' fontFamily='heading'>
                {getStageTitle()}
              </Dialog.Title>
            </HStack>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={6} align='center'>
              {/* Stage icon */}
              <Box>{getStageIcon()}</Box>

              {/* Current message */}
              <VStack gap={2} align='center'>
                <Text
                  fontSize='md'
                  color='fg'
                  fontFamily='heading'
                  textAlign='center'
                >
                  {message}
                </Text>

                {/* Error message */}
                {stage === 'error' && errorMessage && (
                  <Text
                    fontSize='sm'
                    color='error'
                    fontFamily='body'
                    textAlign='center'
                    lineHeight='1.5'
                  >
                    {errorMessage}
                  </Text>
                )}
              </VStack>

              {/* Progress bar - only show during processing stages */}
              {(stage === 'creating' || stage === 'processing') && (
                <VStack gap={3} w='100%'>
                  <Progress.Root
                    value={progress}
                    size='md'
                    bg='bg.muted'
                    w='100%'
                  >
                    <Progress.Track>
                      <Progress.Range colorScheme={getStageColor()} />
                    </Progress.Track>
                  </Progress.Root>
                  <HStack justify='space-between' w='100%'>
                    <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                      {stage === 'creating' ? 'Creating...' : 'Processing...'}
                    </Text>
                    <Text fontSize='xs' color='fg.muted' fontFamily='mono'>
                      {progress}%
                    </Text>
                  </HStack>
                </VStack>
              )}

              {/* Warning about navigation - only during active processing */}
              {(stage === 'creating' || stage === 'processing') && (
                <Box
                  p={3}
                  bg='bg.subtle'
                  borderRadius='md'
                  borderWidth='1px'
                  borderColor='border.muted'
                  w='100%'
                >
                  <HStack gap={2} align='start'>
                    <FiAlertTriangle
                      size={16}
                      color='var(--chakra-colors-warning)'
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    />
                    <VStack gap={1} align='start'>
                      <Text
                        fontSize='sm'
                        fontWeight='medium'
                        color='warning'
                        fontFamily='heading'
                      >
                        Please don't navigate away
                      </Text>
                      <Text
                        fontSize='xs'
                        color='fg.muted'
                        fontFamily='body'
                        lineHeight='1.4'
                      >
                        Your lab is being created. Closing this page may
                        interrupt the process.
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}

              {/* Success message */}
              {stage === 'completed' && (
                <VStack gap={2} align='center'>
                  <Text
                    fontSize='sm'
                    color='success'
                    fontFamily='body'
                    textAlign='center'
                  >
                    Your lab has been created and is ready to use!
                  </Text>
                  <Text
                    fontSize='xs'
                    color='fg.muted'
                    fontFamily='body'
                    textAlign='center'
                  >
                    Redirecting to your new lab...
                  </Text>
                </VStack>
              )}
            </VStack>
          </Dialog.Body>

          {/* Footer with close button for errors */}
          {showCloseButton && (
            <Dialog.Footer>
              <Button
                onClick={onClose}
                variant='outline'
                w='100%'
                color='fg'
                borderColor='border.emphasized'
                bg='bg.canvas'
                _hover={{ bg: 'bg.hover' }}
                fontFamily='heading'
              >
                Close
              </Button>
            </Dialog.Footer>
          )}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default LabCreationLoadingModal;
