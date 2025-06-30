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
import { FiFileText, FiCheck } from 'react-icons/fi';

interface CSVUploadProgressModalProps {
  isOpen: boolean;
  stage: 1 | 2;
  message: string;
  progress: number;
}

const CSVUploadProgressModal: React.FC<CSVUploadProgressModalProps> = ({
  isOpen,
  stage,
  message,
  progress,
}) => {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={() => {}}
      closeOnInteractOutside={false}
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
              <FiFileText size={20} color='var(--chakra-colors-blue-500)' />
              <VStack gap={0} align='start'>
                <Dialog.Title color='fg' fontFamily='heading'>
                  Processing CSV File
                </Dialog.Title>
                <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                  Step {stage} of 2: Validating data
                </Text>
              </VStack>
            </HStack>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} align='stretch'>
              {/* Stage indicators */}
              <HStack gap={4} align='center'>
                {/* Stage 1 */}
                <HStack gap={2} flex='1'>
                  <Box
                    w={6}
                    h={6}
                    borderRadius='full'
                    bg={
                      stage > 1
                        ? 'green.500'
                        : stage === 1
                        ? 'blue.500'
                        : 'gray.300'
                    }
                    color='white'
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    fontSize='xs'
                    fontWeight='bold'
                  >
                    {stage > 1 ? <FiCheck size={12} /> : '1'}
                  </Box>
                  <VStack gap={0} align='start' flex='1'>
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color={stage >= 1 ? 'fg' : 'fg.muted'}
                      fontFamily='heading'
                    >
                      Internal Check
                    </Text>
                    <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                      CSV file validation
                    </Text>
                  </VStack>
                </HStack>

                {/* Connection line */}
                <Box
                  w={8}
                  h={0.5}
                  bg={stage > 1 ? 'green.500' : 'gray.300'}
                  borderRadius='full'
                />

                {/* Stage 2 */}
                <HStack gap={2} flex='1'>
                  <Box
                    w={6}
                    h={6}
                    borderRadius='full'
                    bg={stage === 2 ? 'blue.500' : 'gray.300'}
                    color='white'
                    display='flex'
                    alignItems='center'
                    justifyContent='center'
                    fontSize='xs'
                    fontWeight='bold'
                  >
                    2
                  </Box>
                  <VStack gap={0} align='start' flex='1'>
                    <Text
                      fontSize='sm'
                      fontWeight='medium'
                      color={stage >= 2 ? 'fg' : 'fg.muted'}
                      fontFamily='heading'
                    >
                      Board Check
                    </Text>
                    <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                      Compare with existing data
                    </Text>
                  </VStack>
                </HStack>
              </HStack>

              {/* Current message */}
              <Box
                p={3}
                bg='bg.subtle'
                borderRadius='md'
                borderWidth='1px'
                borderColor='border.muted'
              >
                <HStack gap={3} align='center'>
                  <Spinner size='sm' color='blue.500' />
                  <Text fontSize='sm' color='fg' fontFamily='body'>
                    {message}
                  </Text>
                </HStack>
              </Box>

              {/* Progress bar */}
              <VStack gap={2} align='stretch'>
                <Progress.Root value={progress} size='md' bg='bg.muted'>
                  <Progress.Track>
                    <Progress.Range colorScheme='blue' />
                  </Progress.Track>
                </Progress.Root>
                <HStack justify='space-between'>
                  <Text fontSize='xs' color='fg.muted' fontFamily='body'>
                    Processing...
                  </Text>
                  <Text fontSize='xs' color='fg.muted' fontFamily='mono'>
                    {progress}%
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default CSVUploadProgressModal;
