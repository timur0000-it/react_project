import { z } from 'zod';

export const EXPERIENCE_OPTIONS = ['Без опыта', '1–3 года', '3–5 лет', 'Более 5 лет'];

const email = z.string().trim().pipe(z.email('Введите корректный email'));

// При входе длину пароля не проверяем: у старых аккаунтов она может быть любой
export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Введите пароль'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Минимум 2 символа').max(60, 'Не более 60 символов'),
  email,
  password: z.string().min(8, 'Минимум 8 символов').max(72, 'Не более 72 символов'),
  role: z.enum(['worker', 'employer'], { error: 'Выберите тип аккаунта' }),
});

export const vacancySchema = z.object({
  title: z.string().trim().min(3, 'Минимум 3 символа').max(100, 'Не более 100 символов'),
  city: z.string().trim().min(2, 'Укажите город'),
  // z.coerce превращает строку из input в число
  salary: z.coerce.number({ error: 'Введите число' }).positive('Зарплата должна быть больше 0'),
  experience: z.enum(EXPERIENCE_OPTIONS, { error: 'Выберите опыт' }),
  description: z.string().trim().max(2000, 'Не более 2000 символов'),
});
export const workerResumeSchema = z.object({
  resume: z
    .string()
    .trim()
    .min(10, 'Расскажите о себе подробнее (минимум 10 символов)')
    .max(3000, 'Не более 3000 символов'),
});