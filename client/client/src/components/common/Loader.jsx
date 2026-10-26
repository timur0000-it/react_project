import { Loader2 } from 'lucide-react'

export function Loader({ size = 36, label = 'Загрузка...', className = '' }) {
    return (
        <div
            className={`flex items-center justify-center p-10 ${className}`}
            role="status"
            aria-live="polite"
        >
            <Loader2
                size={size}
                className="animate-spin text-brand-600"
                aria-hidden="true"
            />
            <span className="sr-only">{label}</span>
        </div>
    )
}

export default Loader;