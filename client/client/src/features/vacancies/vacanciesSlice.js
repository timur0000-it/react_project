import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, errorMessage } from '../../api/axios';

// Общий обработчик ошибок для всех запросов вакансий
const makeVacancyThunk = (name, request, fallback) =>
    createAsyncThunk(
        `vacancies/${name}`,
        async (arg, thunkApi) => {
            try {
                return await request(arg, thunkApi);
            } catch (error) {
                return thunkApi.rejectWithValue(
                    errorMessage(error, fallback)
                );
            }
        }
    );

export const fetchVacancies = makeVacancyThunk(
    'fetchVacancies',
    async () => (await api.get('/vacancies')).data,
    'Ошибка при загрузке вакансий'
);

export const createVacancy = makeVacancyThunk(
    'createVacancy',
    async (vacancyData) =>
        (await api.post('/vacancies', vacancyData)).data,
    'Ошибка при создании вакансии'
);

export const updateVacancy = makeVacancyThunk(
    'updateVacancy',
    async ({ id, vacancyData }) =>
        (await api.patch(`/vacancies/${id}`, vacancyData)).data,
    'Ошибка при обновлении вакансии'
);

export const deleteVacancy = makeVacancyThunk(
    'deleteVacancy',
    async (id) => {
        await api.delete(`/vacancies/${id}`);
        return id;
    },
    'Ошибка при удалении вакансии'
);


const initialFilters = {
    searchQuery: '',
    minSalary: '',
    experienceFilter: 'Все',
};
const vacanciesSlice = createSlice({
    name: 'vacancies',
    initialState: {
        items: [],
        status: 'idle',
        error: null,
        ...initialFilters,
    },

    reducers: {
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setMinSalary: (state, action) => {
            state.minSalary = action.payload;
        },
        setExperienceFilter: (state, action) => {
            state.experienceFilter = action.payload;
        },
        resetFilters: (state) => {
            Object.assign(state, initialFilters);
        },
    },

    extraReducers: (builder) => {
        builder
            // Загрузка вакансий
            .addCase(fetchVacancies.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchVacancies.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchVacancies.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Создание: добавляем новую вакансию в начало списка
            .addCase(createVacancy.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            // Редактирование: заменяем существующую вакансию
            .addCase(updateVacancy.fulfilled, (state, action) => {
                const index = state.items.findIndex(
                    (vacancy) =>
                        String(vacancy._id) === String(action.payload._id)
                );
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            // Удаление: убираем вакансию по ID
            .addCase(deleteVacancy.fulfilled, (state, action) => {
                state.items = state.items.filter(
                    (vacancy) =>
                        String(vacancy._id) !== String(action.payload)
                );
            });
    },
});

export const {
    setSearchQuery,
    setMinSalary,
    setExperienceFilter,
    resetFilters,
} = vacanciesSlice.actions;

export default vacanciesSlice.reducer;