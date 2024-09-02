module.exports = {
  duration: 60, // Duration of the test in seconds
  arrivalRate: 5, // Number of new users per second
  maxConnections: 10, // Maximum number of connections to keep open
  minConnections: 1, // Minimum number of connections to keep open
  p95ResponseTime: 2000 // 95th percentile of HTTP request duration in milliseconds
};