export function Input({
    value,
    onChange,
    placeholder,
    type = 'text',
    name,
    disabled = false,
    error = false,
    className = '',
    style = {},
    ...rest
}) {
    return (
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error || undefined}
            className={`
                box-border w-full
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
            style={style}
            {...rest}
        />
    )
}

export default Input;