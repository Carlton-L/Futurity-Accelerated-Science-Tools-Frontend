import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './context/AuthContext';
import { PageProvider } from './context/PageContext';
import { theme } from './theme'; // Import your custom theme
import Layout from './components/layouts/MainLayout/MainLayout';
import Home from './pages/Home';
import Subject from './pages/Subject';
import Search from './pages/Search';
import WorkspaceView from './pages/WorkspaceView';
import Login from './pages/Login/Login';
import Lab from './pages/Lab';
import FuturityLab from './pages/FuturityLab/FuturityLab';
import Whiteboard from './pages/Whiteboard';
import TeamView from './pages/TeamView';
import TeamManage from './pages/TeamManage';
import CreateLab from './pages/CreateLab';

function App() {
  return (
    <ChakraProvider value={theme}>
      <BrowserRouter>
        <AuthProvider>
          <PageProvider>
            <Routes>
              {/* Public Routes */}
              <Route path='/login' element={<Login />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path='/' element={<Home />} />
                  {/* Dynamic lab route - this will catch any lab ID */}
                  <Route path='/lab/:id' element={<Lab />} />
                  <Route path='/lab/create' element={<CreateLab />} />
                  {/* Futurity Lab route - using slug (ent_fsid) */}
                  <Route path='/futurity-lab/:slug' element={<FuturityLab />} />
                  <Route path='/search' element={<Search />} />
                  <Route path='/search/:query' element={<Search />} />
                  <Route path='/subject/:slug' element={<Subject />} />
                  <Route path='/workspace/' element={<WorkspaceView />} />
                  <Route path='/whiteboard/' element={<Whiteboard />} />
                  {/* Team routes */}
                  <Route path='/team/:teamId' element={<TeamView />} />
                  <Route path='/team/:teamId/manage' element={<TeamManage />} />
                </Route>
              </Route>

              {/* Admin-only routes */}
              <Route element={<PrivateRoute requiredRole='admin' />}>
                <Route element={<Layout />}>
                  <Route
                    path='/admin/:orgId'
                    element={<div>Admin Panel</div>}
                  />
                </Route>
              </Route>

              <Route path='/unauthorized' element={<div>Unauthorized</div>} />
              <Route path='*' element={<div>Page Not Found</div>} />
            </Routes>
          </PageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
