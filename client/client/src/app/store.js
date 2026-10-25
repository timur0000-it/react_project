import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import vacanciesReducer from '../features/vacancies/vacanciesSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import { injectStore } from '../api/axios';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    vacancies: vacanciesReducer,
    dashboard: dashboardReducer,
  },
});
injectStore(store);