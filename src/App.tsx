import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './context/AuthContext';
import { theme } from './theme';
import Layout from './components/layouts/MainLayout/MainLayout';
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
          <Routes>
            {/* Public Routes */}
            <Route path='/login' element={<Login />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              {/* Layout */}
              <Route element={<Layout />}>
                <Route path='/' element={<Search />} />
                <Route path='/lab/1' element={<Lab />} />

                <Route path='/search' element={<Search />} />

                {/* Dynamic Subject Route */}
                <Route path='/subject/:slug' element={<Subject />} />

                {/* Fallback Subject Route (for backwards compatibility) */}
                <Route path='/subject/' element={<Subject />} />

                {/* <Route path='/search/:query' element={<Search />} /> */}
                <Route path='/organization/' element={<Organization />} />
                <Route path='/whiteboard/' element={<Whiteboard />} />
              </Route>
            </Route>

            {/* Admin-only routes */}
            <Route element={<PrivateRoute requiredRole='admin' />}>
              <Route element={<Layout />}>
                <Route path='/admin/:orgId' element={<div>Admin Panel</div>} />
              </Route>
            </Route>

            {/* 404 and other routes */}
            <Route path='/unauthorized' element={<div>Unauthorized</div>} />
            <Route path='*' element={<div>Page Not Found</div>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
