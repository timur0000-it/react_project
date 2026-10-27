import { useEffect } from 'react';
import {  Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster, toast } from 'sonner';
import { checkAuth } from './features/auth/authSlice';
import { RegisterPage } from './components/pages/RegisterPage';
import { JobsPage } from './components/pages/JobsPage';
import { LoginPage } from './components/pages/LoginPage';
import { ProtectedRoute } from './components/layout/ProtectedRoutes';
import { NotFoundPage } from './components/pages/NotFoundPage';

function App() {
  const dispatch = useDispatch();

  const actionError = useSelector((state) => state.dashboard.actionError);

  // При первой загрузке восстанавливаем сессию через /auth/refresh
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);


  // Ошибка любого действия (резюме, отклик, статус, вакансии) показывается тостом
  useEffect(() => {
    if (actionError) toast.error(actionError);
  }, [actionError]);

  return (
    <>
      {/* theme="system" следует за prefers-color-scheme, как и остальные цвета проекта */}
      <Toaster position="top-right" theme="system" richColors />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<JobsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;