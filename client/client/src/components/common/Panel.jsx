export function Panel({ icon: Icon, title, children, className = '' }) {
    return (
        <section className={`rounded-card border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card ${className}`}>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight">
                {Icon && <Icon size={18} className="text-brand-600" aria-hidden="true" />}
                {title}
            </h3>
            {children}
        </section>
    );
}

export default Panel;