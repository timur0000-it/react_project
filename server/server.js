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
  throw new Error('Укажи ACCESS_SECRET и REFRESH_SECRET в файле .env');
}

// Список должен совпадать с EXPERIENCE_OPTIONS на фронтенде (lib/schemas.js)
const EXPERIENCE_OPTIONS = ['Без опыта', '1–3 года', '3–5 лет', 'Более 5 лет'];

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
// 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================

// Оборачивает обработчик: необработанная ошибка превращается в ответ клиенту,
// а подробности остаются только в логе сервера
const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Такая запись уже существует' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Некорректные данные' });
    }
    console.error(`${req.method} ${req.originalUrl}:`, error);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Строка нужной длины (пробелы по краям не считаются)
const isText = (value, min, max) =>
  typeof value === 'string' &&
  value.trim().length >= min &&
  value.trim().length <= max;

const isEmail = (value) =>
  isText(value, 5, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isPassword = (value) =>
  typeof value === 'string' && value.length >= 8 && value.length <= 72;

// Проверяет данные вакансии. Возвращает очищенный объект или null
const parseVacancy = (body) => {
  const { title, description, city, salary, experience } = body;
  const salaryNumber = Number(salary);

  if (
    !isText(title, 3, 100) ||
    !isText(city, 2, 100) ||
    !isText(description, 1, 2000) ||
    !Number.isFinite(salaryNumber) ||
    salaryNumber <= 0 ||
    !EXPERIENCE_OPTIONS.includes(experience)
  ) {
    return null;
  }

  return {
    title: title.trim(),
    city: city.trim(),
    description: description.trim(),
    salary: salaryNumber,
    experience
  };
};

// ========================================
// 3. JWT И COOKIE
// ========================================

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

// Один и тот же ответ для регистрации, входа и обновления сессии
const sendAuth = (res, user, profileId, status = 200) => {
  const payload = {
    userId: String(user._id),
    email: user.email,
    role: user.role,
    profileId: profileId ? String(profileId) : ''
  };

  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

  setRefreshCookie(res, refreshToken);

  return res.status(status).json({
    accessToken,
    user: { ...payload, name: user.name }
  });
};

// ID профиля соискателя или работодателя
const getProfileId = async (user) => {
  const Profile = user.role === 'worker' ? Worker : Employer;
  const profile = await Profile.findOne({ user: user._id }).select('_id');
  return profile?._id;
};

// ========================================
// 4. ЗАЩИТА МАРШРУТОВ
// ========================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  try {
    req.user = jwt.verify(authHeader.slice(7), ACCESS_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Access-токен истёк или недействителен' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ message: 'Доступ запрещён' });
  }
  next();
};

// ========================================
// 5. АВТОРИЗАЦИЯ
// ========================================

// POST /api/auth/register
app.post(
  '/api/auth/register',
  handle(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (
      !isText(name, 2, 60) ||
      !isEmail(email) ||
      !isPassword(password) ||
      !['worker', 'employer'].includes(role)
    ) {
      return res.status(400).json({ message: 'Проверьте имя, email, пароль и роль' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role
    });

    try {
      const profile =
        role === 'worker'
          ? await Worker.create({ user: user._id, resume: '' })
          : await Employer.create({ user: user._id, companyName: name.trim() });

      return sendAuth(res, user, profile._id, 201);
    } catch (error) {
      // Пользователь без профиля не нужен, поэтому откатываем
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  })
);

// POST /api/auth/login
app.post(
  '/api/auth/login',
  handle(async (req, res) => {
    const { email, password } = req.body;

    if (!isText(email, 1, 254) || typeof password !== 'string' || !password) {
      return res.status(400).json({ message: 'Введите email и пароль' });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+password');

    const isValid = user && (await bcrypt.compare(password, user.password));

    if (!isValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    return sendAuth(res, user, await getProfileId(user));
  })
);

// GET /api/auth/refresh: восстановление сессии по refresh-cookie
app.get('/api/auth/refresh', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'Сессия истекла. Войдите снова' });
    }

    const decoded = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    return sendAuth(res, user, await getProfileId(user));
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ message: 'Refresh-токен истёк или недействителен' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  clearRefreshCookie(res);
  return res.json({ message: 'Выход выполнен успешно' });
});

// ========================================
// 6. ПРОФИЛИ
// ========================================

// GET /api/workers/me: профиль текущего соискателя
app.get(
  '/api/workers/me',
  authenticateToken,
  requireRole('worker'),
  handle(async (req, res) => {
    const worker = await Worker.findById(req.user.profileId)
      .populate('user', 'name email')
      .lean();

    if (!worker) {
      return res.status(404).json({ message: 'Профиль соискателя не найден' });
    }

    return res.json(worker);
  })
);

// GET /api/employers/me: профиль текущего работодателя
app.get(
  '/api/employers/me',
  authenticateToken,
  requireRole('employer'),
  handle(async (req, res) => {
    const employer = await Employer.findById(req.user.profileId)
      .populate('user', 'name email')
      .lean();

    if (!employer) {
      return res.status(404).json({ message: 'Профиль работодателя не найден' });
    }

    return res.json(employer);
  })
);

// PATCH /api/workers/me: сохранение резюме
app.patch(
  '/api/workers/me',
  authenticateToken,
  requireRole('worker'),
  handle(async (req, res) => {
    const { resume } = req.body;

    if (!isText(resume, 1, 3000)) {
      return res.status(400).json({ message: 'Резюме должно быть не длиннее 3000 символов' });
    }

    const worker = await Worker.findByIdAndUpdate(
      req.user.profileId,
      { resume: resume.trim() },
      { returnDocument: 'after' }
    )
      .populate('user', 'name email')
      .lean();

    if (!worker) {
      return res.status(404).json({ message: 'Профиль соискателя не найден' });
    }

    return res.json(worker);
  })
);

// ========================================
// 7. ВАКАНСИИ
// ========================================

const EMPLOYER_FIELDS = 'companyName user';

// Находит вакансию по :id и проверяет, что она принадлежит текущему работодателю.
// Если что-то не так, сама отправляет ответ и возвращает null
const findOwnVacancy = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({ message: 'Некорректный ID вакансии' });
    return null;
  }

  const vacancy = await Vacancy.findById(req.params.id);

  if (!vacancy) {
    res.status(404).json({ message: 'Вакансия не найдена' });
    return null;
  }

  if (String(vacancy.employer) !== req.user.profileId) {
    res.status(403).json({ message: 'Это не ваша вакансия' });
    return null;
  }

  return vacancy;
};

// GET /api/vacancies
app.get(
  '/api/vacancies',
  authenticateToken,
  handle(async (req, res) => {
    const vacancies = await Vacancy.find()
      .sort({ _id: -1 })
      .populate('employer', EMPLOYER_FIELDS)
      .lean();

    return res.json(vacancies);
  })
);

// POST /api/vacancies
app.post(
  '/api/vacancies',
  authenticateToken,
  requireRole('employer'),
  handle(async (req, res) => {
    if (!req.user.profileId) {
      return res
        .status(400)
        .json({ message: 'Профиль работодателя не найден. Выйдите и войдите снова' });
    }

    const data = parseVacancy(req.body);

    if (!data) {
      return res.status(400).json({ message: 'Проверьте поля вакансии' });
    }

    const vacancy = await Vacancy.create({ ...data, employer: req.user.profileId });
    const populated = await Vacancy.findById(vacancy._id)
      .populate('employer', EMPLOYER_FIELDS)
      .lean();

    return res.status(201).json(populated);
  })
);

// PATCH /api/vacancies/:id
app.patch(
  '/api/vacancies/:id',
  authenticateToken,
  requireRole('employer'),
  handle(async (req, res) => {
    const data = parseVacancy(req.body);

    if (!data) {
      return res.status(400).json({ message: 'Проверьте поля вакансии' });
    }

    const vacancy = await findOwnVacancy(req, res);
    if (!vacancy) return;

    vacancy.set(data);
    await vacancy.save();

    const updated = await Vacancy.findById(vacancy._id)
      .populate('employer', EMPLOYER_FIELDS)
      .lean();

    return res.json(updated);
  })
);

// DELETE /api/vacancies/:id
app.delete(
  '/api/vacancies/:id',
  authenticateToken,
  requireRole('employer'),
  handle(async (req, res) => {
    const vacancy = await findOwnVacancy(req, res);
    if (!vacancy) return;

    await Response.deleteMany({ vacancy: vacancy._id }); // вместе с откликами
    await vacancy.deleteOne();

    return res.json({ id: req.params.id });
  })
);

// ========================================
// 8. ОТКЛИКИ
// ========================================

// Отклик с данными кандидата (имя и email берутся из User)
const WORKER_WITH_USER = {
  path: 'worker',
  populate: { path: 'user', select: 'name email' }
};

// GET /api/responses
// Соискатель видит свои отклики, работодатель отклики на свои вакансии
app.get(
  '/api/responses',
  authenticateToken,
  handle(async (req, res) => {
    let filter;

    if (req.user.role === 'worker') {
      filter = { worker: req.user.profileId };
    } else {
      const vacancyIds = await Vacancy.find({ employer: req.user.profileId }).distinct('_id');
      filter = { vacancy: { $in: vacancyIds } };
    }

    const responses = await Response.find(filter).populate(WORKER_WITH_USER).lean();

    return res.json(responses);
  })
);

// POST /api/responses
app.post(
  '/api/responses',
  authenticateToken,
  requireRole('worker'),
  handle(async (req, res) => {
    const { vacancyId } = req.body;

    if (!mongoose.isValidObjectId(vacancyId)) {
      return res.status(400).json({ message: 'Некорректный ID вакансии' });
    }

    if (!(await Vacancy.exists({ _id: vacancyId }))) {
      return res.status(404).json({ message: 'Вакансия не найдена' });
    }

    if (await Response.exists({ worker: req.user.profileId, vacancy: vacancyId })) {
      return res.status(409).json({ message: 'Вы уже откликнулись на эту вакансию' });
    }

    const created = await Response.create({
      worker: req.user.profileId,
      vacancy: vacancyId,
      status: 'pending'
    });

    const populated = await Response.findById(created._id).populate(WORKER_WITH_USER).lean();

    return res.status(201).json(populated);
  })
);

// PATCH /api/responses/:id: работодатель принимает или отклоняет отклик
app.patch(
  '/api/responses/:id',
  authenticateToken,
  requireRole('employer'),
  handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Некорректный ID отклика' });
    }

    const { status } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Некорректный статус отклика' });
    }

    const response = await Response.findById(req.params.id).populate('vacancy', 'employer');

    // Чужой и несуществующий отклик выглядят одинаково
    if (!response || String(response.vacancy?.employer) !== req.user.profileId) {
      return res.status(404).json({ message: 'Отклик не найден' });
    }

    response.status = status;
    await response.save();

    const updated = await Response.findById(response._id).populate(WORKER_WITH_USER).lean();

    return res.json(updated);
  })
);

// ========================================
// 9. НЕИЗВЕСТНЫЕ МАРШРУТЫ И ЗАПУСК
// ========================================

app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

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