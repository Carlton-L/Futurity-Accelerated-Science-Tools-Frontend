import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, VStack, Text } from '@chakra-ui/react';
import { PageProvider } from '../../../context/PageContext/PageProvider';
import Navbar from './Navbar';
import ChatDrawer from './ChatDrawer';
import ChatButton from './ChatButton';

const MainLayout: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCompact = windowWidth <= 1100;

  // Mobile check
  if (windowWidth < 740) {
    return (
      <Box
        height='100vh'
        display='flex'
        alignItems='center'
        justifyContent='center'
        bg='bg' // Uses semantic token that switches between dark/light
        p={6}
      >
        <VStack gap={4} textAlign='center' maxW='400px'>
          <Text
            fontSize='xl'
            fontWeight='bold'
            color='fg'
            fontFamily='heading' // TT Norms Pro
          >
            Desktop Only Application
          </Text>
          <Text
            color='fg.secondary'
            lineHeight='1.6'
            fontFamily='body' // JetBrains Mono
          >
            This application is designed for desktop screens and is not
            optimized for use on mobile devices or tablets with a width of less
            than 740px.
          </Text>
          <Text fontSize='sm' color='fg.muted' fontFamily='body'>
            Please access this application from a desktop or laptop computer, or
            <Text as='span' fontWeight='bold' color='fg'>
              {' '}
              expand the width of your browser window.
            </Text>
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <PageProvider>
      <Box
        minH='100vh'
        width='100%'
        bg='bg' // Main app background - your #111111 in dark mode, #FAFAFA in light mode
      >
        {/* Sticky Navbar */}
        <Navbar />

        {/* Main Content */}
        <Box
          pt={isCompact ? '74px' : '80px'} // Account for navbar height + top padding (58px/64px + 16px)
          maxWidth='1440px'
          mx='auto'
          bg='bg' // Ensure content area also uses semantic background
        >
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
