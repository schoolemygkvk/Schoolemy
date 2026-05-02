

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Typography,
  Paper,
  LinearProgress
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const ResetPasswordForm = ({ userIdentifier, onPasswordReset, onError }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // SECURITY FIX 3.35.1: Strong password validation matching CreatePasswordForm
  const getPasswordValidation = (p) => {
    return {
      hasMinLength: p.length >= 8,
      hasUpperCase: /[A-Z]/.test(p),
      hasLowerCase: /[a-z]/.test(p),
      hasNumber: /\d/.test(p),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(p),
    };
  };

  const getPasswordStrength = (p) => {
    const validation = getPasswordValidation(p);
    let strength = 0;
    if (validation.hasMinLength) strength += 20;
    if (validation.hasUpperCase) strength += 20;
    if (validation.hasLowerCase) strength += 20;
    if (validation.hasNumber) strength += 20;
    if (validation.hasSpecialChar) strength += 20;
    return strength;
  };

  const getStrengthLabel = (strength) => {
    if (strength === 0) return { label: '', color: '' };
    if (strength < 40) return { label: 'Very Weak', color: '#d32f2f' };
    if (strength < 60) return { label: 'Weak', color: '#f57c00' };
    if (strength < 80) return { label: 'Medium', color: '#fbc02d' };
    if (strength < 100) return { label: 'Strong', color: '#388e3c' };
    return { label: 'Very Strong', color: '#1b5e20' };
  };

  const validation = getPasswordValidation(newPassword);
  const strength = getPasswordStrength(newPassword);
  const strengthInfo = getStrengthLabel(strength);

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (newPassword !== confirmPassword) {
      onError("Passwords do not match.");
      return;
    }
    // SECURITY FIX 3.35.1: Enforce strong password requirements
    if (strength < 80) {
      onError("Password must meet at least 4 out of 5 requirements to be strong enough.");
      return;
    }
    setLoading(true);
    try {
      // Backend resetPasswordValidator requires confirmPassword in the body
      const payload = { ...userIdentifier, newPassword, confirmPassword };
      await onPasswordReset(payload);
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
              sx={{ mb: 1.5 }}
            />

            {/* SECURITY FIX 3.35.1: Show password strength and requirements */}
            {newPassword && (
              <Box sx={{ mt: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Password Strength
                  </Typography>
                  {strengthInfo.label && (
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, color: strengthInfo.color }}
                    >
                      {strengthInfo.label}
                    </Typography>
                  )}
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={strength}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: strengthInfo.color,
                      borderRadius: 3,
                    }
                  }}
                />

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', display: 'block', mb: 1 }}>
                    Password Requirements:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {validation.hasMinLength ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#388e3c' }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                      )}
                      <Typography variant="caption" color={validation.hasMinLength ? 'success.main' : 'error.main'}>
                        At least 8 characters
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {validation.hasUpperCase ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#388e3c' }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                      )}
                      <Typography variant="caption" color={validation.hasUpperCase ? 'success.main' : 'error.main'}>
                        One uppercase letter (A-Z)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {validation.hasLowerCase ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#388e3c' }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                      )}
                      <Typography variant="caption" color={validation.hasLowerCase ? 'success.main' : 'error.main'}>
                        One lowercase letter (a-z)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {validation.hasNumber ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#388e3c' }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                      )}
                      <Typography variant="caption" color={validation.hasNumber ? 'success.main' : 'error.main'}>
                        One number (0-9)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {validation.hasSpecialChar ? (
                        <CheckCircleIcon sx={{ fontSize: 16, color: '#388e3c' }} />
                      ) : (
                        <CancelIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                      )}
                      <Typography variant="caption" color={validation.hasSpecialChar ? 'success.main' : 'error.main'}>
                        One special character (!@#$%^&*...)
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

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
              error={!!confirmPassword && newPassword !== confirmPassword}
              helperText={!!confirmPassword && newPassword !== confirmPassword ? "Passwords don't match" : ""}
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
              disabled={loading || newPassword !== confirmPassword || strength < 80}
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