import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Paper,
  Stack,
  Alert,
  Divider,
} from '@mui/material';
import {
  VpnKey as VpnKeyIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';

const VerifyOtpForm = ({
  userIdentifier,
  onOtpVerified,
  onError,
  onResendOtp,
}) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [otpSent, setOtpSent] = useState(true);

  // Timer for resend button (60 seconds)
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((timer) => timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle OTP input - only allow 6 digits
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (errorText) setErrorText('');
  };

  // Handle OTP submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');
    setLoading(true);

    // Validate OTP format
    if (!otp) {
      setErrorText('Please enter the OTP');
      onError('Please enter the OTP');
      setLoading(false);
      return;
    }

    if (otp.length !== 6) {
      setErrorText('OTP must be 6 digits');
      onError('OTP must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      // Call parent component's OTP verification handler
      const payload = { ...userIdentifier, otp };
      await onOtpVerified(payload);
    } catch (err) {
      // Enhanced error handling
      let errorMessage = 'OTP verification failed. Please try again.';

      if (err.response?.status === 400) {
        // Bad request - invalid OTP
        errorMessage =
          err.response?.data?.message ||
          'Invalid OTP. Please check and try again.';
      } else if (err.response?.status === 404) {
        // User not found
        errorMessage =
          'User not found. Please sign up first.';
      } else if (err.response?.status === 500) {
        // Server error
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message === 'Network Error') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      console.error('OTP verification error:', err);
      setErrorText(errorMessage);
      onError && onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setResendLoading(true);
    setErrorText('');
    setOtp(''); // Clear current OTP input

    try {
      if (onResendOtp) {
        // Call parent's resend handler
        await onResendOtp(userIdentifier);
      }

      // Start timer
      setResendTimer(60);
      setResendCount((count) => count + 1);
      setOtpSent(true);
    } catch (error) {
      let errorMessage = 'Failed to resend OTP. Please try again.';

      if (error.response?.status === 429) {
        // Rate limited
        errorMessage =
          'Too many attempts. Please wait before trying again.';
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message ||
          'Unable to resend OTP. Please check your email/mobile.';
      } else if (error.response?.status === 404) {
        errorMessage = 'User not found. Please sign up first.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      console.error('Resend OTP error:', error);
      setErrorText(errorMessage);
      onError && onError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const destination = userIdentifier.email || userIdentifier.mobile;
  const canResend = resendTimer === 0;

  return (
    <Paper
      elevation={8}
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: '16px',
        maxWidth: '480px',
        width: '100%',
        mx: 'auto',
        background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
        border: '1px solid #e0e0e0',
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            mb: 2,
          }}
        >
          <VpnKeyIcon sx={{ fontSize: 32, color: 'white' }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Verify OTP
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', mt: 1, lineHeight: 1.6 }}
        >
          Enter the 6-digit code sent to <br />
          <strong>{destination}</strong>
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Error Alert */}
      {errorText && (
        <Alert
          severity={
            errorText.toLowerCase().includes('sent')
              ? 'success'
              : 'error'
          }
          sx={{ mb: 2 }}
          onClose={() => setErrorText('')}
        >
          {errorText}
        </Alert>
      )}

      {/* OTP Input Form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        <TextField
          fullWidth
          label="Enter OTP"
          placeholder="000000"
          value={otp}
          onChange={handleOtpChange}
          inputProps={{
            maxLength: 6,
            inputMode: 'numeric',
            pattern: '[0-9]*',
            style: {
              fontSize: '24px',
              letterSpacing: '8px',
              textAlign: 'center',
              fontWeight: '600',
            },
          }}
          error={!!errorText}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              py: 2,
            },
            mb: 2,
          }}
        />

        {/* Timer Display */}
        {resendTimer > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 2,
              p: 1.5,
              borderRadius: '8px',
              backgroundColor: '#f3f4f6',
            }}
          >
            <TimerIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
            <Typography variant="body2" sx={{ color: '#f59e0b', fontWeight: '600' }}>
              Resend available in {resendTimer}s
            </Typography>
          </Box>
        )}

        {/* Verify Button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || otp.length !== 6}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '16px',
            textTransform: 'none',
            mb: 2,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
        </Button>

        {/* Resend OTP Button */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleResendOtp}
          disabled={!canResend || resendLoading}
          sx={{
            py: 1.5,
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '16px',
            textTransform: 'none',
            borderColor: '#e5e7eb',
            color: canResend ? '#3b82f6' : '#9ca3af',
          }}
        >
          {resendLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            'Resend OTP'
          )}
        </Button>
      </Box>

      {/* Additional Info */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e5e7eb' }}>
        <Stack spacing={1}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            ✓ OTP expires in 2 minutes
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            ✓ Check your spam folder if not received
          </Typography>
          {resendCount > 0 && (
            <Typography variant="caption" sx={{ color: '#f59e0b' }}>
              Resent {resendCount} time{resendCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Success Message */}
      {otp.length === 6 && !errorText && (
        <Box
          sx={{
            mt: 2,
            p: 1,
            borderRadius: '8px',
            backgroundColor: '#d1fae5',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 20, color: '#059669' }} />
          <Typography variant="caption" sx={{ color: '#059669', fontWeight: '600' }}>
            OTP format is valid. Click Verify to proceed.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default VerifyOtpForm;
