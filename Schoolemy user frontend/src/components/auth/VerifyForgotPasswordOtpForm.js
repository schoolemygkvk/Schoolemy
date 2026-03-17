
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  CircularProgress, 
  Typography,
  Paper,
  Stack,
  Fade,
  Slide,
  Chip,
  IconButton,
  InputAdornment,
  Alert
} from '@mui/material';
import { 
  VpnKey as VpnKeyIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animated keyframes
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  maxWidth: 400,
  margin: 'auto',
  padding: theme.spacing(3),
  borderRadius: 20,
  background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
  boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.1), 0px 2px 8px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  animation: `${slideUp} 0.6s ease-out`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #1976d2, #42a5f5, #1976d2)',
    backgroundSize: '200% 100%',
    animation: 'gradient-shift 3s ease infinite',
  },
  '@keyframes gradient-shift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

const SecurityIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  '& .security-icon': {
    fontSize: '3rem',
    color: theme.palette.primary.main,
    animation: `${float} 3s ease-in-out infinite`,
    filter: 'drop-shadow(0 2px 4px rgba(25, 118, 210, 0.3))',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
    },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(25, 118, 210, 0.2)',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1.2, 2.5),
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
  boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
  },
  '&:active': {
    transform: 'translateY(-1px)',
  },
  '&.success': {
    background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
    animation: `${pulse} 2s infinite`,
  },
}));

const ResendButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(0.5, 2),
  fontSize: '0.9rem',
  fontWeight: 600,
  textTransform: 'none',
  background: 'linear-gradient(45deg, #ff7043 30%, #ff8a65 90%)',
  color: 'white',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(45deg, #f4511e 30%, #ff7043 90%)',
    transform: 'scale(1.05)',
  },
}));

const CountdownChip = styled(Chip)(({ theme }) => ({
  borderRadius: 12,
  background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
  color: 'white',
  fontWeight: 600,
  animation: `${pulse} 1s infinite`,
}));
const VerifyForgotPasswordOtpForm = ({ userIdentifier, onOtpVerified, onError }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      setAlertMessage('Please enter a 6-digit verification code');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
      return;
    }

    setLoading(true);
    try {
      const payload = { ...userIdentifier, otp };
      setIsSuccess(true);
      setTimeout(() => {
        onOtpVerified(payload);
      }, 1000);
    } catch (err) {
      onError(err.message || 'OTP verification failed.');
      setAlertMessage(err.message || 'OTP verification failed.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 3000);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handleResendOtp = () => {
    setCanResend(false);
    setCountdown(60);
    setOtp('');
    setAlertMessage('New verification code sent!');
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
    // Here you would typically call an API to resend the OTP
  };

  return (
    <Fade in={true} timeout={600}>
      <Box sx={{ 
        padding: 2
      }}>
        <StyledPaper elevation={0}>
          <SecurityIconWrapper>
            <SecurityIcon className="security-icon" />
          </SecurityIconWrapper>
          
          <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5
          }}>
            Verify Your Identity
          </Typography>
          
          <Typography variant="body2" align="center" sx={{ 
            mb: 0.5, 
            color: 'text.secondary',
            fontWeight: 500
          }}>
            Password Reset Verification
          </Typography>
          
          <Typography variant="body2" align="center" sx={{ 
            mb: 3, 
            color: 'text.secondary',
            backgroundColor: 'rgba(25, 118, 210, 0.05)',
            padding: 1.5,
            borderRadius: 1.5,
            border: '1px solid rgba(25, 118, 210, 0.1)',
            fontSize: '0.85rem'
          }}>
            We've sent a 6-digit code to{' '}
            <strong>{userIdentifier.email || userIdentifier.mobile}</strong>
          </Typography>

          {showAlert && (
            <Slide direction="down" in={showAlert} mountOnEnter unmountOnExit>
              <Alert 
                severity={alertMessage.includes('sent') ? 'success' : 'error'}
                sx={{ 
                  mb: 2,
                  borderRadius: 1.5,
                  fontSize: '0.85rem',
                  '& .MuiAlert-icon': {
                    fontSize: '1.2rem'
                  }
                }}
              >
                {alertMessage}
              </Alert>
            </Slide>
          )}
          
          <Box component="form" onSubmit={handleSubmit}>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              id="otp"
              label="Enter 6-Digit Code"
              name="otp"
              autoFocus
              value={otp}
              onChange={handleChange}
              inputProps={{ 
                maxLength: 6,
                style: { 
                  textAlign: 'center', 
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  letterSpacing: '0.4rem'
                }
              }}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKeyIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                endAdornment: otp.length === 6 && (
                  <InputAdornment position="end">
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                  </InputAdornment>
                ),
              }}
              placeholder="000000"
              helperText={`${otp.length}/6 digits entered`}
            />
            
            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              className={isSuccess ? 'success' : ''}
              disabled={loading || otp.length < 6}
              sx={{ mb: 2 }}
            >
              {loading ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={18} color="inherit" />
                  <Typography fontSize="0.9rem">Verifying...</Typography>
                </Stack>
              ) : isSuccess ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircleIcon fontSize="small" />
                  <Typography fontSize="0.9rem">Verified!</Typography>
                </Stack>
              ) : (
                'Verify Code'
              )}
            </StyledButton>
            
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                Didn't receive the code?
              </Typography>
              
              {canResend ? (
                <ResendButton
                  variant="contained"
                  size="small"
                  onClick={handleResendOtp}
                  startIcon={<RefreshIcon fontSize="small" />}
                >
                  Resend
                </ResendButton>
              ) : (
                <CountdownChip
                  label={`${countdown}s`}
                  size="small"
                />
              )}
            </Stack>
            
            <Typography variant="caption" align="center" sx={{ 
              mt: 2, 
              display: 'block',
              color: 'text.secondary',
              opacity: 0.7,
              fontSize: '0.75rem'
            }}>
              🔒 Code expires in 10 minutes
            </Typography>
          </Box>
        </StyledPaper>
      </Box>
    </Fade>
  );
};

export default VerifyForgotPasswordOtpForm;