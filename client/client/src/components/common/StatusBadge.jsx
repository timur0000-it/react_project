const STYLES = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    accepted: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    rejected: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
};

const LABELS = {
    pending: 'На рассмотрении',
    accepted: 'Принято',
    rejected: 'Отклонено',
};

// labels позволяет переопределить подписи под роль (работодатель / соискатель)
export function StatusBadge({ status, labels = {} }) {
    const key = status === 'accepted' || status === 'rejected' ? status : 'pending';
    return (
        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[key]}`}>
            {labels[key] || LABELS[key]}
        </span>
    );
}

export default StatusBadge;