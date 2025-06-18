import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, VStack, Text } from '@chakra-ui/react';
import { PageProvider } from '../../../context/PageContext/PageProvider';
import Navbar from './Navbar';
import ChatDrawer from './ChatDrawer';
import ChatButton from './ChatButton';

const MainLayout: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isChatOpen, setIsChatOpen] = useState(false);

  if (windowWidth < 740) {
    return (
      <Box
        height='100vh'
        display='flex'
        alignItems='center'
        justifyContent='center'
        bg='gray.50'
        p={6}
      >
        <VStack gap={4} textAlign='center' maxW='400px'>
          <Text fontSize='xl' fontWeight='bold' color='gray.700'>
            Desktop Only Application
          </Text>
          <Text color='gray.600' lineHeight='1.6'>
            This application is designed for desktop screens and is not
            optimized for use on mobile devices or tablets with a width of less
            than 740px.
          </Text>
          <Text fontSize='sm' color='gray.500'>
            Please access this application from a desktop or laptop computer, or
            <b> expand the width of your browser window.</b>
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <PageProvider>
      <Box minH='100vh' width='100%' bg='gray.50'>
        {/* Sticky Navbar */}
        <Navbar />

        {/* Main Content */}
        <Box pt='64px' maxWidth='1440px' mx='auto'>
          {' '}
          {/* Account for navbar height */}
          <Outlet />
        </Box>

        {/* Chat Button - Fixed position */}
        <Box position='fixed' bottom='20px' right='20px' zIndex={1000}>
          <ChatButton onClick={() => setIsChatOpen(true)} />
        </Box>

        {/* Chat Drawer */}
        <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </Box>
    </PageProvider>
  );
};

export default MainLayout;
