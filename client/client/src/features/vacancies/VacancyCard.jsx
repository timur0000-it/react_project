import React from 'react';

export function VacancyCard({ vacancy, userRole, hasApplied, onApply }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e1e8ed',
        borderRadius: 8,
        padding: 20,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 15
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: '#2c3e50' }}>{vacancy.title}</h3>
        <p style={{ margin: '0 0 6px 0', color: '#555', fontSize: 14 }}>
          Город: <strong>{vacancy.city}</strong>
        </p>
        <p style={{ margin: '0 0 6px 0', color: '#27ae60', fontWeight: 'bold', fontSize: 15 }}>
          {vacancy.salary?.toLocaleString()} ₸
        </p>
        <p style={{ margin: '0 0 10px 0', color: '#777', fontSize: 13 }}>
          Опыт: {vacancy.experience}
        </p>
        <p style={{ margin: 0, color: '#666', fontSize: 14, lineHeight: 1.4 }}>
          {vacancy.description}
        </p>
      </div>

      {/* Кнопка отклика видна только пользователю с ролью worker */}
      {userRole === 'worker' && (
        <div style={{ marginTop: 'auto', paddingTop: 10 }}>
          {hasApplied ? (
            <div 
              style={{ 
                background: '#e8f8f5', 
                color: '#27ae60', 
                textAlign: 'center', 
                padding: '8px 12px', 
                borderRadius: 6, 
                fontWeight: 'bold',
                fontSize: 14 
              }}
            >
              ✓ Вы откликнулись
            </div>
          ) : (
            <button
              onClick={onApply}
              style={{
                width: '100%',
                padding: '10px 15px',
                background: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Откликнуться
            </button>
          )}
        </div>
      )}
    </div>
  );
}