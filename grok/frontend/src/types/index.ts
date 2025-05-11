export type UserRole = 'admin' | 'head' | 'boss';

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
  id?: number;
  amountOfPeople: number;
  male: number;
  female: number;
  otherGender: number;
  englishSpeaking: number;
  russianSpeaking: number;
  offPeakClients: number;
  peakTimeClients: number;
  newClients: number;
  soldVouchersAmount: number;
  soldVouchersTotal: number;
  soldMembershipsAmount: number;
  soldMembershipsTotal: number;
  yottaDepositsAmount: number;
  yottaDepositsTotal: number;
  yottaLinksAmount: number;
  yottaLinksTotal: number;
  date: string;
  createdBy: string;
  isVerified: boolean;
}