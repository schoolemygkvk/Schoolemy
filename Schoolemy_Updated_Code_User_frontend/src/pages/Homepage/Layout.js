// src/pages/Layout.js

import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

// Material UI Components
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Link as MuiLink,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Toast Notifications
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth Form Components
import LoginForm from "../../components/auth/LoginForm";
import RegisterForm from "../../components/auth/RegisterForm";
import VerifyOtpForm from "../../components/auth/VerifyOtpForm";
import CreatePasswordForm from "../../components/auth/CreatePasswordForm";
import NewProfileForm from "../../components/auth/NewProfileForm";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
import VerifyForgotPasswordOtpForm from "../../components/auth/VerifyForgotPasswordOtpForm";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import StepperComponent from "../../components/auth/common/StepperComponent";

// Auth Service
import authService from "../../components/services/authService";

// Floating Ad Component
import FloatingAd from "../../components/page/FloatingAd";
import { useResumePaymentAfterLogin } from "../../components/Payment/ProtectedPaymentRoute";

// Custom Toast Styles CSS
import styled from "styled-components";

const CustomToastStyles = `
  .Toastify__toast-container {
    padding: 0;
    width: auto;
    max-width: 420px;
    min-width: 320px;
  }
  
  .Toastify__toast {
    font-family: 'Poppins', sans-serif;
    border-radius: 12px;
    padding: 0;
    margin-bottom: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1);
    border: none;
    min-height: 64px;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }
  
  .Toastify__toast--success {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    border-left: 4px solid #047857;
  }
  
  .Toastify__toast--error {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
    border-left: 4px solid #B91C1C;
  }
  
  .Toastify__toast--info {
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    border-left: 4px solid #1D4ED8;
  }
  
  .Toastify__toast--warning {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    border-left: 4px solid #B45309;
  }
  
  .Toastify__toast-body {
    padding: 16px 20px;
    color: #ffffff;
    font-weight: 600;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 12px;
    line-height: 1.5;
  }
  
  .Toastify__toast::before {
    display: none;
  }
  
  .Toastify__close-button {
    color: #ffffff;
    opacity: 0.8;
    transition: all 0.2s ease;
    align-self: flex-start;
    margin-top: 4px;
  }
  
  .Toastify__close-button:hover {
    opacity: 1;
    transform: scale(1.1);
  }
  
  .Toastify__progress-bar {
    height: 4px;
  }
  
  .Toastify__progress-bar--success {
    background: linear-gradient(90deg, #047857, #10B981);
  }
  
  .Toastify__progress-bar--error {
    background: linear-gradient(90deg, #B91C1C, #EF4444);
  }
  
  .Toastify__progress-bar--info {
    background: linear-gradient(90deg, #1D4ED8, #3B82F6);
  }
  
  .Toastify__progress-bar--warning {
    background: linear-gradient(90deg, #B45309, #F59E0B);
  }
  
  .Toastify__toast svg {
    fill: #ffffff !important;
    color: #ffffff !important;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    width: 24px;
    height: 24px;
  }
  
  @media (max-width: 480px) {
    .Toastify__toast-container {
      max-width: 100%;
      left: 8px;
      right: 8px;
    }
    
    .Toastify__toast-body {
      font-size: 0.95rem;
      padding: 14px 16px;
    }
  }
`;

// Professional Theme Configuration
const theme = {
  colors: { 
    primary: "#000000",
    secondary: "#2c2c2c",
    text: "#000000",
    textSecondary: "#666666"
  },
  font: "'Poppins', sans-serif",
};

// Inject Custom Toast Styles
const style = document.createElement("style");
style.textContent = CustomToastStyles;
document.head.appendChild(style);


const SuccessModal = ({ open, onClose, title, message, buttonText, theme }) => {
  const getIcon = () => {
    if (title.includes("Registration") || title.includes("Login")) {
      return (
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (title.includes("OTP")) {
      return (
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8L11 13L19 8M3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: { xs: "20px", sm: "24px" },
          p: { xs: 1.75, sm: 2.5 },
          m: { xs: 1.5, sm: 2 },
          width: "100%",
          maxWidth: { xs: 340, sm: 380 },
          background:
            "radial-gradient(circle at top left, #ECFEFF 0%, #F0F9F6 30%, #EEF2FF 70%, #E0F2FE 100%)",
          boxShadow:
            "0 16px 36px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(148, 163, 184, 0.2)",
          border: "1px solid rgba(191, 219, 254, 0.6)",
          position: "relative",
          overflow: "hidden",
        }
      }}
    >
      {/* Background Decorative Elements */}
      <Box
        sx={{
          position: "absolute",
          top: { xs: -40, sm: -50 },
          right: { xs: -40, sm: -50 },
          width: { xs: 140, sm: 180 },
          height: { xs: 140, sm: 180 },
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, transparent 72%)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: { xs: 1.5, sm: 2 },
          position: "relative",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        {/* Static Success Icon */}
        <Box
          sx={{
            width: { xs: 56, sm: 68 },
            height: { xs: 56, sm: 68 },
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(59, 130, 246, 0.10), rgba(16, 185, 129, 0.10))",
            border: "2px solid rgba(191, 219, 254, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#15803D",
            "& svg": { width: { xs: 28, sm: 34 }, height: { xs: 28, sm: 34 } },
          }}
        >
          {getIcon()}
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#0F172A",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
          }}
        >
          {title}
        </Typography>

        {/* Message */}
        <Typography
          variant="body2"
          sx={{
            color: "#1F2933",
            fontSize: { xs: "0.8rem", sm: "0.9rem" },
            lineHeight: 1.55,
            fontWeight: 400,
            maxWidth: { xs: "100%", sm: "320px" },
            px: { xs: 0.5, sm: 0 },
          }}
        >
          {message}
        </Typography>

        {/* Primary Action Button */}
        <Button
          fullWidth
          onClick={onClose}
          sx={{
            mt: { xs: 1, sm: 1.5 },
            py: { xs: 1.25, sm: 1.5 },
            px: { xs: 2, sm: 3 },
            background:
              "linear-gradient(135deg, #2563EB 0%, #7C3AED 45%, #10B981 100%)",
            color: "#F9FAFB",
            fontWeight: 700,
            fontSize: { xs: "0.875rem", sm: "0.95rem" },
            borderRadius: "12px",
            border: "none",
            letterSpacing: "0.5px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 16px 30px rgba(37, 99, 235, 0.35)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent)",
              transition: "left 0.6s ease",
            },

            "&:hover::before": {
              left: "100%",
            },

            "&:hover": {
              transform: "translateY(-4px) scale(1.01)",
              boxShadow: "0 22px 40px rgba(37, 99, 235, 0.45)",
            },

            "&:active": {
              transform: "translateY(-1px) scale(0.99)",
            },
          }}
        >
          {buttonText}
        </Button>

        {/* Decorative Bottom Line */}
        <Box
          sx={{
            width: 32,
            height: 2,
            borderRadius: 1,
            background: "linear-gradient(90deg, transparent, #7FD8BE, transparent)",
            mt: { xs: 1, sm: 1.5 },
          }}
        />
      </Box>
    </Dialog>
  );
};
const LoginModal = ({ open, onClose, onSwitchToSignup, onSwitchToForgotPassword, onSuccess }) => {
  return ( <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px", m: 2, maxWidth: "900px", background: "linear-gradient(135deg, #F0F9F6 0%, #F5F8FF 100%)", boxShadow: "0 12px 32px rgba(31, 61, 43, 0.08), 0 4px 12px rgba(31, 61, 43, 0.04)", border: "1px solid rgba(168, 213, 186, 0.2)" } }}> <IconButton onClick={onClose} sx={{ position: "absolute", right: 8, top: 8, zIndex: 10, color: "#7FD8BE" }}> <CloseIcon /> </IconButton> <Box sx={{ display: "flex", flexDirection: { xs: "column-reverse", sm: "row" } }}> <Box sx={{ width: { xs: "100%", sm: "50%" }, p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", justifyContent: "center", background: "linear-gradient(135deg, #F0F9F6 0%, #F5F8FF 100%)" }}> <LoginForm onLoginSuccess={onSuccess} onSwitchToForgotPassword={onSwitchToForgotPassword} /> <Typography variant="body2" align="center" sx={{ mt: 3, color: "#3F6B52" }}> Don't have an account?{" "} <MuiLink component="button" variant="body2" onClick={onSwitchToSignup} sx={{ fontWeight: "bold", fontSize: "1rem", color: "#7FD8BE" }}> Sign Up </MuiLink> </Typography> </Box> <Box sx={{ width: { xs: "100%", sm: "50%" }, height: { xs: "250px", sm: "auto" } }}> <Box component="img" src="/yoga2.jpg" alt="Woman doing yoga" sx={{ width: "100%", height: "100%", objectFit: "cover", borderTopRightRadius: "16px", borderBottomRightRadius: "16px", borderTopLeftRadius: { xs: "16px", sm: 0 }, borderBottomLeftRadius: { xs: "16px", sm: 0 }, }} /> </Box> </Box> </Dialog> );
};
const SignupModal = ({ open, onClose, onSwitchToLogin, onSignupSuccess }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [registrationData, setRegistrationData] = useState({ email: "", mobile: "", password: "" });
    const steps = ["Account Setup", "Verify OTP", "Set Password", "Profile Details"];
    const handleNext = () => setActiveStep((prev) => prev + 1);
    const resetModal = () => { setActiveStep(0); setRegistrationData({ email: "", mobile: "", password: "" }); onClose(); };
    const showToastError = (message) => toast.error(message, { position: "top-right" });
    const showToastSuccess = (message) => toast.success(message, { position: "top-right" });
    const handleRegister = async (data) => {
      try {
        const response = await authService.register(data);
        setRegistrationData(prev => ({ ...prev, ...data }));
        showToastSuccess(response.data.message || "OTP Sent!");
        handleNext();
      } catch (error) {
        showToastError(error.response?.data?.message || "Registration failed.");
      }
    };
    // SECURITY FIX 3.19.2: OTP verification must happen on server, not in browser
    // Client-side comparison allows attackers to modify otpFromBackend in console and bypass verification
    const handleVerifyOtp = async (data) => {
      const userIdentifier = registrationData.email ? { email: registrationData.email } : { mobile: registrationData.mobile };
      const payload = { ...userIdentifier, otp: data.otp };
      const response = await authService.verifyOtp(payload);
      if (!response.success) {
        const msg = response.error || "Invalid OTP. Please try again.";
        showToastError(msg);
        throw new Error(msg);
      }
      showToastSuccess(response.data?.message || "OTP Verified Successfully!");
      handleNext();
    };
    const handleResendOtp = async (userIdentifier) => {
      const response = await authService.resendOtp(userIdentifier);
      if (!response.success) {
        const msg = response.error || "Failed to resend OTP.";
        showToastError(msg);
        throw new Error(msg);
      }
      showToastSuccess(response.data?.message || "New OTP sent!");
    };
    const handleCreatePassword = (data) => { setRegistrationData(prev => ({ ...prev, password: data.password })); showToastSuccess("Password noted. Continue to profile."); handleNext(); };
    const handleSaveProfile = async (profileFormDataPayload) => {
      try {
        profileFormDataPayload.append('password', registrationData.password);
        if (registrationData.email) profileFormDataPayload.append('email', registrationData.email);
        if (registrationData.mobile) profileFormDataPayload.append('mobile', registrationData.mobile);
        await authService.completeRegistration(profileFormDataPayload);
        resetModal();
        onSignupSuccess();
      } catch (error) {
        showToastError(error.response?.data?.message || "Failed to save profile.");
      }
    };
    const getStepContent = (step) => { const userIdentifier = registrationData.email ? { email: registrationData.email } : { mobile: registrationData.mobile }; switch (step) { case 0: return <RegisterForm onRegisterSuccess={handleRegister} onError={showToastError} />; case 1: return <VerifyOtpForm onOtpVerified={handleVerifyOtp} onError={showToastError} userIdentifier={userIdentifier} onResendOtp={handleResendOtp} />; case 2: return <CreatePasswordForm onPasswordCreated={handleCreatePassword} onError={showToastError} />; case 3: return <NewProfileForm onProfileSaved={handleSaveProfile} onError={showToastError} userIdentifier={userIdentifier} />; default: return "Unknown step"; } };
  return ( <Dialog open={open} onClose={resetModal} disableEscapeKeyDown={false} maxWidth={activeStep === 3 ? "sm" : "md"} fullWidth PaperProps={{ sx: { borderRadius: "16px", m: 2, maxWidth: activeStep === 3 ? "700px" : "900px", background: "linear-gradient(135deg, #F0F9F6 0%, #F5F8FF 100%)", boxShadow: "0 12px 32px rgba(31, 61, 43, 0.08), 0 4px 12px rgba(31, 61, 43, 0.04)", border: "1px solid rgba(168, 213, 186, 0.2)", transition: "max-width 0.4s ease-in-out" } }}> <IconButton onClick={resetModal} sx={{ position: "absolute", right: 12, top: 12, zIndex: 10, color: '#7FD8BE' }}> <CloseIcon /> </IconButton> <Box sx={{ display: "flex", flexDirection: { xs: "column-reverse", sm: "row" } }}> <Box sx={{ width: { xs: "100%", sm: activeStep === 3 ? "100%" : "50%" }, p: { xs: 3, sm: 4 }, display: "flex", flexDirection: "column", justifyContent: "center", background: "linear-gradient(135deg, #F0F9F6 0%, #F5F8FF 100%)", transition: "width 0.4s ease-in-out" }}> {activeStep !== 3 && ( <Typography variant="h4" sx={{ fontWeight: "700", textAlign: "center", color: "#7FD8BE", mb: 2 }}> Create Account </Typography> )} <StepperComponent activeStep={activeStep} steps={steps} /> <Box sx={{ mt: 3, mb: 1, minHeight: "250px" }}> {getStepContent(activeStep)} </Box> <Typography variant="body2" align="center" sx={{ mt: 3, color: "#3F6B52" }}> Already have an account?{" "} <MuiLink component="button" variant="body2" onClick={() => { resetModal(); onSwitchToLogin(); }} sx={{ fontWeight: "bold", color: "#7FD8BE" }}> Login </MuiLink> </Typography> </Box> <Box sx={{ display: { xs: activeStep === 3 ? 'none' : 'block', sm: activeStep === 3 ? 'none' : 'block' }, width: { xs: "100%", sm: "50%" }, height: { xs: "250px", sm: "auto" } }}> <Box component="img" src="/yoga5.jpeg" alt="Woman meditating" sx={{ width: "100%", height: "100%", objectFit: "cover", borderTopLeftRadius: "16px", borderTopRightRadius: "16px", borderBottomLeftRadius: { xs: "0px", sm: 0 }, borderBottomRightRadius: { xs: "0px", sm: "16px" }, }} /> </Box> </Box> </Dialog> );
};
const ForgotPasswordModal = ({ open, onClose, onSwitchToLogin }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [userIdentifier, setUserIdentifier] = useState({ email: "", mobile: "" });
    const steps = ["Request OTP", "Verify OTP", "Reset Password"];
    const handleNext = () => setActiveStep((prevActiveStep) => prevActiveStep + 1);
    const resetModal = () => { setActiveStep(0); setUserIdentifier({ email: "", mobile: "" }); onClose(); };
    const showToastError = (message) => toast.error(message, { position: "top-right" });
    const showToastSuccess = (message) => toast.success(message, { position: "top-right" });
    const handleOtpRequested = async (data) => { try { const response = await authService.forgotPasswordRequest(data); setUserIdentifier(data); showToastSuccess(response.data.message || "OTP Sent for password reset."); handleNext(); } catch (error) { showToastError(error.response?.data?.message || "Failed to send OTP."); } };
    const handleOtpVerified = async (data) => {
      const payload = { ...userIdentifier, ...data };
      const response = await authService.verifyForgotPasswordOtp(payload);
      if (!response.success) {
        const msg = response.error || "OTP verification failed.";
        showToastError(msg);
        throw new Error(msg);
      }
      showToastSuccess(response.data?.message || "OTP Verified Successfully!");
      handleNext();
    };
    const handleResendForgotPasswordOtp = async (identifier) => {
      const response = await authService.forgotPasswordRequest(identifier || userIdentifier);
      if (!response.success) {
        const msg = response.error || "Failed to resend OTP.";
        showToastError(msg);
        throw new Error(msg);
      }
      showToastSuccess(response.data?.message || "New OTP sent!");
    };
    const handlePasswordReset = async (data) => { try { const payload = { ...userIdentifier, ...data }; const response = await authService.resetPassword(payload); showToastSuccess(response.data.message || "Password reset successfully!"); toast.info("Redirecting to login...", { position: "top-center", autoClose: 2000, onClose: () => { resetModal(); onSwitchToLogin(); }, }); } catch (error) { showToastError(error.response?.data?.message || "Password reset failed."); } };
    const getStepContent = (step) => {
      switch (step) {
        case 0:
          return <ForgotPasswordForm onOtpRequested={handleOtpRequested} onError={showToastError} />;
        case 1:
          return <VerifyForgotPasswordOtpForm onOtpVerified={handleOtpVerified} onError={showToastError} userIdentifier={userIdentifier} onResendOtp={handleResendForgotPasswordOtp} />;
        case 2:
          return <ResetPasswordForm onPasswordReset={handlePasswordReset} onError={showToastError} userIdentifier={userIdentifier} />;
        default:
          return "Unknown step";
      }
    };
  return ( <Dialog open={open} onClose={resetModal} PaperProps={{ sx: { borderRadius: "16px", width: "100%", maxWidth: "550px", m: 2, background: "linear-gradient(135deg, #F0F9F6 0%, #F5F8FF 100%)", boxShadow: "0 12px 32px rgba(31, 61, 43, 0.08), 0 4px 12px rgba(31, 61, 43, 0.04)", border: "1px solid rgba(168, 213, 186, 0.2)" } }}> <DialogContent sx={{ background: "linear-gradient(135deg, #F0F9F6 0%, #F5F8FF 100%)" }}> <Typography variant="h5" sx={{ fontWeight: "600", pb: 1, textAlign: "center", color: "#1A3A2A" }}> Forgot Your Password? <IconButton onClick={resetModal} sx={{ position: "absolute", right: 12, top: 12, color: '#7FD8BE' }}> <CloseIcon /> </IconButton> </Typography> <StepperComponent activeStep={activeStep} steps={steps} /> <Box sx={{ mt: 2, mb: 1, minHeight: "200px" }}> {getStepContent(activeStep)} </Box> <Typography variant="body2" align="center" sx={{ mt: 3, color: "#3F6B52" }}> Remembered your password?{" "} <MuiLink component="button" variant="body2" onClick={() => { resetModal(); onSwitchToLogin(); }} sx={{ fontWeight: "500", color: "#7FD8BE" }}> Login here </MuiLink> </Typography> </DialogContent> </Dialog> );
};

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resumePaymentAfterLogin = useResumePaymentAfterLogin();

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [signupSuccessModalOpen, setSignupSuccessModalOpen] = useState(false);
  const [loginSuccessModalOpen, setLoginSuccessModalOpen] = useState(false);

  const handleOpenLogin = () => setLoginModalOpen(true);
  const handleCloseLogin = () => setLoginModalOpen(false);
  const handleOpenSignup = () => setSignupModalOpen(true);
  const handleCloseSignup = () => setSignupModalOpen(false);
  const handleOpenForgotPassword = () => setForgotPasswordModalOpen(true);
  const handleCloseForgotPassword = () => setForgotPasswordModalOpen(false);

  const switchToSignup = () => { handleCloseLogin(); handleCloseForgotPassword(); handleOpenSignup(); };
  const switchToLogin = () => { handleCloseSignup(); handleCloseForgotPassword(); handleOpenLogin(); };
  const switchToForgotPassword = () => { handleCloseLogin(); handleOpenForgotPassword(); };

  const handleSignupSuccess = () => { handleCloseSignup(); setSignupSuccessModalOpen(true); };
  const handleCloseSignupSuccessModal = () => { setSignupSuccessModalOpen(false); switchToLogin(); };

  /* Open login/signup modals from ?auth=login|signup (replaces standalone /login and /signup pages). */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const auth = params.get("auth");
    if (auth !== "login" && auth !== "signup") return;

    if (auth === "login") setLoginModalOpen(true);
    if (auth === "signup") setSignupModalOpen(true);

    params.delete("auth");
    params.delete("redirect");
    const rest = params.toString();
    navigate(
      { pathname: location.pathname, search: rest ? `?${rest}` : "" },
      { replace: true },
    );
  }, [location.search, location.pathname, navigate]);

  const handleLoginSuccess = () => {
    handleCloseLogin();
    try {
      const raw = sessionStorage.getItem("paymentIntent");
      if (raw) {
        const pi = JSON.parse(raw);
        const ageMin = (Date.now() - (pi.timestamp || 0)) / (1000 * 60);
        if (ageMin <= 30 && pi.redirectFrom) {
          resumePaymentAfterLogin();
          return;
        }
      }
    } catch (e) {
      console.warn("Payment intent resume check failed", e);
    }
    setLoginSuccessModalOpen(true);
  };
  
  const handleCloseLoginSuccessModal = () => {
    setLoginSuccessModalOpen(false);
    // No full reload: AuthContext already updated userData/isLoggedIn on login
  };

  return (
    <div style={{ fontFamily: theme.font, backgroundColor: "white" }}>
      <ToastContainer 
        position="top-right" 
        autoClose={3500} 
        hideProgressBar={false} 
        newestOnTop={true} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="colored"
        style={{
          zIndex: 9999,
          marginTop: '60px'
        }}
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
        progressClassName="custom-toast-progress"
      />
      <Header onLoginClick={handleOpenLogin} theme={theme} />
      <main style={{ minHeight: "80vh" }}>
        <Outlet context={{ onSignUpClick: switchToSignup, onLoginClick: handleOpenLogin }} />
      </main>
      <Footer theme={theme} />
      <FloatingAd />
      <LoginModal
        open={loginModalOpen}
        onClose={handleCloseLogin}
        onSwitchToSignup={switchToSignup}
        onSwitchToForgotPassword={switchToForgotPassword}
        onSuccess={handleLoginSuccess}
      />
      <SignupModal
        open={signupModalOpen}
        onClose={handleCloseSignup}
        onSwitchToLogin={switchToLogin}
        onSignupSuccess={handleSignupSuccess}
      />
      <ForgotPasswordModal
        open={forgotPasswordModalOpen}
        onClose={handleCloseForgotPassword}
        onSwitchToLogin={switchToLogin}
      />
      
      <SuccessModal 
        open={signupSuccessModalOpen}
        onClose={handleCloseSignupSuccessModal}
        title="Registration Successful!"
        message="Your account has been created successfully. You can now log in to explore our comprehensive courses and start your learning journey with us."
        buttonText="Go to Login"
        theme={theme}
      />

      <SuccessModal 
        open={loginSuccessModalOpen}
        onClose={handleCloseLoginSuccessModal}
        title="Login Successful!"
        message="Welcome back! You're now logged in and ready to continue your learning journey. Start exploring amazing courses today."
        buttonText="Continue Exploring"
        theme={theme}
      />
    </div>
  );
};

export default Layout;