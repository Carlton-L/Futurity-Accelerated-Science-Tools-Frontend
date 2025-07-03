import React from 'react';
import { Box, Text, Image, Badge } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import type { FuturityLab } from '../../services/labService';

interface FuturityLabCardProps {
  lab: FuturityLab;
}

const FuturityLabCard: React.FC<FuturityLabCardProps> = ({ lab }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Use the lab's uniqueID for routing instead of ent_fsid
    navigate(`/futurity-lab/${lab.uniqueID}`);
  };

  // Labs from the API should always be active/visible
  const isDisabled = lab.status !== 'active';

  return (
    <Box
      bg='bg.canvas'
      borderRadius='8px'
      borderWidth='1px'
      borderStyle='solid'
      borderColor='border.emphasized'
      overflow='hidden'
      transition='all 0.2s'
      cursor={isDisabled ? 'not-allowed' : 'pointer'}
      opacity={isDisabled ? 0.5 : 1}
      filter={isDisabled ? 'grayscale(100%)' : 'none'}
      _hover={
        !isDisabled
          ? {
              borderColor: 'border.hover',
              transform: 'translateY(-2px)',
              boxShadow: 'md',
            }
          : {}
      }
      onClick={handleCardClick}
      h='400px'
      display='flex'
      flexDirection='column'
    >
      {/* Image */}
      <Box
        position='relative'
        h='200px'
        bg='gray.100'
        _dark={{ bg: 'gray.700' }}
      >
        {lab.thumbnail_url || lab.picture_url ? (
          <Image
            src={lab.thumbnail_url || lab.picture_url}
            alt={lab.ent_name}
            w='100%'
            h='100%'
            objectFit='cover'
          />
        ) : (
          <Box
            w='100%'
            h='100%'
            display='flex'
            alignItems='center'
            justifyContent='center'
            bg='gray.200'
            _dark={{ bg: 'gray.600' }}
          >
            <Text color='fg.muted' fontSize='sm'>
              No image available
            </Text>
          </Box>
        )}

        {/* Status badge */}
        <Badge
          position='absolute'
          top='3'
          right='3'
          colorScheme='green'
          variant='solid'
          fontSize='xs'
        >
          ACTIVE
        </Badge>
      </Box>

      {/* Content */}
      <Box p='4' flex='1' display='flex' flexDirection='column'>
        <Text
          fontSize='lg'
          fontWeight='bold'
          fontFamily='heading'
          color='fg'
          mb='2'
          lineHeight='1.3'
          overflow='hidden'
          textOverflow='ellipsis'
          display='-webkit-box'
          css={{
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {lab.ent_name}
        </Text>

        <Text
          fontSize='sm'
          color='fg.secondary'
          flex='1'
          lineHeight='1.4'
          overflow='hidden'
          textOverflow='ellipsis'
          display='-webkit-box'
          css={{
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {lab.ent_summary}
        </Text>

        {/* Lab identifier */}
        <Box mt='3'>
          <Badge
            variant='outline'
            colorScheme='blue'
            fontSize='xs'
            textTransform='uppercase'
          >
            {lab.ent_fsid}
          </Badge>
        </Box>
      </Box>
    </Box>
  );
};

export default FuturityLabCard;
