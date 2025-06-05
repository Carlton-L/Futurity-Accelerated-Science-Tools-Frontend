import { useAuth } from './useAuth';
import { Navigate, Outlet } from 'react-router-dom';

// // Role-based Routing
// interface PrivateRouteProps {
//   requiredRole?: 'admin' | 'editor' | 'viewer';
// }

// const PrivateRoute: React.FC<PrivateRouteProps> = ({ requiredRole }) => {
//   const { user } = useAuth();

//   if (!user) return <Navigate to="/login" replace />;
//   if (requiredRole && user.role !== requiredRole) return <Navigate to="/unauthorized" replace />;

//   return <Outlet />;
// };

const PrivateRoute = () => {
  const { user } = useAuth();

  return user ? <Outlet /> : <Navigate to='/login' replace />;
};

export default PrivateRoute;
