const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 2345;
const SECRET_KEY = 'your_secret_key'; // Use a secure key in production

app.use(cors({ origin: 'http://localhost:5173' }));
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
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Received token:', token);
  if (!token) return res.status(401).json({ message: 'Token required' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ message: 'Invalid token' });
    }
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
  const {
    amountOfPeople,
    male,
    female,
    otherGender,
    englishSpeaking,
    russianSpeaking,
    offPeakClients,
    peakTimeClients,
    newClients,
    soldVouchersAmount,
    soldVouchersTotal,
    soldMembershipsAmount,
    soldMembershipsTotal,
    yottaDepositsAmount,
    yottaDepositsTotal,
    yottaLinksAmount,
    yottaLinksTotal,
    date,
  } = req.body;

  if (!amountOfPeople || !date) {
    return res.status(400).json({ message: 'Missing required fields: amountOfPeople, date' });
  }

  const client = {
    id: clients.length + 1,
    amountOfPeople: Number(amountOfPeople) || 0,
    male: Number(male) || 0,
    female: Number(female) || 0,
    otherGender: Number(otherGender) || 0,
    englishSpeaking: Number(englishSpeaking) || 0,
    russianSpeaking: Number(russianSpeaking) || 0,
    offPeakClients: Number(offPeakClients) || 0,
    peakTimeClients: Number(peakTimeClients) || 0,
    newClients: Number(newClients) || 0,
    soldVouchersAmount: Number(soldVouchersAmount) || 0,
    soldVouchersTotal: Number(soldVouchersTotal) || 0,
    soldMembershipsAmount: Number(soldMembershipsAmount) || 0,
    soldMembershipsTotal: Number(soldMembershipsTotal) || 0,
    yottaDepositsAmount: Number(yottaDepositsAmount) || 0,
    yottaDepositsTotal: Number(yottaDepositsTotal) || 0,
    yottaLinksAmount: Number(yottaLinksAmount) || 0,
    yottaLinksTotal: Number(yottaLinksTotal) || 0,
    date,
    createdBy: req.user.username,
    isVerified: false,
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