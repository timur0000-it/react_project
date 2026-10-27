import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuth, clearError } from './features/auth/authSlice';
import { RegisterPage } from './components/pages/RegisterPage';
import { JobsPage } from './components/pages/JobsPage';
import { LoginPage } from './components/pages/LoginPage';
import { ProtectedRoute } from './components/layout/ProtectedRoutes';
import { NotFoundPage } from './components/pages/NotFoundPage';
function App() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  // При первой загрузке восстанавливаем сессию через /auth/refresh
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Ошибка входа не должна переезжать на страницу регистрации и обратно
  useEffect(() => {
    dispatch(clearError());
  }, [pathname, dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<JobsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;