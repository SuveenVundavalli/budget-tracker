import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
  CircularProgress,
} from '@mui/material';
import { budgetService } from '../services/budgetService';
import { useAuth } from '../contexts/AuthContext';
import { RecurringTemplate, Expense } from '../types';

interface RecurringImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: () => void;
  month: string;
  existingExpenses: Expense[];
}

const RecurringImportDialog: React.FC<RecurringImportDialogProps> = ({
  open,
  onClose,
  onImport,
  month,
  existingExpenses,
}) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadTemplates();
    }
  }, [user, open]);

  const loadTemplates = async () => {
    setLoading(true);
    const data = await budgetService.getRecurringTemplates(user!.householdId);
    setTemplates(data);

    // Auto-select templates that haven't been imported yet
    // Matching by name for simplicity
    const existingNames = new Set(existingExpenses.map((e) => e.name));
    setSelectedIds(data.filter((t) => !existingNames.has(t.name)).map((t) => t.id));
    setLoading(false);
  };

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleImport = async () => {
    if (!user) return;
    setLoading(true);
    const toImport = templates.filter((t) => selectedIds.includes(t.id));

    const promises = toImport.map((t) => {
      const expense: Omit<Expense, 'id'> = {
        householdId: user.householdId,
        month,
        name: t.name,
        amount: t.amount,
        currency: t.currency,
        category: t.category,
        bankAccountId: t.bankAccountId,
        date: `${month}-01`, // Default to 1st of the month
        isRecurring: true,
        status: 'planned',
      };
      return budgetService.addExpense(expense);
    });

    await Promise.all(promises);
    setLoading(false);
    onImport();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Import Recurring Payments</DialogTitle>
      <DialogContent>
        {loading && templates.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : templates.length === 0 ? (
          <Typography sx={{ p: 2 }}>
            No recurring templates found. Create some in the Recurring Payments page.
          </Typography>
        ) : (
          <List>
            {templates.map((t) => (
              <ListItem key={t.id} disablePadding>
                <ListItemButton onClick={() => handleToggle(t.id)}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedIds.includes(t.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={t.name}
                    secondary={`${t.amount.toLocaleString()} ${t.currency} - ${t.category}`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={loading || selectedIds.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : `Import ${selectedIds.length} Items`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

import { Box, ListItemButton } from '@mui/material';

export default RecurringImportDialog;
