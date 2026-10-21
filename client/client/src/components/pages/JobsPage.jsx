import React, { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { Header } from "../layout/Header";
import { VacancyList } from "../../features/vacancies/VacancyList";
import { EmployerDashboard } from "../../features/dashboard/EmployerDashboard";
import { WorkerDashboard } from "../../features/dashboard/WorkerDashboard";
import { logoutUser } from "../../features/auth/authSlice";

export function JobsPage() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('vacancies'); // 'vacancies' | 'dashboard'
  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui, sans-serif' }}>
      <Header />
      <div style={{ maxWidth: 1100, margin: '20px auto 0', padding: '0 24px' }}>
        {/* Переключатель вкладок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setActiveTab('vacancies')}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'vacancies' ? '#3498db' : '#fff',
                color: activeTab === 'vacancies' ? '#fff' : '#333',
                fontWeight: 600
              }}
            >
              Все вакансии
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '10px 16px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'dashboard' ? '#3498db' : '#fff',
                color: activeTab === 'dashboard' ? '#fff' : '#333',
                fontWeight: 600
              }}
            >
              Мой кабинет ({user?.role === 'employer' ? 'Работодатель' : 'Соискатель'})
            </button>
          </div>
          <button
            onClick={() => dispatch(logoutUser())}
            style={{ padding: '8px 14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Выйти
          </button>
        </div>

        {/* Контент активной вкладки */}
        {activeTab === 'vacancies' ? (
          <main style={{ paddingBottom: 40 }}>
            <VacancyList />
          </main>
        ) : (
          <main style={{ paddingBottom: 40 }}>
            {user?.role === 'employer' ? <EmployerDashboard /> : <WorkerDashboard />}
          </main>
        )}
      </div>
    </div>
  );
}



export default JobsPage; 