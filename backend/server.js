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
let headData = {};

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
app.get('/api/clients/weekly-summary', authenticateToken, (req, res) => {
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

  const weekHeadData = Object.values(headData).filter(data => {
    const dataDate = new Date(data.date);
    dataDate.setUTCHours(0, 0, 0, 0);
    return dataDate >= startDate && dataDate <= endDate;
  });

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

    const dayHeadData = weekHeadData.filter(data => {
      const dataDate = new Date(data.date);
      dataDate.setUTCHours(0, 0, 0, 0);
      return dataDate.getTime() === currentDate.getTime();
    });

    // Initialize treatments with default values
    const defaultTreatments = {
      entryOnly: { value: 0 },
      parenie: { value: 0 },
      aromaPark: { value: 0 },
      iceWrap: { value: 0 },
      scrub: { value: 0 },
      mudMask: { value: 0 },
      mudWrap: { value: 0 },
      aloeVera: { value: 0 },
      massage_25: { value: 0 },
      massage_50: { value: 0 }
    };

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
    totalFoodAndDrink: weekHeadData.reduce((sum, data) => sum + (data.foodAndDrinkSales || 0), 0),
    
    // Treatments summary
    treatments: {
      entryOnly: { 
        value: weekHeadData.reduce((sum, data) => sum + ((data.treatments?.entryOnly?.amount || 0) * (data.treatments?.entryOnly?.done ? 1 : 0)), 0)
      },
      parenie: { 
        value: weekHeadData.reduce((sum, data) => sum + ((data.treatments?.parenie?.amount || 0) * (data.treatments?.parenie?.done ? 1 : 0)), 0)
      },
      aromaPark: { 
        value: weekHeadData.reduce((sum, data) => sum + ((data.treatments?.aromaPark?.amount || 0) * (data.treatments?.aromaPark?.done ? 1 : 0)), 0)
      },
      iceWrap: { 
        value: weekHeadData.reduce((sum, data) => sum + ((data.treatments?.iceWrap?.amount || 0) * (data.treatments?.iceWrap?.done ? 1 : 0)), 0)
      },
      scrub: { 
        value: weekHeadData.reduce((sum, data) => sum + ((data.treatments?.scrub?.amount || 0) * (data.treatments?.scrub?.done ? 1 : 0)), 0)
      },
      mudMask: { 
        value: weekHeadData.reduce((sum, data) => sum + ((data.treatments?.mudMask?.amount || 0) * (data.treatments?.mudMask?.done ? 1 : 0)), 0)
      },
      mudWrap: { 
        value: weekHeadData.reduce((sum, data) => sum + ((data.treatments?.mudWrap?.amount || 0) * (data.treatments?.mudWrap?.done ? 1 : 0)), 0)
      },
      aloeVera: { 
        value: weekHeadData.reduce((sum, data) => sum + ((data.treatments?.aloeVera?.amount || 0) * (data.treatments?.aloeVera?.done ? 1 : 0)), 0)
      },
      massage_25: { 
        value: weekHeadData.reduce((sum, data) => sum + ((data.treatments?.massage_25?.amount || 0) * (data.treatments?.massage_25?.done ? 1 : 0)), 0)
      },
      massage_50: { 
        value: weekHeadData.reduce((sum, data) => sum + ((data.treatments?.massage_50?.amount || 0) * (data.treatments?.massage_50?.done ? 1 : 0)), 0)
      }
    },
    dailyData
  };

  res.json({ summary });
});

// Get head data for a specific date
app.get('/api/head-data', authenticateToken, (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'Missing date query parameter' });
  }

  // Find existing data
  const selectedReceiptData = clients.find(item => item.date === date);
  const selectedHeadData = headData[date];

  return res.json({ 
    headData: selectedHeadData || null, 
    receiptData: selectedReceiptData || null 
  });
});

// Verify head data (F&B Sales + Treatments, Prebooked Data, Bonuses, Other Costs)
app.post('/api/head-data/verify-daily-data', authenticateToken, restrictToRoles(['head']), (req, res) => {
  const { date, headDailyData } = req.body;
  const existingData = headData[date];
  
  if (!existingData) {
    headData[date] = {
      date,
      ...headDailyData,
      status: 'Confirmed'
    };
    console.log('New head data added:', headData[date]);
    return res.json({ message: 'New head data added', headDailyData: headData[date] });
  } else {
    // Record found, update the existing entry
    const updatedData = {
      ...headDailyData,
      status: 'Confirmed',
      updatedAt: new Date().toISOString()
    };
    headData[date] = updatedData;
    console.log('Existing head data updated:', updatedData);
    return res.json({ message: 'Existing head data updated', headDailyData: updatedData });
  }
});

// Get all head data
app.get('/api/head-data/all', authenticateToken, (req, res) => {
  const { verified } = req.query;
  let filteredData = Object.values(headData);

  if (verified === 'false') {
    filteredData = filteredData.filter(data => !data.isVerified);
  } else if (verified === 'true') {
    filteredData = filteredData.filter(data => data.isVerified);
  }

  res.json({ headData: filteredData });
});

// Helper function to format date as dd.mm.yyyy
const formatDate = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});