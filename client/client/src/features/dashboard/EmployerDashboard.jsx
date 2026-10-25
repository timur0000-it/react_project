import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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

import { 
    fetchDashboardData, 
    createVacancy, 
    updateVacancy, 
    deleteVacancy, 
    updateResponseStatus 
} from './dashboardSlice';
import { fetchVacancies } from '../vacancies/vacanciesSlice';

// Регистрация модулей Chart.js
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

export function EmployerDashboard() {
  const dispatch = useDispatch();
  const { vacancies, responses, employerProfile, status, error, actionError } = useSelector((state) => state.dashboard);
  const { user } = useSelector((state) => state.auth);

  // Форма вакансии
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [salary, setSalary] = useState('');
  const [experience, setExperience] = useState('Без опыта');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Извлекаем профиль работодателя с учетом вложенностей
  const actualEmployer = employerProfile?.employer || employerProfile || {};

  const displayName = 
    actualEmployer?.user?.name || 
    actualEmployer?.companyName || 
    user?.name || 
    user?.user?.name || 
    user?.email || 
    'Работодатель';

  const companyName = 
    actualEmployer?.companyName || 
    actualEmployer?.company || 
    'Компания не указана';

  const companyPhone = 
    actualEmployer?.phone || 
    'Не указан';

  // Фильтрация вакансий текущего работодателя
  const myVacancies = vacancies.filter(v => {
    if (!v.employer) return false;
    const vacancyEmployerId = typeof v.employer === 'object' ? (v.employer._id || v.employer.id) : v.employer;
    const vacancyUserRef = typeof v.employer === 'object' && v.employer.user ? (typeof v.employer.user === 'object' ? v.employer.user._id : v.employer.user) : null;
    return (
      String(vacancyEmployerId) === String(user?.profileId) ||
      String(vacancyEmployerId) === String(user?.userId) ||
      (vacancyUserRef && String(vacancyUserRef) === String(user?.userId))
    );
  });

  // Отклики на мои вакансии
  const myVacancyIds = new Set(myVacancies.map(v => String(v._id)));
  const myResponses = responses.filter(r => {
    const vacId = typeof r.vacancy === 'object' ? r.vacancy?._id : r.vacancy;
    return myVacancyIds.has(String(vacId));
  });

  // ==========================================
  // АНАЛИТИЧЕСКИЕ РАСЧЕТЫ И ДАННЫЕ ДЛЯ CHART.JS
  // ==========================================

  // 1. Статусы откликов
  const pendingCount = myResponses.filter(r => r.status === 'pending' || !r.status).length;
  const acceptedCount = myResponses.filter(r => r.status === 'accepted').length;
  const rejectedCount = myResponses.filter(r => r.status === 'rejected').length;

  const responseStatusChartData = {
    labels: ['На рассмотрении', 'Принято (Приглашения)', 'Отклонено'],
    datasets: [
      {
        data: [pendingCount, acceptedCount, rejectedCount],
        backgroundColor: ['#f39c12', '#2ecc71', '#e74c3c'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  // 2. Средняя зарплата по сферам
  const sphereStats = myVacancies.reduce((acc, v) => {
    let sphere = 'Другое';
    const titleLower = (v.title || '').toLowerCase();
    
    if (titleLower.includes('dev') || titleLower.includes('программист') || titleLower.includes('разработчик') || titleLower.includes('frontend') || titleLower.includes('backend') || titleLower.includes('python') || titleLower.includes('js')) {
      sphere = 'IT & Разработка';
    } else if (titleLower.includes('маркет') || titleLower.includes('smm') || titleLower.includes('дизайн') || titleLower.includes('seo')) {
      sphere = 'Маркетинг & Дизайн';
    } else if (titleLower.includes('продаж') || titleLower.includes('менеджер') || titleLower.includes('sales')) {
      sphere = 'Продажи';
    } else if (titleLower.includes('повар') || titleLower.includes('кухн') || titleLower.includes('официант') || titleLower.includes('ресторан')) {
      sphere = 'Рестораны & Общепит';
    }

    if (!acc[sphere]) {
      acc[sphere] = { count: 0, totalSalary: 0 };
    }
    acc[sphere].count += 1;
    acc[sphere].totalSalary += Number(v.salary || 0);
    return acc;
  }, {});

  const sphereLabels = Object.keys(sphereStats);
  const sphereAvgSalaries = sphereLabels.map(s => Math.round(sphereStats[s].totalSalary / sphereStats[s].count));

  const salaryChartData = {
    labels: sphereLabels.length ? sphereLabels : ['Нет данных'],
    datasets: [
      {
        label: 'Средняя зарплата (₸)',
        data: sphereAvgSalaries.length ? sphereAvgSalaries : [0],
        backgroundColor: '#3498db',
        borderRadius: 4,
      },
    ],
  };

  // 3. Динамика откликов по вакансиям
  const vacancyTitles = myVacancies.map(v => v.title);
  const vacancyResponsesCounts = myVacancies.map(v => 
    myResponses.filter(r => String(r.vacancy?._id || r.vacancy) === String(v._id)).length
  );

  const responsesPerVacancyChartData = {
    labels: vacancyTitles.length ? vacancyTitles : ['Вакансий нет'],
    datasets: [
      {
        label: 'Количество откликов',
        data: vacancyResponsesCounts.length ? vacancyResponsesCounts : [0],
        borderColor: '#9b59b6',
        backgroundColor: 'rgba(155, 89, 182, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: '#8e44ad',
      },
    ],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !city || !salary) return;

    const vacancyData = { title, description, city, salary: Number(salary), experience };

    if (editingId) {
      await dispatch(updateVacancy({ id: editingId, vacancyData }));
      setEditingId(null);
    } else {
      await dispatch(createVacancy(vacancyData));
    }

    dispatch(fetchDashboardData());
    dispatch(fetchVacancies());

    setTitle('');
    setDescription('');
    setCity('');
    setSalary('');
    setExperience('Без опыта');
  };

  const handleEdit = (vacancy) => {
    setEditingId(vacancy._id);
    setTitle(vacancy.title);
    setDescription(vacancy.description || '');
    setCity(vacancy.city);
    setSalary(vacancy.salary);
    setExperience(vacancy.experience);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCity('');
    setSalary('');
    setExperience('Без опыта');
  };

  const handleDelete = async (id) => {
    await dispatch(deleteVacancy(id));
    dispatch(fetchDashboardData());
    dispatch(fetchVacancies());
  };

  if (status === 'loading' && vacancies.length === 0) {
    return <p style={{ textAlign: 'center', color: '#555' }}>Загрузка панели аналитики...</p>;
  }

  return (
    <div style={{ display: 'flex',width:1000 , flexDirection: 'column', gap: 24 }}>
      {(error || actionError) && (
        <div style={{ color: '#e74c3c', padding: 12, background: '#fdf2e9', borderRadius: 6, border: '1px solid #f5c6cb' }}>
          Ошибка: {error || actionError}
        </div>
      )}

      {/* ==========================================
          БЛОК ПРОФИЛЯ РАБОТОДАТЕЛЯ
         ========================================== */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems:'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>{displayName}</h2>
            <p style={{ margin: 0, fontSize: 14, color: '#7f8c8d' }}>
              Роль: <strong style={{ color: '#27ae60' }}>Работодатель</strong>
            </p>
          </div>
        </div>
      </div>
              {/* Список моих вакансий */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Мои вакансии ({myVacancies.length})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {myVacancies.map(vacancy => (
            <div key={vacancy._id} style={{ border: '1px solid #e1e8ed', padding: 15, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>{vacancy.title} ({vacancy.city})</h4>
                <p style={{ margin: '0 0 5px 0', color: '#555', fontSize: 13 }}>
                  Зарплата: <strong>{vacancy.salary?.toLocaleString()} ₸</strong> | Опыт: {vacancy.experience}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleEdit(vacancy)} style={{ padding: '6px 12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  Редактировать
                </button>
                <button onClick={() => handleDelete(vacancy._id)} style={{ padding: '6px 12px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
            {/* ==========================================
          СПИСОК ОТКЛИКОВ С КНОПКАМИ ПРИНЯТЬ/ОТКЛОНИТЬ
         ========================================== */}
      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: 16 }}>📥 Отклики кандидатов ({myResponses.length})</h3>
        {myResponses.length === 0 ? (
          <p style={{ color: '#777', fontSize: 13 }}>Пока нет откликов на ваши вакансии.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myResponses.map(resp => {
              const vacancyObj = vacancies.find(v => String(v._id) === String(resp.vacancy?._id || resp.vacancy));
              const worker = resp.worker;

              return (
                <div key={resp._id} style={{ border: '1px solid #e1e8ed', padding: 15, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>Вакансия: {vacancyObj?.title || 'Вакансия'}</h4>
                    <p style={{ margin: '0 0 3px 0', fontSize: 14 }}>Соискатель: <strong>{worker?.user?.name || worker?.name || 'Кандидат'}</strong></p>
                    <p style={{ margin: '0 0 3px 0', fontSize: 13, color: '#555' }}>Резюме: {worker?.resume || 'Не указано'}</p>
                    <p style={{ margin: '0 0 5px 0', fontSize: 13, color: '#555' }}>Телефон: {worker?.phone || 'Не указан'}</p>
                    <p style={{ margin: 0, fontSize: 12 }}>
                      Статус: <strong style={{ 
                        color: resp.status === 'accepted' ? '#27ae60' : resp.status === 'rejected' ? '#e74c3c' : '#f39c12' 
                      }}>
                        {resp.status === 'accepted' ? 'Принято (Приглашение)' : resp.status === 'rejected' ? 'Отклонено' : 'На рассмотрении'}
                      </strong>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      onClick={() => dispatch(updateResponseStatus({ responseId: resp._id, status: 'accepted' }))}
                      style={{ padding: '8px 12px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      Принять
                    </button>
                    <button 
                      onClick={() => dispatch(updateResponseStatus({ responseId: resp._id, status: 'rejected' }))}
                      style={{ padding: '8px 12px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed' , justifyItems:'center' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>{editingId ? 'Редактировать вакансию' : 'Создать новую вакансию'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 500 }}>
          <input type="text" placeholder="Название должности" value={title} onChange={e => setTitle(e.target.value)} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          <input type="text" placeholder="Город" value={city} onChange={e => setCity(e.target.value)} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          <input type="number" placeholder="Зарплата (₸)" value={salary} onChange={e => setSalary(e.target.value)} required style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          <select value={experience} onChange={e => setExperience(e.target.value)} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}>
            <option value="Без опыта">Без опыта</option>
            <option value="1–3 года">1–3 года</option>
            <option value="3–5 лет">3–5 лет</option>
            <option value="Более 5 лет">Более 5 лет</option>
          </select>
          <textarea placeholder="Описание вакансии" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" style={{ padding: '10px 15px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
              {editingId ? 'Сохранить изменения' : 'Опубликовать вакансию'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} style={{ padding: '10px 15px', background: '#95a5a6', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        
        {/* График 1: Статусы откликов (Doughnut) */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: 16, width: '100%', textAlign: 'left' }}>📊 Воронка статусов</h3>
          <div style={{ width: '100%', maxHeight: '240px', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={responseStatusChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* График 2: Средние зарплаты по сферам (Bar) */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: 16 }}>💰 Средняя зарплата (₸)</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <Bar data={salaryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* График 3: Отклики по вакансиям (Line) */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #e1e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: 16 }}>📈 Отклики по вакансиям</h3>
          <div style={{ width: '100%', height: '220px' }}>
            <Line data={responsesPerVacancyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

      </div>






    </div>
  );
}

export default EmployerDashboard;