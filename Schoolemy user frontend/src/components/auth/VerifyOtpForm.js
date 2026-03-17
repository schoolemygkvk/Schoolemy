
// import React, { useState } from 'react';
// import { 
//   Box, 
//   TextField, 
//   Button, 
//   CircularProgress, 
//   Typography,
//   Paper,
//   Stack,
//   Fade,
//   Slide,
//   IconButton,
//   Divider
// } from '@mui/material';
// import { 
//   VpnKey as VpnKeyIcon,
//   CheckCircle as CheckCircleIcon,
//   Refresh as RefreshIcon,
//   ArrowBack as ArrowBackIcon
// } from '@mui/icons-material';
// import api from '../../service/api';

// const VerifyOtpForm = ({ userIdentifier, onOtpVerified, onError, onBack, onResendOtp }) => {
//   const [otp, setOtp] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [otpSent, setOtpSent] = useState(true);
//   const [resendLoading, setResendLoading] = useState(false);
//   const [resendTimer, setResendTimer] = useState(0);

//   // Timer for resend button
//   React.useEffect(() => {
//     let interval = null;
//     if (resendTimer > 0) {
//       interval = setInterval(() => {
//         setResendTimer(timer => timer - 1);
//       }, 1000);
//     } else if (resendTimer === 0) {
//       clearInterval(interval);
//     }
//     return () => clearInterval(interval);
//   }, [resendTimer]);

//   const handleChange = (e) => {
//     const value = e.target.value.replace(/\D/g, ''); // Only allow digits
//     if (value.length <= 6) {
//       setOtp(value);
//     }
//   };

//   const handleResendOtp = async () => {
//     setResendLoading(true);
//     setOtp(''); // Clear current OTP
//     try {
//       if (onResendOtp) {
//         await onResendOtp(userIdentifier);
//         setResendTimer(60); // Start 60 second timer
//         setOtpSent(true);
//       } else {
//         // Default behavior - call API directly using the configured api instance
//         const response = await api.post('/resend-otp', userIdentifier);
        
//         if (response.data.success) {
//           setResendTimer(60);
//           setOtpSent(true);
//         } else {
//           throw new Error(response.data.message || 'Failed to resend OTP');
//         }
//       }
//     } catch (error) {
//       console.error('Resend OTP Error:', error);
//       onError && onError(error.response?.data?.message || error.message || 'Failed to resend OTP. Please try again.');
//     } finally {
//       setResendLoading(false);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const payload = { ...userIdentifier, otp };
//       onOtpVerified(payload);
//     } catch (err) {
//       onError(err.message || 'OTP verification failed.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Fade in={true} timeout={800}>
//       <Slide direction="up" in={true} timeout={600}>
//         <Paper 
//           elevation={24} 
//           sx={{ 
//             maxWidth: 480,
//             width: '100%',
//             mx: 'auto',
//             p: { xs: 3, sm: 5 },
//             borderRadius: 4,
//             background: 'linear-gradient(145deg, #ffffff 0%, #f0f8ff 100%)',
//             boxShadow: '0 20px 60px rgba(30, 144, 255, 0.1), 0 8px 25px rgba(30, 144, 255, 0.08)',
//             backdropFilter: 'blur(10px)',
//             border: '1px solid rgba(135, 206, 250, 0.2)',
//             position: 'relative',
//             overflow: 'hidden',
//             '&::before': {
//               content: '""',
//               position: 'absolute',
//               top: 0,
//               left: 0,
//               right: 0,
//               height: '4px',
//               background: 'linear-gradient(90deg, #87ceeb, #4fc3f7, #29b6f6)',
//               borderRadius: '4px 4px 0 0'
//             }
//           }}
//         >
//             {/* Back Button */}
//             {onBack && (
//               <IconButton 
//                 onClick={onBack}
//                 sx={{ 
//                   position: 'absolute',
//                   top: 16,
//                   left: 16,
//                   color: 'text.secondary',
//                   '&:hover': {
//                     color: '#1976d2',
//                     transform: 'translateX(-2px)'
//                   },
//                   transition: 'all 0.2s ease'
//                 }}
//               >
//                 <ArrowBackIcon />
//               </IconButton>
//             )}

//             {/* Header Section */}
//             <Box sx={{ textAlign: 'center', mb: 4, mt: onBack ? 2 : 0 }}>
//               <Box sx={{ 
//                 display: 'inline-flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 width: 72,
//                 height: 72,
//                 borderRadius: '50%',
//                 background: 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)',
//                 mb: 3,
//                 boxShadow: '0 8px 32px rgba(79, 195, 247, 0.3)'
//               }}>
//                 <VpnKeyIcon sx={{ 
//                   fontSize: 32, 
//                   color: 'white',
//                   filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
//                 }} />
//               </Box>
              
//               <Typography 
//                 variant="h4" 
//                 component="h1" 
//                 gutterBottom 
//                 sx={{ 
//                   fontFamily: 'Inter, sans-serif',
//                   fontWeight: 700,
//                   background: 'linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%)',
//                   backgroundClip: 'text',
//                   WebkitBackgroundClip: 'text',
//                   WebkitTextFillColor: 'transparent',
//                   mb: 1,
//                   fontSize: { xs: '1.8rem', sm: '2.125rem' }
//                 }}
//               >
//                 Verify Your Account
//               </Typography>
              
//               <Typography 
//                 variant="body1" 
//                 sx={{ 
//                   color: 'text.secondary',
//                   fontFamily: 'Inter, sans-serif',
//                   fontWeight: 400,
//                   lineHeight: 1.6,
//                   maxWidth: '320px',
//                   mx: 'auto'
//                 }}
//               >
//                 We've sent a 6-digit verification code to{' '}
//                 <Typography component="span" sx={{ 
//                   fontWeight: 600, 
//                   color: '#1976d2',
//                   fontFamily: 'Inter, sans-serif'
//                 }}>
//                   {userIdentifier.email || userIdentifier.mobile}
//                 </Typography>
//               </Typography>
//             </Box>
            
//             <Divider sx={{ mb: 4, opacity: 0.1 }} />

//             <Box component="form" onSubmit={handleSubmit}>
//               <TextField
//                 margin="normal"
//                 required
//                 fullWidth
//                 id="otp"
//                 label="Enter Verification Code"
//                 name="otp"
//                 autoFocus
//                 value={otp}
//                 onChange={handleChange}
//                 inputProps={{ 
//                   maxLength: 6,
//                   style: { 
//                     textAlign: 'center', 
//                     fontSize: '1.5rem',
//                     fontFamily: 'Inter, sans-serif',
//                     fontWeight: 600,
//                     letterSpacing: '0.5rem'
//                   }
//                 }}
//                 sx={{ 
//                   mb: 3,
//                   '& .MuiOutlinedInput-root': {
//                     borderRadius: 3,
//                     height: '64px',
//                     fontFamily: 'Inter, sans-serif',
//                     transition: 'all 0.3s ease',
//                     backgroundColor: 'rgba(79, 195, 247, 0.02)',
//                     '&:hover': {
//                       backgroundColor: 'rgba(79, 195, 247, 0.04)',
//                       transform: 'translateY(-1px)',
//                       boxShadow: '0 8px 25px rgba(79, 195, 247, 0.15)'
//                     },
//                     '&.Mui-focused': {
//                       backgroundColor: 'rgba(79, 195, 247, 0.04)',
//                       transform: 'translateY(-1px)',
//                       boxShadow: '0 8px 25px rgba(79, 195, 247, 0.2)'
//                     }
//                   },
//                   '& .MuiInputLabel-root': {
//                     fontFamily: 'Inter, sans-serif',
//                     fontWeight: 500
//                   }
//                 }}
//                 InputProps={{
//                   startAdornment: (
//                     <VpnKeyIcon sx={{ 
//                       mr: 2, 
//                       color: '#1976d2',
//                       opacity: 0.7
//                     }} />
//                   ),
//                 }}
//               />
              
//               <Button
//                 type="submit"
//                 fullWidth
//                 variant="contained"
//                 size="small"
//                 sx={{ 
//                   py: 1,
//                   borderRadius: 2,
//                   fontSize: '0.9rem',
//                   fontWeight: 600,
//                   fontFamily: 'Inter, sans-serif',
//                   textTransform: 'none',
//                   background: 'linear-gradient(135deg, #87ceeb 0%, #b3d9f2 100%)',
//                   boxShadow: '0 4px 16px rgba(135, 206, 235, 0.2)',
//                   border: 'none',
//                   transition: 'all 0.3s ease',
//                   '&:hover': {
//                     transform: 'translateY(-1px)',
//                     boxShadow: '0 6px 20px rgba(135, 206, 235, 0.3)',
//                     background: 'linear-gradient(135deg, #7ec8e3 0%, #a8d0e8 100%)'
//                   },
//                   '&:active': {
//                     transform: 'translateY(0px)'
//                   },
//                   '&:disabled': {
//                     background: 'linear-gradient(135deg, #f0f8ff 0%, #e1f0fa 100%)',
//                     color: 'text.disabled',
//                     transform: 'none',
//                     boxShadow: 'none'
//                   },
//                   mb: 3
//                 }}
//                 disabled={loading || otp.length < 6}
//                 startIcon={loading ? null : <CheckCircleIcon />}
//               >
//                 {loading ? (
//                   <CircularProgress 
//                     size={24} 
//                     sx={{ 
//                       color: 'white',
//                       filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
//                     }} 
//                   />
//                 ) : (
//                   'Verify Code'
//                 )}
//               </Button>
              
//               <Divider sx={{ mb: 3, opacity: 0.1 }} />
              
//               <Box sx={{ textAlign: 'center' }}>
//                 <Typography 
//                   variant="body2" 
//                   sx={{ 
//                     color: 'text.secondary',
//                     fontFamily: 'Inter, sans-serif',
//                     mb: 2
//                   }}
//                 >
//                   Didn't receive the code?
//                 </Typography>
                
//                 <Button
//                   variant="outlined"
//                   size="small"
//                   onClick={handleResendOtp}
//                   disabled={resendLoading || resendTimer > 0}
//                   startIcon={resendLoading ? null : <RefreshIcon />}
//                   sx={{ 
//                     fontWeight: 600,
//                     fontFamily: 'Inter, sans-serif',
//                     textTransform: 'none',
//                     borderRadius: 2,
//                     borderColor: '#87ceeb',
//                     color: '#5eb5d4',
//                     px: 2.5,
//                     py: 0.75,
//                     transition: 'all 0.3s ease',
//                     '&:hover': {
//                       borderColor: '#7ec8e3',
//                       backgroundColor: 'rgba(135, 206, 235, 0.08)',
//                       transform: 'translateY(-1px)',
//                       boxShadow: '0 3px 8px rgba(135, 206, 235, 0.15)'
//                     },
//                     '&:disabled': {
//                       borderColor: '#e1f0fa',
//                       color: '#a8d0e8',
//                       transform: 'none',
//                       boxShadow: 'none'
//                     }
//                   }}
//                 >
//                   {resendLoading ? (
//                     <CircularProgress size={20} sx={{ color: '#5eb5d4' }} />
//                   ) : resendTimer > 0 ? (
//                     `Resend in ${resendTimer}s`
//                   ) : (
//                     'Resend Code'
//                   )}
//                 </Button>

//                 {resendTimer > 0 && (
//                   <Typography 
//                     variant="caption" 
//                     sx={{ 
//                       display: 'block',
//                       mt: 1,
//                       color: 'text.secondary',
//                       fontFamily: 'Inter, sans-serif'
//                     }}
//                   >
//                     New verification code will be sent
//                   </Typography>
//                 )}
//               </Box>
//             </Box>
//         </Paper>
//       </Slide>
//     </Fade>
//   );
// };

// export default VerifyOtpForm;
// src/components/auth/VerifyOtpForm.js

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Link } from '@mui/material';

const VerifyOtpForm = ({ userIdentifier, onOtpVerified, onError, onResendOtp }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(timer => timer - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await onResendOtp(userIdentifier);
      setResendTimer(30);
    } catch (err) {
      // Error handled in parent
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length < 6) {
      onError('Please enter a 6-digit OTP.');
      return;
    }
    setLoading(true);
    // onOtpVerified is now a synchronous function in Layout.js
    onOtpVerified({ otp });
    setLoading(false);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Verify Your Account
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          We've sent a 6-digit code to <br />
          <Typography component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            {userIdentifier.email || userIdentifier.mobile}
          </Typography>
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 2 }}>
        <TextField
          fullWidth
          id="otp"
          placeholder="6-Digit Code"
          name="otp"
          autoFocus
          value={otp}
          onChange={handleChange}
          inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || otp.length < 6}
          sx={{ mt: 2.5, py: 1.5, borderRadius: '12px', fontWeight: '600' }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Code'}
        </Button>
      </Box>

      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
        Didn't receive the code?{' '}
        {resendTimer > 0 ? (
          <Typography component="span" sx={{ color: 'text.secondary' }}>
            Resend in {resendTimer}s
          </Typography>
        ) : (
          <Link component="button" variant="body2" onClick={handleResend} disabled={resendLoading}>
            {resendLoading ? 'Sending...' : 'Resend Code'}
          </Link>
        )}
      </Typography>
    </Box>
  );
};

export default VerifyOtpForm;