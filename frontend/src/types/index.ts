export type UserRole = 'admin' | 'head' | 'boss';
export type StatusType = 'Pending' | 'Edited' | 'Confirmed';

export interface User {
  username: string;
  role: UserRole;
  password?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface DailyPreBooked {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
}

export interface PreBookedData {
  dailyPreBookedPeople?: DailyPreBooked;
  dailyPreBookedValue?: DailyPreBooked;
}

export interface Bonuses {
  staffBonus: number;
  onDeskBonus: number;
  voucherSalesBonus: number;
  privateBookingBonus: number;
  kitchenBonus?: number;
  ondeskSalesBonus?: number;
  miscBonus?: number;
  allPerformanceBonus?: number;
  vouchersSalesBonus?: number;
  membershipSalesBonus?: number;
  privateBookingsBonus?: number;
}

export interface OtherCosts {
  kitchenSalaryPaid: number;
  foodAndBeverageStock: number;
  kitchenPL: number;
}

export interface ClientInfo {
  id?: number | null;
  amountOfPeople: number;
  male: number;
  female: number;
  otherGender?: number;
  englishSpeaking: number;
  russianSpeaking: number;
  offPeakClients: number;
  peakTimeClients: number;
  newClients: number;
  onlineMembershipsAmount: number;
  onlineMembershipsTotal: number;
  offlineMembershipsAmount: number;
  offlineMembershipsTotal: number;
  onlineVouchersAmount: number;
  onlineVouchersTotal: number;
  paperVouchersAmount: number;
  paperVouchersTotal: number;
  yottaLinksAmount: number;
  yottaLinksTotal: number;
  yottaWidgetAmount: number;
  yottaWidgetTotal: number;
  date: string;
  createdBy: string;
  isVerified: boolean;
  status: StatusType;
}

export interface HeadDaily {
  id?: number | null;
  foodAndDrinkSales?: number;
  treatments?: {
    entryOnly: { done: boolean; amount: number };
    parenie: { done: boolean; amount: number };
    aromaPark: { done: boolean; amount: number };
    iceWrap: { done: boolean; amount: number };
    scrub: { done: boolean; amount: number };
    mudMask: { done: boolean; amount: number };
    mudWrap: { done: boolean; amount: number };
    aloeVera: { done: boolean; amount: number };
    massage_25: { done: boolean; amount: number };
    massage_50: { done: boolean; amount: number };
  };
  date?: string;
  status: StatusType;
}

export interface HeadWeekly {
  id?: number | null;
  preBookedData?: PreBookedData;
  bonuses?: Bonuses;
  otherCosts?: OtherCosts;
  date: string;
  createdBy: string;
  status: StatusType;
}

export interface WeeklySummary {
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
    entryOnly: { amount: number; value: number };
    parenie: { amount: number; value: number };
    aromaPark: { amount: number; value: number };
    iceWrap: { amount: number; value: number };
    scrub: { amount: number; value: number };
    mudMask: { amount: number; value: number };
    mudWrap: { amount: number; value: number };
    aloeVera: { amount: number; value: number };
    massage_25: { amount: number; value: number };
    massage_50: { amount: number; value: number };
  };
}