import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { VStack, Text, Icon, Link } from '@chakra-ui/react';
import { MdDashboard } from 'react-icons/md';

const WhiteboardButton: React.FC = () => {
  const hoverBg = 'gray';

  return (
    <Link
      asChild
      _hover={{ textDecor: 'none', bg: hoverBg }}
      px={3}
      py={2}
      borderRadius='md'
      transition='background 0.2s'
    >
      <RouterLink to='/whiteboard'>
        <VStack gap={1}>
          <Icon as={MdDashboard} boxSize={5} />
          <Text fontSize='xs' fontWeight='medium'>
            Whiteboard
          </Text>
        </VStack>
      </RouterLink>
    </Link>
  );
};

export default WhiteboardButton;
