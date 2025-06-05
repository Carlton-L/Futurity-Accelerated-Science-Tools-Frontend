import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { VStack, Text, Link } from '@chakra-ui/react';
import { Menu } from '@chakra-ui/react';
import { FaFlask } from 'react-icons/fa';

interface Lab {
  id: string;
  name: string;
}

const LabsButton: React.FC = () => {
  // This would come from your context/state management
  const labs: Lab[] = [
    { id: '1', name: 'Lab Alpha' },
    { id: '2', name: 'Lab Beta' },
    { id: '3', name: 'Lab Gamma' },
  ];

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Link
          _hover={{ textDecor: 'none', bg: 'gray.100' }}
          px={3}
          py={2}
          borderRadius='md'
          transition='background 0.2s'
          cursor='pointer'
        >
          <VStack gap={1}>
            <FaFlask size={20} />
            <Text fontSize='xs' fontWeight='medium'>
              Labs
            </Text>
          </VStack>
        </Link>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          {labs.length > 0 ? (
            labs.map((lab) => (
              <Menu.Item value='lab.id' key={lab.id} asChild>
                <RouterLink to={`/lab/${lab.id}`}>{lab.name}</RouterLink>
              </Menu.Item>
            ))
          ) : (
            <Menu.Item value='none' disabled>
              <Text color='gray.500'>No labs available</Text>
            </Menu.Item>
          )}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};

export default LabsButton;
