import express from 'express';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const PORT = 2345;
const SECRET_KEY = 'your_secret_key'; // Use a secure key in production

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json());

// Hardcoded admin user
const users = [
  { id: 1, username: 'admin', password: '123', role: 'admin' },
  { id: 2, username: 'Ksenia Bobkova', password: '123', role: 'boss' },
  { id: 3, username: 'misha', password: '123', role: 'head' },
];

// In-memory storage for clients
let clients = [];

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
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

// Middleware to restrict to specific roles
const restrictToRoles = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
  }
  next();
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
app.post('/api/clients', authenticateToken, restrictToRoles(['admin']), (req, res) => {
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
    return res.status(400).json({ message: 'Missing required fields: Amount Of People or Date' });
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

// Update client information
app.put('/api/clients/:id', authenticateToken, restrictToRoles(['admin', 'head']), (req, res) => {
  const { id } = req.params;
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

  const clientIndex = clients.findIndex(client => client.id === Number(id));
  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  if (!amountOfPeople || !date) {
    return res.status(400).json({ message: 'Missing required fields: Amount Of People or Date' });
  }

  const wasVerified = clients[clientIndex].isVerified;
  const updatedClient = {
    ...clients[clientIndex],
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
    isVerified: req.user.role === 'admin' && wasVerified ? false : clients[clientIndex].isVerified, // Reset to false if admin updates a verified client
  };

  clients[clientIndex] = updatedClient;
  res.json({ message: 'Client information updated', client: updatedClient });
});

// Verify client information
app.patch('/api/clients/:id/verify', authenticateToken, restrictToRoles(['head']), (req, res) => {
  const { id } = req.params;
  const { isVerified } = req.body;

  const clientIndex = clients.findIndex(client => client.id === Number(id));
  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  if (typeof isVerified !== 'boolean') {
    return res.status(400).json({ message: 'Invalid isVerified value' });
  }

  clients[clientIndex].isVerified = isVerified;
  res.json({ message: 'Invoice verification status updated', client: clients[clientIndex] });
});

// Get all clients
app.get('/api/clients', authenticateToken, (req, res) => {
  const { verified } = req.query;
  let filteredClients = clients;

  if (verified === 'false') {
    filteredClients = clients.filter(client => !client.isVerified);
  } else if (verified === 'true') {
    filteredClients = clients.filter(client => client.isVerified);
  }

  res.json({ clients: filteredClients });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});