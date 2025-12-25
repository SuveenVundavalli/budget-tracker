export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  householdId: string;
}

export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  members: string[];
  primaryAccounts: Record<string, string>; // currency -> accountId
}

export type CurrencyCode = 'SEK' | 'INR' | 'USD' | 'EUR' | string;

export interface BankAccount {
  id: string;
  householdId: string;
  name: string;
  currency: CurrencyCode;
  minBalance: number;
  color: string;
  isPrimary: boolean;
}

export interface Expense {
  id: string;
  householdId: string;
  month: string; // YYYY-MM
  name: string;
  amount: number;
  currency: CurrencyCode;
  category: string;
  date: string; // ISO
  bankAccountId: string;
  isRecurring: boolean;
  status: 'planned' | 'paid';
}

export interface RecurringTemplate {
  id: string;
  householdId: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  category: string;
  bankAccountId: string;
}

export interface MonthlySnapshot {
  id: string;
  householdId: string;
  month: string; // YYYY-MM
  balances: Record<string, number>; // accountId -> balance
}

export interface ExchangeRate {
  date: string; // YYYY-MM-DD
  base: string;
  rates: Record<string, number>;
}
