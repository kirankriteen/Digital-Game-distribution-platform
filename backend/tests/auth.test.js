const request = require('supertest');
const app = require('../authServer');
const { pool } = require('../db/pool');

describe('Auth API Tests', () => {
  const testUserEmail = 'testuser@example.com';
  const testUserPassword = 'Password123';
  const testUserFullName = 'Test User';

  // Helper to delete the test user if it exists
  const cleanupUser = async () => {
    await pool.query('DELETE FROM userlogin WHERE username = ?', [testUserEmail]);
  };

  beforeAll(async () => {
    // Ensure the test user is not in the database before tests
    await cleanupUser();
  });

  afterAll(async () => {
    // Cleanup at the end
    await cleanupUser();
    await pool.end();
  });

  test('Signup - should create a new user', async () => {
    try {
      const res = await request(app)
        .post('/signup')
        .send({
          fullName: testUserFullName,
          email: testUserEmail,
          password: testUserPassword
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'User registered');
      expect(res.body).toHaveProperty('userId');
    } catch (err) {
      // If test fails, remove any user that may have been created
      await cleanupUser();
      throw err; // rethrow so the test still fails
    }
  });

  test('Signup - should fail with duplicate email', async () => {
    try {
      // First signup
      await request(app)
        .post('/signup')
        .send({
          fullName: testUserFullName,
          email: testUserEmail,
          password: testUserPassword
        });

      // Second signup should fail
      const res = await request(app)
        .post('/signup')
        .send({
          fullName: testUserFullName,
          email: testUserEmail,
          password: testUserPassword
        });

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty('error', 'Email already exists');
    } catch (err) {
      await cleanupUser();
      throw err;
    } finally {
      // Always cleanup after test
      await cleanupUser();
    }
  });

  test('Login - should authenticate valid user', async () => {
    try {
      await request(app)
        .post('/signup')
        .send({
          fullName: testUserFullName,
          email: testUserEmail,
          password: testUserPassword
        });

      const res = await request(app)
        .post('/login')
        .send({
          username: testUserEmail,
          password: testUserPassword
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    } catch (err) {
      await cleanupUser();
      throw err;
    } finally {
      await cleanupUser();
    }
  });

  test('Login - should fail with wrong password', async () => {
    try {
      await request(app)
        .post('/signup')
        .send({
          fullName: testUserFullName,
          email: testUserEmail,
          password: testUserPassword
        });

      const res = await request(app)
        .post('/login')
        .send({
          username: testUserEmail,
          password: 'WrongPassword1'
        });

      expect(res.statusCode).toBe(401);
      expect(res.text).toBe('Invalid credentials');
    } catch (err) {
      await cleanupUser();
      throw err;
    } finally {
      await cleanupUser();
    }
  });

  test('Login - should fail for non-existent user', async () => {
    // This test does not create a user, so no cleanup needed
    const res = await request(app)
      .post('/login')
      .send({
        username: 'nonexistent@example.com',
        password: 'Whatever123'
      });

    expect(res.statusCode).toBe(400);
    expect(res.text).toBe('Cannot find user');
  });
});