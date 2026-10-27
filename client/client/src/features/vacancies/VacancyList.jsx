import { useDispatch, useSelector } from "react-redux";
import { useState } from 'react';
import { SearchX, X } from "lucide-react";
import { applyToVacancy } from "../dashboard/dashboardSlice";
import { Loader } from "../../components/common/Loader";
import { Input } from "../../components/common/Input";
import { Select } from "../../components/common/Select";
import { Button } from "../../components/common/Button";
import { VacancyCard } from "./VacancyCard";

export function VacancyList() {
    const dispatch = useDispatch();
    const { items, status, error } = useSelector(
    (state) => state.vacancies
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [minSalary, setMinSalary] = useState('');
    const [experienceFilter, setExperienceFilter] = useState('Все');
    const { responses } = useSelector((state) => state.dashboard);
    const { user } = useSelector((state) => state.auth);

    // Сервер отдаёт соискателю только его отклики, поэтому достаточно собрать ID вакансий
    const appliedVacancyIds = new Set(
        responses.map((r) => String(r.vacancy?._id || r.vacancy))
    );

    // Фильтрация вакансий по названию/городу, зарплате и опыту
    const query = searchQuery.toLowerCase();
    const filteredVacancies = items.filter((vacancy) => {
        const matchesQuery =
            vacancy.title.toLowerCase().includes(query) ||
            vacancy.city.toLowerCase().includes(query);
        const matchesSalary = minSalary === '' || Number(vacancy.salary) >= Number(minSalary);
        const matchesExperience = experienceFilter === 'Все' || vacancy.experience === experienceFilter;
        return matchesQuery && matchesSalary && matchesExperience;
    });

    if (status === 'idle' || status === 'loading') return <Loader />;
    if (status === 'failed') {
        return (
            <div
                role="alert"
                className="mx-auto mt-10 max-w-md rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-600 dark:text-red-400"
            >
                Ошибка: {error}
            </div>
        );
    }

    const hasActiveFilters = searchQuery || minSalary || experienceFilter !== 'Все';

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
            {/* Панель фильтрации */}
            <section className="mb-6 rounded-card border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1.5">
                        <label htmlFor="search" className="text-sm font-medium">Поиск</label>
                        <Input
                            id="search"
                            placeholder="Название или город..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="min-salary" className="text-sm font-medium">Мин. зарплата (₸)</label>
                        <Input
                            id="min-salary"
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="От..."
                            value={minSalary}
                            onChange={(e) => setMinSalary(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="experience" className="text-sm font-medium">Опыт работы</label>
                        <Select
                            id="experience"
                            value={experienceFilter}
                            onChange={(e) => setExperienceFilter(e.target.value)}
                        >
                            <option value="Все">Все варианты</option>
                            <option value="Без опыта">Без опыта</option>
                            <option value="1–3 года">1–3 года</option>
                            <option value="3–5 лет">3–5 лет</option>
                            <option value="Более 5 лет">Более 5 лет</option>
                        </Select>
                    </div>
                </div>

                <div className="mt-4 flex min-h-9 items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                    <p className="text-sm text-[var(--muted)]" aria-live="polite">
                        Найдено: <span className="font-medium text-[var(--text)]">{filteredVacancies.length}</span>
                    </p>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSearchQuery('');
                                setMinSalary('');
                                setExperienceFilter('Все');
                            }}
                        >
                            <X size={16} aria-hidden="true" />
                            Сбросить фильтры
                        </Button>
                    )}
                </div>
            </section>

            {/* Список карточек вакансий */}
            {filteredVacancies.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-[var(--border)] px-6 py-14 text-center">
                    <SearchX size={32} className="text-[var(--muted)]" aria-hidden="true" />
                    <p className="text-sm text-[var(--muted)]">
                        Вакансии с такими параметрами не найдены
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                    {filteredVacancies.map((vacancy) => (
                        <VacancyCard
                            key={vacancy._id}
                            vacancy={vacancy}
                            userRole={user?.role}
                            hasApplied={appliedVacancyIds.has(String(vacancy._id))}
                            onApply={() => dispatch(applyToVacancy(vacancy._id))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default VacancyList;