const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  pharmacy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pharmacy' 
  },
  appointment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Appointment' 
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    trim: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// Add virtual population for patient details
feedbackSchema.virtual('patientDetails', {
  ref: 'User',
  localField: 'patient',
  foreignField: '_id',
  justOne: true,
  options: { select: 'name avatar' }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;