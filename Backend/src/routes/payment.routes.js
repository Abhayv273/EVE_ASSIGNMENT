const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { paymentSchema, webhookSchema } = require('../utils/validators');

// Mock payment trigger (Authenticated user)
router.post('/', authenticate, validate(paymentSchema), paymentController.processPayment);

// Webhook endpoint 
router.post('/webhook', validate(webhookSchema), paymentController.handleWebhook);

module.exports = router;