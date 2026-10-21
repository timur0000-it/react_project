import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/axios';

// 1. ASYNC THUNK: Загрузка данных личного кабинета (отклики, вакансии, профиль)
export const fetchDashboardData = createAsyncThunk(
    'dashboard/fetchDashboardData',
    async (_, { getState, rejectWithValue }) => {
        try {
            const [responsesRes, vacanciesRes, workersRes, employersRes] = await Promise.all([
                api.get('/responses'),
                api.get('/vacancies'),
                api.get('/workers').catch(() => ({ data: [] })),
                api.get('/employers').catch(() => ({ data: [] })) // Загружаем список работодателей
            ]);

            const { auth } = getState();
            const userId = auth.user?.userId || auth.user?._id;
            const profileId = auth.user?.profileId;

            const workers = workersRes.data;
            const employers = employersRes.data;
            
            // Находим профиль текущего соискателя
            const workerProfile = Array.isArray(workers)
                ? workers.find(w => {
                    const wUserId = typeof w.user === 'object' ? w.user?._id : w.user;
                    return String(w._id) === String(profileId) || String(wUserId) === String(userId);
                  })
                : null;

            // Находим профиль текущего работодателя
            const employerProfile = Array.isArray(employers)
                ? employers.find(e => {
                    const eUserId = typeof e.user === 'object' ? e.user?._id : e.user;
                    return String(e._id) === String(profileId) || String(eUserId) === String(userId);
                  })
                : null;

            return {
                responses: responsesRes.data,
                vacancies: vacanciesRes.data,
                workers,
                workerProfile,
                employers,
                employerProfile
            };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Ошибка загрузки данных кабинета'
            );
        }
    }
);
// ==========================================
// CRUD ВАКАНСИЙ (для работодателя)
// ==========================================

export const createVacancy = createAsyncThunk(
    'dashboard/createVacancy',
    async (vacancyData, { rejectWithValue }) => {
        try {
            const response = await api.post('/vacancies', vacancyData);
            return response.data; // Созданная вакансия
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Ошибка при создании вакансии'
            );
        }
    }
);

export const updateVacancy = createAsyncThunk(
    'dashboard/updateVacancy',
    async ({ id, vacancyData }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/vacancies/${id}`, vacancyData);
            return response.data; // Обновленная вакансия
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Ошибка при обновлении вакансии'
            );
        }
    }
);

export const deleteVacancy = createAsyncThunk(
    'dashboard/deleteVacancy',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/vacancies/${id}`);
            return id; // ID удаленной вакансии
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Ошибка при удалении вакансии'
            );
        }
    }
);

// ==========================================
// CRUD / ОБНОВЛЕНИЕ РЕЗЮМЕ (для соискателя)
// ==========================================

export const updateWorkerResume = createAsyncThunk(
    'dashboard/updateWorkerResume',
    async (resumeData, { rejectWithValue }) => {
        try {
            const response = await api.patch('/workers/me', resumeData);
            return response.data; // Обновленный профиль работника
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Ошибка при обновлении резюме'
            );
        }
    }
);

// ==========================================
// ОТКЛИКИ И СТАТУСЫ
// ==========================================

// Отклик на вакансию (соискатель)
export const applyToVacancy = createAsyncThunk(
    'dashboard/applyToVacancy',
    async (vacancyId, { rejectWithValue }) => {
        try {
            const response = await api.post('/responses', { vacancyId });
            return response.data; // Созданный отклик
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Ошибка при отправке отклика'
            );
        }
    }
);

// Изменение статуса отклика (ТОЛЬКО работодатель: 'accepted' или 'rejected')
export const updateResponseStatus = createAsyncThunk(
    'dashboard/updateResponseStatus',
    async ({ responseId, status }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/responses/${responseId}`, { status });
            return response.data; // Обновленный отклик
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Ошибка обновления статуса отклика'
            );
        }
    }
);

const dashboardSlice = createSlice({
    name: 'dashboard',
        initialState: {
        vacancies: [],
        responses: [],
        workers: [],
        workerProfile: null,
        employers: [],       // Добавлено
        employerProfile: null, // Добавлено
        status: 'idle',
        error: null,
        actionStatus: 'idle',
        actionError: null
    },
    reducers: {
        clearDashboardError: (state) => {
            state.error = null;
            state.actionError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // 1. Загрузка данных
            .addCase(fetchDashboardData.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchDashboardData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.responses = action.payload.responses;
                state.vacancies = action.payload.vacancies;
                state.workers = action.payload.workers;
                state.workerProfile = action.payload.workerProfile;
                state.employers = action.payload.employers;             // <--- Добавить
                state.employerProfile = action.payload.employerProfile; // <--- Сохраняем профиль
            })
            .addCase(fetchDashboardData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // 2. Создание вакансии
            .addCase(createVacancy.pending, (state) => {
                state.actionStatus = 'loading';
                state.actionError = null;
            })
              .addCase(createVacancy.fulfilled, (state, action) => {
          state.actionStatus = 'succeeded';
          state.vacancies.unshift(action.payload); // Сразу добавляем в начало массива
      })
            .addCase(createVacancy.rejected, (state, action) => {
                state.actionStatus = 'failed';
                state.actionError = action.payload;
            })

            // 3. Обновление вакансии
.addCase(updateVacancy.fulfilled, (state, action) => {
        const index = state.vacancies.findIndex(v => v._id === action.payload._id);
        if (index !== -1) {
            state.vacancies[index] = action.payload; // Сразу обновляем в массиве
        }
    })

            // 4. Удаление вакансии
            .addCase(deleteVacancy.fulfilled, (state, action) => {
        state.vacancies = state.vacancies.filter(v => v._id !== action.payload);
    })

            // 5. Обновление резюме соискателя
            .addCase(updateWorkerResume.fulfilled, (state, action) => {
                state.workerProfile = action.payload;
                state.actionStatus = 'succeeded';
            })
            .addCase(updateWorkerResume.pending, (state) => {
                state.actionStatus = 'loading';
                state.actionError = null;
            })
            .addCase(updateWorkerResume.rejected, (state, action) => {
                state.actionStatus = 'failed';
                state.actionError = action.payload;
            })

            // 6. Отклик на вакансию
            .addCase(applyToVacancy.pending, (state) => {
                state.actionStatus = 'loading';
                state.actionError = null;
            })
            .addCase(applyToVacancy.fulfilled, (state, action) => {
                state.actionStatus = 'succeeded';
                state.responses.push(action.payload);
            })
            .addCase(applyToVacancy.rejected, (state, action) => {
                state.actionStatus = 'failed';
                state.actionError = action.payload;
            })

            // 7. Обновление статуса отклика (Работодателем)
            .addCase(updateResponseStatus.fulfilled, (state, action) => {
                const index = state.responses.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.responses[index] = action.payload;
                }
            });
    }
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;