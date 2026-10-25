import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {  fetchVacancies,  setSearchQuery,  setMinSalary,  setExperienceFilter, resetFilters } from "./vacanciesSlice";
import { fetchDashboardData, applyToVacancy } from "../dashboard/dashboardSlice";
import { Loader } from "../../components/common/Loader";
import { Input } from "../../components/common/Input";
import { VacancyCard } from "./VacancyCard";

export function VacancyList() {
    const dispatch = useDispatch();
    const { items, status, error, searchQuery, minSalary, experienceFilter } = useSelector((state) => state.vacancies);
    const { responses } = useSelector((state) => state.dashboard);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchVacancies());
        }dispatch(fetchDashboardData());
    }, [status, dispatch]);

    const handleApply = (vacancyId) => {
        dispatch(applyToVacancy(vacancyId));
    };

    // Множество ID вакансий, на которые соискатель уже откликнулся
    const myAppliedVacancyIds = new Set(
        responses
            .filter(r => {
                const workerId = typeof r.worker === 'object' ? r.worker?._id : r.worker;
                return String(workerId) === String(user?.profileId);
            })
            .map(r => String(typeof r.vacancy === 'object' ? r.vacancy?._id : r.vacancy))
    );

    // Фильтрация вакансий по названию/городу, зарплате и опыту
    const filteredVacancies = items.filter((vacancy) => {
        // 1. Поиск по тексту (название или город)
        const matchesQuery = 
            vacancy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vacancy.city.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Фильтр по минимальной зарплате
        const matchesSalary = minSalary === '' || Number(vacancy.salary) >= Number(minSalary);

        // 3. Фильтр по опыту работы
        const matchesExperience = experienceFilter === 'Все' || vacancy.experience === experienceFilter;

        return matchesQuery && matchesSalary && matchesExperience;
    });

    if (status === 'loading') return <Loader />;
    if (status === 'failed') return <div style={{ color: 'red', textAlign: 'center' }}>Ошибка: {error}</div>;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
            {/* Панель фильтрации */}
            <div style={{ 
                background: '#fff', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid #e1e8ed', 
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center' }}>
                    {/* Поиск по названию / городу */}
                    <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Поиск</label>
                        <Input 
                            placeholder="Название или город..." 
                            value={searchQuery}  
                            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
                        />
                    </div>

                    {/* Порог зарплаты */}
                    <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Мин. зарплата (₸)</label>
                        <Input 
                            type="number"
                            placeholder="От..." 
                            value={minSalary}  
                            onChange={(e) => dispatch(setMinSalary(e.target.value))}
                        />
                    </div>

                    {/* Фильтр по опыту */}
                    <div>
                        <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Опыт работы</label>
                        <select 
                            value={experienceFilter} 
                            onChange={(e) => dispatch(setExperienceFilter(e.target.value))}
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                borderRadius: '4px', 
                                border: '1px solid #ccc',
                                background: '#fff',
                                fontSize: '14px' }}>
                                    
                            <option value="Все">Все варианты</option>
                            <option value="Без опыта">Без опыта</option>
                            <option value="1–3 года">1–3 года</option>
                            <option value="3–5 лет">3–5 лет</option>
                            <option value="Более 5 лет">Более 5 лет</option>
                        </select>
                    </div>
                </div>

                {/* Сброс фильтров */}
                {(searchQuery || minSalary || experienceFilter !== 'Все') && (
                    <button 
                        onClick={() => dispatch(resetFilters())} 
                        style={{ alignSelf: 'flex-end',background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '13px',fontWeight: 600 }}>
                        ✕ Сбросить фильтры
                    </button>
                )}
            </div>

            {/* Список карточек вакансий */}
            {filteredVacancies.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#777' }}>Вакансии с такими параметрами не найдены</p>
            ) : (
                <div
                    style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20}}>
                    {filteredVacancies.map(vacancy => (
                        <VacancyCard  key={vacancy._id}  vacancy={vacancy}  userRole={user?.role} 
                         hasApplied={myAppliedVacancyIds.has(String(vacancy._id))} onApply={() => handleApply(vacancy._id)}/>
                    ))}
                </div>
            )}
        </div>
    );
}

export default VacancyList;