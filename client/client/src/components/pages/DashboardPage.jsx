import React from 'react';
import { useSelector } from 'react-redux';
import { Header } from '../layout/Header';
import { EmployerDashboard } from '../../features/dashboard/EmployerDashboard';
import { WorkerDashboard } from '../../features/dashboard/WorkerDashboard';

export function DashboardPage() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui, sans-serif' }}>
      <Header />

      <main style={{ maxWidth: 1100, margin: '20px auto', padding: '0 24px 40px' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>Личный кабинет</h2>
          <p style={{ margin: 0, color: '#666' }}>
            Вы вошли как: <strong>{user?.email}</strong> (
            <span style={{ textTransform: 'capitalize' }}>
              {user?.role === 'employer' ? 'Работодатель' : 'Соискатель'}
            </span>
            )
          </p>
        </div>

        {/* Условный рендеринг дашборда в зависимости от роли */}
        {user?.role === 'employer' ? (
          <EmployerDashboard />
        ) : user?.role === 'worker' ? (
          <WorkerDashboard />
        ) : (
          <div style={{ background: '#fff', padding: 20, borderRadius: 8, textAlign: 'center' }}>
            Загрузка профиля пользователя...
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;