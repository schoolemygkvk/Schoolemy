import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  CircularProgress, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  FormLabel, 
  FormControl,
  Paper,
  Typography,
  Fade,
  Slide,
  useTheme,
  alpha
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LockResetIcon from '@mui/icons-material/LockReset';
import { styled } from '@mui/material/styles';

// Styled Components with modern design and effects
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)}, ${alpha(theme.palette.background.paper, 0.8)})`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 12px 48px ${alpha(theme.palette.primary.main, 0.25)}`,
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1.5),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: alpha(theme.palette.background.paper, 0.6),
    '&:hover': {
      transform: 'translateY(-1px)',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px',
      }
    },
    '&.Mui-focused': {
      transform: 'translateY(-1px)',
      background: alpha(theme.palette.primary.main, 0.05),
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: '2px',
        boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.2)}`,
      }
    }
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    }
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1, 2),
  fontSize: '0.9rem',
  fontWeight: 600,
  textTransform: 'none',
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
  },
  '&:active': {
    transform: 'translateY(0px)',
  },
  '&.Mui-disabled': {
    background: alpha(theme.palette.action.disabled, 0.3),
    transform: 'none',
    boxShadow: 'none',
  }
}));

const StyledRadio = styled(Radio)(({ theme }) => ({
  '&.Mui-checked': {
    color: theme.palette.primary.main,
    '& .MuiSvgIcon-root': {
      filter: `drop-shadow(0 0 6px ${alpha(theme.palette.primary.main, 0.4)})`,
    }
  }
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 60,
  height: 60,
  borderRadius: '50%',
  background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.2)})`,
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'rotate(360deg) scale(1.1)',
    background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.main, 0.3)})`,
  }
}));

const ForgotPasswordForm = ({ onOtpRequested, onError }) => {
  const [identifier, setIdentifier] = useState('');
  const [requestWith, setRequestWith] = useState('email'); // 'email' or 'mobile'
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleChange = (e) => {
    setIdentifier(e.target.value);
  };

  const handleRequestTypeChange = (e) => {
    setRequestWith(e.target.value);
    setIdentifier(''); // Reset identifier field on type change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = requestWith === 'email' ? { email: identifier } : { mobile: identifier };
       if (!identifier) {
        onError(`${requestWith === 'email' ? 'Email' : 'Mobile'} is required.`);
        setLoading(false);
        return;
      }
      onOtpRequested(payload); // Pass payload to parent (ForgotPasswordPage)
    } catch (err) {
      onError(err.message || 'Failed to request OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fade in timeout={800}>
      <StyledPaper elevation={0}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <IconWrapper>
            <LockResetIcon 
              sx={{ 
                fontSize: 30, 
                color: 'primary.main',
                filter: `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.3)})`
              }} 
            />
          </IconWrapper>
          
          <Typography 
            variant="h5" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 600,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Reset Password
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            textAlign="center"
            sx={{ mb: 3, maxWidth: '300px' }}
          >
            Choose your preferred method to receive the OTP for password reset
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Slide direction="right" in timeout={600}>
            <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
              <FormLabel 
                component="legend" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: 1.5,
                  fontSize: '0.95rem'
                }}
              >
                Request OTP via:
              </FormLabel>
              <RadioGroup 
                row 
                name="requestType" 
                value={requestWith} 
                onChange={handleRequestTypeChange}
                sx={{
                  '& .MuiFormControlLabel-root': {
                    margin: theme.spacing(0, 2, 0, 0),
                    padding: theme.spacing(1, 2),
                    borderRadius: theme.spacing(1),
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.05),
                      transform: 'translateY(-1px)',
                    }
                  }
                }}
              >
                <FormControlLabel 
                  value="email" 
                  control={<StyledRadio />} 
                  label="Email" 
                />
                {/* <FormControlLabel 
                  value="mobile" 
                  control={<StyledRadio />} 
                  label="Mobile" 
                /> */}
              </RadioGroup>
            </FormControl>
          </Slide>

          <Slide direction="up" in timeout={800}>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              id="identifier"
              label={requestWith === 'email' ? 'Email Address' : 'Mobile Number (with country code)'}
              name="identifier"
              autoComplete={requestWith === 'email' ? 'email' : 'tel'}
              placeholder={requestWith === 'mobile' ? '+1234567890' : 'Enter your email address'}
              autoFocus
              value={identifier}
              onChange={handleChange}
              InputProps={{
                startAdornment: requestWith === 'email' 
                  ? <EmailIcon sx={{ 
                      mr: 1.5, 
                      color: 'primary.main',
                      filter: `drop-shadow(0 0 4px ${alpha(theme.palette.primary.main, 0.3)})`
                    }} />
                  : <PhoneIcon sx={{ 
                      mr: 1.5, 
                      color: 'primary.main',
                      filter: `drop-shadow(0 0 4px ${alpha(theme.palette.primary.main, 0.3)})`
                    }} />,
              }}
              sx={{ mb: 2 }}
            />
          </Slide>
          
          <Slide direction="up" in timeout={1000}>
            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 2, mb: 1 }}
            >
              {loading ? (
                <Box display="flex" alignItems="center" gap={1}>
                  <CircularProgress 
                    size={20} 
                    color="inherit" 
                    sx={{ 
                      filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))'
                    }} 
                  />
                  <Typography variant="button">Sending...</Typography>
                </Box>
              ) : (
                'Send Reset OTP'
              )}
            </StyledButton>
          </Slide>
        </Box>
      </StyledPaper>
    </Fade>
  );
};

export default ForgotPasswordForm;