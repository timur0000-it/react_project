import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { initDB } from './db.js';

import User from './models/User.js';
import Employer from './models/Employer.js';
import Worker from './models/Worker.js';
import Response from './models/Response.js';
import Vacancy from './models/Vacancy.js';

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error(
    'Укажи ACCESS_SECRET и REFRESH_SECRET в файле .env'
  );
}

// ========================================
// 1. MIDDLEWARE
// ========================================

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);

// ========================================
// 2. JWT И COOKIE
// ========================================

const generateTokens = (user, profileId) => {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    profileId: profileId ? profileId.toString() : ''
  };

  return {
    accessToken: jwt.sign(payload, ACCESS_SECRET, {
      expiresIn: '15m'
    }),
    refreshToken: jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: '7d'
    }),
    user: payload
  };
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/'
  });
};

// ========================================
// 3. MIDDLEWARE ЗАЩИТЫ МАРШРУТОВ
// ========================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Требуется авторизация'
    });
  }

  const token = authHeader.slice(7);

  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({
      message: 'Access-токен истёк или недействителен'
    });
  }
};

// ========================================
// 4. РЕГИСТРАЦИЯ
// POST /api/auth/register
// ========================================

app.post('/api/auth/register', async (req, res) => {
  let user;
  let profile;
  let role;

  try {
    const { name, email, password, role: requestedRole, resume } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      password.length < 8 ||
      !['worker', 'employer'].includes(requestedRole)
    ) {
      return res.status(400).json({
        message: 'Проверьте имя, email, пароль и роль'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Пользователь с таким email уже существует'
      });
    }

    role = requestedRole;
    const hashedPassword = await bcrypt.hash(password, 12);

    // 1. Сначала создаем пользователя в коллекции User
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role
    });

    // 2. Затем создаем профиль, привязывая его к созданному юзеру через user: user._id
    if (role === 'worker') {
      profile = await Worker.create({
        resume: typeof resume === 'string' ? resume : '',
        user: user._id
      });
    } else {
      profile = await Employer.create({
        companyName: name.trim(),
        user: user._id
      });
    }

    const tokens = generateTokens(user, profile._id);

    // Сохраняем хеш refresh-токена в базе.
    user.refreshTokenHash = await bcrypt.hash(
      tokens.refreshToken,
      10
    );
    await user.save();

    setRefreshCookie(res, tokens.refreshToken);

    return res.status(201).json({
      message: 'Регистрация успешна',
      accessToken: tokens.accessToken,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileId: profile._id
      }
    });
  } catch (error) {
    // Откат при ошибке: удаляем созданные записи, если что-то пошло не так
    if (user?._id) {
      await User.findByIdAndDelete(user._id);
    }
    if (profile?._id) {
      if (role === 'worker') {
        await Worker.findByIdAndDelete(profile._id);
      } else if (role === 'employer') {
        await Employer.findByIdAndDelete(profile._id);
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Пользователь с таким email уже существует'
      });
    }

    console.error('Ошибка регистрации:', error);

    return res.status(500).json({
      message: 'Ошибка сервера при регистрации'
    });
  }
});
// ========================================
// 5. АВТОРИЗАЦИЯ
// POST /api/auth/login
// ========================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Введите email и пароль'
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Неверный email или пароль'
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Неверный email или пароль'
      });
    }

    // Находим соответствующий профиль соискателя или работодателя
    const ProfileModel = user.role === 'worker' ? Worker : Employer;
    const profile = await ProfileModel.findOne({ user: user._id });

    const tokens = generateTokens(user, profile?._id);

    setRefreshCookie(res, tokens.refreshToken);

    return res.json({
      message: 'Вход выполнен успешно',
      accessToken: tokens.accessToken,
      user: tokens.user
    });
  } catch (error) {
    console.error('Ошибка входа:', error);

    return res.status(500).json({
      message: 'Ошибка сервера при входе'
    });
  }
});

// ========================================
// 6. ОБНОВЛЕНИЕ ТОКЕНА
// GET /api/auth/refresh
// ========================================

app.get('/api/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: 'Сессия истекла. Войдите снова'
      });
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    // Проверяем, что аккаунт всё ещё существует.
    const user = await User.findById(decoded.userId);

    if (!user || user.email !== decoded.email) {
      clearRefreshCookie(res);

      return res.status(401).json({
        message: 'Пользователь не найден'
      });
    }

    const tokens = generateTokens(user);

    // Выдаём новую пару токенов.
    setRefreshCookie(res, tokens.refreshToken);

    return res.json({
      accessToken: tokens.accessToken,
      user: tokens.user
    });
  } catch (error) {
    clearRefreshCookie(res);

    return res.status(401).json({
      message: 'Refresh-токен истёк или недействителен'
    });
  }
});

// ========================================
// 7. ВЫХОД
// POST /api/auth/logout
// ========================================

app.post('/api/auth/logout', (req, res) => {
  clearRefreshCookie(res);

  return res.json({
    message: 'Выход выполнен успешно'
  });
});

// ========================================
// 8. ПРОВЕРКА АВТОРИЗАЦИИ
// GET /api/auth/me
// ========================================

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(401).json({
        message: 'Пользователь не найден'
      });
    }

    return res.json({
      user: {
        userId: user._id.toString(),
        email: user.email
      }
    });
  } catch (error) {
    console.error('Ошибка проверки пользователя:', error);

    return res.status(500).json({
      message: 'Ошибка сервера'
    });
  }
});

// ========================================
// 9. ЗАЩИЩЁННЫЕ ДАННЫЕ
// GET /api/protected-data
// ========================================

app.get(
  '/api/protected-data',
  authenticateToken,
  (req, res) => {
    return res.json({
      message: 'Доступ разрешён',
      user: req.user
    });
  }
);

// ========================================
// 10. РАБОТОДАТЕЛИ
// GET /api/employers
// ========================================

app.get('/api/employers', async (req, res) => {
  try {
    const employers = await Employer.find().populate('user', 'name email role').lean();
    return res.json(employers);
  } catch (error) {
    console.error('Ошибка получения работодателей:', error);

    return res.status(500).json({
      message: 'Не удалось получить работодателей'
    });
  }
});

// ========================================
// 11. РАБОТНИКИ
// GET /api/workers
// ========================================

app.get('/api/workers', async (req, res) => {
  try {
    // Добавляем populate, чтобы подтягивать связанные данные из коллекции User
    const workers = await Worker.find().populate('user', 'name email role').lean();
    return res.json(workers);
  } catch (error) {
    console.error('Ошибка получения работников:', error);
    return res.status(500).json({
      message: 'Не удалось получить работников'
    });
  }
});
// ========================================
// 12. ОТКЛИКИ
// GET /api/responses
// ========================================

app.get('/api/responses', async (req, res) => {
  try {
    const responses = await Response.find()
      .populate('worker')
      .lean();

    return res.json(responses);
  } catch (error) {
    console.error('Ошибка получения откликов:', error);

    return res.status(500).json({
      message: 'Не удалось получить отклики'
    });
  }
});

// ========================================
// 13. ВАКАНСИИ
// GET /api/vacancies
// ========================================

app.get('/api/vacancies', async (req, res) => {
  try {
    const vacancies = await Vacancy.find()
      .populate('employer')
      .populate({
        path: 'responses',
        populate: {
          path: 'worker'
        }
      })
      .lean();

    return res.json(vacancies);
  } catch (error) {
    console.error('Ошибка получения вакансий:', error);

    return res.status(500).json({
      message: 'Не удалось получить вакансии'
    });
  }
});

// ========================================
// 14. ОДНА ВАКАНСИЯ ПО ID
// GET /api/vacancies/:id
// ========================================

app.get('/api/vacancies/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Некорректный ID вакансии'
      });
    }

    const vacancy = await Vacancy.findById(req.params.id)
      .populate('employer')
      .populate({
        path: 'responses',
        populate: {
          path: 'worker'
        }
      })
      .lean();

    if (!vacancy) {
      return res.status(404).json({
        message: 'Вакансия не найдена'
      });
    }

    return res.json(vacancy);
  } catch (error) {
    console.error('Ошибка получения вакансии:', error);

    return res.status(500).json({
      message: 'Не удалось получить вакансию'
    });
  }
});


// ========================================
// ВАКАНСИИ: CRUD (Создание, Обновление, Удаление)
// ========================================

// Создание вакансии (только работодатель)
app.post('/api/vacancies', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Только работодатели могут создавать вакансии' });
    }

    // Проверяем, что profileId реально есть в токене
    if (!req.user.profileId) {
      return res.status(400).json({ message: 'Ошибка сессии: ID профиля работодателя не найден. Пожалуйста, выйдите и войдите снова.' });
    }

    const { title, description, city, salary, experience } = req.body;

    if (!title || !city || salary === undefined || !experience || !description) {
      return res.status(400).json({ message: 'Заполните все обязательные поля, включая описание' });
    }

    const vacancy = await Vacancy.create({
      title: title.trim(),
      description: description.trim(),
      city: city.trim(),
      salary: Number(salary),
      experience,
      employer: req.user.profileId
    });

    const populated = await Vacancy.findById(vacancy._id).populate('employer').lean();
    return res.status(201).json(populated);
  } catch (error) {
    console.error('Ошибка создания вакансии:', error);
    return res.status(500).json({ message: 'Не удалось создать вакансию: ' + error.message });
  }
});
// Обновление вакансии (только владелец-работодатель)
app.patch('/api/vacancies/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Некорректный ID вакансии' });
    }

    const vacancy = await Vacancy.findById(req.params.id);
    if (!vacancy) {
      return res.status(404).json({ message: 'Вакансия не найдена' });
    }

    if (vacancy.employer.toString() !== req.user.profileId) {
      return res.status(403).json({ message: 'Вы не можете редактировать чужую вакансию' });
    }

    const { title, description, city, salary, experience } = req.body;
    if (title) vacancy.title = title.trim();
    if (description !== undefined) vacancy.description = description;
    if (city) vacancy.city = city.trim();
    if (salary !== undefined) vacancy.salary = Number(salary);
    if (experience) vacancy.experience = experience;

    await vacancy.save();
    const updated = await Vacancy.findById(vacancy._id).populate('employer').lean();
    return res.json(updated);
  } catch (error) {
    console.error('Ошибка обновления вакансии:', error);
    return res.status(500).json({ message: 'Не удалось обновить вакансию' });
  }
});

// Удаление вакансии (только владелец-работодатель)
app.delete('/api/vacancies/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Некорректный ID вакансии' });
    }

    const vacancy = await Vacancy.findById(req.params.id);
    if (!vacancy) {
      return res.status(404).json({ message: 'Вакансия не найдена' });
    }

    if (vacancy.employer.toString() !== req.user.profileId) {
      return res.status(403).json({ message: 'Вы не можете удалить чужую вакансию' });
    }

    await Vacancy.findByIdAndDelete(req.params.id);
    await Response.deleteMany({ vacancy: req.params.id }); // Удаляем связанные отклики

    return res.json({ message: 'Вакансия успешно удалена', id: req.params.id });
  } catch (error) {
    console.error('Ошибка удаления вакансии:', error);
    return res.status(500).json({ message: 'Не удалось удалить вакансию' });
  }
});


// ========================================
// РЕЗЮМЕ / ПРОФИЛЬ СОИСКАТЕЛЯ
// ========================================

// Обновление резюме и навыков (только соискатель)
app.patch('/api/workers/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Только соискатели могут редактировать резюме' });
    }

    const { resume, skills, phone } = req.body;
    const worker = await Worker.findById(req.user.profileId);
    
    if (!worker) {
      return res.status(404).json({ message: 'Профиль соискателя не найден' });
    }

    if (resume !== undefined) worker.resume = resume;
    if (skills) worker.skills = skills;
    if (phone !== undefined) worker.phone = phone;

    await worker.save();
    return res.json(worker);
  } catch (error) {
    console.error('Ошибка обновления резюме:', error);
    return res.status(500).json({ message: 'Не удалось обновить резюме' });
  }
});


// ========================================
// ОТКЛИКИ И СТАТУСЫ
// ========================================

// Отклик на вакансию (соискателем)
app.post('/api/responses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'worker') {
      return res.status(403).json({ message: 'Только соискатели могут откликаться на вакансии' });
    }

    const { vacancyId } = req.body;
    if (!mongoose.isValidObjectId(vacancyId)) {
      return res.status(400).json({ message: 'Некорректный ID вакансии' });
    }

    const vacancy = await Vacancy.findById(vacancyId);
    if (!vacancy) {
      return res.status(404).json({ message: 'Вакансия не найдена' });
    }

    const existingResponse = await Response.findOne({
      worker: req.user.profileId,
      vacancy: vacancyId
    });

    if (existingResponse) {
      return res.status(400).json({ message: 'Вы уже откликнулись на эту вакансию' });
    }

    const newResponse = await Response.create({
      worker: req.user.profileId,
      vacancy: vacancyId,
      status: 'pending'
    });

    const populated = await Response.findById(newResponse._id).populate('worker').lean();
    return res.status(201).json(populated);
  } catch (error) {
    console.error('Ошибка отправки отклика:', error);
    return res.status(500).json({ message: 'Не удалось отправить отклик' });
  }
});

// Изменение статуса отклика (employer меняет на 'accepted' или 'rejected')
app.patch('/api/responses/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'employer') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Некорректный ID отклика' });
    }

    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Некорректный статус отклика' });
    }

    const responseItem = await Response.findById(req.params.id).populate('vacancy');
    if (!responseItem) {
      return res.status(404).json({ message: 'Отклик не найден' });
    }

    // Проверяем, принадлежит ли вакансия этому работодателю
    if (responseItem.vacancy.employer.toString() !== req.user.profileId) {
      return res.status(403).json({ message: 'Вы можете управлять откликами только на свои вакансии' });
    }

    responseItem.status = status;
    await responseItem.save();

    const updated = await Response.findById(responseItem._id).populate('worker').lean();
    return res.json(updated);
  } catch (error) {
    console.error('Ошибка обновления статуса отклика:', error);
    return res.status(500).json({ message: 'Не удалось обновить статус отклика' });
  }
});

// ========================================
// 15. ОБРАБОТКА НЕИЗВЕСТНЫХ МАРШРУТОВ
// ========================================

app.use((req, res) => {
  res.status(404).json({
    message: 'Маршрут не найден'
  });
});

// ========================================
// 16. ЗАПУСК СЕРВЕРА
// ========================================

async function startServer() {
  try {
    await initDB();

    app.listen(PORT, () => {
      console.log(`Сервер запущен: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Не удалось запустить сервер:', error);
    process.exit(1);
  }
}

startServer();


