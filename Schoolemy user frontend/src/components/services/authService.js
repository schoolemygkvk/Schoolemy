// src/services/authService.js
import api from '../../service/api';

const register = (data) => {
  return api.post('/register', data);
};

const verifyOtp = (data) => {
  return api.post('/verify-otp', data);
};

const resendOtp = (data) => {
  return api.post('/resend-otp', data);
};

const createPassword = (data) => {
  return api.post('/create-password', data);
};

const saveProfileData = (formData, userIdentifier) => {
  if (userIdentifier.email) formData.append('email', userIdentifier.email);
  if (userIdentifier.mobile) formData.append('mobile', userIdentifier.mobile);
  
  // Change "/form" to "/register-form" here
  return api.post('/form', formData,   { 
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

const login = (data) => {
  return api.post('/login', data);
};

const completeRegistration = (formData) => {
  // This function will send all data to the new single endpoint
  return api.post('/complete-registration', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// --- FORGOT PASSWORD ---
const forgotPasswordRequest = (data) => {
  return api.post('/forgot-password', data);
};

const verifyForgotPasswordOtp = (data) => {
  return api.post('/verify-forgot-password-otp', data);
};

// Renaming frontend function for clarity, maps to backend's ForgotResetPassword
const resetPassword = (data) => {
  return api.post('/reset-password', data);
};
// --- END FORGOT PASSWORD ---


const authService = {
  register,
  verifyOtp,
  resendOtp,
  createPassword,
  saveProfileData,
  login,
  forgotPasswordRequest,
  verifyForgotPasswordOtp,
  resetPassword,
  completeRegistration,
};

export default authService;