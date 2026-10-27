import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, errorMessage } from '../../api/axios';

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      return (await api.post('/auth/register', data)).data; // { accessToken, user }
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Ошибка регистрации'));
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      return (await api.post('/auth/login', data)).data; // { accessToken, user }
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Ошибка входа'));
    }
  }
);

// Тихое восстановление сессии при загрузке страницы
export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      return (await api.get('/auth/refresh')).data;
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Неавторизован'));
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});

const startLoading = (state) => {
  state.isLoading = true;
  state.error = null;
};

const setSession = (state, action) => {
  state.user = action.payload.user;
  state.accessToken = action.payload.accessToken;
  state.isLoading = false;
  state.error = null;
};

const clearSession = (state) => {
  state.user = null;
  state.accessToken = null;
  state.isLoading = false;
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null, // { userId, name, email, role, profileId }
    accessToken: null,
    isLoading: true, // true, пока идёт первичная проверка сессии
    error: null,
    authCheckStatus: 'idle',
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Их вызывает axios.js при автоматическом обновлении токена
    sessionRefreshed: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    sessionExpired: clearSession,
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, startLoading)
      .addCase(registerUser.fulfilled, setSession)
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Ошибка регистрации';
      })

      .addCase(loginUser.pending, startLoading)
      .addCase(loginUser.fulfilled, setSession)
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Ошибка входа';
      })

      .addCase(checkAuth.pending, (state) => {
        state.authCheckStatus = 'loading';
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.authCheckStatus = 'succeeded';
        setSession(state, action);
      })
      .addCase(checkAuth.rejected, (state) => {
        state.authCheckStatus = 'failed';
        clearSession(state);
      })

      .addCase(logoutUser.fulfilled, (state) => {
        clearSession(state);
        state.error = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;