import { useState, useEffect, useCallback } from 'react';
import { budgetService } from '../services/budgetService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { BankAccount } from '../types';

export const useBankAccounts = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await budgetService.getBankAccounts(user.householdId);
      setAccounts(data);
    } catch (error: any) {
      notify(error.message || 'Failed to fetch bank accounts', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, notify]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return { accounts, loading, refresh: fetchAccounts };
};
