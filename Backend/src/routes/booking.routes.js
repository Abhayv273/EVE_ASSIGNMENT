const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { bookingSchema } = require('../utils/validators');
const Booking = require('../models/Booking');

// Authentication middleware for all booking routes
router.use(authenticate);

// 1. Admin Route
router.get('/', async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admins only'
      });
    }

    const bookings = await Booking.find({
      $or: [
        { isPaidByPatient: true },
        { status: 'CONFIRMED' }
      ]
    })
      .populate('centreId', 'name location')
      .populate('testId', 'name price')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: { bookings }
    });
  } catch (error) {
    next(error);
  }
});

// 2. Patient Route
router.patch('/:id/pay', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Not get booking' });
    }

    booking.isPaidByPatient = true;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Payment verified',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
});

// 3. Existing booking endpoints
router.post('/', validate(bookingSchema), bookingController.createBooking);
router.get('/me', bookingController.getMyBookings);
router.get('/:id', bookingController.getBookingById);

module.exports = router;