const request = require('supertest');
const app = require('../src/app'); 
describe('Booking API Endpoints', () => {
  it('Should fetch all bookings for logged-in user', async () => {
    // Bina token ke unauthorized (401) aana chahiye
    const res = await request(app).get('/api/bookings/me');
    expect(res.statusCode).toBe(401);
  });
});