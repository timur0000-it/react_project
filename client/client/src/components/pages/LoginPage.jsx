import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { loginUser } from '../../features/auth/authSlice';
import { getRequestError } from '../../lib/getRequestError';
import { loginSchema } from '../../lib/schemas';
import { validate } from '../../lib/validate';

import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Field } from '../common/Field';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { isLoading } = useSelector((state) => state.auth);

    const bind = (key, setter) => (e) => {
        setter(e.target.value);

        if (fieldErrors[key]) {
            setFieldErrors((prev) => ({
                ...prev,
                [key]: undefined,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { data, errors } = validate(
            loginSchema,
            { email, password }
        );

        setFieldErrors(errors);

        // Ошибки валидации отображаются непосредственно у полей
        if (!data) return;

        try {
            await dispatch(loginUser(data)).unwrap();

            toast.success('Вы успешно вошли в аккаунт');

            navigate('/');
        } catch (error) {
            toast.error(
                getRequestError(
                    error,
                    'Не удалось выполнить вход'
                )
            );
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm rounded-card border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">
                        Вход
                    </h2>

                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Введите данные, чтобы продолжить
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-4"
                >
                    <Field
                        id="email"
                        label="Email"
                        error={fieldErrors.email}
                    >
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            error={!!fieldErrors.email}
                            aria-describedby={
                                fieldErrors.email
                                    ? 'email-error'
                                    : undefined
                            }
                            value={email}
                            onChange={bind('email', setEmail)}
                        />
                    </Field>

                    <Field
                        id="password"
                        label="Пароль"
                        error={fieldErrors.password}
                    >
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            error={!!fieldErrors.password}
                            aria-describedby={
                                fieldErrors.password
                                    ? 'password-error'
                                    : undefined
                            }
                            value={password}
                            onChange={bind('password', setPassword)}
                        />
                    </Field>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading && (
                            <Loader2
                                size={16}
                                className="animate-spin"
                                aria-hidden="true"
                            />
                        )}

                        {isLoading ? 'Входим...' : 'Войти'}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-[var(--muted)]">
                    Нет аккаунта?{' '}
                    <Link to="/register" className="font-medium">
                        Зарегистрироваться
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;