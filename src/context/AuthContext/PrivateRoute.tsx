import React from 'react';
import { useAuth } from './useAuth';
import { Navigate, Outlet } from 'react-router-dom';

interface PrivateRouteProps {
  requiredRole?: 'admin' | 'user';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole }) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Since we're handling loading at the App level, we don't need to show loading here
  // If we get to this point, the user should be authenticated

  // Redirect to login if not authenticated (shouldn't happen with our App setup)
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
