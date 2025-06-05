import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './context/AuthContext';
import Layout from './components/layouts/MainLayout/MainLayout';
import Home from './pages/Home';
// import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          {/* <Route path='/login' element={<Login />} /> */}

          {/* Protected Routes  */}
          {/* <Route element={<PrivateRoute />}> */}
          {/* Layout */}
          <Route element={<Layout />}>
            <Route path='/' element={<Home />} />
          </Route>
          {/* </Route> */}
          {/* <Route path='/login' element={<Login />} /> */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
