import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
    Briefcase, FileText, Inbox, Phone, PieChart, TrendingUp, UserPen
} from 'lucide-react';

import { fetchDashboardData, updateWorkerResume } from './dashboardSlice';
import { CHART_COLORS, useChartTheme, getChartOptions } from '../../lib/chart';
import { Loader } from '../../components/common/Loader';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';

const WORKER_STATUS_LABELS = { accepted: 'Приглашение', rejected: 'Отказ' };

export function WorkerDashboard() {
    const dispatch = useDispatch();
    const { responses, vacancies, workerProfile, status, error, actionError } = useSelector((state) => state.dashboard);
    const { user } = useSelector((state) => state.auth);
    const chartTheme = useChartTheme();
    const chartOptions = getChartOptions(chartTheme);

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

    const hasResume = Boolean(actualWorker?.resume || resume);
    const displayResume =
        actualWorker?.resume ||
        resume ||
        'Резюме пока не заполнено.';

    const skillsList = Array.isArray(actualWorker?.skills)
        ? actualWorker.skills
        : String(actualWorker?.skills || '').split(',').map((s) => s.trim()).filter(Boolean);

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

    // 1. Статусы откликов (Doughnut)
    const responseStatusChartData = {
        labels: ['На рассмотрении', 'Приглашения', 'Отказы'],
        datasets: [
            {
                data: [pendingCount, acceptedCount, rejectedCount],
                backgroundColor: [CHART_COLORS.pending, CHART_COLORS.accepted, CHART_COLORS.rejected],
                borderColor: chartTheme.surface,
                borderWidth: 3,
            },
        ],
    };

    const appliedSphereStats = {};
    const appliedSalariesList = [];
    const appliedTitlesList = [];

    myResponses.forEach(r => {
        const vac = vacancies.find(v => String(v._id) === String(r.vacancy?._id || r.vacancy));
        if (vac) {
            if (vac.salary) {
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

    // 2. Распределение по сферам (Bar)
    const sphereLabels = Object.keys(appliedSphereStats);
    const sphereCounts = sphereLabels.map(s => appliedSphereStats[s]);

    const sphereChartData = {
        labels: sphereLabels.length ? sphereLabels : ['Нет данных'],
        datasets: [
            {
                label: 'Количество откликов',
                data: sphereCounts.length ? sphereCounts : [0],
                backgroundColor: CHART_COLORS.brand,
                borderRadius: 6,
                maxBarThickness: 48,
            },
        ],
    };

    // 3. Зарплаты по откликам (Line)
    const salaryTrendChartData = {
        labels: appliedTitlesList.length ? appliedTitlesList : ['Нет данных'],
        datasets: [
            {
                label: 'Зарплата в отклике (₸)',
                data: appliedSalariesList.length ? appliedSalariesList : [0],
                borderColor: CHART_COLORS.money,
                backgroundColor: CHART_COLORS.moneySoft,
                tension: 0.3,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: CHART_COLORS.money,
            },
        ],
    };

    // На оси зарплат нужны разделители разрядов
    const salaryChartOptions = {
        ...chartOptions.axis,
        scales: {
            ...chartOptions.axis.scales,
            y: {
                ...chartOptions.axis.scales.y,
                ticks: {
                    ...chartOptions.axis.scales.y.ticks,
                    callback: (v) => Number(v).toLocaleString('ru-RU'),
                },
            },
        },
    };

    if (status === 'loading' && !workerProfile) {
        return <Loader label="Загрузка кабинета соискателя..." />;
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            {(error || actionError) && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                >
                    Ошибка: {error || actionError}
                </div>
            )}

            {/* ПРОФИЛЬ И ТЕКУЩЕЕ РЕЗЮМЕ */}
            <section className="rounded-card border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
                <div className="flex flex-wrap items-center gap-4">
                    <div
                        className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-600 text-lg font-semibold text-white"
                        aria-hidden="true"
                    >
                        {String(displayName).trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-xl font-semibold tracking-tight">{displayName}</h2>
                            <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-100">
                                Соискатель
                            </span>
                        </div>
                        {actualWorker?.phone && (
                            <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-[var(--muted)]">
                                <Phone size={15} aria-hidden="true" />
                                {actualWorker.phone}
                            </p>
                        )}
                    </div>
                </div>

                {skillsList.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                        {skillsList.map((skill) => (
                            <li
                                key={skill}
                                className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-xs font-medium"
                            >
                                {skill}
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-5 border-t border-[var(--border)] pt-5">
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <FileText size={16} className="text-brand-600" aria-hidden="true" />
                        Ваше текущее резюме
                    </h4>
                    <p
                        className={`whitespace-pre-line rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm leading-relaxed ${
                            hasResume ? '' : 'text-[var(--muted)]'
                        }`}
                    >
                        {displayResume}
                    </p>
                </div>
            </section>

            {/* АНАЛИТИКА (3 ГРАФИКА) */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Panel icon={PieChart} title="Воронка статусов">
                    <div className="h-64 w-full">
                        <Doughnut data={responseStatusChartData} options={chartOptions.doughnut} />
                    </div>
                </Panel>

                <Panel icon={Briefcase} title="Отклики по сферам">
                    <div className="h-64 w-full">
                        <Bar data={sphereChartData} options={chartOptions.axis} />
                    </div>
                </Panel>

                <Panel icon={TrendingUp} title="Зарплаты в откликах (₸)" className="md:col-span-2 lg:col-span-1">
                    <div className="h-64 w-full">
                        <Line data={salaryTrendChartData} options={salaryChartOptions} />
                    </div>
                </Panel>
            </div>

            {/* РЕДАКТИРОВАНИЕ РЕЗЮМЕ */}
            <Panel icon={UserPen} title="Редактировать профиль и резюме">
                <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label htmlFor="worker-phone" className="text-sm font-medium">Телефон</label>
                        <Input
                            id="worker-phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+7 (700) 000-00-00"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="worker-skills" className="text-sm font-medium">Навыки</label>
                        <Input
                            id="worker-skills"
                            placeholder="JavaScript, React, Node.js"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                        />
                        <p className="text-xs text-[var(--muted)]">Перечислите через запятую</p>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <label htmlFor="worker-resume" className="text-sm font-medium">О себе / Опыт работы</label>
                        <Textarea
                            id="worker-resume"
                            rows={5}
                            placeholder="Расскажите о своем опыте..."
                            value={resume}
                            onChange={(e) => setResume(e.target.value)}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <Button type="submit">Обновить резюме</Button>
                    </div>
                </form>
            </Panel>

            {/* СПИСОК ОТКЛИКОВ */}
            <Panel icon={Inbox} title={`Мои отклики (${myResponses.length})`}>
                {myResponses.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">Вы еще не откликались ни на одну вакансию.</p>
                ) : (
                    <ul className="space-y-3">
                        {myResponses.map((resp) => {
                            const vacancyObj = vacancies.find(v => String(v._id) === String(resp.vacancy?._id || resp.vacancy));
                            return (
                                <li
                                    key={resp._id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 transition hover:border-brand-500/50"
                                >
                                    <div className="min-w-0">
                                        <h4 className="font-medium">
                                            {vacancyObj?.title || 'Вакансия'}{' '}
                                            <span className="font-normal text-[var(--muted)]">· {vacancyObj?.city || '—'}</span>
                                        </h4>
                                        <p className="mt-1 text-sm text-[var(--muted)]">
                                            Зарплата:{' '}
                                            <span className="font-medium text-[var(--text)]">
                                                {vacancyObj?.salary != null
                                                    ? `${vacancyObj.salary.toLocaleString('ru-RU')} ₸`
                                                    : '—'}
                                            </span>
                                        </p>
                                    </div>
                                    <StatusBadge status={resp.status} labels={WORKER_STATUS_LABELS} />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Panel>
        </div>
    );
}

export default WorkerDashboard;