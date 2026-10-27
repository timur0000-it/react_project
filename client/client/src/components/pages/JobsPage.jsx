import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Briefcase, LayoutDashboard } from "lucide-react";
import { Header } from "../layout/Header";
import { Button } from "../common/Button";
import { VacancyList } from "../../features/vacancies/VacancyList";
import { EmployerDashboard } from "../../features/dashboard/EmployerDashboard";
import { WorkerDashboard } from "../../features/dashboard/WorkerDashboard";
import { fetchVacancies } from "../../features/vacancies/vacanciesSlice";
import { fetchDashboardData } from "../../features/dashboard/dashboardSlice";

const TABS = [
  { id: "vacancies", label: "Все вакансии", icon: Briefcase },
  { id: "dashboard", label: "Мой кабинет", icon: LayoutDashboard },
];

export function JobsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("vacancies"); // 'vacancies' | 'dashboard'

  // Данные загружаются один раз; дальше их обновляют сами слайсы
  useEffect(() => {
    dispatch(fetchVacancies());
    dispatch(fetchDashboardData());
  }, [dispatch]);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Переключатель вкладок */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6">
        <div
          role="tablist"
          aria-label="Разделы"
          className="inline-flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-card"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <Button
                key={id}
                id={`tab-${id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls="jobs-panel"
                variant={isActive ? "primary" : "ghost"}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Контент активной вкладки */}
      <main id="jobs-panel" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === "vacancies" ? (
          <VacancyList />
        ) : user?.role === "employer" ? (
          <EmployerDashboard />
        ) : (
          <WorkerDashboard />
        )}
      </main>
    </div>
  );
}

export default JobsPage;