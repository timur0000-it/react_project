import mongoose from 'mongoose';

const EmployerSchema = new mongoose.Schema({
  user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
  unique: true // гарантирует связь 1 к 1
}
});

export default mongoose.model('Employer', EmployerSchema);