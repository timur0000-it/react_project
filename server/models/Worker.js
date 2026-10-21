import mongoose from 'mongoose';

const WorkerSchema = new mongoose.Schema({
  resume: {
    type: String,
    default: ''
  },
  user: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
  unique: true // гарантирует связь 1 к 1
}
});

export default mongoose.model('Worker', WorkerSchema);
