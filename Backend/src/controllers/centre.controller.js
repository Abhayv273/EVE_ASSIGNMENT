const DiagnosticCentre = require('../models/DiagnosticCentre');
const DiagnosticTest = require('../models/DiagnosticTest');
const ApiResponse = require('../utils/apiResponse');

// List diagnostic centres with optional search by location
const getCentres = async (req, res, next) => {
  try {
    const { location } = req.query;
    const filter = {};
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    const centres = await DiagnosticCentre.find(filter);
    return ApiResponse.success(res, 'Centres fetched successfully', { centres });
  } catch (error) {
    next(error);
  }
};

// Create a new centre
const createCentre = async (req, res, next) => {
  try {
    const { name, location } = req.body;
    const centre = await DiagnosticCentre.create({ name, location });
    return ApiResponse.success(res, 'Diagnostic centre created', { centre }, 201);
  } catch (error) {
    next(error);
  }
};

// Get all tests under a specific centre
const getCentreTests = async (req, res, next) => {
  try {
    const { centreId } = req.params;

    const centre = await DiagnosticCentre.findById(centreId);
    if (!centre) {
      return ApiResponse.error(res, 'Diagnostic centre not found', 404);
    }

    const tests = await DiagnosticTest.find({ centreId });
    return ApiResponse.success(res, 'Tests fetched successfully', { centre, tests });
  } catch (error) {
    next(error);
  }
};

// Add a test to a centre
const addTestToCentre = async (req, res, next) => {
  try {
    const { centreId } = req.params;
    const { name, description, price } = req.body;

    const centre = await DiagnosticCentre.findById(centreId);
    if (!centre) {
      return ApiResponse.error(res, 'Diagnostic centre not found', 404);
    }

    const test = await DiagnosticTest.create({
      centreId,
      name,
      description,
      price,
    });

    return ApiResponse.success(res, 'Diagnostic test created', { test }, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCentres,
  createCentre,
  getCentreTests,
  addTestToCentre,
};