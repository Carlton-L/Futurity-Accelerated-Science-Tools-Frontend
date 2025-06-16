import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './context/AuthContext';
import Layout from './components/layouts/MainLayout/MainLayout';
import Subject from './pages/Subject';
import Search from './pages/Search';
import Organization from './pages/Organization';
import Login from './pages/Login/Login';
import Lab from './pages/Lab';
import Whiteboard from './pages/Whiteboard';
// import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path='/login' element={<Login />} />

          {/* Protected Routes  */}
          {/* <Route element={<PrivateRoute />}> */}
          {/* Layout */}
          <Route element={<Layout />}>
            {/* <Route path='/' element={<Organization />} /> */}
            <Route path='/' element={<Lab />} />
            <Route path='/lab/1' element={<Lab />} />
            <Route path='/subject/' element={<Subject />} />
            <Route path='/search/' element={<Search />} />
            <Route path='/organization/' element={<Organization />} />
            <Route path='/whiteboard/' element={<Whiteboard />} />
          </Route>
          {/* </Route> */}
          {/* <Route path='/login' element={<Login />} /> */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
