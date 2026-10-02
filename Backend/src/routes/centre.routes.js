const express = require('express');
const router = express.Router();
const centreController = require('../controllers/centre.controller');
const authenticate = require('../middlewares/auth.middleware');

// Public endpoints to browse centres and available tests
router.get('/', centreController.getCentres);
router.get('/:centreId/tests', centreController.getCentreTests);

// Admin-only endpoints for adding data (protected)
router.post('/', authenticate, centreController.createCentre);
router.post('/:centreId/tests', authenticate, centreController.addTestToCentre);

module.exports = router;