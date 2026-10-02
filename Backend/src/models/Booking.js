const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    centreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiagnosticCentre',
      required: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DiagnosticTest',
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    isPaidByPatient: {
    type: Boolean,
    default: false
  }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);