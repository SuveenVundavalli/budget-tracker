import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { budgetService } from '../services/budgetService';
import { useAuth } from '../contexts/AuthContext';
import { BankAccount, Expense } from '../types';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  month: string;
  initialData?: Expense;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, onClose, onSave, month, initialData }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    name: '',
    amount: 0,
    currency: 'SEK',
    category: '',
    bankAccountId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'planned',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        amount: 0,
        currency: 'SEK',
        category: '',
        bankAccountId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'planned',
      });
    }
  }, [initialData, open]);

  useEffect(() => {
    if (user && open) {
      loadAccounts();
      loadCategories();
    }
  }, [user, open]);

  const loadAccounts = async () => {
    const data = await budgetService.getBankAccounts(user!.householdId);
    setAccounts(data);
  };

  const loadCategories = async () => {
    const data = await budgetService.getCategories(user!.householdId);
    setCategories(data);
  };

  const handleNameChange = async (name: string) => {
    setFormData((prev) => ({ ...prev, name }));
    if (name.length > 2) {
      const recent = await budgetService.getRecentExpenseByName(user!.householdId, name);
      if (recent) {
        setFormData((prev) => ({
          ...prev,
          name,
          amount: recent.amount,
          category: recent.category,
          currency: recent.currency,
          bankAccountId: recent.bankAccountId,
        }));
      }
    }
  };

  const handleSave = async () => {
    if (user && formData.name && formData.bankAccountId) {
      setLoading(true);

      // Add category if new
      if (formData.category) {
        await budgetService.addCategory(user.householdId, formData.category);
      }

      if (initialData?.id) {
        await budgetService.updateExpense(initialData.id, formData);
      } else {
        await budgetService.addExpense({
          ...(formData as Omit<Expense, 'id'>),
          householdId: user.householdId,
          month,
          isRecurring: false,
          status: 'planned',
        });
      }
      setLoading(false);
      onSave();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialData ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Autocomplete
          freeSolo
          options={[]}
          value={formData.name}
          onInputChange={(_, newValue) => handleNameChange(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="Expense Name" fullWidth sx={{ mt: 1 }} />
          )}
        />
        <TextField
          label="Amount"
          type="number"
          fullWidth
          value={formData.amount === 0 ? '' : formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, amount: e.target.value === '' ? 0 : Number(e.target.value) })
          }
        />
        <TextField
          select
          label="Paid From Account"
          fullWidth
          value={formData.bankAccountId}
          onChange={(e) => {
            const acc = accounts.find((a) => a.id === e.target.value);
            setFormData({
              ...formData,
              bankAccountId: e.target.value,
              currency: acc?.currency || 'SEK',
            });
          }}
        >
          {accounts.map((acc) => (
            <MenuItem key={acc.id} value={acc.id}>
              {acc.name} ({acc.currency})
            </MenuItem>
          ))}
        </TextField>
        <Autocomplete
          freeSolo
          options={categories}
          value={formData.category}
          onInputChange={(_, newValue) => setFormData({ ...formData, category: newValue })}
          renderInput={(params) => <TextField {...params} label="Category" fullWidth />}
        />
        <TextField
          label="Date"
          type="date"
          fullWidth
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !formData.name || !formData.bankAccountId}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseForm;
