import React from 'react';
import { Box, Flex, HStack } from '@chakra-ui/react';
import Logo from './Logo';
import WhiteboardButton from './WhiteboardButton';
import TeamSelector from './TeamSelector';
import LabsButton from './LabsButton';
import SearchField from './SearchField';
import ProfileButton from './ProfileButton';

const Navbar: React.FC = () => {
  // const bg = useColorModeValue('white', 'gray.800');
  // const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bg = 'black';
  const borderColor = 'white';

  return (
    <Box
      position='fixed'
      top={0}
      left={0}
      right={0}
      zIndex={1001}
      bg={bg}
      borderBottom='1px'
      borderColor={borderColor}
      shadow='sm'
      h='64px'
    >
      <Flex h='full' align='center' justify='space-between' px={4} maxW='full'>
        {/* Left side */}
        <HStack gap={6} flex={1}>
          <Logo />
          <WhiteboardButton />
          <TeamSelector />
          <LabsButton />
        </HStack>

        {/* Right side */}
        <HStack gap={4}>
          <SearchField />
          <ProfileButton />
        </HStack>
      </Flex>
    </Box>
  );
};

export default Navbar;
