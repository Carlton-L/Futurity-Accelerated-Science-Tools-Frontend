import React from 'react';
import { Container, VStack } from '@chakra-ui/react';
import FuturityLabsSection from './FuturityLabsSection';
import FeaturedSubjectSection from './FeaturedSubjectSection';
import AnalysesSection from './AnalysesSection';

const Home: React.FC = () => {
  return (
    <Container maxW='7xl' py='8'>
      <VStack gap='12' align='stretch'>
        {/* Featured Subject Section */}
        <FeaturedSubjectSection />

        {/* Analyses Section */}
        <AnalysesSection />

        {/* Futurity Labs Section */}
        <FuturityLabsSection />

        {/* Add more sections as needed */}
      </VStack>
    </Container>
  );
};

export default Home;
