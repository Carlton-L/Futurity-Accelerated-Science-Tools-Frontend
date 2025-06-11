import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './context/AuthContext';
import Layout from './components/layouts/MainLayout/MainLayout';
import Subject from './pages/Subject';
import Organization from './pages/Organization';
import Login from './pages/Login/Login';
// import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path='/login' element={<Login />} />

          {/* Protected Routes  */}
          <Route element={<PrivateRoute />}>
            {/* Layout */}
            <Route element={<Layout />}>
              {/* <Route path='/' element={<Organization />} /> */}
              <Route path='/' element={<Subject />} />
              {/* <Route path='/subject/:id' element={<Subject />} /> */}
              <Route path='/organization/:id' element={<Organization />} />
            </Route>
          </Route>
          {/* <Route path='/login' element={<Login />} /> */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
