import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { initDB } from './db.js';

import User from './models/User.js';
import Employer from './models/Employer.js';
import Worker from './models/Worker.js';
import Vacancy from './models/Vacancy.js';
import Response from './models/Response.js';

// Вспомогательные массивы для генерации реалистичных данных
const firstNames = ['Алексей', 'Дмитрий', 'Иван', 'Елена', 'Мария', 'Ольга', 'Сергей', 'Андрей', 'Анна', 'Максим', 'Павел', 'Юлия', 'Татьяна', 'Артем', 'Виктория'];
const lastNames = ['Смирнов', 'Иванов', 'Кузнецов', 'Соколов', 'Попов', 'Лебедев', 'Козлов', 'Новиков', 'Морозов', 'Петров'];
const cities = ['Москва', 'Санкт-Петербург', 'Казань', 'Алматы', 'Астана', 'Екатеринбург', 'Новосибирск', 'Минск'];
const skillsList = ['JavaScript', 'React', 'Node.js', 'Python', 'Django', 'MongoDB', 'Express', 'TypeScript', 'Docker', 'SQL'];
const jobTitles = ['Frontend Developer', 'Backend Developer', 'Fullstack Engineer', 'Junior React Dev', 'Node.js Developer', 'Python Programmer', 'Web Developer', 'Junior Software Engineer'];
const companyNames = ['ТехноСофт', 'ВебСтудия Плюс', 'Глобал Дев', 'Альфа Решения', 'Инновация', 'Цифра Лаб', 'ИТ Прогресс', 'Софт Сервис', 'Код Мастер', 'Айти Юнион'];

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomSkills = () => {
  const count = getRandomNumber(2, 5);
  const shuffled = [...skillsList].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

async function seedDatabase() {
  try {
    await initDB();
    console.log('📦 Подключение к БД установлено. Очистка старых данных...');

    // Очищаем коллекции перед заполнением
    await User.deleteMany({});
    await Employer.deleteMany({});
    await Worker.deleteMany({});
    await Vacancy.deleteMany({});
    await Response.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);

    // ==========================================
    // 1. СОЗДАНИЕ 30 РАБОТНИКОВ
    // ==========================================
    console.log('👷 Генерация работников...');
    const workerProfiles = [];
    
    for (let i = 1; i <= 30; i++) {
      const name = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
      const email = `worker${i}_${Date.now()}@test.com`;

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'worker'
      });

      const worker = await Worker.create({
        resume: `Опытный специалист с навыками веб-разработки. Готов к интересным проектам. Стек: ${getRandomSkills().join(', ')}.`,
        skills: getRandomSkills(),
        phone: `+7 (9${getRandomNumber(10, 99)}) ${getRandomNumber(100, 999)}-${getRandomNumber(10, 99)}-${getRandomNumber(10, 99)}`,
        user: user._id
      });

      workerProfiles.push(worker);
    }

    // ==========================================
    // 2. СОЗДАНИЕ 30 РАБОТОДАТЕЛЕЙ
    // ==========================================
    console.log('🏢 Генерация работодателей...');
    const employerProfiles = [];

    for (let i = 1; i <= 30; i++) {
      const name = `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
      const email = `employer${i}_${Date.now()}@test.com`;
      const companyName = `${getRandomItem(companyNames)} #${i}`;

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'employer'
      });

      const employer = await Employer.create({
        companyName,
        description: `Мы занимаемся разработкой современных веб-приложений и ищем талантливых специалистов в команду ${companyName}.`,
        website: `https://${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        user: user._id
      });

      employerProfiles.push(employer);
    }

    // ==========================================
    // 3. СОЗДАНИЕ 30 ВАКАНСИЙ
    // ==========================================
    console.log('📋 Генерация вакансий...');
    const vacancies = [];

    for (let i = 1; i <= 30; i++) {
      const employer = getRandomItem(employerProfiles);
      const vacancy = await Vacancy.create({
        title: `${getRandomItem(jobTitles)}`,
        description: `Требуется специалист для работы над масштабным проектом. Обязанности: разработка фич, поддержка кода, ревью. Условия: гибкий график, удаленка/офис.`,
        city: getRandomItem(cities),
        salary: getRandomNumber(60000, 250000),
        experience: getRandomItem(['Без опыта', '1–3 года', '3–5 лет']),
        employer: employer._id
      });

      vacancies.push(vacancy);
    }

    // ==========================================
    // 4. СОЗДАНИЕ 30 ОТКЛИКОВ
    // ==========================================
    console.log('📩 Генерация откликов...');
    for (let i = 1; i <= 30; i++) {
      const worker = getRandomItem(workerProfiles);
      const vacancy = getRandomItem(vacancies);

      try {
        await Response.create({
          worker: worker._id,
          vacancy: vacancy._id,
          status: getRandomItem(['pending', 'accepted', 'rejected'])
        });
      } catch (err) {
        // Игнорируем дубликаты (если рандом выбрал ту же пару worker+vacancy)
        if (err.code !== 11000) throw err;
      }
    }

    console.log('✅ База данных успешно заполнена тестовыми данными!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка при заполнении базы данных:', error);
    process.exit(1);
  }
}

seedDatabase();