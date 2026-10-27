import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './features/auth/authSlice';
import { RegisterPage } from './components/pages/RegisterPage';
import { JobsPage } from './components/pages/JobsPage';
import { LoginPage } from './components/pages/LoginPage';
import { ProtectedRoute } from './components/layout/ProtectedRoutes';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { Toaster } from 'sonner';
function App() {
  const dispatch = useDispatch();


  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    
    <>
        <Toaster
      position="top-right" richColors closeButton duration={4000}/>
        <Routes>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>

        <Route path="/" element={<JobsPage />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>

  );
}

export default App;