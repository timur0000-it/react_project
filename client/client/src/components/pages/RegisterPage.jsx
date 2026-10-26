import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { registerUser, clearError } from '../../features/auth/authSlice';
import { Input } from '../../components/common/Input';   // поправьте пути под вашу структуру
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('worker');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { error, isLoading } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    dispatch(clearError());

    const result = await dispatch(
      registerUser({ name, email, password, role })
    );

    if (registerUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Регистрация</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Создайте аккаунт, чтобы начать
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Имя
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Как к вам обращаться"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Пароль
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-[var(--muted)]">Минимум 8 символов</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="role" className="text-sm font-medium">
              Тип аккаунта
            </label>
            <Select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="worker">Соискатель</option>
              <option value="employer">Работодатель</option>
            </Select>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;