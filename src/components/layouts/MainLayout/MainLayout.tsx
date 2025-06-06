import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@chakra-ui/react';
import Navbar from './Navbar';
import ChatDrawer from './ChatDrawer';
import ChatButton from './ChatButton';

const MainLayout: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <Box minH='100vh' bg='gray.50'>
      {/* Sticky Navbar */}
      <Navbar />

      {/* Main Content */}
      <Box pt='64px'>
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
  );
};

export default MainLayout;
