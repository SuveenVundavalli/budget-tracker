import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TableSortLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  CompareArrows as TransferIcon,
  Delete as DeleteIcon,
  Autorenew as AutorenewIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { budgetService } from '../services/budgetService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { useExpenses } from '../hooks/useExpenses';
import { Expense } from '../types';
import { format, startOfMonth, addMonths, subMonths } from 'date-fns';
import ExpenseForm from '../components/ExpenseForm';
import TransferWizard from '../components/TransferWizard';
import RecurringImportDialog from '../components/RecurringImportDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { MenuItem, TextField } from '@mui/material';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { accounts } = useBankAccounts();
  const { expenses, refresh: refreshExpenses } = useExpenses(currentMonth);
  const [activeTab, setActiveTab] = useState(0);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [recurringImportOpen, setRecurringImportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | undefined>(undefined);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Expense | 'bankAccount';
    direction: 'asc' | 'desc';
  }>({
    key: 'name',
    direction: 'asc',
  });

  // Generate a list of months for the dropdown (e.g., 12 months back, 12 months forward)
  const monthOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const start = startOfMonth(subMonths(new Date(), 12));
    for (let i = 0; i <= 24; i++) {
      const date = addMonths(start, i);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy'),
      });
    }
    return options;
  }, []);

  useEffect(() => {
    if (user && accounts.length > 0) {
      loadHistoricalData();
    }
  }, [user, accounts, expenses]);

  const loadHistoricalData = async () => {
    if (!user || accounts.length === 0) return;

    // Load historical data for the last 6 months
    const last6Months = Array.from({ length: 6 }, (_, i) =>
      format(subMonths(new Date(), 5 - i), 'yyyy-MM')
    );

    try {
      const histData = await Promise.all(
        last6Months.map(async (m) => {
          const monthExpenses = await budgetService.getExpenses(user.householdId, m);
          const totals: any = {
            month: format(addMonths(subMonths(new Date(), 5), last6Months.indexOf(m)), 'MMM yy'),
          };

          // Calculate totals per currency found in the account list
          currencies.forEach((curr) => {
            totals[curr] = monthExpenses
              .filter((e) => e.currency === curr)
              .reduce((sum, e) => sum + e.amount, 0);
          });
          return totals;
        })
      );
      setHistoricalData(histData);
    } catch (error: any) {
      notify('Failed to load historical data', 'error');
    }
  };

  const currencies = Array.from(new Set(accounts.map((a) => a.currency)));

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await budgetService.deleteExpense(expenseToDelete);
      refreshExpenses();
      notify('Expense deleted successfully');
    } catch (error: any) {
      notify('Failed to delete expense', 'error');
    } finally {
      setDeleteConfirmOpen(false);
      setExpenseToDelete(null);
    }
  };

  const confirmDeleteExpense = (id: string) => {
    setExpenseToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setExpenseFormOpen(true);
  };

  const handleToggleStatus = async (expense: Expense) => {
    try {
      const newStatus = expense.status === 'paid' ? 'planned' : 'paid';
      await budgetService.updateExpense(expense.id, { status: newStatus });
      refreshExpenses();
    } catch (error: any) {
      notify('Failed to update status', 'error');
    }
  };

  const handleRequestSort = (key: keyof Expense | 'bankAccount') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedExpenses = React.useMemo(() => {
    const filtered = expenses.filter((e) => e.currency === currencies[activeTab]);
    return [...filtered].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Expense];
      let bValue: any = b[sortConfig.key as keyof Expense];

      if (sortConfig.key === 'bankAccount') {
        aValue = accounts.find((acc) => acc.id === a.bankAccountId)?.name || '';
        bValue = accounts.find((acc) => acc.id === b.bankAccountId)?.name || '';
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [expenses, activeTab, currencies, sortConfig, accounts]);

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 4 }} alignItems="center">
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            select
            label="Month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            size="small"
            fullWidth
          >
            {monthOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid
          size={{ xs: 12, sm: 6, md: 8 }}
          sx={{
            display: 'flex',
            justifyContent: { xs: 'flex-start', sm: 'flex-end' },
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="outlined"
            startIcon={<AutorenewIcon />}
            onClick={() => setRecurringImportOpen(true)}
            size="small"
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<TransferIcon />}
            onClick={() => setWizardOpen(true)}
            size="small"
          >
            Transfer
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setExpenseFormOpen(true)}
            size="small"
          >
            Add Expense
          </Button>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {currencies.map((currency) => {
          const total = expenses
            .filter((e) => e.currency === currency)
            .reduce((sum, e) => sum + e.amount, 0);
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={currency}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {currency} Expenses
                  </Typography>
                  <Typography variant="h5">
                    {total.toLocaleString()} {currency}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Paper sx={{ mt: 4, overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {currencies.map((c) => (
            <Tab key={c} label={`${c} Payments`} />
          ))}
          <Tab label="Trends" icon={<TrendingUpIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab < currencies.length ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
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
                        Account
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
                  {sortedExpenses.map((e) => (
                    <TableRow key={e.id} sx={{ opacity: e.status === 'paid' ? 0.7 : 1 }}>
                      <TableCell>
                        <IconButton
                          size="small"
                          color={e.status === 'paid' ? 'success' : 'default'}
                          onClick={() => handleToggleStatus(e)}
                        >
                          {e.status === 'paid' ? <CheckCircleIcon /> : <UncheckedIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell
                        sx={{ textDecoration: e.status === 'paid' ? 'line-through' : 'none' }}
                      >
                        {e.name}
                      </TableCell>
                      <TableCell>{e.category}</TableCell>
                      <TableCell>{accounts.find((a) => a.id === e.bankAccountId)?.name}</TableCell>
                      <TableCell align="right">
                        {e.amount.toLocaleString()} {e.currency}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditExpense(e)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => confirmDeleteExpense(e.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ height: 400, width: '100%' }}>
              <Typography variant="h6" gutterBottom align="center">
                Last 6 Months Spending
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                  {currencies.map((curr, idx) => (
                    <Bar
                      key={curr}
                      dataKey={curr}
                      fill={idx === 0 ? '#8884d8' : '#82ca9d'}
                      name={`${curr} Expenses`}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>
      </Paper>

      <ExpenseForm
        open={expenseFormOpen}
        onClose={() => {
          setExpenseFormOpen(false);
          setExpenseToEdit(undefined);
        }}
        onSave={refreshExpenses}
        month={currentMonth}
        initialData={expenseToEdit}
      />

      <TransferWizard open={wizardOpen} onClose={() => setWizardOpen(false)} month={currentMonth} />

      <RecurringImportDialog
        open={recurringImportOpen}
        onClose={() => setRecurringImportOpen(false)}
        onImport={refreshExpenses}
        month={currentMonth}
        existingExpenses={expenses}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteExpense}
      />
    </Box>
  );
};

export default Dashboard;
