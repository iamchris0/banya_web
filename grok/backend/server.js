const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 2345;
const SECRET_KEY = 'your_secret_key'; // Use a secure key in production

app.use(cors());
app.use(bodyParser.json());

// Hardcoded admin user
const users = [
  { id: 1, username: 'admin', password: '123', role: 'admin' }
];

// In-memory storage for clients
let clients = [];

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: 'Token required' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Submit client information
app.post('/api/clients', authenticateToken, (req, res) => {
  const { name, date, serviceType, duration, notes } = req.body;
  if (!name || !date || !serviceType || !duration) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const client = {
    id: clients.length + 1,
    name,
    date,
    serviceType,
    duration,
    notes: notes || '',
    createdBy: req.user.username,
    isVerified: false
  };

  clients.push(client);
  res.json({ message: 'Client information submitted', clients });
});

// Get all clients
app.get('/api/clients', authenticateToken, (req, res) => {
  res.json({ clients });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});