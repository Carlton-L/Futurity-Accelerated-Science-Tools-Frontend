import React, { useState } from 'react';
import { Input, Box, HStack } from '@chakra-ui/react';
import { LuSearch } from 'react-icons/lu';

const SearchField: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <form onSubmit={handleSearch}>
      <Box position='relative' w='300px'>
        <HStack gap={0} position='relative'>
          <Box position='absolute' left={3} zIndex={1} color='white'>
            <LuSearch size={16} />
          </Box>
          <Input
            placeholder='Search snapshots...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg='#1a1a1a'
            border='1px solid'
            borderColor='white'
            pl={10}
            size='sm'
            _focus={{
              borderColor: 'blue.500',
              boxShadow: '0 0 0 1px #3182CE',
            }}
          />
        </HStack>
      </Box>
    </form>
  );
};

export default SearchField;
