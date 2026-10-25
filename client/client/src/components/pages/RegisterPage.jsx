import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { registerUser, clearError } from '../features/auth/authSlice';
import { registerUser,clearError } from '../../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';

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
      registerUser({name,email,password,role})
    );

    if (registerUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div style={{ maxWidth: 320, margin: '50px auto' }}>
      <h2>Регистрация</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: 10 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input type="text"placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} required 
        style={{display: 'block',width: '100%',marginBottom: 10
          }}
        />

        <input type="email"  placeholder="Email"  value={email} onChange={(e) => setEmail(e.target.value)}  required
              style={{ display: 'block', width: '100%', marginBottom: 10
          }}
        />

        <input type="password" placeholder="Пароль (минимум 8 символов)" value={password} onChange={(e) => setPassword(e.target.value)}  minLength={8} required
          style={{ display: 'block', width: '100%', marginBottom: 10}}
        />

        <label htmlFor="role" style={{ display: 'block', marginBottom: 5 }}>
          Тип аккаунта
        </label>

        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}
          style={{ display: 'block',width: '100%', marginBottom: 15, padding: 8}}>
          <option value="worker">Соискатель</option>
          <option value="employer">Работодатель</option>
        </select>

        <button type="submit" disabled={isLoading} style={{ width: '100%', padding: 8 }}>
          {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
        </button>
      </form>

      <p>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}

export default RegisterPage;