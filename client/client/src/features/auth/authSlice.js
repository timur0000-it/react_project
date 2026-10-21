import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../api/axios';

// 1. ASYNC THUNK: РЕГИСТРАЦИЯ
export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', credentials);
      return response.data; // Возвращает { accessToken, user }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка регистрации');
    }
  }
);

// 2. ASYNC THUNK: ВХОД
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data; // Возвращает { accessToken, user }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка входа');
    }
  }
);

// 3. ASYNC THUNK: ТИХОЕ ОБНОВЛЕНИЕ СЕССИИ ПРИ ПЕРЕЗАГРУЗКЕ СТРАНИЦЫ
export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      // Идем на /refresh, сервер прочитает HttpOnly куку и вернет новый Access Token
      const response = await api.get('/auth/refresh');
      return response.data;
    } catch (error) {
      return rejectWithValue('Неавторизован');
    }
  }
);

// 4. ASYNC THUNK: ВЫХОД
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  }
);
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,         // Данные пользователя { userId, email }
    accessToken: null,  // Access Token хранится ТОЛЬКО В ПАМЯТИ REDUX
    isLoading: true,    // Идет ли первичная проверка сессии
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
 extraReducers: (builder) => {
  builder
    // Регистрация
    .addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(registerUser.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isLoading = false;
      state.error = null;
    })
    .addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Ошибка регистрации';
    })

    // Вход
    .addCase(loginUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(loginUser.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isLoading = false;
      state.error = null;
    })
    .addCase(loginUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || 'Ошибка входа';
    })

    // Восстановление сессии
    .addCase(checkAuth.pending, (state) => {
      state.isLoading = true;
    })
    .addCase(checkAuth.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isLoading = false;
      state.error = null;
    })
    .addCase(checkAuth.rejected, (state) => {
      state.user = null;
      state.accessToken = null;
      state.isLoading = false;
    })

    // Выход
    .addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.isLoading = false;
      state.error = null;
    });
},
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;














// import { createSlice } from "@reduxjs/toolkit"

// let savedUser = JSON.parse(localStorage.getItem('currentUser')) || null
// let savedUsersList = JSON.parse(localStorage.getItem('users')) || []

// const initialState = {
//     user: savedUser,
//     users: savedUsersList,
//     error: null
// }

// const authSlice = createSlice({
//     name: 'auth',
//     initialState,
//     reducers: {
//         register: (state, action) => {
//             const {email, password, name} = action.payload
//             let existing = state.users.find((u) => u.email === email)
//             if(existing) {
//                 state.error = "Пользователь с такой почтой уже существует"
//             }

//             const newUser = {email, password, name}
//             console.log(newUser);
            
//             state.users.push(newUser)
//             state.user = {email, name}
//             state.error = null

//             localStorage.setItem('currentUser', JSON.stringify(state.user))
//             localStorage.setItem('users', JSON.stringify(state.users))
//         },
//         login: (state, action) => {
//             const {email, password} = action.payload

//             const user = state.users.find((u) => u.email === email && u.password === password)

//             if(!user) {
//                 state.error = 'Неверный email или пароль'
//                 return
//             }

//             state.user = {email: user.email, name: user.name}
//             localStorage.setItem('currentUser', JSON.stringify(state.user))
//         },
//         logout: (state, action) => {
//             state.user = null
//             localStorage.removeItem('currentUser')
//         }
//     }
// })

// export const {register, login, logout} = authSlice.actions

// export const selectCurrentUser = (state) => state.auth.user
// export const selectAuthError = (state) => state.auth.error

// export default authSlice.reducer