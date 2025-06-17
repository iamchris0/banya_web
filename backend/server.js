import express from 'express';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import xlsx from 'xlsx';
import { startOfWeek } from 'date-fns';

const app = express();
const PORT = 2345;
const SECRET_KEY = 'your_secret_key'; // Use a secure key in production

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(bodyParser.json());

// Hardcoded admin user
const users = [
  { id: 1, username: 'admin', password: '123', role: 'admin' },
  { id: 2, username: 'irina', password: '123', role: 'head' },
  { id: 3, username: 'elena', password: '123', role: 'head' },
  { id: 4, username: 'ksenia', password: '123', role: 'boss' },
];

// Roles:
// reception - daily data
// reporting - verify + financial data
// viewer - just to view

// In-memory storage for clients with persistence
let clients = [];
let headDailyData = {};
let headWeeklyData = {};

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
    date,
  } = req.body;

  if (!amountOfPeople || !date) {
    return res.status(400).json({ message: 'Missing required fields: Amount Of People or Date' });
  }

  // Validate gender distribution
  const totalGender = Number(male || 0) + Number(female || 0) + Number(otherGender || 0);
  if (totalGender !== Number(amountOfPeople)) {
    return res.status(400).json({ message: 'Sum of gender counts must equal total number of people' });
  }

  // Validate language distribution
  const totalLanguage = Number(englishSpeaking || 0) + Number(russianSpeaking || 0);
  if (totalLanguage > Number(amountOfPeople)) {
    return res.status(400).json({ message: 'Total language speakers cannot exceed total number of people' });
  }

  // Validate timing distribution
  const totalTiming = Number(offPeakClients || 0) + Number(peakTimeClients || 0);
  if (totalTiming !== Number(amountOfPeople)) {
    return res.status(400).json({ message: 'Sum of timing distribution must equal total number of people' });
  }

  // Validate new clients
  if (Number(newClients || 0) > Number(amountOfPeople)) {
    return res.status(400).json({ message: 'Number of new clients cannot exceed total number of people' });
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
    date,
    createdBy: req.user.username,
    isVerified: false,
    status: 'Edited'
  };

  clients.push(client);
  return res.json({ message: 'Client information submitted', client });
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
    date,
  } = req.body;

  const clientIndex = clients.findIndex(client => client.id === Number(id));
  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Invoice not found' });
  }

  if (!amountOfPeople || !date) {
    return res.status(400).json({ message: 'Missing required fields: Amount Of People or Date' });
  }

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
    date,
    isVerified: false,
    status: 'Edited',
  };

  clients[clientIndex] = updatedClient;
  return res.json({ message: 'Client information updated', client: updatedClient });
});

// Verify client information (Receipt Data)
app.patch('/api/clients/:id/verify', authenticateToken, restrictToRoles(['head']), (req, res) => {
  const { id } = req.params;
  const { isVerified } = req.body;

  const clientIndex = clients.findIndex(client => client.id === Number(id));
  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Client not found' });
  }

  if (typeof isVerified !== 'boolean') {
    return res.status(400).json({ message: 'Invalid isVerified value' });
  }

  // Update the survey status to Confirmed
  clients[clientIndex].status = isVerified ? 'Confirmed' : 'Edited';
  return res.json({ message: 'Client verification status updated', client: clients[clientIndex] });
});

// Get all clients
app.get('/api/clients', authenticateToken, (req, res) => {
  const { date, verified } = req.query;
  let filteredClients = clients;

  if (verified === 'false') filteredClients = clients.filter(client => !client.isVerified);
  else if (verified === 'true') filteredClients = clients.filter(client => client.isVerified);

  if (date) {
    filteredClients = filteredClients.filter(client => client.date === date);
  }

  return res.json({ clients: filteredClients });
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
app.get('/api/weekly-summary', authenticateToken, (req, res) => {
  const { weekStart } = req.query;
  if (!weekStart) {
    return res.status(400).json({ message: 'Missing weekStart query parameter' });
  }

  // Convert weekStart to Date object and set time to midnight UTC
  const startDate = new Date(weekStart);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 6); // Add 6 days to get the end of the week
  endDate.setUTCHours(23, 59, 59, 999); // Set to end of day

  // Filter clients and head data for the specified week
  const weekClients = clients.filter(client => {
    const clientDate = new Date(client.date);
    clientDate.setUTCHours(0, 0, 0, 0);
    return clientDate >= startDate && clientDate <= endDate;
  });

  // Filter daily head data for the specified week
  const dailyHeadData = Object.entries(headDailyData)
    .filter(([date]) => {
      const dataDate = new Date(date);
      dataDate.setUTCHours(0, 0, 0, 0);
      return dataDate >= startDate && dataDate <= endDate;
    })
    .map(([_, data]) => data);

  
  // Create a map for daily data
  const dailyData = {};
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setUTCDate(currentDate.getUTCDate() + i);
    currentDate.setUTCHours(0, 0, 0, 0);
    const formattedDate = formatDate(currentDate);
    
    // Filter clients and head data for this specific day
    const dayClients = weekClients.filter(client => {
      const clientDate = new Date(client.date);
      clientDate.setUTCHours(0, 0, 0, 0);
      return clientDate.getTime() === currentDate.getTime();
    });

    const dayHeadData = dailyHeadData.filter(data => {
      const dataDate = new Date(data.date);
      dataDate.setUTCHours(0, 0, 0, 0);
      return dataDate.getTime() === currentDate.getTime();
    });

    dailyData[formattedDate] = {
      visitors: dayClients.reduce((sum, client) => sum + (client.amountOfPeople || 0), 0),
      newClients: dayClients.reduce((sum, client) => sum + (client.newClients || 0), 0),
      male: dayClients.reduce((sum, client) => sum + (client.male || 0), 0),
      female: dayClients.reduce((sum, client) => sum + (client.female || 0), 0),
      englishSpeaking: dayClients.reduce((sum, client) => sum + (client.englishSpeaking || 0), 0),
      russianSpeaking: dayClients.reduce((sum, client) => sum + (client.russianSpeaking || 0), 0),
      offPeak: dayClients.reduce((sum, client) => sum + (client.offPeakClients || 0), 0),
      peakTime: dayClients.reduce((sum, client) => sum + (client.peakTimeClients || 0), 0),
      onlineMemberships: {
        amount: dayClients.reduce((sum, client) => sum + (client.onlineMembershipsAmount || 0), 0),
        value: dayClients.reduce((sum, client) => sum + (client.onlineMembershipsTotal || 0), 0)
      },
      offlineMemberships: {
        amount: dayClients.reduce((sum, client) => sum + (client.offlineMembershipsAmount || 0), 0),
        value: dayClients.reduce((sum, client) => sum + (client.offlineMembershipsTotal || 0), 0)
      },
      onlineVouchers: {
        amount: dayClients.reduce((sum, client) => sum + (client.onlineVouchersAmount || 0), 0),
        value: dayClients.reduce((sum, client) => sum + (client.onlineVouchersTotal || 0), 0)
      },
      paperVouchers: {
        amount: dayClients.reduce((sum, client) => sum + (client.paperVouchersAmount || 0), 0),
        value: dayClients.reduce((sum, client) => sum + (client.paperVouchersTotal || 0), 0)
      },
      yottaLinks: {
        amount: dayClients.reduce((sum, client) => sum + (client.yottaLinksAmount || 0), 0),
        value: dayClients.reduce((sum, client) => sum + (client.yottaLinksTotal || 0), 0)
      },
      yottaWidget: {
        amount: dayClients.reduce((sum, client) => sum + (client.yottaWidgetAmount || 0), 0),
        value: dayClients.reduce((sum, client) => sum + (client.yottaWidgetTotal || 0), 0)
      },
      foodAndDrink: dayHeadData.reduce((sum, data) => sum + (data.foodAndDrinkSales || 0), 0),
      treatments: {
        entryOnly: { 
          value: dayHeadData.reduce((sum, data) => sum + ((data.treatments?.entryOnly?.amount || 0) * (data.treatments?.entryOnly?.done ? 1 : 0)), 0)
        },
        parenie: { 
          value: dayHeadData.reduce((sum, data) => sum + ((data.treatments?.parenie?.amount || 0) * (data.treatments?.parenie?.done ? 1 : 0)), 0)
        },
        aromaPark: { 
          value: dayHeadData.reduce((sum, data) => sum + ((data.treatments?.aromaPark?.amount || 0) * (data.treatments?.aromaPark?.done ? 1 : 0)), 0)
        },
        iceWrap: { 
          value: dayHeadData.reduce((sum, data) => sum + ((data.treatments?.iceWrap?.amount || 0) * (data.treatments?.iceWrap?.done ? 1 : 0)), 0)
        },
        scrub: { 
          value: dayHeadData.reduce((sum, data) => sum + ((data.treatments?.scrub?.amount || 0) * (data.treatments?.scrub?.done ? 1 : 0)), 0)
        },
        mudMask: { 
          value: dayHeadData.reduce((sum, data) => sum + ((data.treatments?.mudMask?.amount || 0) * (data.treatments?.mudMask?.done ? 1 : 0)), 0)
        },
        mudWrap: { 
          value: dayHeadData.reduce((sum, data) => sum + ((data.treatments?.mudWrap?.amount || 0) * (data.treatments?.mudWrap?.done ? 1 : 0)), 0)
        },
        aloeVera: { 
          value: dayHeadData.reduce((sum, data) => sum + ((data.treatments?.aloeVera?.amount || 0) * (data.treatments?.aloeVera?.done ? 1 : 0)), 0)
        },
        massage_25: { 
          value: dayHeadData.reduce((sum, data) => sum + ((data.treatments?.massage_25?.amount || 0) * (data.treatments?.massage_25?.done ? 1 : 0)), 0)
        },
        massage_50: { 
          value: dayHeadData.reduce((sum, data) => sum + ((data.treatments?.massage_50?.amount || 0) * (data.treatments?.massage_50?.done ? 1 : 0)), 0)
        }
      }
    };
  }

  // Aggregate the data for weekly totals
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
    totalFoodAndDrink: dailyHeadData.reduce((sum, data) => sum + (data.foodAndDrinkSales || 0), 0),
    
    // Treatments summary
    treatments: {
      entryOnly: { 
        value: dailyHeadData.reduce((sum, data) => sum + ((data.treatments?.entryOnly?.amount || 0) * (data.treatments?.entryOnly?.done ? 1 : 0)), 0)
      },
      parenie: { 
        value: dailyHeadData.reduce((sum, data) => sum + ((data.treatments?.parenie?.amount || 0) * (data.treatments?.parenie?.done ? 1 : 0)), 0)
      },
      aromaPark: { 
        value: dailyHeadData.reduce((sum, data) => sum + ((data.treatments?.aromaPark?.amount || 0) * (data.treatments?.aromaPark?.done ? 1 : 0)), 0)
      },
      iceWrap: { 
        value: dailyHeadData.reduce((sum, data) => sum + ((data.treatments?.iceWrap?.amount || 0) * (data.treatments?.iceWrap?.done ? 1 : 0)), 0)
      },
      scrub: { 
        value: dailyHeadData.reduce((sum, data) => sum + ((data.treatments?.scrub?.amount || 0) * (data.treatments?.scrub?.done ? 1 : 0)), 0)
      },
      mudMask: { 
        value: dailyHeadData.reduce((sum, data) => sum + ((data.treatments?.mudMask?.amount || 0) * (data.treatments?.mudMask?.done ? 1 : 0)), 0)
      },
      mudWrap: { 
        value: dailyHeadData.reduce((sum, data) => sum + ((data.treatments?.mudWrap?.amount || 0) * (data.treatments?.mudWrap?.done ? 1 : 0)), 0)
      },
      aloeVera: { 
        value: dailyHeadData.reduce((sum, data) => sum + ((data.treatments?.aloeVera?.amount || 0) * (data.treatments?.aloeVera?.done ? 1 : 0)), 0)
      },
      massage_25: { 
        value: dailyHeadData.reduce((sum, data) => sum + ((data.treatments?.massage_25?.amount || 0) * (data.treatments?.massage_25?.done ? 1 : 0)), 0)
      },
      massage_50: { 
        value: dailyHeadData.reduce((sum, data) => sum + ((data.treatments?.massage_50?.amount || 0) * (data.treatments?.massage_50?.done ? 1 : 0)), 0)
      }
    }
  };

  res.json({ summary });
});

// Get head data for a specific date
app.get('/api/head-daily-data', authenticateToken, (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Missing date query parameter' });
  }

  // Find existing data
  const selectedReceiptData = clients.find(item => item.date === date);
  const selectedHeadData = headDailyData[date];
  
  return res.json({ 
    headData: selectedHeadData || null, 
    receiptData: selectedReceiptData || null 
  });
});

// Verify head data (F&B Sales + Treatments)
app.post('/api/head-daily-data', authenticateToken, restrictToRoles(['head']), (req, res) => {
  const { date, newDailyData } = req.body;
  const existingData = headDailyData[date];
  
  if (!existingData) {
    headDailyData[date] = {
      ...newDailyData,
      status: 'Confirmed'
    };
    
    return res.json({ message: 'New head data added', headDailyData: headDailyData[date] });
  } else {
    // Record found, update the existing entry
    const updatedData = {
      ...newDailyData,
      status: 'Confirmed'
    };
    headDailyData[date] = updatedData;
    
    return res.json({ message: 'Existing head data updated', headDailyData: updatedData });
  }
});

app.get('/api/head-weekly-data', authenticateToken, (req, res) => {
  const { weekStart } = req.query;

  if (!headWeeklyData[weekStart]) {
    headWeeklyData[weekStart] = {
      preBookedData: {
        status: 'Pending'
      },
      bonuses: {
        status: 'Pending'
      },
      otherCosts: {
        status: 'Pending'
      }
    };
  }

  return res.json({ headWeeklyData: headWeeklyData[weekStart] });
});

app.post('/api/head-weekly-data', authenticateToken, restrictToRoles(['head']), async (req, res) => {
  try {
    const { date, section, newWeeklyData } = req.body;
    
    // Get existing data or initialize new entry
    const existingData = headWeeklyData[date] || {
      preBookedData: {},
      bonuses: {},
      otherCosts: {}
    };
    
    // Update only the specified section
    switch (section) {
      case 'preBookedData':
        existingData.preBookedData = newWeeklyData.preBookedData;
        existingData.preBookedData.status = 'Confirmed';
        break;
      case 'bonuses':
        existingData.bonuses = newWeeklyData.bonuses;
        existingData.bonuses.status = 'Confirmed';
        break;
      case 'otherCosts':
        existingData.otherCosts = newWeeklyData.otherCosts;
        existingData.otherCosts.status = 'Confirmed';
        break;
    }
    
    // Update status and save to dictionary
    headWeeklyData[date] = existingData;

    res.json({ 
      success: true, 
      headWeeklyData: headWeeklyData[date]
    });
  } catch (error) {
    console.error('Error updating weekly data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update weekly data' 
    });
  }
});

// Download weekly Excel report endpoint
app.get('/api/download-weekly-excel', authenticateToken, async (req, res) => {
  try {
    const { weekStart } = req.query;

    const weekEndDate = new Date(weekStart);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    const summaryData = {};
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(currentDate.getDate() + i);
      currentDate.setUTCHours(0, 0, 0, 0);
      const formattedDate = formatDate(currentDate);
      
      // Get data for the current day from headDailyData
      const clientsDaily = clients.find(client => client.date === formattedDate) || {};
      const headDaily = headDailyData[formattedDate] || {};
      
      // Only include data with Confirmed status
      if (clientsDaily.status === 'Confirmed') {
        summaryData[formattedDate] = {
          totalVisitors: clientsDaily.amountOfPeople || 0,
          totalNewClients: clientsDaily.newClients || 0,

          totalMale: clientsDaily.male || 0,
          totalFemale: clientsDaily.female || 0,

          totalEnglishSpeaking: clientsDaily.englishSpeaking || 0,
          totalRussianSpeaking: clientsDaily.russianSpeaking || 0,

          totalOffPeak: clientsDaily.offPeakClients || 0,
          totalPeakTime: clientsDaily.peakTimeClients || 0,

          totalOnlineMemberships: {
            amount: clientsDaily.onlineMembershipsAmount || 0,
            value: clientsDaily.onlineMembershipsTotal || 0
          },
          totalOfflineMemberships: {
            amount: clientsDaily.offlineMembershipsAmount || 0,
            value: clientsDaily.offlineMembershipsTotal || 0
          },
          totalOnlineVouchers: {
            amount: clientsDaily.onlineVouchersAmount || 0,
            value: clientsDaily.onlineVouchersTotal || 0
          },
          totalPaperVouchers: {
            amount: clientsDaily.paperVouchersAmount || 0,
            value: clientsDaily.paperVouchersTotal || 0
          },
          totalYottaLinks: {
            amount: clientsDaily.yottaLinksAmount || 0,
            value: clientsDaily.yottaLinksTotal || 0
          },
          totalYottaWidget: {
            amount: clientsDaily.yottaWidgetAmount || 0,
            value: clientsDaily.yottaWidgetTotal || 0
          }
        };
      }

      if (headDaily.status === 'Confirmed') {
        summaryData[formattedDate].treatments = headDaily.treatments;
        summaryData[formattedDate].foodAndDrinkSales = headDaily.foodAndDrinkSales;
      }
    }

    // Add confirmed headWeeklyData to summary
    const weeklyData = headWeeklyData[weekStart] || {};

    if (weeklyData.bonuses?.status === 'Confirmed') {
      summaryData.bonuses = weeklyData.bonuses;
    }
    if (weeklyData.otherCosts?.status === 'Confirmed') {
      summaryData.otherCosts = weeklyData.otherCosts;
    }

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    
    // Prepare the data for Excel
    const excelData = Object.entries(summaryData)
      .filter(([key]) => key !== 'bonuses' && key !== 'otherCosts')
      .map(([date, data]) => {
        return {
          'Date': new Date(date.split('.').reverse().join('-')).toLocaleDateString(),
          'Total Visitors': data.totalVisitors || 0,
          'Total Male': data.totalMale || 0,
          'Total Female': data.totalFemale || 0,
          'Total New Clients': data.totalNewClients || 0,
          'Total English Speaking': data.totalEnglishSpeaking || 0,
          'Total Russian Speaking': data.totalRussianSpeaking || 0,
          'Total Off Peak': data.totalOffPeak || 0,
          'Total Peak Time': data.totalPeakTime || 0,
          'Food & Drink Sales': data.foodAndDrinkSales || 0,
          'Entry Only': data.treatments?.entryOnly?.amount || 0,
          'Parenie': data.treatments?.parenie?.amount || 0,
          'Aroma Park': data.treatments?.aromaPark?.amount || 0,
          'Ice Wrap': data.treatments?.iceWrap?.amount || 0,
          'Scrub': data.treatments?.scrub?.amount || 0,
          'Mud Mask': data.treatments?.mudMask?.amount || 0,
          'Mud Wrap': data.treatments?.mudWrap?.amount || 0,
          'Aloe Vera': data.treatments?.aloeVera?.amount || 0,
          'Massage 25': data.treatments?.massage_25?.amount || 0,
          'Massage 50': data.treatments?.massage_50?.amount || 0,
          'Total Treatments': Object.values(data.treatments || {}).reduce((sum, treatment) => 
            sum + (treatment.amount || 0), 0
          ),
          'Online Memberships Amount': data.totalOnlineMemberships?.amount || 0,
          'Online Memberships Value': data.totalOnlineMemberships?.value || 0,
          'Offline Memberships Amount': data.totalOfflineMemberships?.amount || 0,
          'Offline Memberships Value': data.totalOfflineMemberships?.value || 0,
          'Online Vouchers Amount': data.totalOnlineVouchers?.amount || 0,
          'Online Vouchers Value': data.totalOnlineVouchers?.value || 0,
          'Paper Vouchers Amount': data.totalPaperVouchers?.amount || 0,
          'Paper Vouchers Value': data.totalPaperVouchers?.value || 0,
          'Yotta Links Amount': data.totalYottaLinks?.amount || 0,
          'Yotta Links Value': data.totalYottaLinks?.value || 0,
          'Yotta Widget Amount': data.totalYottaWidget?.amount || 0,
          'Yotta Widget Value': data.totalYottaWidget?.value || 0,
          'F&B + Treatments Total': (data.foodAndDrinkSales || 0) + 
            Object.values(data.treatments || {}).reduce((sum, treatment) => 
              sum + (treatment.amount || 0), 0
            )
        };
      });

    // Add totals row
    const totals = {
      'Date': 'TOTAL',
      'Total Visitors': excelData.reduce((sum, row) => sum + row['Total Visitors'], 0),
      'Total Male': excelData.reduce((sum, row) => sum + row['Total Male'], 0),
      'Total Female': excelData.reduce((sum, row) => sum + row['Total Female'], 0),
      'Total New Clients': excelData.reduce((sum, row) => sum + row['Total New Clients'], 0),
      'Total English Speaking': excelData.reduce((sum, row) => sum + row['Total English Speaking'], 0),
      'Total Russian Speaking': excelData.reduce((sum, row) => sum + row['Total Russian Speaking'], 0),
      'Total Off Peak': excelData.reduce((sum, row) => sum + row['Total Off Peak'], 0),
      'Total Peak Time': excelData.reduce((sum, row) => sum + row['Total Peak Time'], 0),
      'Food & Drink Sales': excelData.reduce((sum, row) => sum + row['Food & Drink Sales'], 0),
      'Entry Only': excelData.reduce((sum, row) => sum + row['Entry Only'], 0),
      'Parenie': excelData.reduce((sum, row) => sum + row['Parenie'], 0),
      'Aroma Park': excelData.reduce((sum, row) => sum + row['Aroma Park'], 0),
      'Ice Wrap': excelData.reduce((sum, row) => sum + row['Ice Wrap'], 0),
      'Scrub': excelData.reduce((sum, row) => sum + row['Scrub'], 0),
      'Mud Mask': excelData.reduce((sum, row) => sum + row['Mud Mask'], 0),
      'Mud Wrap': excelData.reduce((sum, row) => sum + row['Mud Wrap'], 0),
      'Aloe Vera': excelData.reduce((sum, row) => sum + row['Aloe Vera'], 0),
      'Massage 25': excelData.reduce((sum, row) => sum + row['Massage 25'], 0),
      'Massage 50': excelData.reduce((sum, row) => sum + row['Massage 50'], 0),
      'Total Treatments': excelData.reduce((sum, row) => sum + row['Total Treatments'], 0),
      'F&B + Treatments Total': excelData.reduce((sum, row) => sum + row['F&B + Treatments Total'], 0),
      'Online Memberships Amount': excelData.reduce((sum, row) => sum + row['Online Memberships Amount'], 0),
      'Online Memberships Value': excelData.reduce((sum, row) => sum + row['Online Memberships Value'], 0),
      'Offline Memberships Amount': excelData.reduce((sum, row) => sum + row['Offline Memberships Amount'], 0),
      'Offline Memberships Value': excelData.reduce((sum, row) => sum + row['Offline Memberships Value'], 0),
      'Online Vouchers Amount': excelData.reduce((sum, row) => sum + row['Online Vouchers Amount'], 0),
      'Online Vouchers Value': excelData.reduce((sum, row) => sum + row['Online Vouchers Value'], 0),
      'Paper Vouchers Amount': excelData.reduce((sum, row) => sum + row['Paper Vouchers Amount'], 0),
      'Paper Vouchers Value': excelData.reduce((sum, row) => sum + row['Paper Vouchers Value'], 0),
      'Yotta Links Amount': excelData.reduce((sum, row) => sum + row['Yotta Links Amount'], 0),
      'Yotta Links Value': excelData.reduce((sum, row) => sum + row['Yotta Links Value'], 0),
      'Yotta Widget Amount': excelData.reduce((sum, row) => sum + row['Yotta Widget Amount'], 0),
      'Yotta Widget Value': excelData.reduce((sum, row) => sum + row['Yotta Widget Value'], 0),
      'Bonuses': excelData.reduce((sum, row) => sum + row['Bonuses'], 0),
      'Other Costs': excelData.reduce((sum, row) => sum + row['Other Costs'], 0)
    };
    excelData.push(totals);

    // Create worksheet
    const worksheet = xlsx.utils.json_to_sheet(excelData);

    // Set column widths
    const columnWidths = {
      'A': 15,  // Date
      'B': 15,  // Total Visitors
      'C': 15,  // Total Male
      'D': 15,  // Total Female
      'E': 15,  // Total New Clients
      'F': 20,  // Total English Speaking
      'G': 20,  // Total Russian Speaking
      'H': 15,  // Total Off Peak
      'I': 15,  // Total Peak Time
      'J': 20,  // Food & Drink Sales
      'K': 15,  // Entry Only
      'L': 15,  // Parenie
      'M': 15,  // Aroma Park
      'N': 15,  // Ice Wrap
      'O': 15,  // Scrub
      'P': 15,  // Mud Mask
      'Q': 15,  // Mud Wrap
      'R': 15,  // Aloe Vera
      'S': 15,  // Massage 25
      'T': 15,  // Massage 50
      'U': 20,  // Total Treatments
      'AH': 25, // F&B + Treatments Total
      'V': 20,  // Online Memberships Amount
      'W': 20,  // Online Memberships Value
      'X': 20,  // Offline Memberships Amount
      'Y': 20,  // Offline Memberships Value
      'Z': 20,  // Online Vouchers Amount
      'AA': 20, // Online Vouchers Value
      'AB': 20, // Paper Vouchers Amount
      'AC': 20, // Paper Vouchers Value
      'AD': 20, // Yotta Links Amount
      'AE': 20, // Yotta Links Value
      'AF': 20, // Yotta Widget Amount
      'AG': 20, // Yotta Widget Value
      'AI': 20, // Bonuses
      'AJ': 20  // Other Costs
    };
    worksheet['!cols'] = Object.values(columnWidths).map(width => ({ width }));

    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Weekly Report');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=weekly_report_${weekStart}.xlsx`);

    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error('Error generating Excel file:', error);
    res.status(500).json({ message: 'Error generating Excel file' });
  }
});

app.get('/api/dashboard-data', authenticateToken, async (req, res) => {
  const { timeFilter, selectedDate, periodStart, periodEnd } = req.query;
  
  if (timeFilter === 'day') {
    const clientData = clients.find(client => client.date === selectedDate) || {};
    const headDaily = headDailyData[selectedDate];
    const dayIndex = new Date(selectedDate).getDay();
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const prebooked = headWeeklyData[weekStart]?.preBookedData?.dailyPreBookedPeople?.[getDayName(dayIndex)] || 0;
    const dailyData = {
      totalVisitors: clientData.amountOfPeople || 0,
      totalNewClients: clientData.newClients || 0,
      totalMale: clientData.male || 0,
      totalFemale: clientData.female || 0,
      totalEnglishSpeaking: clientData.englishSpeaking || 0,
      totalRussianSpeaking: clientData.russianSpeaking || 0,
      totalOffPeak: clientData.offPeakClients || 0,
      totalPeakTime: clientData.peakTimeClients || 0,
      totalOnlineMemberships: {
        amount: clientData.onlineMembershipsAmount || 0,
        value: clientData.onlineMembershipsTotal || 0
      },
      totalOfflineMemberships: {
        amount: clientData.offlineMembershipsAmount || 0,
        value: clientData.offlineMembershipsTotal || 0
      },
      totalOnlineVouchers: {
        amount: clientData.onlineVouchersAmount || 0,
        value: clientData.onlineVouchersTotal || 0
      },
      totalPaperVouchers: {
        amount: clientData.paperVouchersAmount || 0,
        value: clientData.paperVouchersTotal || 0
      },
      totalYottaLinks: {
        amount: clientData.yottaLinksAmount || 0,
        value: clientData.yottaLinksTotal || 0
      },
      totalYottaWidget: {
        amount: clientData.yottaWidgetAmount || 0,
        value: clientData.yottaWidgetTotal || 0
      },
      totalFoodAndDrinkSales: headDaily.foodAndDrinkSales || 0,
      totalTreatments: headDaily.treatments || 0,
      prebooked: prebooked
    }
    return res.json({ dailyData });
  } else if (timeFilter === 'week') {
    const weeklyDashboardData = {};
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(selectedDate);
      currentDate.setDate(currentDate.getDate() + i);
      currentDate.setUTCHours(0, 0, 0, 0);
      const formattedDate = formatDate(currentDate);
      const clientsDaily = clients.find(client => client.date === formattedDate) || {};
      const headDaily = headDailyData[formattedDate] || {};
      weeklyDashboardData[formattedDate] = {
        totalVisitors: clientsDaily.amountOfPeople || 0,
        totalNewClients: clientsDaily.newClients || 0,
        totalMale: clientsDaily.male || 0,
        totalFemale: clientsDaily.female || 0,
        totalEnglishSpeaking: clientsDaily.englishSpeaking || 0,
        totalRussianSpeaking: clientsDaily.russianSpeaking || 0,
        totalOffPeak: clientsDaily.offPeakClients || 0,
        totalPeakTime: clientsDaily.peakTimeClients || 0,
        totalOnlineMemberships: {
          amount: clientsDaily.onlineMembershipsAmount || 0,
          value: clientsDaily.onlineMembershipsTotal || 0
        },
        totalOfflineMemberships: {
          amount: clientsDaily.offlineMembershipsAmount || 0,
          value: clientsDaily.offlineMembershipsTotal || 0
        },
        totalOnlineVouchers: {
          amount: clientsDaily.onlineVouchersAmount || 0,
          value: clientsDaily.onlineVouchersTotal || 0
        },
        totalPaperVouchers: {
          amount: clientsDaily.paperVouchersAmount || 0,
          value: clientsDaily.paperVouchersTotal || 0
        },
        totalYottaLinks: {
          amount: clientsDaily.yottaLinksAmount || 0,
          value: clientsDaily.yottaLinksTotal || 0
        },
        totalYottaWidget: {
          amount: clientsDaily.yottaWidgetAmount || 0,
          value: clientsDaily.yottaWidgetTotal || 0
        },
        totalFoodAndDrinkSales: headDaily.foodAndDrinkSales || 0,
        totalTreatments: headDaily.treatments || 0,
        prebooked: headWeeklyData[selectedDate]?.preBookedData?.dailyPreBookedPeople?.[getDayName(i)] || 0
      };
    }
    return res.json({ weeklyDashboardData });
  } else if (timeFilter === 'period') {
    const periodDashboardData = {};
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const formattedDate = formatDate(date);
      const clientsDaily = clients.find(client => client.date === formattedDate) || {};
      const headDaily = headDailyData[formattedDate] || {};
      
      periodDashboardData[formattedDate] = {
        totalVisitors: clientsDaily.amountOfPeople || 0,
        totalNewClients: clientsDaily.newClients || 0,
        totalMale: clientsDaily.male || 0,
        totalFemale: clientsDaily.female || 0,
        totalEnglishSpeaking: clientsDaily.englishSpeaking || 0,
        totalRussianSpeaking: clientsDaily.russianSpeaking || 0,
        totalOffPeak: clientsDaily.offPeakClients || 0,
        totalPeakTime: clientsDaily.peakTimeClients || 0,
        totalOnlineMemberships: {
          amount: clientsDaily.onlineMembershipsAmount || 0,
          value: clientsDaily.onlineMembershipsTotal || 0
        },
        totalOfflineMemberships: {
          amount: clientsDaily.offlineMembershipsAmount || 0,
          value: clientsDaily.offlineMembershipsTotal || 0
        },
        totalOnlineVouchers: {
          amount: clientsDaily.onlineVouchersAmount || 0,
          value: clientsDaily.onlineVouchersTotal || 0
        },
        totalPaperVouchers: {
          amount: clientsDaily.paperVouchersAmount || 0,
          value: clientsDaily.paperVouchersTotal || 0
        },
        totalYottaLinks: {
          amount: clientsDaily.yottaLinksAmount || 0,
          value: clientsDaily.yottaLinksTotal || 0
        },
        totalYottaWidget: {
          amount: clientsDaily.yottaWidgetAmount || 0,
          value: clientsDaily.yottaWidgetTotal || 0
        },
        totalFoodAndDrinkSales: headDaily.foodAndDrinkSales || 0,
        totalTreatments: headDaily.treatments || 0,
        prebooked: headWeeklyData[formattedDate]?.preBookedData?.dailyPreBookedPeople?.[getDayName(date.getDay())] || 0
      };
    }
    return res.json({ weeklyDashboardData: periodDashboardData });
  }
}); 

// Helper function to format date as dd.mm.yyyy
const formatDate = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
};

// Helper function to get day name
const getDayName = (dayIndex) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days[dayIndex];
};

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});