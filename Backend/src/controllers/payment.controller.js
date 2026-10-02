const Booking = require('../models/Booking');
const ApiResponse = require('../utils/apiResponse');
const paymentService = require('../services/payment.service');
const crypto = require('crypto');

// POST /payments/ (Mock Payment Endpoint)
const processPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return ApiResponse.error(res, 'Booking not found', 404);
    }

    if (booking.status === 'CONFIRMED') {
      return ApiResponse.error(res, 'Booking is already paid and confirmed', 400);
    }

    // 80% success rate simulate karte hain
    const isSuccess = Math.random() < 0.8;
    const paymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';
    const simulatedEventId = `evt_${crypto.randomUUID()}`;

    // Process through the same idempotent pipeline
    const result = await paymentService.processWebhookEvent({
      eventId: simulatedEventId,
      bookingId: booking._id,
      status: paymentStatus,
      providerReference: `ref_${Date.now()}`,
      rawPayload: req.body,
    });

    return ApiResponse.success(res, `Payment processed: ${paymentStatus}`, {
      bookingId: booking._id,
      status: paymentStatus,
      transactionId: result.transaction._id,
    });
  } catch (error) {
    next(error);
  }
};

// POST /payments/webhook/ (Idempotent Webhook Endpoint)
const handleWebhook = async (req, res, next) => {
  try {
    const { eventId, bookingId, status, providerReference } = req.body;

    const result = await paymentService.processWebhookEvent({
      eventId,
      bookingId,
      status,
      providerReference,
      rawPayload: req.body,
    });

    if (result.alreadyProcessed) {
      return ApiResponse.success(
        res,
        'Event already processed (Idempotent replay ignored)',
        { eventId, status: 'IGNORED_DUPLICATE' },
        200
      );
    }

    return ApiResponse.success(
      res,
      'Webhook processed successfully',
      {
        bookingId,
        bookingStatus: result.booking.status,
        transactionId: result.transaction._id,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processPayment,
  handleWebhook,
};