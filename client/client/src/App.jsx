import { useState } from 'react'
import './App.css'
import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom'
import { useDispatch } from 'react-redux';
import { checkAuth } from './features/auth/authSlice';
import { RegisterPage } from './components/pages/RegisterPage'
import { JobsPage } from './components/pages/JobsPage'
import { LoginPage } from './components/pages/LoginPage'
import { ProtectedRoute } from './components/layout/ProtectedRoutes'

function App() {
    const dispatch = useDispatch();

  // При первой загрузке приложения делаем контрольный запрос на /refresh для восстановления сессии
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  return (
    <Routes>
      <Route path='/login' element={<LoginPage />}/>
      <Route path='/register' element={<RegisterPage />}/>
      <Route element={<ProtectedRoute />}>
        <Route path='/' element={<JobsPage />}/>
      </Route>
    </Routes>
  )
}

export default App