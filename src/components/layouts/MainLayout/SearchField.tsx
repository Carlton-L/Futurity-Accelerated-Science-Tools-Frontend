import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Box, HStack } from '@chakra-ui/react';
import { LuSearch } from 'react-icons/lu';

const SearchField: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const navigate = useNavigate();

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  const isCompact = windowWidth <= 1100;
  const placeholderFontSize = isCompact ? '16px' : '24px';

  return (
    <Box as='form' onSubmit={handleSearch} w='full' h='100%'>
      <Box position='relative' h='100%'>
        <HStack gap={0} position='relative' h='100%'>
          <Box position='absolute' left={3} zIndex={1} color='fg' mx={'8px'}>
            <LuSearch size={24} />
          </Box>
          <Input
            placeholder='search...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            bg='bg.canvas'
            border='1px solid'
            borderColor='border.emphasized'
            color='fg'
            pl={14}
            pr={isCompact ? '4px' : '16px'}
            py={isCompact ? '4px' : '8px'}
            h='100%'
            size='sm'
            fontSize={placeholderFontSize}
            fontFamily='body'
            _placeholder={{
              color: 'fg.secondary',
              fontSize: placeholderFontSize,
            }}
            _focus={{
              borderColor: 'brand',
              boxShadow: '0 0 0 1px {colors.brand.500}',
            }}
            _hover={{
              borderColor: 'border.hover',
            }}
          />
        </HStack>
      </Box>
    </Box>
  );
};

export default SearchField;
