import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { toast } from 'sonner';
import {
    Briefcase, Check, FileText, Inbox, Mail, Pencil,
    PieChart, PlusCircle, Trash2, TrendingUp, Wallet, X
} from 'lucide-react';

import { updateResponseStatus } from './dashboardSlice';
import { createVacancy, updateVacancy, deleteVacancy } from '../vacancies/vacanciesSlice';
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
    const { responses, status, error } = useSelector((state) => state.dashboard);
    const vacancies = useSelector((state) => state.vacancies.items);
    const vacanciesStatus = useSelector((state) => state.vacancies.status);
    const { user } = useSelector((state) => state.auth);
    const chartTheme = useChartTheme();
    const formRef = useRef(null);

    // Форма вакансии
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [city, setCity] = useState('');
    const [salary, setSalary] = useState('');
    const [experience, setExperience] = useState('Без опыта');
    const [editingId, setEditingId] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    // Когда форма открывается (или переключается на другую вакансию), прокручиваем к ней
    useEffect(() => {
        if (isFormOpen) {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isFormOpen, editingId]);

    const displayName = user?.name || 'Работодатель';

    // Сервер отдаёт в откликах только отклики на вакансии работодателя
    const myResponses = responses;

    // ==========================================
    // МЕМОИЗИРОВАННЫЕ ДАННЫЕ ДЛЯ ГРАФИКОВ
    // Пересчитываются только при смене своих зависимостей,
    // а не при вводе текста в форму
    // ==========================================

    const myVacancies = useMemo(
        () => vacancies.filter((v) => String(v.employer?._id || v.employer) === String(user?.profileId)),
        [vacancies, user?.profileId]
    );

    const chartOptions = useMemo(() => getChartOptions(chartTheme), [chartTheme]);

    // На оси зарплат нужны разделители разрядов
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

    // 1. Статусы откликов
    const responseStatusChartData = useMemo(() => {
        const pendingCount = myResponses.filter(r => r.status === 'pending' || !r.status).length;
        const acceptedCount = myResponses.filter(r => r.status === 'accepted').length;
        const rejectedCount = myResponses.filter(r => r.status === 'rejected').length;

        return {
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
    }, [myResponses, chartTheme]);

    // 2. Средняя зарплата по сферам
    const salaryChartData = useMemo(() => {
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

        return {
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
    }, [myVacancies]);

    // 3. Отклики по вакансиям
    const responsesPerVacancyChartData = useMemo(() => {
        const vacancyTitles = myVacancies.map(v => v.title);
        const vacancyResponsesCounts = myVacancies.map(v =>
            myResponses.filter(r => String(r.vacancy?._id || r.vacancy) === String(v._id)).length
        );

        return {
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
    }, [myVacancies, myResponses]);

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

    const openCreateForm = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const closeForm = () => {
        resetForm();
        setIsFormOpen(false);
    };

    const handleEdit = (vacancy) => {
        setEditingId(vacancy._id);
        setTitle(vacancy.title);
        setDescription(vacancy.description || '');
        setCity(vacancy.city);
        setSalary(vacancy.salary);
        setExperience(vacancy.experience);
        setFieldErrors({});
        setIsFormOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { data: vacancyData, errors } = validate(vacancySchema, {
            title, city, salary, experience, description,
        });
        setFieldErrors(errors);
        if (!vacancyData) return;

        const result = await dispatch(
            editingId
                ? updateVacancy({ id: editingId, vacancyData })
                : createVacancy(vacancyData)
        );

        // При ошибке сервера оставляем форму открытой (тост с ошибкой покажет App)
        if (result.meta.requestStatus === 'fulfilled') {
            toast.success(editingId ? 'Вакансия обновлена' : 'Вакансия опубликована');
            closeForm();
        }
    };

    const handleDelete = async (id) => {
        const result = await dispatch(deleteVacancy(id));

        if (result.meta.requestStatus === 'fulfilled') {
            toast.success('Вакансия удалена');
            // Если удалили вакансию, которая сейчас редактируется, закрываем форму
            if (editingId === id) closeForm();
        }
    };

    const handleStatus = async (responseId, newStatus) => {
        const result = await dispatch(updateResponseStatus({ responseId, status: newStatus }));

        if (result.meta.requestStatus === 'fulfilled') {
            toast.success(newStatus === 'accepted' ? 'Кандидат приглашён' : 'Отклик отклонён');
        }
    };

    const isLoading = [status, vacanciesStatus].some((s) => s === 'idle' || s === 'loading');

    if (isLoading) {
        return <Loader label="Загрузка панели аналитики..." />;
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
            {/* Ошибки действий показывает тост (см. App.jsx), здесь только ошибка загрузки кабинета */}
            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                >
                    Ошибка: {error}
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
                </div>
            </section>

            {/* СПИСОК МОИХ ВАКАНСИЙ */}
            <Panel icon={Briefcase} title={`Мои вакансии (${myVacancies.length})`}>
                {!isFormOpen && (
                    <div className="mb-4">
                        <Button onClick={openCreateForm}>
                            <PlusCircle size={16} aria-hidden="true" />
                            Создать вакансию
                        </Button>
                    </div>
                )}

                {myVacancies.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">
                        У вас пока нет вакансий. Нажмите «Создать вакансию», чтобы добавить первую.
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

            {/* ФОРМА ВАКАНСИИ (показывается только после нажатия «Создать» или «Редактировать») */}
            {isFormOpen && (
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
                                <Button type="button" variant="secondary" onClick={closeForm}>
                                    Отмена
                                </Button>
                            </div>
                        </form>
                    </Panel>
                </div>
            )}

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
                                                {worker?.user?.name || 'Кандидат'}
                                            </h4>
                                            <StatusBadge status={resp.status} labels={EMPLOYER_STATUS_LABELS} />
                                        </div>
                                        <p className="text-sm text-[var(--muted)]">
                                            Вакансия:{' '}
                                            <span className="text-[var(--text)]">{vacancyObj?.title || 'Вакансия'}</span>
                                        </p>
                                        <p className="flex items-start gap-1.5 whitespace-pre-line break-words text-sm text-[var(--muted)]">
                                            <FileText size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                                            {worker?.resume || 'Резюме не указано'}
                                        </p>
                                        <p className="flex items-center gap-1.5 text-sm text-[var(--muted)]">
                                            <Mail size={15} className="shrink-0" aria-hidden="true" />
                                            {worker?.user?.email || '—'}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="success"
                                            disabled={resp.status === 'accepted'}
                                            onClick={() => handleStatus(resp._id, 'accepted')}
                                        >
                                            <Check size={14} aria-hidden="true" />
                                            Принять
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger-soft"
                                            disabled={resp.status === 'rejected'}
                                            onClick={() => handleStatus(resp._id, 'rejected')}
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