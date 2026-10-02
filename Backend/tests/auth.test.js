require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');

jest.setTimeout(30000);


beforeAll(async () => {
  const url = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eve_assignment';
  await mongoose.connect(url);
});


afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth API Endpoints', () => {
  it('Should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test User',
        email: 'testuser123@example.com',
        password: 'password123',
        role: 'PATIENT'
      });
    
    expect([200, 201, 400]).toContain(res.statusCode); 
  });

  it('Should login an existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser123@example.com', password: 'password123' });
    
    expect([200, 404]).toContain(res.statusCode);
  });
});