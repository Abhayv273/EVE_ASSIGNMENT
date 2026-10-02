const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      required: true,
    },
    providerReference: {
      type: String,
      default: null,
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: { createdAt: 'processedAt', updatedAt: false } }
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);