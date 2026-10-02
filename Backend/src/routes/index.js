const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const centreRoutes = require('./centre.routes');
const bookingRoutes = require('./booking.routes');
const paymentRoutes = require('./payment.routes');

router.use('/auth', authRoutes);
router.use('/centres', centreRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);

module.exports = router;