import { Link } from 'react-router-dom';
import { SearchX, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
    return (
        <main className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="grid size-20 place-items-center rounded-2xl bg-brand-500/10">
                        <SearchX
                            size={40}
                            className="text-brand-600"
                            aria-hidden="true"
                        />
                    </div>
                </div>

                <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
                    Ошибка 404
                </p>

                <h1 className="mt-3 text-3xl font-bold tracking-tight">
                    Страница не найдена
                </h1>

                <p className="mt-3 text-[var(--muted)]">
                    Возможно, страница была удалена, адрес указан неверно
                    или она никогда не существовала.
                </p>

                <Link
                    to="/"
                    className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    На главную
                </Link>
            </div>
        </main>
    );
}

export default NotFoundPage;