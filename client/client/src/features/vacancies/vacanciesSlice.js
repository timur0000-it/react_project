import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, errorMessage } from '../../api/axios';
import { createVacancy, updateVacancy, deleteVacancy } from '../dashboard/dashboardSlice';

export const fetchVacancies = createAsyncThunk(
  'vacancies/fetchVacancies',
  async (_, { rejectWithValue }) => {
    try {
      return (await api.get('/vacancies')).data;
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Ошибка при загрузке вакансий.'));
    }
  }
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

      // Создание, правка и удаление работодателем сразу отражаются в списке
      .addCase(createVacancy.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateVacancy.fulfilled, (state, action) => {
        const index = state.items.findIndex((v) => v._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteVacancy.fulfilled, (state, action) => {
        state.items = state.items.filter((v) => v._id !== action.payload);
      });
  },
});

export const { setSearchQuery, setMinSalary, setExperienceFilter, resetFilters } =
  vacanciesSlice.actions;
export default vacanciesSlice.reducer;