const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('PATIENT', 'ADMIN').default('PATIENT'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const bookingSchema = Joi.object({
  centreId: Joi.string().hex().length(24).required(),
  testId: Joi.string().hex().length(24).required(),
  appointmentDate: Joi.date().iso().greater('now').required(),
});

const paymentSchema = Joi.object({
  bookingId: Joi.string().hex().length(24).required(),
});

const webhookSchema = Joi.object({
  eventId: Joi.string().required(),
  bookingId: Joi.string().hex().length(24).required(),
  status: Joi.string().valid('SUCCESS', 'FAILED').required(),
  amount: Joi.number().positive().required(),
  providerReference: Joi.string().optional(),
});

module.exports = {
  signupSchema,
  loginSchema,
  bookingSchema,
  paymentSchema,
  webhookSchema,
};