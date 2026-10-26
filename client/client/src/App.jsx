import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth } from './features/auth/authSlice';
import { RegisterPage } from './components/pages/RegisterPage';
import { JobsPage } from './components/pages/JobsPage';
import { LoginPage } from './components/pages/LoginPage';
import { ProtectedRoute } from './components/layout/ProtectedRoutes';
import { Toaster } from 'sonner';
function App() {
  const dispatch = useDispatch();

  // При первой загрузке приложения делаем контрольный запрос на /refresh для восстановления сессии
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
      {/* Любой неизвестный адрес ведёт на главную (если не авторизован, ProtectedRoute отправит на /login) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>

  );
}

export default App;