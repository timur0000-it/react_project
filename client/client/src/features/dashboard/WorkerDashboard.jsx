import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    PointElement, 
    LineElement, 
    Title , 
    Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { fetchDashboardData, updateWorkerResume } from './dashboardSlice';

// Регистрация компонентов Chart.js
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
    Filler
);

export function WorkerDashboard() {
  const dispatch = useDispatch();
  const { responses, vacancies, workerProfile, status, error, actionError } = useSelector((state) => state.dashboard);
  const { user } = useSelector((state) => state.auth);

  const [resume, setResume] = useState('');
  const [skills, setSkills] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const actualWorker = workerProfile?.worker || workerProfile || {};

  const displayName = 
    actualWorker?.user?.name || 
    actualWorker?.name || 
    user?.name || 
    user?.user?.name || 
    'Соискатель';

  const displayResume = 
    actualWorker?.resume || 
    resume || 
    'Резюме пока не заполнено.';

  // Предзаполнение формы данными из профиля при загрузке
  useEffect(() => {
    if (actualWorker && Object.keys(actualWorker).length > 0) {
      if (actualWorker.resume) setResume(actualWorker.resume);
      if (actualWorker.phone) setPhone(actualWorker.phone);
      if (actualWorker.skills) {
        setSkills(Array.isArray(actualWorker.skills) ? actualWorker.skills.join(', ') : actualWorker.skills);
      }
    }
  }, [workerProfile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formattedSkills = skills.split(',').map(s => s.trim()).filter(Boolean);
    dispatch(updateWorkerResume({ resume, skills: formattedSkills, phone }));
  };

  // Отклики текущего соискателя
  const myResponses = responses.filter(r => {
    const workerId = typeof r.worker === 'object' ? r.worker?._id : r.worker;
    return String(workerId) === String(user?.profileId);
  });

  // ==========================================
  // АНАЛИТИКА И ДАННЫЕ ДЛЯ ГРАФИКОВ
  // ==========================================

  const pendingCount = myResponses.filter(r => r.status === 'pending' || !r.status).length;
  const acceptedCount = myResponses.filter(r => r.status === 'accepted').length;
  const rejectedCount = myResponses.filter(r => r.status === 'rejected').length;

  // 1. График статусов откликов (Doughnut)
  const responseStatusChartData = {
    labels: ['На рассмотрении', 'Приглашения', 'Отказы'],
    datasets: [
      {
        data: [pendingCount, acceptedCount, rejectedCount],
        backgroundColor: ['#f39c12', '#2ecc71', '#e74c3c'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  let totalSalaryApplied = 0;
  const appliedSphereStats = {};
  const appliedSalariesList = [];
  const appliedTitlesList = [];

  myResponses.forEach(r => {
    const vac = vacancies.find(v => String(v._id) === String(r.vacancy?._id || r.vacancy));
    if (vac) {
      if (vac.salary) {
        totalSalaryApplied += Number(vac.salary);
        appliedSalariesList.push(Number(vac.salary));
        appliedTitlesList.push(vac.title || 'Вакансия');
      }

      let sphere = 'Другое';
      const titleLower = (vac.title || '').toLowerCase();
      if (titleLower.includes('dev') || titleLower.includes('программист') || titleLower.includes('frontend') || titleLower.includes('backend')) {
        sphere = 'IT & Разработка';
      } else if (titleLower.includes('маркет') || titleLower.includes('smm') || titleLower.includes('дизайн')) {
        sphere = 'Маркетинг & Дизайн';
      } else if (titleLower.includes('продаж') || titleLower.includes('менеджер')) {
        sphere = 'Продажи & Менеджмент';
      } else if (titleLower.includes('повар') || titleLower.includes('кухн') || titleLower.includes('ресторан')) {
        sphere = 'Рестораны & Общепит';
      }

      appliedSphereStats[sphere] = (appliedSphereStats[sphere] || 0) + 1;
    }
  });

  // 2. График распределения по сферам (Bar)
  const sphereLabels = Object.keys(appliedSphereStats);
  const sphereCounts = sphereLabels.map(s => appliedSphereStats[s]);

  const sphereChartData = {
    labels: sphereLabels.length ? sphereLabels : ['Нет данных'],
    datasets: [
      {
        label: 'Количество откликов',
        data: sphereCounts.length ? sphereCounts : [0],
        backgroundColor: '#3498db',
        borderRadius: 4,
      },
    ],
  };

  // 3. График зарплат по откликам (Line)
  const salaryTrendChartData = {
    labels: appliedTitlesList.length ? appliedTitlesList : ['Нет данных'],
    datasets: [
      {
        label: 'Зарплата в отклике (₸)',
        data: appliedSalariesList.length ? appliedSalariesList : [0],
        borderColor: '#27ae60',
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: '#2ecc71',
      },
    ],
  };

  if (status === 'loading' && !workerProfile) {
    return <p style={{ textAlign: 'center', color: '#555' }}>Загрузка кабинета соискателя...</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(error || actionError) && (
        <div style={{ color: '#e74c3c', padding: 12, background: '#fdf2e9', borderRadius: 6, border: '1px solid #f5c6cb' }}>
          Ошибка: {error || actionError}
        </div>
      )}

      {/* ==========================================
          БЛОК ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ И РЕЗЮМЕ
         ========================================== */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{displayName}</h2>
            <p style={{ margin: '0 0 10px 0', fontSize: 14, color: '#7f8c8d' }}>
              Роль: <strong style={{ color: '#3498db' }}>Соискатель</strong>
            </p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '15px 0' }} />

        {/* Текущее резюме */}
        <div>
          <h4 style={{ margin: '0 0 8px 0', color: '#34495e' }}>📄 Ваше текущее резюме:</h4>
          <p style={{ margin: '0 0 10px 0', fontSize: 14, color: '#444', lineHeight: 1.5, background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0' }}>
            {displayResume}
          </p>
        </div>
      </div>

      {/* ==========================================
          БЛОК АНАЛИТИКИ (3 ГРАФИКА)
         ========================================== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        
        {/* График 1: Статусы откликов (Doughnut) */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: 16, width: '100%', textAlign: 'left' }}>📊 Воронка статусов</h3>
          <div style={{ width: '100%', maxHeight: '240px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={responseStatusChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* График 2: Отклики по сферам (Bar) */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: 16 }}>💼 Отклики по сферам</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <Bar data={sphereChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* График 3: Динамика зарплат по откликам (Line) */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: 16 }}>📈 Зарплаты в откликах (₸)</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <Line data={salaryTrendChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

      </div>

      {/* ==========================================
          РЕДАКТИРОВАНИЕ РЕЗЮМЕ
         ========================================== */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Редактировать профиль и резюме</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: '#555' }}>Телефон</label>
            <input type="text" placeholder="+7 (700) 000-00-00" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: '#555' }}>Навыки (через запятую)</label>
            <input type="text" placeholder="JavaScript, React, Node.js" value={skills} onChange={e => setSkills(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: '#555' }}>О себе / Опыт работы</label>
            <textarea placeholder="Расскажите о своем опыте..." value={resume} onChange={e => setResume(e.target.value)} rows={4} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ padding: '10px 15px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}>
            Обновить резюме
          </button>
        </form>
      </div>

      {/* Список откликов */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Мои отклики ({myResponses.length})</h3>
        {myResponses.length === 0 ? (
          <p style={{ color: '#777', fontSize: 14 }}>Вы еще не откликались ни на одну вакансию.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myResponses.map(resp => {
              const vacancyObj = vacancies.find(v => String(v._id) === String(resp.vacancy?._id || resp.vacancy));
              return (
                <div key={resp._id} style={{ border: '1px solid #e1e8ed', padding: 15, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>{vacancyObj?.title || 'Вакансия'} ({vacancyObj?.city || '—'})</h4>
                    <p style={{ margin: 0, color: '#555', fontSize: 13 }}>
                      Зарплата: <strong>{vacancyObj?.salary?.toLocaleString()} ₸</strong>
                    </p>
                  </div>
                  <div>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: 4, 
                      fontSize: 12, 
                      fontWeight: 'bold',
                      background: resp.status === 'accepted' ? '#e8f8f5' : resp.status === 'rejected' ? '#fadbd8' : '#fef9e7',
                      color: resp.status === 'accepted' ? '#27ae60' : resp.status === 'rejected' ? '#e74c3c' : '#f39c12',
                      border: `1px solid ${resp.status === 'accepted' ? '#a3e4d7' : resp.status === 'rejected' ? '#f5b7b1' : '#f9e79f'}`
                    }}>
                      {resp.status === 'accepted' ? 'Приглашение' : resp.status === 'rejected' ? 'Отказ' : 'На рассмотрении'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkerDashboard;