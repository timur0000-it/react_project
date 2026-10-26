import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { loginUser } from '../../features/auth/authSlice';
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
  const { error, isLoading } = useSelector((state) => state.auth);

  const bind = (key, setter) => (e) => {
    setter(e.target.value);
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data, errors } = validate(loginSchema, { email, password });
    setFieldErrors(errors);
    if (!data) return;

    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Вход</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Введите данные, чтобы продолжить</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field id="email" label="Email" error={fieldErrors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={!!fieldErrors.email || !!error}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              value={email}
              onChange={bind('email', setEmail)}
            />
          </Field>

          <Field id="password" label="Пароль" error={fieldErrors.password}>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={!!fieldErrors.password || !!error}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              value={password}
              onChange={bind('password', setPassword)}
            />
          </Field>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isLoading ? 'Входим...' : 'Войти'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Нет аккаунта?{' '}
          <Link to="/register" className="font-medium">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;