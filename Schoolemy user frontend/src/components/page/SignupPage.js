


import React, { useState } from 'react';
import { Grid, Box, Paper, useMediaQuery, useTheme, Typography, Link as MuiLink } from '@mui/material'; // AuthLayout-ku bathila itha import pannunga
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Unga signup step components and services (ithula entha maathramum illa)
import StepperComponent from '../auth/common/StepperComponent';
import RegisterForm from '../auth/RegisterForm';
import VerifyOtpForm from '../auth/VerifyOtpForm';
import CreatePasswordForm from '../auth/CreatePasswordForm';
import ProfileForm from '../auth/ProfileForm';
import authService from '../services/authService';

const steps = ['Account Setup', 'Verify OTP', 'Set Password', 'Profile Details'];

const SignupPage = () => {
  // Layout-kaga intha hooks theva
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Unga signup flow-oda state and logic (ithu appadiye irukatum)
  const [activeStep, setActiveStep] = useState(0);
  const [userIdentifier, setUserIdentifier] = useState({ email: '', mobile: '' });

  const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);

  const showToastError = (message) => toast.error(message, { position: "top-right" });
  const showToastSuccess = (message) => toast.success(message, { position: "top-right" });
  
  const handleRegister = async (data) => {
    try {
      const response = await authService.register(data);
      setUserIdentifier(data);
      showToastSuccess(response.data.message || "OTP Sent! Check your device.");
      handleNext();
      return response;
    } catch (error) {
        let msg = error.response?.data?.message || error.message || "Registration failed.";
        if (error.response?.status === 409) {
          msg = error.response?.data?.message || 'An account with this identifier already exists. Try logging in or reset your password.';
        }
        showToastError(msg);
    }
  };

  const handleVerifyOtp = async (data) => {
    try {
      const payload = { ...userIdentifier, otp: data.otp };
      const response = await authService.verifyOtp(payload);
      showToastSuccess(response.data.message || "OTP Verified Successfully!");
      handleNext();
    } catch (error) {
      showToastError(error.response?.data?.message || "OTP verification failed.");
    }
  };

  const handleCreatePassword = async (data) => {
    try {
      const payload = { ...userIdentifier, password: data.password };
      const response = await authService.createPassword(payload);
      showToastSuccess(response.data.message || "Password created successfully!");
      handleNext();
    } catch (error) {
      showToastError(error.response?.data?.message || "Password creation failed.");
    }
  };
  
  const handleSaveProfile = async (formDataPayload) => {
    try {
      const response = await authService.saveProfileData(formDataPayload, userIdentifier);
      showToastSuccess(response.data.message || "Profile saved! Signup complete.");
      toast.info("Redirecting to login...", {
        position: "top-center",
        autoClose: 2000,
        onClose: () => navigate('/login')
      });
    } catch (error) {
      showToastError(error.response?.data?.message || "Failed to save profile.");
    }
  };

  const handleResendOtp = async (identifier) => {
    try {
      const response = await authService.resendOtp(identifier);
      if (response.data.success) {
        showToastSuccess(response.data.message || 'New OTP sent successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      showToastError(error.response?.data?.message || error.message || 'Failed to resend OTP. Please try again.');
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <RegisterForm onRegisterSuccess={handleRegister} onError={showToastError} />;
      case 1:
        return <VerifyOtpForm userIdentifier={userIdentifier} onOtpVerified={handleVerifyOtp} onError={showToastError} onResendOtp={handleResendOtp} />;
      case 2:
        return <CreatePasswordForm userIdentifier={userIdentifier} onPasswordCreated={handleCreatePassword} onError={showToastError} />;
      case 3:
        return <ProfileForm userIdentifier={userIdentifier} onProfileSaved={handleSaveProfile} onError={showToastError} />;
      default:
        return 'Unknown step';
    }
  };

  // ----- ITHU THAAN PUTHU LAYOUT (LOGIN PAGE LA IRUNTHU) -----
  return (
    <Grid 
      container 
      component="main" 
      sx={{ 
        height: '100vh',
        minHeight: '100vh',
        overflow: 'hidden'
      }}
    >
      
      {/* 1. LEFT COLUMN: Photo (Ithuthan neenga kettathu) */}
      {!isMobile && (
        <Grid 
          item 
          md={7}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              textAlign: 'center',
              color: '#1e293b',
              maxWidth: '80%'
            }}
          >
            <Box
              component="img"
              sx={{
                maxWidth: '75%',
                maxHeight: '55vh',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                mb: 4,
                objectFit: 'cover',
                border: '3px solid rgba(255, 255, 255, 0.9)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 35px 70px -12px rgba(0, 0, 0, 0.2)'
                }
              }}
              alt="Woman doing yoga with a laptop"
              src="/YOGAGIRL.png"
            />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: '700', 
                mb: 2,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { md: '2.5rem', lg: '3rem' },
                letterSpacing: '-0.02em'
              }}
            >
              Begin Your Wellness Journey
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#64748b',
                fontWeight: '400',
                fontSize: '1.125rem',
                lineHeight: 1.6,
                maxWidth: '400px',
                mx: 'auto'
              }}
            >
              Join our community to find balance, strength, and peace.
            </Typography>
          </Box>
        </Grid>
      )}

      {/* 2. RIGHT COLUMN: Unga Signup Form Flow */}
      <Grid 
        item 
        xs={12} 
        md={5}
        component={Paper} 
        elevation={0} 
        square
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isMobile 
            ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
            : '#ffffff',
          position: 'relative',
          minHeight: '100vh',
          padding: { xs: '16px', sm: '24px', md: '32px' },
          overflowY: 'auto' // Profile form perusa iruntha scroll panna
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: activeStep === 3 ? { xs: '100%', sm: '700px' } : { xs: '100%', sm: '420px' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: { xs: 2, sm: 3, md: 4 },
            px: { xs: 1, sm: 2, md: 0 },
            transition: 'max-width 0.4s ease-in-out',
          }}
        >
          {/* Header */}
          <Box 
            sx={{ 
              textAlign: 'center', 
              mb: { xs: 3, md: 4 },
              width: '100%'
            }}
          >
            <Typography 
              variant={isSmallMobile ? "h5" : "h4"} 
              sx={{ 
                fontWeight: '700',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2rem' },
                letterSpacing: '-0.02em'
              }}
            >
              Create an Account
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', fontSize: { xs: '0.9rem', sm: '1rem' }}}>
              Start your journey with us today
            </Typography>
          </Box>

          {/* Stepper and Form Content Inga varum */}
          <Box
            sx={{
              width: '100%',
            }}
          >
            {activeStep < 3 && ( 
              <StepperComponent activeStep={activeStep} steps={steps} />
            )}
            
            <Box sx={{ mt: 3, mb: 1 }}>
                {getStepContent(activeStep)}
            </Box>
          </Box>

          {/* Keela irukura Login Link */}
          <Typography 
            variant="body2" 
            align="center" 
            sx={{ mt: 4, color: '#64748b' }}
          >
            Already have an account?{' '}
            <MuiLink 
              component="button" 
              variant="body2" 
              onClick={() => navigate('/login')} 
              sx={{ 
                fontWeight: '600',
                color: '#3b82f6',
                '&:hover': { color: '#2563eb' },
              }}
            >
              Sign In
            </MuiLink>
          </Typography>

        </Box>
      </Grid>
    </Grid>
  );
};

export default SignupPage;