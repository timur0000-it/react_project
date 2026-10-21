import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/axios';

// 1. ASYNC THUNK: ПОЛУЧЕНИЕ ВАКАНСИЙ
export const fetchVacancies = createAsyncThunk(
    'vacancies/fetchVacancies',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/vacancies');
            return response.data; // Возвращает массив вакансий с бэкенда
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Ошибка при загрузке вакансий.'
            );
        }
    }
);

const vacanciesSlice = createSlice({
    name: 'vacancies',
    initialState: {
        items: [],
        status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
        error: null,
        searchQuery: '',
        minSalary: '',
        experienceFilter: 'Все'
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
            state.searchQuery = '';
            state.minSalary = '';
            state.experienceFilter = 'Все';
        }
    },
    extraReducers: (builder) => {
        builder
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
            });
    }
});

export const { setSearchQuery, setMinSalary, setExperienceFilter, resetFilters } = vacanciesSlice.actions;
export default vacanciesSlice.reducer;