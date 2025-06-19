import React from 'react';
import { useAuth } from './useAuth';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, Spinner, VStack } from '@chakra-ui/react';

interface PrivateRouteProps {
  requiredRole?: 'admin' | 'user';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        minHeight='100vh'
        display='flex'
        alignItems='center'
        justifyContent='center'
        bg='gray.50'
      >
        <VStack gap={4}>
          <Spinner size='xl' color='blue.500' />
        </VStack>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to='/login' replace />;
  }

  // Check role-based access if required
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to='/unauthorized' replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
