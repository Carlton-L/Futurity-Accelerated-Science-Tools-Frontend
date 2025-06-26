import React from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';

const CreateLab: React.FC = () => {
  return (
    <Box p={6} maxW='800px' mx='auto'>
      <VStack gap={4} align='center' textAlign='center'>
        <Text fontSize='2xl' fontWeight='bold' color='fg' fontFamily='heading'>
          Create New Lab
        </Text>
        <Text color='fg.secondary' fontFamily='body' lineHeight='1.6'>
          Lab creation functionality coming soon...
        </Text>
      </VStack>
    </Box>
  );
};

export default CreateLab;
