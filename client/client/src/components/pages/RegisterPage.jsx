import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { registerUser } from '../../features/auth/authSlice';
import { registerSchema } from '../../lib/schemas';
import { validate } from '../../lib/validate';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { Field } from '../common/Field';
import { toast } from 'sonner';
import { getRequestError } from '../../lib/getRequestError';
export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('worker');
  const [fieldErrors, setFieldErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

const { isLoading } = useSelector((state) => state.auth);
  // Обновляет значение и сбрасывает ошибку этого поля, как только пользователь начал исправлять
  const bind = (key, setter) => (e) => {
    setter(e.target.value);
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    

    const { data, errors } = validate(
        registerSchema,
        { name, email, password, role }
    );

    setFieldErrors(errors);

    // Ошибки валидации показываем рядом с полями
    if (!data) return;

    try {
        await dispatch(registerUser(data)).unwrap();

        toast.success('Аккаунт успешно создан');

        navigate('/');
    } catch (error) {
        toast.error(
            getRequestError(
                error,
                'Не удалось зарегистрировать аккаунт'
            )
        );
    }
};

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Регистрация</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Создайте аккаунт, чтобы начать</p>
        </div>



        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field id="name" label="Имя" error={fieldErrors.name}>
            <Input
              id="name"
              name="name"
              placeholder="Как к вам обращаться"
              autoComplete="name"
              error={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              value={name}
              onChange={bind('name', setName)}
            />
          </Field>

          <Field id="email" label="Email" error={fieldErrors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              value={email}
              onChange={bind('email', setEmail)}
            />
          </Field>

          <Field id="password" label="Пароль" error={fieldErrors.password} hint="Минимум 8 символов">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              error={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              value={password}
              onChange={bind('password', setPassword)}
            />
          </Field>

          <Field id="role" label="Тип аккаунта" error={fieldErrors.role}>
            <Select
              id="role"
              name="role"
              error={!!fieldErrors.role}
              value={role}
              onChange={bind('role', setRole)}
            >
              <option value="worker">Соискатель</option>
              <option value="employer">Работодатель</option>
            </Select>
          </Field>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium">Войти</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;