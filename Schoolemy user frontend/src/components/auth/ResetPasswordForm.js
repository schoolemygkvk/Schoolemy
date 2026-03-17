

import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  CircularProgress, 
  IconButton, 
  InputAdornment, 
  Typography,
  Paper
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';

const ResetPasswordForm = ({ userIdentifier, onPasswordReset, onError }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
        onError("Password must be at least 8 characters long.");
        return;
    }
    setLoading(true);
    try {
      const payload = { ...userIdentifier, newPassword };
      onPasswordReset(payload);
    } catch (err) {
      onError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Paper 
        elevation={1}
        sx={{ 
          maxWidth: 350,
          width: '100%',
          p: 3,
          borderRadius: 2,
          border: '1px solid #e0e0e0'
        }}
      >
          {/* Icon and Title Section */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <SecurityIcon 
              sx={{ 
                fontSize: '2.5rem', 
                color: '#1976d2',
                mb: 1
              }} 
            />
            
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                color: '#1976d2',
                mb: 1
              }}
            >
              Reset Password
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#666'
              }}
            >
              Create a new password
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              placeholder="Enter new password"
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              placeholder="Confirm new password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleClickShowConfirmPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !newPassword || newPassword !== confirmPassword}
              sx={{ 
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Updating...</span>
                </Box>
              ) : (
                'Update Password'
              )}
            </Button>
          </Box>
        </Paper>
      </Box>
  );
};

export default ResetPasswordForm;