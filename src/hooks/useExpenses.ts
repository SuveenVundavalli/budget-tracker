import { useState, useEffect, useCallback } from 'react';
import { budgetService } from '../services/budgetService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Expense } from '../types';

export const useExpenses = (month: string) => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await budgetService.getExpenses(user.householdId, month);
      setExpenses(data);
    } catch (error: any) {
      notify(error.message || 'Failed to fetch expenses', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, month, notify]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, loading, refresh: fetchExpenses };
};
