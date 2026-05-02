
import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, InputAdornment, Alert } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EmailIcon from '@mui/icons-material/Email';

const RegisterForm = ({ onRegisterSuccess, onError }) => {
  const [formData, setFormData] = useState({ email: '' });
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleChange = (e) => {
    const value = e.target.value.trim();
    setFormData({ ...formData, email: value });
    if (errorText) setErrorText('');
  };

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorText('');

    const email = formData.email.trim();

    // Input validation
    if (!email) {
      const msg = "Please enter your email address";
      setErrorText(msg);
      onError(msg);
      setLoading(false);
      return;
    }

    if (email.length > 255) {
      const msg = "Email is too long. Maximum 255 characters.";
      setErrorText(msg);
      onError(msg);
      setLoading(false);
      return;
    }

    // Email validation
    if (!isValidEmail(email)) {
      const msg = "Please enter a valid email address (example@domain.com)";
      setErrorText(msg);
      onError(msg);
      setLoading(false);
      return;
    }

    const payload = { email: email.toLowerCase() };

    // BACKEND FIX: Proper async error handling
    try {
      setErrorText('');
      await onRegisterSuccess(payload);
    } catch (err) {
      let errorMessage = 'Registration failed. Please try again.';

      // BACKEND FIX: Handle validation errors
      if (err.response?.data?.errors) {
        // Validation error with multiple field errors
        const errors = err.response.data.errors;
        errorMessage = errors.map(e => e.message).join(', ');
      } else if (err.response?.data?.code === 'REGISTER_OTP_PENDING') {
        // User already has pending OTP
        errorMessage = err.response?.data?.message ||
          'An OTP has already been sent. Please verify it first or wait a few minutes before trying again.';
      } else if (err.response?.status === 409) {
        // User already exists
        errorMessage = err.response?.data?.message || 'This account is already registered. Please login.';
      } else if (err.response?.status === 400) {
        // Bad request
        errorMessage = err.response?.data?.message || 'Please check your input and try again.';
      } else if (err.response?.status === 429) {
        // Rate limited
        errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
      } else if (err.response?.status === 500) {
        // Server error
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      console.error('Registration error:', err);
      setErrorText(errorMessage);
      onError && onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Create Your Account
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Enter your email address to get started
        </Typography>
      </Box>

      {/* Error Alert */}
      {errorText && (
        <Alert severity="error" onClose={() => setErrorText('')}>
          {errorText}
        </Alert>
      )}

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
        <TextField
          fullWidth
          id="email"
          placeholder="you@example.com"
          name="email"
          autoComplete="email"
          autoFocus
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={!!errorText}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || !formData.email}
          sx={{
            mt: 2.5,
            py: 1.5,
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '16px',
            textTransform: 'none',
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
        </Button>
      </Box>

      {/* Instructions */}
      <Box sx={{ mt: 2, p: 1.5, borderRadius: '8px', backgroundColor: '#f3f4f6' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
          ℹ️ We'll send you a one-time password (OTP) to verify your account.
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Make sure you have access to your email address.
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterForm;