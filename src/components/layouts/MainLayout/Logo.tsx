import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Link } from '@chakra-ui/react';

const Logo: React.FC = () => {
  return (
    <Link asChild _hover={{ textDecor: 'none' }}>
      <RouterLink to='/'>
        <Box>
          {/* TODO: Replace with your actual SVG logo */}
          <svg width='32' height='32' viewBox='0 0 32 32' fill='currentColor'>
            <rect width='32' height='32' rx='6' fill='#3182CE' />
            <text
              x='16'
              y='20'
              textAnchor='middle'
              fill='white'
              fontSize='12'
              fontWeight='bold'
            >
              LOGO
            </text>
          </svg>
        </Box>
      </RouterLink>
    </Link>
  );
};

export default Logo;
