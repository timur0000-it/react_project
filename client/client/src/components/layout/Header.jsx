import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../features/auth/authSlice';
import { Briefcase, UserCheck, LogOut } from 'lucide-react';

export function Header({ activeTab, setActiveTab }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: '#fff',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}
    >
      {/* Логотип платформы */}
      <div 
        onClick={() => setActiveTab && setActiveTab('vacancies')}
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
      >
        <Briefcase size={28} color="#007bff" />
        <h2 style={{ margin: 0, fontSize: 20, color: '#2c3e50', fontWeight: 'bold' }}>JobPortal</h2>
      </div>

      {/* Навигация и профиль */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        {/* Кнопка переключения в кабинет / список */}
        {setActiveTab && (
          <button
            onClick={() => setActiveTab(activeTab === 'dashboard' ? 'vacancies' : 'dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f0f2f5',
              border: 'none',
              padding: '8px 14px',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              color: '#333'
            }}
          >
            <UserCheck size={18} color="#007bff" />
            <span>
              {activeTab === 'dashboard' ? ' Все вакансии' : ' Мой кабинет'}
            </span>
          </button>
        )}

        {/* Информация о пользователе */}
        {user && (
          <span style={{ fontSize: 14, color: '#666', borderLeft: '1px solid #ddd', paddingLeft: 12 }}>
            {user.email} (<strong>{user.role === 'employer' ? 'Работодатель' : 'Соискатель'}</strong>)
          </span>
        )}

        {/* Кнопка выхода */}
        <button
          onClick={() => dispatch(logoutUser())}
          title="Выйти из аккаунта"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#fff1f0',
            border: '1px solid #ffa39e',
            color: '#e74c3c',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500
          }}
        >
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </header>
  );
}

export default Header;