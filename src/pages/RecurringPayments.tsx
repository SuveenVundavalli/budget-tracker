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
  TableSortLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { budgetService } from '../services/budgetService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { RecurringTemplate, BankAccount } from '../types';
import Autocomplete from '@mui/material/Autocomplete';
import ConfirmDialog from '../components/ConfirmDialog';

const RecurringPayments: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<RecurringTemplate>>({
    name: '',
    amount: 0,
    currency: 'INR',
    category: '',
    bankAccountId: '',
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof RecurringTemplate | 'bankAccount';
    direction: 'asc' | 'desc';
  }>({
    key: 'name',
    direction: 'asc',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [tData, aData, cData] = await Promise.all([
        budgetService.getRecurringTemplates(user!.householdId),
        budgetService.getBankAccounts(user!.householdId),
        budgetService.getCategories(user!.householdId),
      ]);
      setTemplates(tData);
      setAccounts(aData);
      setCategories(cData);
    } catch (error: any) {
      notify('Failed to load recurring templates', 'error');
    }
  };

  const handleOpen = (template?: RecurringTemplate) => {
    if (template) {
      setNewTemplate(template);
      setEditingId(template.id);
    } else {
      setNewTemplate({
        name: '',
        amount: 0,
        currency: 'INR',
        category: '',
        bankAccountId: '',
      });
      setEditingId(null);
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (user && newTemplate.name && newTemplate.bankAccountId) {
      try {
        const selectedAccount = accounts.find((a) => a.id === newTemplate.bankAccountId);
        const templateData = {
          ...(newTemplate as Omit<RecurringTemplate, 'id'>),
          householdId: user.householdId,
          currency: selectedAccount?.currency || 'INR',
        };

        // Add category if new
        if (templateData.category) {
          await budgetService.addCategory(user.householdId, templateData.category);
        }

        if (editingId) {
          await budgetService.updateRecurringTemplate(editingId, templateData);
          notify('Template updated successfully');
        } else {
          await budgetService.addRecurringTemplate(templateData);
          notify('Template added successfully');
        }

        setOpen(false);
        loadData();
      } catch (error: any) {
        notify('Failed to save template', 'error');
      }
    }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      await budgetService.deleteRecurringTemplate(templateToDelete);
      notify('Template deleted successfully');
      loadData();
    } catch (error: any) {
      notify('Failed to delete template', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleRequestSort = (key: keyof RecurringTemplate | 'bankAccount') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTemplates = React.useMemo(() => {
    return [...templates].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof RecurringTemplate];
      let bValue: any = b[sortConfig.key as keyof RecurringTemplate];

      if (sortConfig.key === 'bankAccount') {
        aValue = accounts.find((acc) => acc.id === a.bankAccountId)?.name || '';
        bValue = accounts.find((acc) => acc.id === b.bankAccountId)?.name || '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [templates, sortConfig, accounts]);

  return (
    <div>
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Recurring Payments</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Template
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
                  active={sortConfig.key === 'category'}
                  direction={sortConfig.key === 'category' ? sortConfig.direction : 'asc'}
                  onClick={() => handleRequestSort('category')}
                >
                  Category
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === 'bankAccount'}
                  direction={sortConfig.key === 'bankAccount' ? sortConfig.direction : 'asc'}
                  onClick={() => handleRequestSort('bankAccount')}
                >
                  Bank Account
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortConfig.key === 'amount'}
                  direction={sortConfig.key === 'amount' ? sortConfig.direction : 'asc'}
                  onClick={() => handleRequestSort('amount')}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedTemplates.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.category}</TableCell>
                <TableCell>
                  {accounts.find((a) => a.id === t.bankAccountId)?.name || 'Unknown'}
                </TableCell>
                <TableCell align="right">
                  {t.amount.toLocaleString()} {t.currency}
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpen(t)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => confirmDelete(t.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>
          {editingId ? 'Edit Recurring Template' : 'Add Recurring Template'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Name"
            fullWidth
            value={newTemplate.name}
            onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
            sx={{ mt: 1 }}
          />
          <Autocomplete
            freeSolo
            options={categories}
            value={newTemplate.category}
            onInputChange={(_, newValue) => setNewTemplate({ ...newTemplate, category: newValue })}
            renderInput={(params) => <TextField {...params} label="Category" fullWidth />}
          />
          <TextField
            label="Amount"
            type="number"
            fullWidth
            value={newTemplate.amount === 0 ? '' : newTemplate.amount}
            onChange={(e) =>
              setNewTemplate({
                ...newTemplate,
                amount: e.target.value === '' ? 0 : Number(e.target.value),
              })
            }
          />
          <TextField
            select
            label="Bank Account"
            fullWidth
            value={newTemplate.bankAccountId}
            onChange={(e) => setNewTemplate({ ...newTemplate, bankAccountId: e.target.value })}
          >
            {accounts.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.name} ({a.currency})
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Template"
        message="Are you sure you want to delete this recurring payment template?"
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default RecurringPayments;
