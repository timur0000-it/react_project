import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const { user, isLoading } = useSelector((state) => state.auth);

  // Пока идет асинхронный запрос на /refresh, показываем экраны загрузки
  if (isLoading) {
    return <div style={{ padding: 20 }}>Проверка авторизации...</div>;
  }

  // Если пользователя нет в Redux — перенаправляем на /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}