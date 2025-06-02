import * as XLSX from 'xlsx';

interface WeeklySummary {
  totalVisitors: number;
  totalMale: number;
  totalFemale: number;
  totalNewClients: number;
  totalEnglishSpeaking: number;
  totalRussianSpeaking: number;
  totalOffPeak: number;
  totalPeakTime: number;
  totalOnlineMemberships: { amount: number; value: number };
  totalOfflineMemberships: { amount: number; value: number };
  totalOnlineVouchers: { amount: number; value: number };
  totalPaperVouchers: { amount: number; value: number };
  totalYottaLinks: { amount: number; value: number };
  totalYottaWidget: { amount: number; value: number };
  totalFoodAndDrink: number;
  treatments: {
    entryOnly: number;
    parenie: number;
    aromaPark: number;
    iceWrap: number;
    scrub: number;
    mudMask: number;
    mudWrap: number;
    aloeVera: number;
    massage_25: number;
    massage_50: number;
  };
  dailyData?: {
    [date: string]: {
      visitors: number;
      newClients: number;
      male: number;
      female: number;
      englishSpeaking: number;
      russianSpeaking: number;
      offPeak: number;
      peakTime: number;
      onlineMemberships: { amount: number; value: number };
      offlineMemberships: { amount: number; value: number };
      onlineVouchers: { amount: number; value: number };
      paperVouchers: { amount: number; value: number };
      yottaLinks: { amount: number; value: number };
      yottaWidget: { amount: number; value: number };
      foodAndDrink: number;
      treatments: {
        entryOnly: number;
        parenie: number;
        aromaPark: number;
        iceWrap: number;
        scrub: number;
        mudMask: number;
        mudWrap: number;
        aloeVera: number;
        massage_25: number;
        massage_50: number;
      };
    };
  };
}

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export const generateWeeklyReport = (summary: WeeklySummary, weekStart: string) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Generate dates for the week
  const startDate = new Date(weekStart);
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return formatDate(date);
  });

  // Define headers and their corresponding values
  const headers = [
    'Day',
    'Total Visitors',
    'New Clients',
    'Male Visitors',
    'Female Visitors',
    'English Speaking',
    'Russian Speaking',
    'Off-Peak Clients',
    'Peak-Time Clients',
    'Online Memberships (Amount)',
    'Online Memberships (£)',
    'Offline Memberships (Amount)',
    'Offline Memberships (£)',
    'Online Vouchers (Amount)',
    'Online Vouchers (£)',
    'Paper Vouchers (Amount)',
    'Paper Vouchers (£)',
    'Yotta Links (Amount)',
    'Yotta Links (£)',
    'Yotta Widget (Amount)',
    'Yotta Widget (£)',
    'Entry Only',
    'Parenie',
    'Aroma Park',
    'Ice Wrap',
    'Scrub',
    'Mud Mask',
    'Mud Wrap',
    'Aloe Vera',
    'Massage (25 min)',
    'Massage (50 min)',
    'Food and Drink Sales (£)'
  ];

  // Prepare data rows
  const data: any[] = [headers];

  // Add a row for each day with its specific data
  dates.forEach(date => {
    const dailyData = summary.dailyData?.[date] || {
      visitors: 0,
      newClients: 0,
      male: 0,
      female: 0,
      englishSpeaking: 0,
      russianSpeaking: 0,
      offPeak: 0,
      peakTime: 0,
      onlineMemberships: { amount: 0, value: 0 },
      offlineMemberships: { amount: 0, value: 0 },
      onlineVouchers: { amount: 0, value: 0 },
      paperVouchers: { amount: 0, value: 0 },
      yottaLinks: { amount: 0, value: 0 },
      yottaWidget: { amount: 0, value: 0 },
      foodAndDrink: 0,
      treatments: {
        entryOnly: 0,
        parenie: 0,
        aromaPark: 0,
        iceWrap: 0,
        scrub: 0,
        mudMask: 0,
        mudWrap: 0,
        aloeVera: 0,
        massage_25: 0,
        massage_50: 0
      }
    };

    data.push([
      date,
      dailyData.visitors,
      dailyData.newClients,
      dailyData.male,
      dailyData.female,
      dailyData.englishSpeaking,
      dailyData.russianSpeaking,
      dailyData.offPeak,
      dailyData.peakTime,
      dailyData.onlineMemberships.amount,
      dailyData.onlineMemberships.value,
      dailyData.offlineMemberships.amount,
      dailyData.offlineMemberships.value,
      dailyData.onlineVouchers.amount,
      dailyData.onlineVouchers.value,
      dailyData.paperVouchers.amount,
      dailyData.paperVouchers.value,
      dailyData.yottaLinks.amount,
      dailyData.yottaLinks.value,
      dailyData.yottaWidget.amount,
      dailyData.yottaWidget.value,
      dailyData.treatments.entryOnly,
      dailyData.treatments.parenie,
      dailyData.treatments.aromaPark,
      dailyData.treatments.iceWrap,
      dailyData.treatments.scrub,
      dailyData.treatments.mudMask,
      dailyData.treatments.mudWrap,
      dailyData.treatments.aloeVera,
      dailyData.treatments.massage_25,
      dailyData.treatments.massage_50,
      dailyData.foodAndDrink
    ]);
  });

  // Create the worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Weekly Summary');

  // Generate the Excel file
  const fileName = `Weekly_Report_${weekStart}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return fileName;
}; 