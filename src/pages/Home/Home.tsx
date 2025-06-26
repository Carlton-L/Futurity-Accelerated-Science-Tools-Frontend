import React from 'react';
import { Container, VStack } from '@chakra-ui/react';
import FuturityLabsSection from './FuturityLabsSection';

const Home: React.FC = () => {
  return (
    <Container maxW='7xl' py='8'>
      <VStack spacing='12' align='stretch'>
        {/* Your existing home page content would go here */}

        {/* Futurity Labs Section */}
        <FuturityLabsSection />

        {/* Add more sections as needed */}
      </VStack>
    </Container>
  );
};

export default Home;
