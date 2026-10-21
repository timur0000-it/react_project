
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/job_database';

export async function initDB() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');
  return mongoose.connection;
}