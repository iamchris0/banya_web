export type UserRole = 'admin' | 'head' | 'boss';
export type StatusType = 'pending' | 'edited' | 'Confirmed';
export type Status = {
  survey: StatusType;
  headData: StatusType;
};

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