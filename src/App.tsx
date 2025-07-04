import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './context/AuthContext';
import { PageProvider } from './context/PageContext';
import { ThemeProvider } from './context/ThemeContext';
import { theme } from './theme';
import Layout from './components/layouts/MainLayout/MainLayout';
import ScrollToTop from './components/shared/ScrollToTop';
import LoadingScreen from './components/layouts/MainLayout/LoadingScreen';
import Home from './pages/Home';
import Subject from './pages/Subject';
import Search from './pages/Search';
import WorkspaceView from './pages/WorkspaceView';
import Login from './pages/Login/Login';
import Lab from './pages/Lab';
import FuturityLab from './pages/FuturityLab';
import FuturityLabsDirectory from './pages/FuturityLabsDirectory';
import Whiteboard from './pages/Whiteboard';
import TeamView from './pages/TeamView';
import TeamManage from './pages/TeamManage';
import TeamLabs from './pages/TeamLabs';
import CreateLab from './pages/CreateLab';
import { Profile } from './pages/Profile';
import FuturityAnalysis from './pages/FuturityAnalysis';
import FuturityAnalysesDirectory from './pages/FuturityAnalysesDirectory';
import Unauthorized from './pages/Unauthorized'; // Import the Unauthorized component
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import NotFound from './pages/NotFound';

// Create a separate component for the auth-aware loading logic
const AppWithAuth = () => {
  const { user, userRelationships, currentTeam, isLoadingUser, isLoading } =
    useAuth();
  const { isDark } = useTheme();

  // Show loading screen while initial authentication is happening
  if (isLoading || isLoadingUser) {
    return <LoadingScreen isDark={isDark} />;
  }

  // Show loading screen while user data is being set up
  if (user && !userRelationships) {
    return <LoadingScreen isDark={isDark} />;
  }

  // Show loading screen while team is being set up (if user has teams)
  if (
    user &&
    userRelationships &&
    userRelationships.teams.length > 0 &&
    !currentTeam
  ) {
    return <LoadingScreen isDark={isDark} />;
  }

  // If user is not authenticated, show login page
  if (!user) {
    return (
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    );
  }

  // User is authenticated, show main app
  return (
    <Routes>
      {/* Protected Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path='/' element={<Home />} />
          <Route path='/profile' element={<Profile />} />
          {/* Analysis routes */}
          <Route
            path='/futurity-analysis/:slug'
            element={<FuturityAnalysis />}
          />
          <Route
            path='/futurity-analyses'
            element={<FuturityAnalysesDirectory />}
          />
          {/* Dynamic lab route - this will catch any lab ID */}
          <Route path='/lab/:id' element={<Lab />} />
          <Route path='/lab/create' element={<CreateLab />} />
          {/* Futurity Lab route - using slug (ent_fsid) */}
          <Route path='/futurity-lab/:uniqueId' element={<FuturityLab />} />
          {/* Futurity Labs Directory route */}
          <Route path='/futuritylabs' element={<FuturityLabsDirectory />} />
          <Route path='/search' element={<Search />} />
          <Route path='/search/:query' element={<Search />} />
          <Route path='/subject/:slug' element={<Subject />} />
          <Route path='/workspace/' element={<WorkspaceView />} />
          <Route path='/whiteboard/' element={<Whiteboard />} />
          {/* Team routes */}
          <Route path='/team/:teamId' element={<TeamView />} />
          <Route path='/team/:teamId/manage' element={<TeamManage />} />
          <Route path='/team/:teamId/labs' element={<TeamLabs />} />
        </Route>
      </Route>

      {/* Admin-only routes */}
      <Route element={<PrivateRoute requiredRole='admin' />}>
        <Route element={<Layout />}>
          <Route path='/admin/:orgId' element={<div>Admin Panel</div>} />
        </Route>
      </Route>

      {/* Unauthorized route - outside of Layout to be fullscreen */}
      <Route path='/unauthorized' element={<Unauthorized />} />
      {/* Redirect login attempts to home if already authenticated */}
      <Route path='/login' element={<Navigate to='/' replace />} />
      <Route path='*' element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ChakraProvider value={theme}>
      <ThemeProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <PageProvider>
              <AppWithAuth />
            </PageProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ChakraProvider>
  );
}

export default App;
