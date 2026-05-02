import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress, IconButton, InputAdornment, Typography, LinearProgress } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const CreatePasswordForm = ({ onPasswordCreated, onError }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const validation = getPasswordValidation(password);
  const strength = getPasswordStrength(password);
  const strengthInfo = getStrengthLabel(strength);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      onError("Passwords do not match.");
      return;
    }
    if (strength < 80) {
      onError("Password must meet at least 4 out of 5 requirements to be strong enough.");
      return;
    }
    setLoading(true);
    onPasswordCreated({ password });
    setLoading(false);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
       <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Set Your Password
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Create a strong password to secure your account.
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 2 }}>
        <TextField
          fullWidth
          required
          name="password"
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><LockOutlinedIcon fontSize="small" /></InputAdornment>,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {password && (
          <Box sx={{ mt: 1.5 }}>
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
          fullWidth
          required
          margin="normal"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={!!confirmPassword && password !== confirmPassword}
          helperText={!!confirmPassword && password !== confirmPassword ? "Passwords don't match" : ""}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><LockOutlinedIcon fontSize="small" /></InputAdornment>,
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || password !== confirmPassword || strength < 80}
          sx={{ mt: 2.5, py: 1.5, borderRadius: '12px', fontWeight: '600' }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Set Password & Continue'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePasswordForm;