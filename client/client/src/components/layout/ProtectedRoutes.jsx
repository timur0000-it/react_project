import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader } from '../common/Loader';   // поправьте путь под вашу структуру

export function ProtectedRoute() {
  const { user, isLoading } = useSelector((state) => state.auth);

  // Пока идет асинхронный запрос на /refresh, показываем экран загрузки
  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader label="Проверка авторизации..." />
      </div>
    );
  }

  // Если пользователя нет в Redux — перенаправляем на /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;