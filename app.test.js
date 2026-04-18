const request = require('supertest');
const express = require('express');

// We create a stripped-down version of the app for testing
// No Redis connection needed — we're testing routes only
const app = express();

const flights = [
  { flightNumber: 'EY101', origin: 'AUH', destination: 'LHR', status: 'On Time', departure: '08:00' },
  { flightNumber: 'EY203', origin: 'AUH', destination: 'JFK', status: 'Delayed', departure: '10:30' },
];

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'etihad-flight-api' });
});

app.get('/flights', (req, res) => {
  res.json({ flights, total: flights.length });
});

app.get('/flights/:flightNumber', (req, res) => {
  const flight = flights.find(f => f.flightNumber === req.params.flightNumber.toUpperCase());
  if (!flight) return res.status(404).json({ error: 'Flight not found' });
  res.json(flight);
});

// Test suite
describe('Etihad Flight API', () => {

  test('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  test('GET /flights returns all flights', async () => {
    const res = await request(app).get('/flights');
    expect(res.statusCode).toBe(200);
    expect(res.body.flights).toHaveLength(2);
  });

  test('GET /flights/EY101 returns correct flight', async () => {
    const res = await request(app).get('/flights/EY101');
    expect(res.statusCode).toBe(200);
    expect(res.body.flightNumber).toBe('EY101');
  });

  test('GET /flights/UNKNOWN returns 404', async () => {
    const res = await request(app).get('/flights/UNKNOWN');
    expect(res.statusCode).toBe(404);
  });

});