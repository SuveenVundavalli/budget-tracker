import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Box,
  TableSortLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { budgetService } from '../services/budgetService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { BankAccount } from '../types';
import ConfirmDialog from '../components/ConfirmDialog';

const BankAccounts: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const { accounts, refresh: refreshAccounts } = useBankAccounts();
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const [accountToEdit, setAccountToEdit] = useState<BankAccount | null>(null);
  const [newAccount, setNewAccount] = useState<Partial<BankAccount>>({
    name: '',
    currency: 'INR',
    minBalance: 0,
    color: '#3f51b5',
    isPrimary: false,
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BankAccount;
    direction: 'asc' | 'desc';
  }>({
    key: 'name',
    direction: 'asc',
  });

  const currencies = ['INR', 'SEK', 'USD', 'EUR', 'GBP'];

  useEffect(() => {
    if (accountToEdit) {
      setNewAccount(accountToEdit);
    } else {
      setNewAccount({
        name: '',
        currency: 'INR',
        minBalance: 0,
        color: '#3f51b5',
        isPrimary: false,
      });
    }
  }, [accountToEdit, open]);

  const handleSave = async () => {
    if (user && newAccount.name) {
      try {
        if (accountToEdit) {
          await budgetService.updateBankAccount(accountToEdit.id, newAccount);
          notify('Account updated successfully');
        } else {
          await budgetService.addBankAccount({
            ...(newAccount as Omit<BankAccount, 'id'>),
            householdId: user.householdId,
          });
          notify('Account added successfully');
        }
        setOpen(false);
        setAccountToEdit(null);
        refreshAccounts();
      } catch (error: any) {
        notify('Failed to save account', 'error');
      }
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await budgetService.deleteBankAccount(accountToDelete);
      notify('Account deleted successfully');
      refreshAccounts();
    } catch (error: any) {
      notify('Failed to delete account', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setAccountToDelete(null);
    }
  };

  const handleEdit = (account: BankAccount) => {
    setAccountToEdit(account);
    setOpen(true);
  };

  const confirmDelete = (id: string) => {
    setAccountToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleRequestSort = (key: keyof BankAccount) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAccounts = React.useMemo(() => {
    return [...accounts].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [accounts, sortConfig]);

  return (
    <div>
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Bank Accounts</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setAccountToEdit(null);
            setOpen(true);
          }}
        >
          Add Account
        </Button>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'name'}
                  direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
                  onClick={() => handleRequestSort('name')}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'currency'}
                  direction={sortConfig.key === 'currency' ? sortConfig.direction : 'asc'}
                  onClick={() => handleRequestSort('currency')}
                >
                  Currency
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortConfig.key === 'minBalance'}
                  direction={sortConfig.key === 'minBalance' ? sortConfig.direction : 'asc'}
                  onClick={() => handleRequestSort('minBalance')}
                >
                  Min Balance
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'isPrimary'}
                  direction={sortConfig.key === 'isPrimary' ? sortConfig.direction : 'asc'}
                  onClick={() => handleRequestSort('isPrimary')}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedAccounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: account.color,
                        mr: 1,
                      }}
                    />
                    {account.name}
                  </Box>
                </TableCell>
                <TableCell>{account.currency}</TableCell>
                <TableCell align="right">{account.minBalance.toLocaleString()}</TableCell>
                <TableCell>{account.isPrimary ? 'Primary (Hub)' : 'Secondary'}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleEdit(account)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => confirmDelete(account.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setAccountToEdit(null);
        }}
      >
        <DialogTitle>{accountToEdit ? 'Edit Bank Account' : 'Add New Bank Account'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Account Name"
            fullWidth
            value={newAccount.name}
            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
            sx={{ mt: 1 }}
          />
          <TextField
            select
            label="Currency"
            fullWidth
            value={newAccount.currency}
            onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value })}
          >
            {currencies.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Minimum Balance"
            type="number"
            fullWidth
            value={newAccount.minBalance === 0 ? '' : newAccount.minBalance}
            onChange={(e) =>
              setNewAccount({
                ...newAccount,
                minBalance: e.target.value === '' ? 0 : Number(e.target.value),
              })
            }
          />
          <TextField
            select
            label="Is Primary Hub?"
            fullWidth
            value={newAccount.isPrimary ? 'yes' : 'no'}
            onChange={(e) => setNewAccount({ ...newAccount, isPrimary: e.target.value === 'yes' })}
          >
            <MenuItem value="no">No</MenuItem>
            <MenuItem value="yes">Yes</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setAccountToEdit(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Bank Account"
        message="Are you sure you want to delete this bank account? This might affect existing expenses linked to it."
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default BankAccounts;
