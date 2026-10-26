import React from 'react';
import { MapPin, Briefcase, Check } from 'lucide-react';
import { Button } from '../../components/common/Button';   // поправьте путь под вашу структуру

export function VacancyCard({ vacancy, userRole, hasApplied, onApply }) {
  return (
    <article className="flex h-full flex-col justify-between gap-5 rounded-card border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card transition hover:border-brand-500/50 hover:shadow-md">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold leading-snug tracking-tight">
          {vacancy.title}
        </h3>

        <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
          {vacancy.salary != null
            ? `${vacancy.salary.toLocaleString('ru-RU')} ₸`
            : 'Зарплата не указана'}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={15} aria-hidden="true" />
            {vacancy.city}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Briefcase size={15} aria-hidden="true" />
            Опыт: {vacancy.experience}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
          {vacancy.description}
        </p>
      </div>

      {/* Кнопка отклика видна только пользователю с ролью worker */}
      {userRole === 'worker' && (
        <div>
          {hasApplied ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <Check size={16} aria-hidden="true" />
              Вы откликнулись
            </div>
          ) : (
            <Button onClick={onApply} className="w-full">
              Откликнуться
            </Button>
          )}
        </div>
      )}
    </article>
  );
}

export default VacancyCard;