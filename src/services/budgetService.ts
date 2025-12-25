import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
  limit,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { BankAccount, Expense, RecurringTemplate, MonthlySnapshot } from '../types';

export const budgetService = {
  // Bank Accounts
  getBankAccounts: async (householdId: string) => {
    const q = query(collection(db, 'bankAccounts'), where('householdId', '==', householdId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as BankAccount);
  },

  addBankAccount: async (account: Omit<BankAccount, 'id'>) => {
    return await addDoc(collection(db, 'bankAccounts'), account);
  },

  updateBankAccount: async (id: string, updates: Partial<BankAccount>) => {
    const docRef = doc(db, 'bankAccounts', id);
    await updateDoc(docRef, updates);
  },

  deleteBankAccount: async (id: string) => {
    await deleteDoc(doc(db, 'bankAccounts', id));
  },

  // Expenses
  getExpenses: async (householdId: string, month: string) => {
    const q = query(
      collection(db, 'expenses'),
      where('householdId', '==', householdId),
      where('month', '==', month)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Expense);
  },

  addExpense: async (expense: Omit<Expense, 'id'>) => {
    return await addDoc(collection(db, 'expenses'), expense);
  },

  updateExpense: async (id: string, updates: Partial<Expense>) => {
    const docRef = doc(db, 'expenses', id);
    await updateDoc(docRef, updates);
  },

  deleteExpense: async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
  },

  // Get most recent expense by name for auto-suggestion
  getRecentExpenseByName: async (householdId: string, name: string) => {
    const q = query(
      collection(db, 'expenses'),
      where('householdId', '==', householdId),
      where('name', '==', name),
      orderBy('date', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as Expense;
  },

  // Recurring Templates
  getRecurringTemplates: async (householdId: string) => {
    const q = query(collection(db, 'recurringTemplates'), where('householdId', '==', householdId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as RecurringTemplate);
  },

  addRecurringTemplate: async (template: Omit<RecurringTemplate, 'id'>) => {
    return await addDoc(collection(db, 'recurringTemplates'), template);
  },

  updateRecurringTemplate: async (id: string, updates: Partial<RecurringTemplate>) => {
    const docRef = doc(db, 'recurringTemplates', id);
    await updateDoc(docRef, updates);
  },

  deleteRecurringTemplate: async (id: string) => {
    await deleteDoc(doc(db, 'recurringTemplates', id));
  },

  // Monthly Snapshots
  getMonthlySnapshot: async (householdId: string, month: string) => {
    const q = query(
      collection(db, 'monthlySnapshots'),
      where('householdId', '==', householdId),
      where('month', '==', month)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as MonthlySnapshot;
  },

  saveMonthlySnapshot: async (snapshot: Omit<MonthlySnapshot, 'id'>) => {
    const existing = await budgetService.getMonthlySnapshot(snapshot.householdId, snapshot.month);
    if (existing) {
      await updateDoc(doc(db, 'monthlySnapshots', existing.id), { balances: snapshot.balances });
    } else {
      await addDoc(collection(db, 'monthlySnapshots'), snapshot);
    }
  },

  // Categories
  getCategories: async (householdId: string) => {
    const q = query(collection(db, 'categories'), where('householdId', '==', householdId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data().name as string);
  },

  addCategory: async (householdId: string, name: string) => {
    const categories = await budgetService.getCategories(householdId);
    if (!categories.includes(name)) {
      await addDoc(collection(db, 'categories'), { householdId, name });
    }
  },

  // Household sharing
  getHousehold: async (id: string) => {
    const docRef = doc(db, 'households', id);
    const snap = await getDoc(docRef);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
  },

  inviteSpouse: async (householdId: string, spouseEmail: string) => {
    // In a real app, this would send an email.
    // For this prototype, we'll find a user by email and update their householdId.
    const q = query(collection(db, 'users'), where('email', '==', spouseEmail));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('User not found. Ask them to log in first.');

    const userDoc = snap.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), { householdId });

    // Add to household members
    const householdRef = doc(db, 'households', householdId);
    const householdSnap = await getDoc(householdRef);
    if (householdSnap.exists()) {
      const members = householdSnap.data().members || [];
      if (!members.includes(userDoc.id)) {
        await updateDoc(householdRef, { members: [...members, userDoc.id] });
      }
    }
  },
};
