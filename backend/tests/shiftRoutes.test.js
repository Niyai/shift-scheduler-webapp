const request = require('supertest');
const app = require('../server'); // Replace with the actual path to your app file
const db = require('../db'); // Your database connection setup

// Jest hooks to clean up or reset the database
beforeAll(async () => {
  // Setup before tests run (e.g., seed test data)
});

afterAll(async () => {
  // Clean up database after all tests
  await db.query('DELETE FROM shifts');
  await db.query('DELETE FROM shift_logs');
  await db.end();
});

describe('Shift Management Routes', () => {

  // Test for creating a new shift
  it('should create a new shift', async () => {
    const res = await request(app)
      .post('/api/shifts')
      .send({
        date: '2024-10-10',
        startTime: '09:00',
        endTime: '17:00',
        userId: 1
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('date', '2024-10-10');
  });

  // Test for getting shifts by date
  it('should get shifts by date', async () => {
    const res = await request(app)
      .get('/api/shifts')
      .query({ date: '2024-10-10' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Test for updating an existing shift
  it('should update an existing shift', async () => {
    const res = await request(app)
      .put('/api/shifts/1') // Replace with a valid shift id
      .send({
        date: '2024-10-11',
        startTime: '10:00',
        endTime: '18:00'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('date', '2024-10-11');
  });

  // Test for calculating team strength
  it('should calculate team strength', async () => {
    const res = await request(app)
      .get('/api/team-strength');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('teamStrength');
    expect(Number(res.body.teamStrength)).toBeGreaterThanOrEqual(0);
  });

  // Test for logging changes to a shift
  it('should log changes to a shift', async () => {
    const res = await request(app)
      .post('/api/shifts/log')
      .send({
        shiftId: 1,
        changeDescription: 'Updated shift time',
        changedBy: 1
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('shift_id', 1);
    expect(res.body).toHaveProperty('change_description', 'Updated shift time');
  });

});
