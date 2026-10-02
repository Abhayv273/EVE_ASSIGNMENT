
const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());
app.get('/favicon.ico', (req, res) => res.status(204).end());
// Static UI serve karne ke liye
app.use(express.static(path.join(__dirname, '../public')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
const routes = require('./routes');
app.use('/api', routes);

app.use(errorHandler);

module.exports = app;