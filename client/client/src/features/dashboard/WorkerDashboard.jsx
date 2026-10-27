import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
    Briefcase, FileText, Inbox, Pencil, PieChart, TrendingUp, UserPen
} from 'lucide-react';

import { updateWorkerResume } from './dashboardSlice';
import { CHART_COLORS, useChartTheme, getChartOptions } from '../../lib/chart';
import { workerResumeSchema } from '../../lib/schemas';
import { validate } from '../../lib/validate';
import { Loader } from '../../components/common/Loader';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Field } from '../../components/common/Field';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';

const WORKER_STATUS_LABELS = { accepted: 'Приглашение', rejected: 'Отказ' };

export function WorkerDashboard() {
    const dispatch = useDispatch();
    const { responses, profile, status, error, actionError } = useSelector((state) => state.dashboard);
    const vacancies = useSelector((state) => state.vacancies.items);
    const vacanciesStatus = useSelector((state) => state.vacancies.status);
    const { user } = useSelector((state) => state.auth);
    const chartTheme = useChartTheme();
    const formRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);
    const [resume, setResume] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const displayName = user?.name || 'Соискатель';

    // В блоке текущее резюме показываем только сохранённый текст, а не то, что набрано в форме
    const savedResume = profile?.resume || '';

    // Когда форма открывается, прокручиваем к ней
    useEffect(() => {
        if (isEditing) {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isEditing]);

    const openForm = () => {
        setResume(savedResume);
        setFieldErrors({});
        setIsEditing(true);
    };

    const closeForm = () => {
        setFieldErrors({});
        setIsEditing(false);
    };

    const handleChange = (e) => {
        setResume(e.target.value);
        if (fieldErrors.resume) setFieldErrors((prev) => ({ ...prev, resume: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { data, errors } = validate(workerResumeSchema, { resume });
        setFieldErrors(errors);
        if (!data) return;

        const result = await dispatch(updateWorkerResume({ resume: data.resume }));

        // При ошибке сервера оставляем форму открытой, чтобы не потерять введённый текст
        if (result.meta.requestStatus === 'fulfilled') closeForm();
    };

    // Сервер отдаёт соискателю только его собственные отклики
    const myResponses = responses;

    const chartOptions = useMemo(() => getChartOptions(chartTheme), [chartTheme]);

    // разделители цифр не 300000 а 300 000
    const salaryChartOptions = useMemo(() => ({
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
    }), [chartOptions]);

    // 1. Статусы откликов (Doughnut)
    const responseStatusChartData = useMemo(() => {
        const pendingCount = myResponses.filter(r => r.status === 'pending' || !r.status).length;
        const acceptedCount = myResponses.filter(r => r.status === 'accepted').length;
        const rejectedCount = myResponses.filter(r => r.status === 'rejected').length;

        return {
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
    }, [myResponses, chartTheme]);

    // 2 и 3. Сферы и зарплаты считаются одним проходом по откликам
    const { sphereChartData, salaryTrendChartData } = useMemo(() => {
        const appliedSphereStats = {};
        const appliedSalariesList = [];
        const appliedTitlesList = [];

        myResponses.forEach(r => {
            const vac = vacancies.find(v => String(v._id) === String(r.vacancy?._id || r.vacancy));
            if (!vac) return;

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
        });

        const sphereLabels = Object.keys(appliedSphereStats);
        const sphereCounts = sphereLabels.map(s => appliedSphereStats[s]);

        return {
            sphereChartData: {
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
            },
            salaryTrendChartData: {
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
            },
        };
    }, [myResponses, vacancies]);

    const isLoading = [status, vacanciesStatus].some((s) => s === 'idle' || s === 'loading');

    if (isLoading) {
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
                    </div>
                </div>

                <div className="mt-5 border-t border-[var(--border)] pt-5">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold">
                            <FileText size={16} className="text-brand-600" aria-hidden="true" />
                            Ваше текущее резюме
                        </h4>
                        {!isEditing && (
                            <Button size="sm" variant="secondary" onClick={openForm}>
                                <Pencil size={14} aria-hidden="true" />
                                {savedResume ? 'Редактировать' : 'Добавить резюме'}
                            </Button>
                        )}
                    </div>
                    <p
                        className={`whitespace-pre-line rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm leading-relaxed ${
                            savedResume ? '' : 'text-[var(--muted)]'
                        }`}
                    >
                        {savedResume || 'Резюме пока не заполнено.'}
                    </p>
                </div>
            </section>

            {/* РЕДАКТИРОВАНИЕ РЕЗЮМЕ (показывается только после нажатия кнопки) */}
            {isEditing && (
                <div ref={formRef} className="scroll-mt-24">
                    <Panel icon={UserPen} title="Редактировать резюме">
                        {/* noValidate отключает всплывающие подсказки браузера, чтобы показывались сообщения Zod */}
                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            <Field id="worker-resume" label="О себе / Опыт работы" error={fieldErrors.resume}>
                                <Textarea
                                    id="worker-resume"
                                    rows={6}
                                    placeholder="Расскажите о своем опыте..."
                                    error={!!fieldErrors.resume}
                                    aria-describedby={fieldErrors.resume ? 'worker-resume-error' : undefined}
                                    value={resume}
                                    onChange={handleChange}
                                />
                            </Field>

                            <div className="flex flex-wrap gap-3">
                                <Button type="submit">Сохранить резюме</Button>
                                <Button type="button" variant="secondary" onClick={closeForm}>
                                    Отмена
                                </Button>
                            </div>
                        </form>
                    </Panel>
                </div>
            )}

            {/* (3 ГРАФИКА) */}
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