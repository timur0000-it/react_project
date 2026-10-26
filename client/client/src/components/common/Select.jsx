import { ChevronDown } from 'lucide-react'

export function Select({
    value,
    onChange,
    name,
    disabled = false,
    error = false,
    className = '',
    children,
    ...rest
}) {
    return (
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                aria-invalid={error || undefined}
                className={`
                    box-border w-full appearance-none
                    rounded-lg border bg-[var(--bg)]
                    py-2.5 pl-3.5 pr-10
                    text-sm text-[var(--text)]
                    outline-none transition
                    disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-[var(--surface)]
                    ${error
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/25'
                        : 'border-[var(--border)] hover:border-brand-500/60 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25'}
                    ${className}
                `}
                {...rest}
            >
                {children}
            </select>
            <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
        </div>
    )
}

export default Select;