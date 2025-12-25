import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { budgetService } from '../services/budgetService';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', severity: 'success' as 'success' | 'error' });
  const [open, setOpen] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await budgetService.inviteSpouse(user!.householdId, email);
      setMessage({ text: `Successfully linked ${email} to your household!`, severity: 'success' });
      setEmail('');
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to invite spouse', severity: 'error' });
    } finally {
      setLoading(false);
      setOpen(true);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Household Sharing
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Enter your spouse's email address to link them to your household. They must have logged in
          at least once before you can link them.
        </Typography>

        <Box
          component="form"
          onSubmit={handleInvite}
          sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
        >
          <TextField
            label="Spouse Email"
            variant="outlined"
            size="small"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            sx={{ flexGrow: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<PersonAddIcon />}
            disabled={loading || !email}
          >
            Link Spouse
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          About My Household
        </Typography>
        <Divider sx={{ my: 2 }} />
        <List>
          <ListItem>
            <ListItemText primary="Household ID" secondary={user?.householdId} />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="My Role"
              secondary={user?.householdId === user?.uid ? 'Household Owner' : 'Member'}
            />
          </ListItem>
        </List>
      </Paper>

      <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)}>
        <Alert onClose={() => setOpen(false)} severity={message.severity} sx={{ width: '100%' }}>
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
