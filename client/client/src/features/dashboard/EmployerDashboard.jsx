import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
    Briefcase, Building2, Check, FileText, Inbox, Pencil,
    Phone, PieChart, PlusCircle, Trash2, TrendingUp, Wallet, X
} from 'lucide-react';

import {
    fetchDashboardData,
    createVacancy,
    updateVacancy,
    deleteVacancy,
    updateResponseStatus
} from './dashboardSlice';
import { fetchVacancies } from '../vacancies/vacanciesSlice';
import { Loader } from '../../components/common/Loader';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { Field } from '../../components/common/Field';
import { Panel } from '../../components/common/Panel';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CHART_COLORS, useChartTheme, getChartOptions } from '../../lib/chart';
import { vacancySchema, EXPERIENCE_OPTIONS } from '../../lib/schemas';
import { validate } from '../../lib/validate';

const EMPLOYER_STATUS_LABELS = { accepted: 'Принято (Приглашение)' };

export function EmployerDashboard() {
    const dispatch = useDispatch();
    const { vacancies, responses, employerProfile, status, error, actionError } = useSelector((state) => state.dashboard);
    const { user } = useSelector((state) => state.auth);
    const chartTheme = useChartTheme();
    const chartOptions = getChartOptions(chartTheme);
    const formRef = useRef(null);

    // Форма вакансии
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [salary, setSalary] = useState('');
    const [experience, setExperience] = useState('Без опыта');
    const [editingId, setEditingId] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

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
                backgroundColor: [CHART_COLORS.pending, CHART_COLORS.accepted, CHART_COLORS.rejected],
                borderColor: chartTheme.surface,
                borderWidth: 3,
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
                backgroundColor: CHART_COLORS.brand,
                borderRadius: 6,
                maxBarThickness: 48,
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
                borderColor: CHART_COLORS.brandDark,
                backgroundColor: CHART_COLORS.brandSoft,
                tension: 0.3,
                fill: true,
                pointRadius: 5,
                pointBackgroundColor: CHART_COLORS.brandDark,
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

    // ==========================================
    // ОБРАБОТЧИКИ
    // ==========================================

    // Обновляет значение поля и сбрасывает его ошибку, как только пользователь начал исправлять
    const bind = (key, setter) => (e) => {
        setter(e.target.value);
        if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setDescription('');
        setCity('');
        setSalary('');
        setExperience('Без опыта');
        setFieldErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { data: vacancyData, errors } = validate(vacancySchema, {
            title, city, salary, experience, description,
        });
        setFieldErrors(errors);
        if (!vacancyData) return;

        if (editingId) {
            await dispatch(updateVacancy({ id: editingId, vacancyData }));
        } else {
            await dispatch(createVacancy(vacancyData));
        }

        dispatch(fetchDashboardData());
        dispatch(fetchVacancies());
        resetForm();
    };

    const handleEdit = (vacancy) => {
        setEditingId(vacancy._id);
        setTitle(vacancy.title);
        setDescription(vacancy.description || '');
        setCity(vacancy.city);
        setSalary(vacancy.salary);
        setExperience(vacancy.experience);
        setFieldErrors({});
        // форма находится ниже списка, поэтому прокручиваем к ней
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleDelete = async (id) => {
        await dispatch(deleteVacancy(id));
        dispatch(fetchDashboardData());
        dispatch(fetchVacancies());
    };

    if (status === 'loading' && vacancies.length === 0) {
        return <Loader label="Загрузка панели аналитики..." />;
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

            {/* ПРОФИЛЬ РАБОТОДАТЕЛЯ */}
            <section className="flex flex-wrap items-center gap-4 rounded-card border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
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
                            Работодатель
                        </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--muted)]">
                        <span className="inline-flex items-center gap-1.5">
                            <Building2 size={15} aria-hidden="true" />
                            {companyName}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Phone size={15} aria-hidden="true" />
                            {companyPhone}
                        </span>
                    </div>
                </div>
            </section>

            {/* СПИСОК МОИХ ВАКАНСИЙ */}
            <Panel icon={Briefcase} title={`Мои вакансии (${myVacancies.length})`}>
                {myVacancies.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">
                        У вас пока нет вакансий. Создайте первую в форме ниже.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {myVacancies.map((vacancy) => (
                            <li
                                key={vacancy._id}
                                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-[var(--bg)] p-4 transition ${
                                    editingId === vacancy._id
                                        ? 'border-brand-500 ring-2 ring-brand-500/20'
                                        : 'border-[var(--border)] hover:border-brand-500/50'
                                }`}
                            >
                                <div className="min-w-0">
                                    <h4 className="font-medium">
                                        {vacancy.title}{' '}
                                        <span className="font-normal text-[var(--muted)]">· {vacancy.city}</span>
                                    </h4>
                                    <p className="mt-1 text-sm text-[var(--muted)]">
                                        Зарплата:{' '}
                                        <span className="font-medium text-[var(--text)]">
                                            {vacancy.salary?.toLocaleString('ru-RU')} ₸
                                        </span>{' '}
                                        · Опыт: {vacancy.experience}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(vacancy)}>
                                        <Pencil size={14} aria-hidden="true" />
                                        Редактировать
                                    </Button>
                                    <Button size="sm" variant="danger-soft" onClick={() => handleDelete(vacancy._id)}>
                                        <Trash2 size={14} aria-hidden="true" />
                                        Удалить
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>

            {/* ОТКЛИКИ КАНДИДАТОВ */}
            <Panel icon={Inbox} title={`Отклики кандидатов (${myResponses.length})`}>
                {myResponses.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">Пока нет откликов на ваши вакансии.</p>
                ) : (
                    <ul className="space-y-3">
                        {myResponses.map((resp) => {
                            const vacancyObj = vacancies.find(v => String(v._id) === String(resp.vacancy?._id || resp.vacancy));
                            const worker = resp.worker;

                            return (
                                <li
                                    key={resp._id}
                                    className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4"
                                >
                                    <div className="min-w-0 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="font-medium">
                                                {worker?.user?.name || worker?.name || 'Кандидат'}
                                            </h4>
                                            <StatusBadge status={resp.status} labels={EMPLOYER_STATUS_LABELS} />
                                        </div>
                                        <p className="text-sm text-[var(--muted)]">
                                            Вакансия:{' '}
                                            <span className="text-[var(--text)]">{vacancyObj?.title || 'Вакансия'}</span>
                                        </p>
                                        <p className="flex items-start gap-1.5 break-words text-sm text-[var(--muted)]">
                                            <FileText size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                                            {worker?.resume || 'Резюме не указано'}
                                        </p>
                                        <p className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                                            <Phone size={15} className="shrink-0" aria-hidden="true" />
                                            {worker?.phone || 'Не указан'}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="success"
                                            disabled={resp.status === 'accepted'}
                                            onClick={() => dispatch(updateResponseStatus({ responseId: resp._id, status: 'accepted' }))}
                                        >
                                            <Check size={14} aria-hidden="true" />
                                            Принять
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger-soft"
                                            disabled={resp.status === 'rejected'}
                                            onClick={() => dispatch(updateResponseStatus({ responseId: resp._id, status: 'rejected' }))}
                                        >
                                            <X size={14} aria-hidden="true" />
                                            Отклонить
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Panel>

            {/* ФОРМА ВАКАНСИИ */}
            <div ref={formRef} className="scroll-mt-24">
                <Panel
                    icon={editingId ? Pencil : PlusCircle}
                    title={editingId ? 'Редактировать вакансию' : 'Создать новую вакансию'}
                >
                    {/* noValidate отключает всплывающие подсказки браузера, чтобы показывались сообщения Zod */}
                    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
                        <Field id="vacancy-title" label="Название должности" error={fieldErrors.title}>
                            <Input
                                id="vacancy-title"
                                placeholder="Например, Frontend-разработчик"
                                error={!!fieldErrors.title}
                                aria-describedby={fieldErrors.title ? 'vacancy-title-error' : undefined}
                                value={title}
                                onChange={bind('title', setTitle)}
                            />
                        </Field>

                        <Field id="vacancy-city" label="Город" error={fieldErrors.city}>
                            <Input
                                id="vacancy-city"
                                placeholder="Караганда"
                                error={!!fieldErrors.city}
                                aria-describedby={fieldErrors.city ? 'vacancy-city-error' : undefined}
                                value={city}
                                onChange={bind('city', setCity)}
                            />
                        </Field>

                        <Field id="vacancy-salary" label="Зарплата (₸)" error={fieldErrors.salary}>
                            <Input
                                id="vacancy-salary"
                                type="number"
                                min="0"
                                inputMode="numeric"
                                placeholder="300000"
                                error={!!fieldErrors.salary}
                                aria-describedby={fieldErrors.salary ? 'vacancy-salary-error' : undefined}
                                value={salary}
                                onChange={bind('salary', setSalary)}
                            />
                        </Field>

                        <Field id="vacancy-experience" label="Опыт работы" error={fieldErrors.experience}>
                            <Select
                                id="vacancy-experience"
                                error={!!fieldErrors.experience}
                                value={experience}
                                onChange={bind('experience', setExperience)}
                            >
                                {EXPERIENCE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </Select>
                        </Field>

                        <div className="sm:col-span-2">
                            <Field id="vacancy-description" label="Описание вакансии" error={fieldErrors.description}>
                                <Textarea
                                    id="vacancy-description"
                                    rows={4}
                                    placeholder="Обязанности, требования, условия"
                                    error={!!fieldErrors.description}
                                    aria-describedby={fieldErrors.description ? 'vacancy-description-error' : undefined}
                                    value={description}
                                    onChange={bind('description', setDescription)}
                                />
                            </Field>
                        </div>

                        <div className="flex flex-wrap gap-3 sm:col-span-2">
                            <Button type="submit">
                                {editingId ? 'Сохранить изменения' : 'Опубликовать вакансию'}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="secondary" onClick={resetForm}>
                                    Отмена
                                </Button>
                            )}
                        </div>
                    </form>
                </Panel>
            </div>

            {/* ГРАФИКИ */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Panel icon={PieChart} title="Воронка статусов">
                    <div className="h-64 w-full">
                        <Doughnut data={responseStatusChartData} options={chartOptions.doughnut} />
                    </div>
                </Panel>

                <Panel icon={Wallet} title="Средняя зарплата (₸)">
                    <div className="h-64 w-full">
                        <Bar data={salaryChartData} options={salaryChartOptions} />
                    </div>
                </Panel>

                <Panel icon={TrendingUp} title="Отклики по вакансиям" className="md:col-span-2 lg:col-span-1">
                    <div className="h-64 w-full">
                        <Line data={responsesPerVacancyChartData} options={chartOptions.axis} />
                    </div>
                </Panel>
            </div>
        </div>
    );
}

export default EmployerDashboard;