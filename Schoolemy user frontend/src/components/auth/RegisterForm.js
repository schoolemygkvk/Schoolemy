

import React, { useState } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, InputAdornment } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const RegisterForm = ({ onRegisterSuccess, onError }) => {
  const [formData, setFormData] = useState({ emailOrMobile: '' });
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorText) setErrorText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorText('');

    const emailOrMobile = formData.emailOrMobile.trim();
    if (!emailOrMobile) {
      const msg = "Enter Your Email"
      setErrorText(msg);
      onError(msg);
      setLoading(false);
      return;
    }

    let payload = {};
    if (emailOrMobile.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrMobile)) {
        const msg = "Invalid email format.";
        setErrorText(msg);
        onError(msg);
        setLoading(false);
        return;
      }
      payload = { email: emailOrMobile };
    } else {
      let mobileNumber = emailOrMobile.replace(/[^\d+]/g, '');
      if (/^\d{10}$/.test(mobileNumber)) {
        payload = { mobile: `+91${mobileNumber}` };
      } else if (/^\+91\d{10}$/.test(mobileNumber)) {
        payload = { mobile: mobileNumber };
      } else {
        const msg = "Please enter a valid  a 10-digit mobile number.";
        setErrorText(msg);
        onError(msg);
        setLoading(false);
        return;
      }
    }
    
    try {
      await onRegisterSuccess(payload);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      setErrorText(msg);
      onError && onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Get Started
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Enter your email receive an OTP.
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 2 }}>
        <TextField
          fullWidth
          id="emailOrMobile"
          placeholder=" Enter Your Email"
          name="emailOrMobile"
          autoComplete="username"
          autoFocus
          value={formData.emailOrMobile}
          onChange={handleChange}
          error={!!errorText}
          helperText={errorText}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutlineIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            sx: { borderRadius: '12px' }
          }}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ mt: 2.5, py: 1.5, borderRadius: '12px', fontWeight: '600' }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
        </Button>
      </Box>
    </Box>
  );
};

export default RegisterForm;