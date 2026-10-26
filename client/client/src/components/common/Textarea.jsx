export function Textarea({
    value,
    onChange,
    placeholder,
    name,
    rows = 3,
    disabled = false,
    error = false,
    className = '',
    ...rest
}) {
    return (
        <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            aria-invalid={error || undefined}
            className={`
                box-border w-full resize-y
                rounded-lg border bg-[var(--bg)]
                px-3.5 py-2.5
                text-sm text-[var(--text)]
                outline-none transition
                placeholder:text-[var(--muted)]
                disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[var(--surface)]
                ${error
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/25'
                    : 'border-[var(--border)] hover:border-brand-500/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25'}
                ${className}
            `}
            {...rest}
        />
    )
}

export default Textarea;