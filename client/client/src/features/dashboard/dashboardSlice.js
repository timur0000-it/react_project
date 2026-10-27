import { createSlice, createAsyncThunk, isAnyOf } from '@reduxjs/toolkit';
import { api, errorMessage } from '../../api/axios';
import { logoutUser } from '../auth/authSlice';

// Создаёт thunk: запрос плюс единый текст ошибки
const makeThunk = (name, request, fallback) =>
  createAsyncThunk(`dashboard/${name}`, async (arg, thunkApi) => {
    try {
      return await request(arg, thunkApi);
    } catch (error) {
      return thunkApi.rejectWithValue(errorMessage(error, fallback));
    }
  });

// Отклики и профиль (соискателя или работодателя в зависимости от роли)
export const fetchDashboardData = makeThunk(
  'fetchDashboardData',
  async (_, { getState }) => {
    const role = getState().auth.user?.role;
    const [responses, profile] = await Promise.all([
      api.get('/responses'),
      api.get(role === 'employer' ? '/employers/me' : '/workers/me'),
    ]);
    return { responses: responses.data, profile: profile.data };
  },
  'Ошибка загрузки данных кабинета'
);

// Вакансии (работодатель). Список вакансий обновляет vacanciesSlice
export const createVacancy = makeThunk(
  'createVacancy',
  async (vacancyData) => (await api.post('/vacancies', vacancyData)).data,
  'Ошибка при создании вакансии'
);

export const updateVacancy = makeThunk(
  'updateVacancy',
  async ({ id, vacancyData }) => (await api.patch(`/vacancies/${id}`, vacancyData)).data,
  'Ошибка при обновлении вакансии'
);

export const deleteVacancy = makeThunk(
  'deleteVacancy',
  async (id) => {
    await api.delete(`/vacancies/${id}`);
    return id;
  },
  'Ошибка при удалении вакансии'
);

// Резюме (соискатель)
export const updateWorkerResume = makeThunk(
  'updateWorkerResume',
  async (data) => (await api.patch('/workers/me', data)).data,
  'Ошибка при обновлении резюме'
);

// Отклики
export const applyToVacancy = makeThunk(
  'applyToVacancy',
  async (vacancyId) => (await api.post('/responses', { vacancyId })).data,
  'Ошибка при отправке отклика'
);

export const updateResponseStatus = makeThunk(
  'updateResponseStatus',
  async ({ responseId, status }) => (await api.patch(`/responses/${responseId}`, { status })).data,
  'Ошибка обновления статуса отклика'
);

const actionThunks = [
  createVacancy,
  updateVacancy,
  deleteVacancy,
  updateWorkerResume,
  applyToVacancy,
  updateResponseStatus,
];

const initialState = {
  responses: [],
  profile: null,
  status: 'idle', // загрузка кабинета
  error: null,
  actionError: null, // ошибка последнего действия (сохранить, удалить, откликнуться)
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.responses = action.payload.responses;
        state.profile = action.payload.profile;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(updateWorkerResume.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(applyToVacancy.fulfilled, (state, action) => {
        state.responses.push(action.payload);
      })
      .addCase(updateResponseStatus.fulfilled, (state, action) => {
        const index = state.responses.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.responses[index] = action.payload;
      })
      // Сервер удаляет отклики вместе с вакансией
      .addCase(deleteVacancy.fulfilled, (state, action) => {
        state.responses = state.responses.filter(
          (r) => String(r.vacancy?._id || r.vacancy) !== String(action.payload)
        );
      })

      // После выхода данные прошлого пользователя не должны остаться
      .addCase(logoutUser.fulfilled, () => initialState)

      // Ошибка любого действия попадает в actionError
      .addMatcher(isAnyOf(...actionThunks.map((t) => t.pending)), (state) => {
        state.actionError = null;
      })
      .addMatcher(isAnyOf(...actionThunks.map((t) => t.rejected)), (state, action) => {
        state.actionError = action.payload || 'Что-то пошло не так';
      });
  },
});

export default dashboardSlice.reducer;