import mongoose from 'mongoose';

const VacancySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    default: ''
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  experience: {
    type: String,
    required: true 
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employer',
    required: true
  }
}, { timestamps: true });
VacancySchema.virtual('responses', {
  ref: 'Response',
  localField: '_id',
  foreignField: 'vacancy'
});

// Не забудьте включить виртуальные поля при конвертации в JSON/Object (если используете .lean(), нужно передавать настройки, но для .populate() в Mongoose 6+ это работает из коробки):
VacancySchema.set('toObject', { virtuals: true });
VacancySchema.set('toJSON', { virtuals: true });
export default mongoose.model('Vacancy', VacancySchema);