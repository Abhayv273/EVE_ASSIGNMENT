const Booking = require('../models/Booking');

class BookingService {
  async getBookingsForAdmin() {
    return await Booking.find({
      $or: [{ isPaidByPatient: true }, { status: 'CONFIRMED' }]
    })
      .populate('centreId', 'name location')
      .populate('testId', 'name price')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
  }

  async recordPatientPayment(bookingId, userId) {
    const query = userId ? { _id: bookingId, userId } : { _id: bookingId };
    return await Booking.findOneAndUpdate(
      query,
      { $set: { isPaidByPatient: true } },
      { new: true }
    );
  }

  async getUserBookings(userId) {
    return await Booking.find({ userId })
      .populate('centreId', 'name location')
      .populate('testId', 'name price')
      .sort({ createdAt: -1 });
  }
}

module.exports = new BookingService();