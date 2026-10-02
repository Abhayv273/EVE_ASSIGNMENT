const Booking = require('../models/Booking');
const PaymentTransaction = require('../models/PaymentTransaction');

const processWebhookEvent = async ({ eventId, bookingId, status, providerReference, rawPayload }) => {
  // 1. Idempotency Check: check eventId processed 
  const existingTransaction = await PaymentTransaction.findOne({ idempotencyKey: eventId });
  if (existingTransaction) {
    return {
      alreadyProcessed: true,
      transaction: existingTransaction,
    };
  }

  // 2. Booking exist ?
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found for webhook event');
    error.statusCode = 404;
    throw error;
  }

  // 3. Duplicate booking state corruption stop done by unauthorised admin
  
  if (booking.status === 'CONFIRMED' && status === 'SUCCESS') {
    return {
      alreadyProcessed: true,
      booking,
    };
  }

  // 4. booking status update 
  const targetBookingStatus = status === 'SUCCESS' ? 'CONFIRMED' : 'FAILED';
  booking.status = targetBookingStatus;
  await booking.save();

  // 5. Audit trail transaction record save with unique idempotency
  const transaction = await PaymentTransaction.create({
    bookingId: booking._id,
    idempotencyKey: eventId,
    status,
    providerReference: providerReference || `sim_${Date.now()}`,
    rawPayload,
  });

  return {
    alreadyProcessed: false,
    booking,
    transaction,
  };
};

module.exports = {
  processWebhookEvent,
};