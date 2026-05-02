// src/services/authService.js
import api from '../../service/api';

/**
 * SECURITY FIX 3.5.1: Add error handling to all API calls
 * Prevents unhandled promise rejections and provides user-friendly error messages
 */

/**
 * Handle API errors consistently
 * @param {Error} error - The error from axios
 * @param {string} defaultMessage - Default message if error parsing fails
 * @returns {Object} Normalized error response
 */
const handleError = (error, defaultMessage = 'An error occurred') => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || defaultMessage;
  const code = error?.code;

  // Log for debugging (uses logger in production)
  console.error(`[API Error] ${defaultMessage}:`, { status, message, code });

  return {
    success: false,
    error: message,
    code: status,
    statusCode: status,
  };
};

const register = async (data) => {
  try {
    const response = await api.post('/api/v1/users/register', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'Registration failed. Please try again.');
  }
};

const verifyOtp = async (data) => {
  try {
    const response = await api.post('/api/v1/users/verify-otp', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'OTP verification failed. Please try again.');
  }
};

const resendOtp = async (data) => {
  try {
    const response = await api.post('/api/v1/users/resend-otp', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'Failed to resend OTP. Please try again.');
  }
};

const createPassword = async (data) => {
  try {
    const response = await api.post('/api/v1/users/create-password', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'Failed to create password. Please try again.');
  }
};

const saveProfileData = async (formData, userIdentifier) => {
  try {
    if (userIdentifier.email) formData.append('email', userIdentifier.email);
    if (userIdentifier.mobile) formData.append('mobile', userIdentifier.mobile);

    const response = await api.post('/api/v1/users/form', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'Failed to save profile data. Please try again.');
  }
};

const login = async (data) => {
  try {
    const response = await api.post('/api/v1/users/login', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'Login failed. Please check your credentials.');
  }
};

const completeRegistration = async (formData) => {
  try {
    const response = await api.post('/api/v1/users/complete-registration', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'Failed to complete registration. Please try again.');
  }
};

// --- FORGOT PASSWORD ---
const forgotPasswordRequest = async (data) => {
  try {
    const response = await api.post('/api/v1/users/forgot-password', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'Failed to process password reset request. Please try again.');
  }
};

const verifyForgotPasswordOtp = async (data) => {
  try {
    const response = await api.post('/api/v1/users/verify-forgot-password-otp', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'OTP verification failed. Please try again.');
  }
};

const resetPassword = async (data) => {
  try {
    const response = await api.post('/api/v1/users/reset-password', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'Failed to reset password. Please try again.');
  }
};
// --- END FORGOT PASSWORD ---

// SECURITY FIX 3.32.10: Refresh token endpoint
// Called automatically by axios interceptor when access token expires
// Backend returns new access token in httpOnly cookie
// Frontend does NOT need to handle the token - it's automatic
const refreshToken = async () => {
  try {
    const response = await api.post('/api/v1/users/refresh-token');
    // Response contains: { success: true, user: {...}, message: "..." }
    // New access token is in httpOnly cookie (automatic)
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleError(error, 'Token refresh failed. Please login again.');
  }
};

// SECURITY FIX 3.32.9: Logout with server-side token revocation
// Backend endpoint revokes all refresh tokens and clears httpOnly cookies
// Frontend clears any remaining session data
const logout = async () => {
  try {
    const response = await api.post('/api/v1/users/logout');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    // Even if API call fails, treat logout as success
    // We'll clear frontend state regardless
    console.error('Logout error:', error);
    return { success: true };
  }
};

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
  refreshToken,  // SECURITY FIX 3.32.10: Add refresh endpoint
  logout,        // SECURITY FIX 3.32.9: Add logout endpoint
};

export default authService;