// src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import StepperComponent from '../auth/common/StepperComponent';
import AuthLayout from '../auth/common/AuthLayout';
import ForgotPasswordForm from '../auth/ForgotPasswordForm';
import VerifyForgotPasswordOtpForm from '../auth/VerifyForgotPasswordOtpForm';
import ResetPasswordForm from '../auth/ResetPasswordForm';

import authService from '../services/authService';
import { Box, Link as MuiLink, Typography } from '@mui/material';

const steps = ['Request OTP', 'Verify OTP', 'Reset Password'];

const ForgotPasswordPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [userIdentifier, setUserIdentifier] = useState({ email: '' });
  const navigate = useNavigate();

  const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);

  const showToastError = (message) => {
    toast.error(message, { position: "top-right" /* ... other options ... */ });
  };
  const showToastSuccess = (message) => {
    toast.success(message, { position: "top-right" /* ... other options ... */ });
  };

  // Step 1: Handle OTP Request
  const handleOtpRequested = async (data) => {
    try {
      const response = await authService.forgotPasswordRequest(data);
      setUserIdentifier(data); // Store email/mobile
      showToastSuccess(response.data.message || "OTP Sent for password reset.");
      handleNext();
    } catch (error) {
      showToastError(error.response?.data?.message || "Failed to send OTP.");
    }
  };

  // Step 2: Handle OTP Verification
  const handleOtpVerified = async (data) => {
    try {
      const response = await authService.verifyForgotPasswordOtp(data);
      showToastSuccess(response.data.message || "OTP Verified Successfully!");
      handleNext();
    } catch (error) {
      showToastError(error.response?.data?.message || "OTP verification failed.");
    }
  };

  // Step 3: Handle Password Reset
  const handlePasswordReset = async (data) => {
    try {
      const response = await authService.resetPassword(data);
      showToastSuccess(response.data.message || "Password reset successfully!");
      toast.info("Redirecting to login...", {
        position: "top-center",
        autoClose: 2000,
        onClose: () => navigate('/login')
      });
    } catch (error) {
      showToastError(error.response?.data?.message || "Password reset failed.");
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <ForgotPasswordForm onOtpRequested={handleOtpRequested} onError={showToastError} />;
      case 1:
        return <VerifyForgotPasswordOtpForm userIdentifier={userIdentifier} onOtpVerified={handleOtpVerified} onError={showToastError} />;
      case 2:
        return <ResetPasswordForm userIdentifier={userIdentifier} onPasswordReset={handlePasswordReset} onError={showToastError} />;
      default:
        return 'Unknown step';
    }
  };

  return (
    <AuthLayout title="Forgot Your Password?">
      <StepperComponent activeStep={activeStep} steps={steps} />
      <Box sx={{ mt: 2, mb: 1 }}>
        {getStepContent(activeStep)}
      </Box>
      <Typography variant="body2" align="center" sx={{ mt: 3 }}>
        Remembered your password?{' '}
        <MuiLink component="button" variant="body2" onClick={() => navigate('/login')}>
          Login here
        </MuiLink>
      </Typography>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;