const Booking = require('../models/Booking');
const DiagnosticCentre = require('../models/DiagnosticCentre');
const DiagnosticTest = require('../models/DiagnosticTest');
const ApiResponse = require('../utils/apiResponse');

// Create a booking
const createBooking = async (req, res, next) => {
  try {
    const { centreId, testId, appointmentDate } = req.body;
    const userId = req.user._id;

    // Verify centre exists
    const centre = await DiagnosticCentre.findById(centreId);
    if (!centre) {
      return ApiResponse.error(res, 'Diagnostic centre not found', 404);
    }

    // Verify test belongs to this centre
    const test = await DiagnosticTest.findOne({ _id: testId, centreId });
    if (!test) {
      return ApiResponse.error(
        res,
        'Diagnostic test not found or does not belong to this centre',
        404
      );
    }

    // Create booking with amount snapshot
    const booking = await Booking.create({
      userId,
      centreId,
      testId,
      appointmentDate,
      amount: test.price,
      status: 'PENDING',
    });

    return ApiResponse.success(res, 'Booking created successfully', { booking }, 201);
  } catch (error) {
    next(error);
  }
};

// Get current user's bookings
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('centreId', 'name location')
      .populate('testId', 'name price')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'User bookings fetched', { bookings });
  } catch (error) {
    next(error);
  }
};

// Get booking by ID
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('centreId', 'name location')
      .populate('testId', 'name price');

    if (!booking) {
      return ApiResponse.error(res, 'Booking not found', 404);
    }

    // Ensure users can only view their own bookings unless admin
    if (booking.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
      return ApiResponse.error(res, 'Unauthorized access to booking', 403);
    }

    return ApiResponse.success(res, 'Booking details fetched', { booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
};