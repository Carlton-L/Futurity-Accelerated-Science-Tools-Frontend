import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './context/AuthContext';
import { PageProvider } from './context/PageContext'; // ADDED
import { theme } from './theme';
import Layout from './components/layouts/MainLayout/MainLayout';
import Home from './pages/Home';
import Subject from './pages/Subject';
import Search from './pages/Search';
import Organization from './pages/Organization';
import Login from './pages/Login/Login';
import Lab from './pages/Lab';
import Whiteboard from './pages/Whiteboard';

function App() {
  return (
    <ChakraProvider value={theme}>
      <BrowserRouter>
        <AuthProvider>
          <PageProvider>
            {' '}
            {/* ADDED PageProvider wrapper */}
            <Routes>
              {/* Public Routes */}
              <Route path='/login' element={<Login />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  <Route path='/' element={<Home />} />
                  <Route path='/lab/1' element={<Lab />} />
                  <Route path='/search' element={<Search />} />
                  <Route path='/search/:query' element={<Search />} />
                  <Route path='/subject/:slug' element={<Subject />} />
                  <Route path='/organization/' element={<Organization />} />
                  <Route path='/whiteboard/' element={<Whiteboard />} />
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
          </PageProvider>{' '}
          {/* CLOSE PageProvider wrapper */}
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
