import express from 'express';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';

const app = express();
const PORT = 2345;
const SECRET_KEY = 'your_secret_key'; // Use a secure key in production

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json());

// Hardcoded admin user
const users = [
  { id: 1, username: 'reception', password: '123', role: 'admin' },
  { id: 2, username: 'general operation', password: '123', role: 'head' },
  { id: 3, username: 'elena', password: '123', role: 'boss' },
  { id: 4, username: 'ksenia', password: '123', role: 'boss' },
];

// Roles:
// reception - daily data
// reporting - verify + financial data
// viewer - just to view

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
  res.json({ message: 'Client information submitted', client });
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
    isVerified: req.user.role === 'admin' && wasVerified ? false : clients[clientIndex].isVerified,
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

// In-memory storage for weekly data
let weeklyData = [];

// Submit or update weekly data
app.post('/api/weekly-data', authenticateToken, restrictToRoles(['boss']), (req, res) => {
  const {
    staffBonus,
    onDeskBonus,
    voucherSalesBonus,
    privateBookingBonus,
    preBookedValueNextWeek,
    preBookedPeopleNextWeek,
    date,
    createdBy,
  } = req.body;

  if (!date) {
    return res.status(400).json({ message: 'Missing required field: Date' });
  }

  // Normalize date to week start (Monday)
  const weekStart = new Date(date);
  const dayOfWeek = weekStart.getDay();
  const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  weekStart.setDate(diff);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const existingDataIndex = weeklyData.findIndex(item => item.date === weekStartStr);

  const data = {
    id: existingDataIndex === -1 ? weeklyData.length + 1 : weeklyData[existingDataIndex].id,
    staffBonus: Number(staffBonus) || 0,
    onDeskBonus: Number(onDeskBonus) || 0,
    voucherSalesBonus: Number(voucherSalesBonus) || 0,
    privateBookingBonus: Number(privateBookingBonus) || 0,
    preBookedValueNextWeek: Number(preBookedValueNextWeek) || 0,
    preBookedPeopleNextWeek: Number(preBookedPeopleNextWeek) || 0,
    date: weekStartStr,
    createdBy: createdBy || req.user.username,
    isVerified: false,
    status: existingDataIndex === -1 ? 'edited' : 'confirmed',
  };

  if (existingDataIndex === -1) {
    weeklyData.push(data);
  } else {
    weeklyData[existingDataIndex] = data;
  }

  res.json({ message: 'Weekly data submitted', weeklyData: data });
});

// Update weekly data
app.put('/api/weekly-data/:id', authenticateToken, restrictToRoles(['boss']), (req, res) => {
  const { id } = req.params;
  const {
    staffBonus,
    onDeskBonus,
    voucherSalesBonus,
    privateBookingBonus,
    preBookedValueNextWeek,
    preBookedPeopleNextWeek,
    date,
    createdBy,
  } = req.body;

  const dataIndex = weeklyData.findIndex(item => item.id === Number(id));
  if (dataIndex === -1) {
    return res.status(404).json({ message: 'Weekly data not found' });
  }

  if (!date) {
    return res.status(400).json({ message: 'Missing required field: Date' });
  }

  const weekStart = new Date(date);
  const dayOfWeek = weekStart.getDay();
  const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  weekStart.setDate(diff);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const updatedData = {
    ...weeklyData[dataIndex],
    staffBonus: Number(staffBonus) || 0,
    onDeskBonus: Number(onDeskBonus) || 0,
    voucherSalesBonus: Number(voucherSalesBonus) || 0,
    privateBookingBonus: Number(privateBookingBonus) || 0,
    preBookedValueNextWeek: Number(preBookedValueNextWeek) || 0,
    preBookedPeopleNextWeek: Number(preBookedPeopleNextWeek) || 0,
    date: weekStartStr,
    createdBy: createdBy || req.user.username,
    isVerified: false,
    status: 'edited',
  };

  weeklyData[dataIndex] = updatedData;
  res.json({ message: 'Weekly data updated', weeklyData: updatedData });
});

// Verify weekly data
app.patch('/api/weekly-data/:id/verify', authenticateToken, restrictToRoles(['boss']), (req, res) => {
  const { id } = req.params;
  const { isVerified, status } = req.body;

  const dataIndex = weeklyData.findIndex(item => item.id === Number(id));
  if (dataIndex === -1) {
    return res.status(404).json({ message: 'Weekly data not found' });
  }

  if (typeof isVerified !== 'boolean') {
    return res.status(400).json({ message: 'Invalid isVerified value' });
  }

  weeklyData[dataIndex].isVerified = isVerified;
  weeklyData[dataIndex].status = status || 'confirmed';
  res.json({ message: 'Weekly data verification status updated', weeklyData: weeklyData[dataIndex] });
});

// Get weekly data for a specific week
app.get('/api/weekly-data', authenticateToken, restrictToRoles(['boss']), (req, res) => {
  const { weekStart } = req.query;
  if (!weekStart) {
    return res.status(400).json({ message: 'Missing weekStart query parameter' });
  }

  const weekData = weeklyData.find(item => item.date === weekStart) || null;
  res.json({ weeklyData: weekData });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let activeUsers = 0;

wss.on('connection', function connection(ws) {
  activeUsers++;
  // Broadcast to all clients
  wss.clients.forEach(client => {
    if (client.readyState === ws.OPEN) {
      client.send(JSON.stringify({ activeUsers }));
    }
  });

  ws.on('close', function close() {
    activeUsers--;
    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        client.send(JSON.stringify({ activeUsers }));
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});