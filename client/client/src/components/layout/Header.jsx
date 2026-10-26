import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../features/auth/authSlice';
import { Briefcase, UserCheck, LogOut } from 'lucide-react';
import { Button } from '../../components/common/Button';

export function Header({ activeTab, setActiveTab }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Логотип платформы */}
        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('vacancies')}
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
            <Briefcase size={20} aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">JobPortal</span>
        </button>

        {/* Навигация и профиль */}
        <div className="flex items-center gap-2 sm:gap-3">
          {setActiveTab && (
            <Button
              variant="secondary"
              onClick={() => setActiveTab(activeTab === 'dashboard' ? 'vacancies' : 'dashboard')}
            >
              <UserCheck size={18} className="text-brand-600" aria-hidden="true" />
              <span>{activeTab === 'dashboard' ? 'Все вакансии' : 'Мой кабинет'}</span>
            </Button>
          )}

          {user && (
            <>
              <span className="hidden h-6 w-px bg-[var(--border)] md:block" aria-hidden="true" />
              <div className="hidden items-center gap-2 text-sm md:flex">
                <span className="max-w-[200px] truncate text-[var(--muted)]">{user.email}</span>
                <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-100">
                  {user.role === 'employer' ? 'Работодатель' : 'Соискатель'}
                </span>
              </div>
            </>
          )}

          <Button
            variant="danger-soft"
            onClick={() => dispatch(logoutUser())}
            title="Выйти из аккаунта"
            aria-label="Выйти из аккаунта"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;