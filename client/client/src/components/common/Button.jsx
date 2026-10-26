export function Button({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    className = '',
    ...rest
}) {
    const sizes = { md: 'px-4 py-2', sm: 'px-3 py-1.5' };
    const variants = {
        primary:
            'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-700/90 focus-visible:outline-brand-500',
        secondary:
            'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-brand-500/60 hover:bg-brand-500/10 focus-visible:outline-brand-500',
        ghost:
            'text-[var(--text)] hover:bg-[var(--surface)] focus-visible:outline-brand-500',
        danger:
            'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-700/90 focus-visible:outline-red-500',
        'danger-soft':
    'border border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/15 focus-visible:outline-red-500 dark:text-red-400',
         success:
            'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-emerald-500',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                inline-flex items-center justify-center gap-2
                rounded-lg ${sizes[size] || sizes.md}      
                text-sm font-medium
                transition duration-200
                focus-visible:outline-2 focus-visible:outline-offset-2
                disabled:pointer-events-none disabled:opacity-50
                ${variants[variant] || variants.primary}
                ${className}
            `}
            {...rest}
        >
            {children}
        </button>
    );
}

export default Button;