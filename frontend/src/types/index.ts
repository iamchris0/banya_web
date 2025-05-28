export type UserRole = 'admin' | 'head' | 'boss';
export type Status = 'pending' | 'edited' | 'Confirmed';

export interface User {
  username: string;
  role: UserRole;
  password?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
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
  digitalBillAmount: number;
  digitalBillTotal: number;
  staffBonus: number;
  onDeskBonus: number;
  voucherSalesBonus: number;
  privateBookingBonus: number;
  preBookedValueNextWeek: number;
  preBookedPeopleNextWeek: number;
  dailyPreBooked?: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  dailyPreBookedPeople?: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
  date: string;
  createdBy: string;
  isVerified: boolean;
  status: Status;
}