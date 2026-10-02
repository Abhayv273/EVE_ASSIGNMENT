require('dotenv').config();
const app = require('./app');
const connectDB = require('./utils/db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
});

// Sirf ek baar, sabse aakhir mein:
module.exports = app;