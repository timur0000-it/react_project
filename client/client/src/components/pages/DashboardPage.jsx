import React from 'react';
import { useSelector } from 'react-redux';
import { Header } from '../layout/Header';
import { Loader } from '../common/Loader';
import { EmployerDashboard } from '../../features/dashboard/EmployerDashboard';
import { WorkerDashboard } from '../../features/dashboard/WorkerDashboard';

export function DashboardPage() {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen">
      <Header />

      <main>
        <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Личный кабинет</h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
            <span>Вы вошли как:</span>
            <span className="font-medium text-[var(--text)]">{user?.email}</span>
            {(user?.role === 'employer' || user?.role === 'worker') && (
              <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-100">
                {user.role === 'employer' ? 'Работодатель' : 'Соискатель'}
              </span>
            )}
          </p>
        </div>

        {/* Условный рендеринг дашборда в зависимости от роли */}
        {user?.role === 'employer' ? (
          <EmployerDashboard />
        ) : user?.role === 'worker' ? (
          <WorkerDashboard />
        ) : (
          <Loader label="Загрузка профиля пользователя..." />
        )}
      </main>
    </div>
  );
}

export default DashboardPage;