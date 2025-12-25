import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Divider,
  Paper,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { budgetService } from '../services/budgetService';
import { getExchangeRate } from '../services/currencyService';
import { useAuth } from '../contexts/AuthContext';
import { BankAccount, Expense } from '../types';

interface TransferWizardProps {
  open: boolean;
  onClose: () => void;
  month: string;
}

const TransferWizard: React.FC<TransferWizardProps> = ({ open, onClose, month }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [exchangeRate, setExchangeRate] = useState<number>(0);

  useEffect(() => {
    if (user && open) {
      loadData();
    }
  }, [user, open]);

  const loadData = async () => {
    const [aData, eData, snapshot] = await Promise.all([
      budgetService.getBankAccounts(user!.householdId),
      budgetService.getExpenses(user!.householdId, month),
      budgetService.getMonthlySnapshot(user!.householdId, month),
    ]);
    setAccounts(aData);
    setExpenses(eData);
    if (snapshot) {
      setBalances(snapshot.balances);
    } else {
      const initialBalances: Record<string, number> = {};
      aData.forEach((acc) => (initialBalances[acc.id] = 0));
      setBalances(initialBalances);
    }

    // Fetch initial exchange rate (SEK to INR)
    const rates = await getExchangeRate('SEK', new Date().toISOString().split('T')[0]);
    setExchangeRate(rates['INR']);
  };

  const calculateTopUp = (account: BankAccount) => {
    const accountExpenses = expenses
      .filter((e) => e.bankAccountId === account.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const currentBalance = balances[account.id] || 0;
    const needed = accountExpenses + account.minBalance - currentBalance;
    return Math.max(0, needed);
  };

  const handleSaveBalances = async () => {
    if (user) {
      await budgetService.saveMonthlySnapshot({
        householdId: user.householdId,
        month,
        balances,
      });
      setStep(2);
    }
  };

  const inrAccounts = accounts.filter((a) => a.currency === 'INR' && !a.isPrimary);
  const primaryInrAccount = accounts.find((a) => a.currency === 'INR' && a.isPrimary);
  const primarySekAccount = accounts.find((a) => a.currency === 'SEK' && a.isPrimary);

  const totalInrNeeded =
    inrAccounts.reduce((sum, acc) => sum + calculateTopUp(acc), 0) +
    (primaryInrAccount ? calculateTopUp(primaryInrAccount) : 0);

  const sekNeeded = totalInrNeeded / exchangeRate;
  const roundedSek = Math.ceil(sekNeeded / 100) * 100; // Round up to nearest 100

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        Transfer Wizard - {month}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {step === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6">Step 1: Update Current Balances</Typography>
            <Typography variant="body2" color="textSecondary">
              Enter the starting balance for each account this month.
            </Typography>
            {accounts.map((acc) => (
              <Box key={acc.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ flexGrow: 1 }}>
                  {acc.name} ({acc.currency})
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  label="Balance"
                  value={balances[acc.id] === 0 ? '' : balances[acc.id]}
                  onChange={(e) =>
                    setBalances({
                      ...balances,
                      [acc.id]: e.target.value === '' ? 0 : Number(e.target.value),
                    })
                  }
                />
              </Box>
            ))}
          </Box>
        )}

        {step === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6">Step 2: Transfer Summary</Typography>

            <Paper sx={{ p: 2, bgcolor: '#e8f5e9' }}>
              <Typography variant="subtitle1" gutterBottom>
                <b>Conversion Rate</b>
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography>1 SEK = </Typography>
                <TextField
                  size="small"
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value))}
                  sx={{ width: 100 }}
                />
                <Typography>INR</Typography>
              </Box>
            </Paper>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <b>Distribution (INR)</b>
              </Typography>
              {inrAccounts.map((acc) => {
                const topup = calculateTopUp(acc);
                if (topup === 0) return null;
                return (
                  <Box
                    key={acc.id}
                    sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
                  >
                    <Typography>{acc.name}</Typography>
                    <Typography>+ {topup.toLocaleString()} INR</Typography>
                  </Box>
                );
              })}
              {primaryInrAccount && calculateTopUp(primaryInrAccount) > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>{primaryInrAccount.name} (Own Expenses)</Typography>
                  <Typography>
                    + {calculateTopUp(primaryInrAccount).toLocaleString()} INR
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>
                  <b>Total INR Needed from Hub</b>
                </Typography>
                <Typography color="primary">
                  <b>{totalInrNeeded.toLocaleString()} INR</b>
                </Typography>
              </Box>
            </Box>

            <Paper sx={{ p: 2, bgcolor: '#fff3e0', border: '1px solid #ffe0b2' }}>
              <Typography variant="h6" color="warning.dark" gutterBottom>
                Final Transfer Instruction
              </Typography>
              <Typography variant="body1">
                Transfer <b>{roundedSek.toLocaleString()} SEK</b> from{' '}
                <b>{primarySekAccount?.name || 'Sweden Bank'}</b> to{' '}
                <b>{primaryInrAccount?.name || 'NRE Account'}</b>.
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Actual needed: {sekNeeded.toFixed(2)} SEK. Rounded up for safety.
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {step === 1 ? (
          <Button onClick={handleSaveBalances} variant="contained">
            Next: Calculate Transfer
          </Button>
        ) : (
          <Button onClick={() => setStep(1)}>Back</Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferWizard;
