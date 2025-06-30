import React from 'react';
import {
  Dialog,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Badge,
} from '@chakra-ui/react';
import { FiCheck, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { FaFlask } from 'react-icons/fa';

interface LabCreationSuccessModalProps {
  isOpen: boolean;
  labData?: {
    uniqueID: string;
    ent_name: string;
    ent_fsid: string;
    _id: string;
    [key: string]: any;
  };
  onClose: () => void;
}

const LabCreationSuccessModal: React.FC<LabCreationSuccessModalProps> = ({
  isOpen,
  labData,
  onClose,
}) => {
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
          maxW='lg'
          w='90vw'
          zIndex={1302}
        >
          <Dialog.Header>
            <HStack gap={3} align='center'>
              <Box color='success'>
                <FiCheck size={24} />
              </Box>
              <VStack gap={0} align='start'>
                <Dialog.Title color='fg' fontFamily='heading'>
                  Lab Created Successfully!
                </Dialog.Title>
                <Text fontSize='sm' color='fg.muted' fontFamily='body'>
                  Your lab is being set up in the background
                </Text>
              </VStack>
            </HStack>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={6} align='stretch'>
              {/* Lab info */}
              {labData && (
                <Box
                  p={4}
                  bg='successSubtle'
                  borderRadius='md'
                  borderWidth='1px'
                  borderColor='success'
                >
                  <VStack gap={2} align='start'>
                    <Text
                      fontSize='md'
                      fontWeight='medium'
                      color='success'
                      fontFamily='heading'
                    >
                      "{labData.ent_name}"
                    </Text>
                    <Text fontSize='sm' color='success' fontFamily='body'>
                      Lab ID: {labData.ent_fsid}
                    </Text>
                  </VStack>
                </Box>
              )}

              {/* Instructions */}
              <VStack gap={4} align='stretch'>
                <Text
                  fontSize='md'
                  fontWeight='medium'
                  color='fg'
                  fontFamily='heading'
                >
                  What happens next?
                </Text>

                <VStack gap={3} align='start'>
                  <HStack gap={3} align='start'>
                    <Box
                      w={6}
                      h={6}
                      borderRadius='full'
                      bg='brand'
                      color='white'
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                      fontSize='xs'
                      fontWeight='bold'
                      flexShrink={0}
                      mt={0.5}
                    >
                      1
                    </Box>
                    <Text fontSize='sm' color='fg' fontFamily='body'>
                      Subject ingestion is running in the background
                    </Text>
                  </HStack>

                  <HStack gap={3} align='start'>
                    <Box
                      w={6}
                      h={6}
                      borderRadius='full'
                      bg='brand'
                      color='white'
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                      fontSize='xs'
                      fontWeight='bold'
                      flexShrink={0}
                      mt={0.5}
                    >
                      2
                    </Box>
                    <Text fontSize='sm' color='fg' fontFamily='body'>
                      Your lab will appear in the Labs menu when ready
                    </Text>
                  </HStack>

                  <HStack gap={3} align='start'>
                    <Box
                      w={6}
                      h={6}
                      borderRadius='full'
                      bg='brand'
                      color='white'
                      display='flex'
                      alignItems='center'
                      justifyContent='center'
                      fontSize='xs'
                      fontWeight='bold'
                      flexShrink={0}
                      mt={0.5}
                    >
                      3
                    </Box>
                    <Text fontSize='sm' color='fg' fontFamily='body'>
                      Processing may take a few minutes depending on the number
                      of subjects
                    </Text>
                  </HStack>
                </VStack>
              </VStack>

              {/* Visual guide */}
              <Box
                p={4}
                bg='bg.subtle'
                borderRadius='md'
                borderWidth='1px'
                borderColor='border.muted'
              >
                <VStack gap={3} align='stretch'>
                  <Text
                    fontSize='sm'
                    fontWeight='medium'
                    color='fg'
                    fontFamily='heading'
                  >
                    Check your lab status here:
                  </Text>

                  {/* Mock Labs menu */}
                  <VStack gap={3} align='stretch'>
                    {/* Fake Labs Button */}
                    <Box
                      p={3}
                      bg='bg.canvas'
                      borderRadius='md'
                      borderWidth='1px'
                      borderColor='border.emphasized'
                      position='relative'
                      alignSelf='center'
                    >
                      <VStack gap={1}>
                        <FaFlask size={20} color='var(--chakra-colors-brand)' />
                        <HStack gap={1}>
                          <Text
                            fontSize='xs'
                            fontWeight='medium'
                            fontFamily='body'
                          >
                            labs
                          </Text>
                          <Box transform='rotate(180deg)'>
                            <Text fontSize='xs'>▼</Text>
                          </Box>
                        </HStack>
                      </VStack>

                      {/* Fake dropdown menu */}
                      <Box
                        position='absolute'
                        top='100%'
                        left='50%'
                        transform='translateX(-50%)'
                        mt={2}
                        bg='bg.canvas'
                        borderRadius='md'
                        borderWidth='1px'
                        borderColor='border.emphasized'
                        boxShadow='lg'
                        minW='220px'
                        p={2}
                        zIndex={10}
                      >
                        {/* Team header */}
                        <Box
                          px={2}
                          py={1}
                          borderBottom='1px solid'
                          borderBottomColor='border.muted'
                          mb={2}
                        >
                          <Text
                            fontSize='xs'
                            fontWeight='medium'
                            color='fg.secondary'
                            fontFamily='body'
                          >
                            team labs
                          </Text>
                        </Box>

                        <VStack gap={1} align='stretch'>
                          <Box
                            p={2}
                            borderRadius='sm'
                            _hover={{ bg: 'bg.hover' }}
                            cursor='pointer'
                          >
                            <Text fontSize='sm' fontFamily='body' color='fg'>
                              Lab Alpha
                            </Text>
                          </Box>
                          <Box
                            p={2}
                            borderRadius='sm'
                            _hover={{ bg: 'bg.hover' }}
                            cursor='pointer'
                            bg='orange.50'
                            _dark={{ bg: 'orange.900' }}
                          >
                            <HStack justify='space-between' align='center'>
                              <Text fontSize='sm' fontFamily='body' color='fg'>
                                {labData?.ent_name || 'Your New Lab'}
                              </Text>
                              <Badge colorScheme='orange' size='sm'>
                                Processing
                              </Badge>
                            </HStack>
                          </Box>
                          <Box
                            p={2}
                            borderRadius='sm'
                            _hover={{ bg: 'bg.hover' }}
                            cursor='pointer'
                          >
                            <Text fontSize='sm' fontFamily='body' color='fg'>
                              Lab Gamma
                            </Text>
                          </Box>
                        </VStack>

                        {/* Refresh button at bottom */}
                        <Box
                          mt={2}
                          pt={2}
                          borderTop='1px solid'
                          borderTopColor='border.muted'
                        >
                          <HStack
                            gap={2}
                            p={2}
                            borderRadius='sm'
                            bg='brand'
                            color='white'
                            cursor='pointer'
                            _hover={{ bg: 'brand.hover' }}
                            position='relative'
                          >
                            <FiRefreshCw size={14} />
                            <Text fontSize='sm' fontFamily='body'>
                              Refresh Labs
                            </Text>

                            {/* Arrow pointing to refresh button */}
                            <Box
                              position='absolute'
                              right='-30px'
                              top='50%'
                              transform='translateY(-50%)'
                              color='brand'
                              zIndex={20}
                            >
                              <FiArrowRight size={20} />
                            </Box>
                          </HStack>
                        </Box>
                      </Box>
                    </Box>

                    {/* Instruction text */}
                    <VStack gap={1} align='center'>
                      <Text
                        fontSize='sm'
                        fontWeight='medium'
                        color='brand'
                        fontFamily='heading'
                      >
                        Click "Refresh Labs" to check status
                      </Text>
                      <Text
                        fontSize='xs'
                        color='fg.muted'
                        fontFamily='body'
                        textAlign='center'
                      >
                        Your lab will appear with a "Processing" badge until
                        setup is complete
                      </Text>
                    </VStack>
                  </VStack>
                </VStack>
              </Box>

              {/* Note */}
              <Box
                p={3}
                bg='bg.muted'
                borderRadius='md'
                borderWidth='1px'
                borderColor='border.muted'
              >
                <Text
                  fontSize='xs'
                  color='fg.muted'
                  fontFamily='body'
                  textAlign='center'
                >
                  You can safely close this and continue working. Your lab will
                  be ready soon!
                </Text>
              </Box>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <Button
              onClick={onClose}
              variant='solid'
              bg='brand'
              color='white'
              _hover={{ bg: 'brand.hover' }}
              fontFamily='heading'
              w='100%'
            >
              Back to Homepage
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

export default LabCreationSuccessModal;
