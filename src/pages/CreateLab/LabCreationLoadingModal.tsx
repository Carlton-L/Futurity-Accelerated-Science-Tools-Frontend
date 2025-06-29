import React from 'react';
import {
  Dialog,
  Text,
  VStack,
  HStack,
  Progress,
  Spinner,
  Box,
} from '@chakra-ui/react';
import { FiCheck, FiLayers, FiAlertCircle } from 'react-icons/fi';

interface LabCreationLoadingModalProps {
  isOpen: boolean;
  stage: 'creating' | 'processing' | 'completed' | 'error';
  message: string;
  progress: number;
  errorMessage?: string;
}

const LabCreationLoadingModal: React.FC<LabCreationLoadingModalProps> = ({
  isOpen,
  stage,
  message,
  progress,
  errorMessage,
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
        return 'Processing Terms';
      case 'completed':
        return 'Lab Created Successfully!';
      case 'error':
        return 'Creation Failed';
      default:
        return 'Creating Lab';
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={() => {}}
      closeOnInteractOutside={false}
      closeOnEscape={false}
    >
      <Dialog.Backdrop bg='blackAlpha.700' zIndex={1300} />
      <Dialog.Positioner zIndex={1301}>
        <Dialog.Content
          bg='bg.canvas'
          borderColor='border.emphasized'
          maxW='md'
          w='90vw'
          zIndex={1302}
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
                <VStack gap={2} w='100%'>
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

              {/* Success message */}
              {stage === 'completed' && (
                <Text
                  fontSize='sm'
                  color='success'
                  fontFamily='body'
                  textAlign='center'
                >
                  Your lab has been created and is ready to use!
                </Text>
              )}
            </VStack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default LabCreationLoadingModal;
