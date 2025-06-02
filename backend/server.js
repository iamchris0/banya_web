import express from 'express';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cors from 'cors';
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

// Track users per page
const usersByPage = new Map();

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
    onlineMembershipsAmount,
    onlineMembershipsTotal,
    offlineMembershipsAmount,
    offlineMembershipsTotal,
    onlineVouchersAmount,
    onlineVouchersTotal,
    paperVouchersAmount,
    paperVouchersTotal,
    yottaLinksAmount,
    yottaLinksTotal,
    yottaWidgetAmount,
    yottaWidgetTotal,
    dailyPreBooked,
    dailyPreBookedValue,
    treatments,
    bonuses,
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
    onlineMembershipsAmount: Number(onlineMembershipsAmount) || 0,
    onlineMembershipsTotal: Number(onlineMembershipsTotal) || 0,
    offlineMembershipsAmount: Number(offlineMembershipsAmount) || 0,
    offlineMembershipsTotal: Number(offlineMembershipsTotal) || 0,
    onlineVouchersAmount: Number(onlineVouchersAmount) || 0,
    onlineVouchersTotal: Number(onlineVouchersTotal) || 0,
    paperVouchersAmount: Number(paperVouchersAmount) || 0,
    paperVouchersTotal: Number(paperVouchersTotal) || 0,
    yottaLinksAmount: Number(yottaLinksAmount) || 0,
    yottaLinksTotal: Number(yottaLinksTotal) || 0,
    yottaWidgetAmount: Number(yottaWidgetAmount) || 0,
    yottaWidgetTotal: Number(yottaWidgetTotal) || 0,
    
    foodAndDrinkSales: 0,
    dailyPreBooked: dailyPreBooked || {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    },
    dailyPreBookedValue: dailyPreBookedValue || {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0
    },
    treatments: treatments || {
      entryOnly: { done: false, amount: 0 },
      parenie: { done: false, amount: 0 },
      aromaPark: { done: false, amount: 0 },
      iceWrap: { done: false, amount: 0 },
      scrub: { done: false, amount: 0 },
      mudMask: { done: false, amount: 0 },
      mudWrap: { done: false, amount: 0 },
      aloeVera: { done: false, amount: 0 },
      massage_25: { done: false, amount: 0 },
      massage_50: { done: false, amount: 0 }
    },
    bonuses: bonuses || {
      kitchenBonus: 0,
      ondeskSalesBonus: 0,
      miscBonus: 0,
      allPerformanceBonus: 0,
      vouchersSalesBonus: 0,
      membershipSalesBonus: 0,
      privateBookingsBonus: 0
    },
    date,
    createdBy: req.user.username,
    isVerified: false,
    status: {
      survey: 'edited',
      headData: 'edited'
    }
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
    onlineMembershipsAmount,
    onlineMembershipsTotal,
    offlineMembershipsAmount,
    offlineMembershipsTotal,
    onlineVouchersAmount,
    onlineVouchersTotal,
    paperVouchersAmount,
    paperVouchersTotal,
    yottaLinksAmount,
    yottaLinksTotal,
    yottaWidgetAmount,
    yottaWidgetTotal,
    foodAndDrinkSales,
    dailyPreBooked,
    dailyPreBookedValue,
    treatments,
    bonuses,
    date,
  } = req.body;

  const clientIndex = clients.findIndex(client => client.id === Number(id));
  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  if (!amountOfPeople || !date) {
    return res.status(400).json({ message: 'Missing required fields: Amount Of People or Date' });
  }

  // Determine which part was updated
  const isHeadDataUpdate = req.user.role === 'head' && 
    (foodAndDrinkSales !== undefined || treatments !== undefined);
  const isSurveyUpdate = req.user.role === 'admin' || 
    (req.user.role === 'head' && !isHeadDataUpdate);

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
    onlineMembershipsAmount: Number(onlineMembershipsAmount) || 0,
    onlineMembershipsTotal: Number(onlineMembershipsTotal) || 0,
    offlineMembershipsAmount: Number(offlineMembershipsAmount) || 0,
    offlineMembershipsTotal: Number(offlineMembershipsTotal) || 0,
    onlineVouchersAmount: Number(onlineVouchersAmount) || 0,
    onlineVouchersTotal: Number(onlineVouchersTotal) || 0,
    paperVouchersAmount: Number(paperVouchersAmount) || 0,
    paperVouchersTotal: Number(paperVouchersTotal) || 0,
    yottaLinksAmount: Number(yottaLinksAmount) || 0,
    yottaLinksTotal: Number(yottaLinksTotal) || 0,
    yottaWidgetAmount: Number(yottaWidgetAmount) || 0,
    yottaWidgetTotal: Number(yottaWidgetTotal) || 0,
    foodAndDrinkSales: Number(foodAndDrinkSales) || 0,
    dailyPreBooked: dailyPreBooked || clients[clientIndex].dailyPreBooked,
    dailyPreBookedValue: dailyPreBookedValue || clients[clientIndex].dailyPreBookedValue,
    treatments: treatments || clients[clientIndex].treatments,
    bonuses: bonuses || clients[clientIndex].bonuses,
    date,
    isVerified: false,
    status: {
      ...clients[clientIndex].status,
      survey: isSurveyUpdate ? 'edited' : clients[clientIndex].status.survey,
      headData: isHeadDataUpdate ? 'edited' : clients[clientIndex].status.headData
    }
  };

  clients[clientIndex] = updatedClient;
  res.json({ message: 'Client information updated', client: updatedClient });
});

// Verify client information
app.patch('/api/clients/:id/verify', authenticateToken, restrictToRoles(['head']), (req, res) => {
  const { id } = req.params;
  const { isVerified, verifyType } = req.body;

  const clientIndex = clients.findIndex(client => client.id === Number(id));
  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  if (typeof isVerified !== 'boolean') {
    return res.status(400).json({ message: 'Invalid isVerified value' });
  }

  if (!verifyType || !['survey', 'headData'].includes(verifyType)) {
    return res.status(400).json({ message: 'Invalid verifyType. Must be either "survey" or "headData"' });
  }

  clients[clientIndex].status[verifyType] = isVerified ? 'Confirmed' : 'edited';
  res.json({ message: 'Client verification status updated', client: clients[clientIndex] });
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
    dailyPreBooked,
    dailyPreBookedPeople,
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

  // Check if the week is more than 1 week ahead
  const today = new Date();
  const currentWeekStart = new Date(today);
  const currentDayOfWeek = today.getDay();
  const currentDiff = today.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1);
  currentWeekStart.setDate(currentDiff);
  
  const maxAllowedWeek = new Date(currentWeekStart);
  maxAllowedWeek.setDate(maxAllowedWeek.getDate() + 7);
  
  if (weekStart > maxAllowedWeek) {
    return res.status(400).json({ message: 'Cannot submit data for more than 1 week in advance' });
  }

  const existingDataIndex = weeklyData.findIndex(item => item.date === weekStartStr);

  const data = {
    id: existingDataIndex === -1 ? weeklyData.length + 1 : weeklyData[existingDataIndex].id,
    staffBonus: Number(staffBonus) || 0,
    onDeskBonus: Number(onDeskBonus) || 0,
    voucherSalesBonus: Number(voucherSalesBonus) || 0,
    privateBookingBonus: Number(privateBookingBonus) || 0,
    preBookedValueNextWeek: Number(preBookedValueNextWeek) || 0,
    preBookedPeopleNextWeek: Number(preBookedPeopleNextWeek) || 0,
    dailyPreBooked: dailyPreBooked || {},
    dailyPreBookedPeople: dailyPreBookedPeople || {},
    date: weekStartStr,
    createdBy: createdBy || req.user.username,
    isVerified: false,
    status: existingDataIndex === -1 ? 'edited' : 'Confirmed',
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
    dailyPreBooked,
    dailyPreBookedPeople,
    date,
    createdBy,
  } = req.body;

  const dataIndex = weeklyData.findIndex(item => item.id === parseInt(id));
  if (dataIndex === -1) {
    return res.status(404).json({ message: 'Weekly data not found' });
  }

  const updatedData = {
    ...weeklyData[dataIndex],
    staffBonus: Number(staffBonus) || 0,
    onDeskBonus: Number(onDeskBonus) || 0,
    voucherSalesBonus: Number(voucherSalesBonus) || 0,
    privateBookingBonus: Number(privateBookingBonus) || 0,
    preBookedValueNextWeek: Number(preBookedValueNextWeek) || 0,
    preBookedPeopleNextWeek: Number(preBookedPeopleNextWeek) || 0,
    dailyPreBooked: dailyPreBooked || {},
    dailyPreBookedPeople: dailyPreBookedPeople || {},
    date: date || weeklyData[dataIndex].date,
    createdBy: createdBy || weeklyData[dataIndex].createdBy,
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
  weeklyData[dataIndex].status = status || 'Confirmed';
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

// Get active users for a page
app.get('/api/active-users', authenticateToken, (req, res) => {
  const { page, username } = req.query;
  
  if (!page || !username) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  // Remove user from their previous page if they exist
  for (const [pageName, users] of usersByPage.entries()) {
    if (users.has(username)) {
      users.delete(username);
      // If no users left on the page, remove the page entry
      if (users.size === 0) {
        usersByPage.delete(pageName);
      }
    }
  }

  // Add user to their new page
  if (!usersByPage.has(page)) {
    usersByPage.set(page, new Set());
  }
  usersByPage.get(page).add(username);

  // Return users for the current page
  const pageUsers = usersByPage.get(page) || new Set();
  res.json({
    activeUsers: Array.from(pageUsers),
    count: pageUsers.size
  });
});

// Get aggregated weekly data
app.get('/api/clients/weekly-summary', authenticateToken, (req, res) => {
  const { weekStart } = req.query;
  if (!weekStart) {
    return res.status(400).json({ message: 'Missing weekStart query parameter' });
  }

  // Convert weekStart to Date object
  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // Add 6 days to get the end of the week

  // Filter clients for the specified week
  const weekClients = clients.filter(client => {
    const clientDate = new Date(client.date);
    return clientDate >= startDate && clientDate <= endDate;
  });

  // Aggregate the data
  const summary = {
    totalVisitors: weekClients.reduce((sum, client) => sum + (client.amountOfPeople || 0), 0),
    totalMale: weekClients.reduce((sum, client) => sum + (client.male || 0), 0),
    totalFemale: weekClients.reduce((sum, client) => sum + (client.female || 0), 0),
    totalNewClients: weekClients.reduce((sum, client) => sum + (client.newClients || 0), 0),
    totalEnglishSpeaking: weekClients.reduce((sum, client) => sum + (client.englishSpeaking || 0), 0),
    totalRussianSpeaking: weekClients.reduce((sum, client) => sum + (client.russianSpeaking || 0), 0),
    totalOffPeak: weekClients.reduce((sum, client) => sum + (client.offPeakClients || 0), 0),
    totalPeakTime: weekClients.reduce((sum, client) => sum + (client.peakTimeClients || 0), 0),
    
    // Sales totals
    totalOnlineMemberships: {
      amount: weekClients.reduce((sum, client) => sum + (client.onlineMembershipsAmount || 0), 0),
      value: weekClients.reduce((sum, client) => sum + (client.onlineMembershipsTotal || 0), 0)
    },
    totalOfflineMemberships: {
      amount: weekClients.reduce((sum, client) => sum + (client.offlineMembershipsAmount || 0), 0),
      value: weekClients.reduce((sum, client) => sum + (client.offlineMembershipsTotal || 0), 0)
    },
    totalOnlineVouchers: {
      amount: weekClients.reduce((sum, client) => sum + (client.onlineVouchersAmount || 0), 0),
      value: weekClients.reduce((sum, client) => sum + (client.onlineVouchersTotal || 0), 0)
    },
    totalPaperVouchers: {
      amount: weekClients.reduce((sum, client) => sum + (client.paperVouchersAmount || 0), 0),
      value: weekClients.reduce((sum, client) => sum + (client.paperVouchersTotal || 0), 0)
    },
    
    // Transaction totals
    totalYottaLinks: {
      amount: weekClients.reduce((sum, client) => sum + (client.yottaLinksAmount || 0), 0),
      value: weekClients.reduce((sum, client) => sum + (client.yottaLinksTotal || 0), 0)
    },
    totalYottaWidget: {
      amount: weekClients.reduce((sum, client) => sum + (client.yottaWidgetAmount || 0), 0),
      value: weekClients.reduce((sum, client) => sum + (client.yottaWidgetTotal || 0), 0)
    },
    
    // Food and drink sales
    totalFoodAndDrink: weekClients.reduce((sum, client) => sum + (client.foodAndDrinkSales || 0), 0),
    
    // Treatments summary
    treatments: {
      entryOnly: weekClients.reduce((sum, client) => sum + ((client.treatments?.entryOnly?.amount || 0) * (client.treatments?.entryOnly?.done ? 1 : 0)), 0),
      parenie: weekClients.reduce((sum, client) => sum + ((client.treatments?.parenie?.amount || 0) * (client.treatments?.parenie?.done ? 1 : 0)), 0),
      aromaPark: weekClients.reduce((sum, client) => sum + ((client.treatments?.aromaPark?.amount || 0) * (client.treatments?.aromaPark?.done ? 1 : 0)), 0),
      iceWrap: weekClients.reduce((sum, client) => sum + ((client.treatments?.iceWrap?.amount || 0) * (client.treatments?.iceWrap?.done ? 1 : 0)), 0),
      scrub: weekClients.reduce((sum, client) => sum + ((client.treatments?.scrub?.amount || 0) * (client.treatments?.scrub?.done ? 1 : 0)), 0),
      mudMask: weekClients.reduce((sum, client) => sum + ((client.treatments?.mudMask?.amount || 0) * (client.treatments?.mudMask?.done ? 1 : 0)), 0),
      mudWrap: weekClients.reduce((sum, client) => sum + ((client.treatments?.mudWrap?.amount || 0) * (client.treatments?.mudWrap?.done ? 1 : 0)), 0),
      aloeVera: weekClients.reduce((sum, client) => sum + ((client.treatments?.aloeVera?.amount || 0) * (client.treatments?.aloeVera?.done ? 1 : 0)), 0),
      massage_25: weekClients.reduce((sum, client) => sum + ((client.treatments?.massage_25?.amount || 0) * (client.treatments?.massage_25?.done ? 1 : 0)), 0),
      massage_50: weekClients.reduce((sum, client) => sum + ((client.treatments?.massage_50?.amount || 0) * (client.treatments?.massage_50?.done ? 1 : 0)), 0)
    }
  };

  res.json({ summary });
});

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});