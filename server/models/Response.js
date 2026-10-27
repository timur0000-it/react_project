import mongoose from 'mongoose';

const ResponseSchema = new mongoose.Schema({
  worker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Worker',
    required: true
  },
  vacancy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vacancy',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });


ResponseSchema.index({ worker: 1, vacancy: 1 }, { unique: true });

export default mongoose.model('Response', ResponseSchema);