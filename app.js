const express = require('express');
const redis = require('redis');
const app = express();
const PORT = process.env.PORT || 3000;

// Redis connection — reads host from environment variable
// In Docker Compose, REDIS_HOST will be "redis" (the service name)
// On your local machine without compose, it falls back to localhost
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379
  }
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.connect();

const flights = [
  { flightNumber: 'EY101', origin: 'AUH', destination: 'LHR', status: 'On Time',  departure: '08:00' },
  { flightNumber: 'EY203', origin: 'AUH', destination: 'JFK', status: 'Delayed',  departure: '10:30' },
  { flightNumber: 'EY315', origin: 'AUH', destination: 'CDG', status: 'Boarding', departure: '11:15' },
  { flightNumber: 'EY422', origin: 'AUH', destination: 'SYD', status: 'Cancelled',departure: '14:00' },
];

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'etihad-flight-api', timestamp: new Date() });
});

app.get('/flights', (req, res) => {
  res.json({ flights, total: flights.length });
});

// This route now uses Redis caching
app.get('/flights/:flightNumber', async (req, res) => {
  const key = `flight:${req.params.flightNumber.toUpperCase()}`;

  // Step 1: check the cache first
  const cached = await redisClient.get(key);
  if (cached) {
    console.log(`Cache HIT for ${key}`);
    return res.json({ ...JSON.parse(cached), source: 'cache' });
  }

  // Step 2: cache miss — fetch from data source
  console.log(`Cache MISS for ${key}`);
  const flight = flights.find(f => f.flightNumber === req.params.flightNumber.toUpperCase());
  if (!flight) return res.status(404).json({ error: 'Flight not found' });

  // Step 3: store in Redis for 30 seconds then return
  await redisClient.setEx(key, 30, JSON.stringify(flight));
  res.json({ ...flight, source: 'database' });
});

app.listen(PORT, () => {
  console.log(`Etihad Flight API running on port ${PORT}`);
});