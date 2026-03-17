import React, { useState } from "react";
import axios from "../../Utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthProvider";
import { secureStorage } from "../../Utils/security";
import logo from "../../assets/logo.png";
import { FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import AnimatedBackground from "./AnimatedBackground";
import "./login.css";

// Normalize approval flag from API (can be boolean, string, or number)
const isTutorApproved = (value) => {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  // Unknown/missing: caller should decide fallback strategy
  return null;
};

const AdminLogin = () => {
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password reset states
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = email, 2 = OTP+password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const fetchTutorApprovalFromProfile = async (token) => {
    if (!token) return null;
    try {
      const res = await axios.get("/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = res?.data ?? {};
      const p = payload.profile ?? payload.data ?? payload.user ?? payload;
      return isTutorApproved(p?.isApproved);
    } catch (e) {
      return null;
    }
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post("/adminlogin", { email, password }, { noAuth: true });
      const data = response.data;

      if (data.isFirstTime) {
        setShowOtpBox(true);
        setMessage("OTP sent to your email. Please verify.");
      } else {
        // Use the login function from AuthProvider
        login({
          id: data.id,
          token: data.token,
          role: data.role,
          name: data.name,
          ...(data.isApproved !== undefined ? { isApproved: data.isApproved } : {})
        });

        setMessage("Login successful");
        
        // Role-based navigation
        if (data.role === 'tutormanagement') {
          // Check if tutor has approved terms and conditions
          // Force-sync approval into secureStorage (prevents stale/missing values)
          let approvedFromApi = isTutorApproved(data.isApproved);
          if (approvedFromApi === null) {
            approvedFromApi = await fetchTutorApprovalFromProfile(data.token);
          }
          // If still unknown, default to false (force T&C)
          const approvedBool = approvedFromApi === true;
          secureStorage.setItem("isApproved", String(approvedBool));

          // Navigate based on stored value (single source of truth)
          const approved = isTutorApproved(secureStorage.getItem("isApproved"));
          if (!approved) {
            navigate("/schoolemy/tutor-terms-and-conditions");
          } else {
            navigate("/schoolemy/tutor/dashboard");
          }
        } else if (data.role === 'superadmin' || data.role === 'admin') {
          navigate("/schoolemy");
        } else {
          // Default to schoolemy main dashboard for all users
          navigate("/schoolemy");
        }
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post("/verify-otp", { email, otp }, { noAuth: true });
      const { id, token, role, name, isApproved } = response.data;

      // Use the login function from AuthProvider
      login({
        id: id,
        token: token,
        role: role,
        name: name,
        ...(isApproved !== undefined ? { isApproved: isApproved } : {})
      });

      setMessage("OTP verified and login successful");
      setShowOtpBox(false);

      // Role-based navigation after OTP verification
      if (role === 'tutormanagement') {
        // Check if tutor has approved terms and conditions
        // Force-sync approval into secureStorage (prevents stale/missing values)
        let approvedFromApi = isTutorApproved(isApproved);
        if (approvedFromApi === null) {
          approvedFromApi = await fetchTutorApprovalFromProfile(token);
        }
        const approvedBool = approvedFromApi === true;
        secureStorage.setItem("isApproved", String(approvedBool));

        // Navigate based on stored value (single source of truth)
        const approved = isTutorApproved(secureStorage.getItem("isApproved"));
        if (!approved) {
          navigate("/schoolemy/tutor-terms-and-conditions");
        } else {
          navigate("/schoolemy/tutor/dashboard");
        }
      } else if (role === 'superadmin' || role === 'admin') {
        navigate("/schoolemy");
      } else {
        // Default to schoolemy main dashboard for all users
        navigate("/schoolemy");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset request
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      await axios.post("/forgot-password", { email }, { noAuth: true });
      setResetStep(2);
      setMessage("OTP sent to your email. Please check your inbox.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset submission
  const handlePasswordReset = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    // Password strength validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setMessage(
        "Password must contain 8+ characters with uppercase, lowercase, number and special character"
      );
      return;
    }

    setIsLoading(true);
    try {
     await axios.post("/reset-password", { email, otp, password: newPassword, confirmPassword }, { noAuth: true });

      setMessage("Password reset successful! Redirecting to login...");

      // Reset state and return to login
      setTimeout(() => {
        setForgotPassword(false);
        setResetStep(1);
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Password reset failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-page login-page" style={styles.landingPage}>
      {/* Hero Section */}
      <div className="hero-section" style={styles.heroSection}>
        <AnimatedBackground />
        <div className="hero-background" style={styles.heroBackground}></div>
        <div className="hero-content" style={styles.heroContent}>
          <div className="hero-text" style={styles.heroText}>
            <div style={styles.logoContainer}>
              <img src={logo} alt="Schoolemy Logo" style={styles.heroLogo} />
              <span style={styles.logoText}>GKVK</span>
            </div>
            <h1 style={styles.heroTitle}>Welcome to Schoolemy</h1>
            <p style={styles.heroSubtitle}>
              Empowering Education Through Advanced Administration
            </p>
            <div style={styles.heroFeatures}>
              <div style={styles.featureItem} className="feature-item">
                <span style={styles.featureIcon}>📚</span>
                <span>Course Management</span>
              </div>
              <div style={styles.featureItem} className="feature-item">
                <span style={styles.featureIcon}>👥</span>
                <span>Student Portal</span>
              </div>
              <div style={styles.featureItem} className="feature-item">
                <span style={styles.featureIcon}>📊</span>
                <span>Analytics Dashboard</span>
              </div>
                  <div style={styles.featureItem} className="feature-item">
              <span style={styles.featureIcon}>👩‍🏫</span>
                <span>Tutors Portal</span>
              </div>
            </div>
            <div style={styles.heroStats}>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>10K+</span>
                <span style={styles.statLabel}>Students</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>500+</span>
                <span style={styles.statLabel}>Courses</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>100+</span>
                <span style={styles.statLabel}>Instructors</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>50+</span>
                <span style={styles.statLabel}>Tutorss</span>
              </div>
            </div>
          </div>
          
          {/* Login Card */}
          <div className="login-card" style={styles.loginCard}>
            <div className="card-header" style={styles.cardHeader}>
              <div style={styles.cardHeaderIcon}>🔐</div>
              <h2 style={styles.title}>
                {forgotPassword ? "Reset Password" : "Login Access"}
              </h2>
              <p style={styles.subtitle}>
                {forgotPassword
                  ? "Secure password recovery process"
                  : "Sign in to access your dashboard (Admin, Super Admin, or Tutor)"}
              </p>
            </div>

        {/* Login Form */}
        {!forgotPassword && !showOtpBox && (
          <form onSubmit={handleLogin} style={styles.form}>
            <div className="form-group" style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="text"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                disabled={isLoading}
              />
            </div>

            <div className="form-group" style={styles.formGroup}>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>
              <div style={styles.passwordInputContainer}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  style={styles.togglePasswordButton}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={
                isLoading
                  ? { ...styles.button, ...styles.buttonLoading }
                  : styles.button
              }
              disabled={isLoading}
            >
              {isLoading ? (
                <span style={styles.buttonText}>
                  <span className="loading-spinner">⟳</span>
                  Authenticating...
                </span>
              ) : (
                <span style={styles.buttonText}>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        )}

        {/* Initial Login OTP Verification */}
        {showOtpBox && (
          <form
            onSubmit={handleVerifyOtp}
            style={{ ...styles.form, marginTop: "20px" }}
          >
            <div className="form-group" style={styles.formGroup}>
              <label htmlFor="otp" style={styles.label}>
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                style={styles.input}
                disabled={isLoading}
              />
              <p style={styles.otpHelpText}>
                Check your email for the 6-digit code
              </p>
            </div>

            <button
              type="submit"
              style={
                isLoading
                  ? { ...styles.button, ...styles.buttonLoading }
                  : styles.button
              }
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {/* Password Reset Flow */}
        {forgotPassword && (
          <form
            onSubmit={
              resetStep === 1 ? handleForgotPassword : handlePasswordReset
            }
            style={styles.form}
          >
            {/* Back button for step 2 */}
            {resetStep === 2 && (
              <button
                type="button"
                style={styles.backButton}
                onClick={() => setResetStep(1)}
              >
                <FaArrowLeft /> Back
              </button>
            )}

            {/* Step 1: Email input */}
            {resetStep === 1 && (
              <div className="form-group" style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  placeholder="Enter registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                  disabled={isLoading}
                />
                <p style={styles.otpHelpText}>
                  We'll send a verification code to this email
                </p>
              </div>
            )}

            {/* Step 2: OTP and Password */}
            {resetStep === 2 && (
              <>
                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>Verification Code</label>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    style={styles.input}
                    disabled={isLoading}
                  />
                  <p style={styles.otpHelpText}>
                    Check your email for the 6-digit code
                  </p>
                </div>

                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>New Password</label>
                  <div style={styles.passwordInputContainer}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Create new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      style={styles.input}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      style={styles.togglePasswordButton}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <p style={styles.passwordHint}>
                    8+ characters with uppercase, lowercase, number and special
                    character
                  </p>
                </div>

                <div className="form-group" style={styles.formGroup}>
                  <label style={styles.label}>Confirm Password</label>
                  <div style={styles.passwordInputContainer}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={styles.input}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      style={styles.togglePasswordButton}
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              style={
                isLoading
                  ? { ...styles.button, ...styles.buttonLoading }
                  : styles.button
              }
              disabled={isLoading}
            >
              {isLoading
                ? resetStep === 1
                  ? "Sending..."
                  : "Resetting..."
                : resetStep === 1
                ? "Send Verification Code"
                : "Reset Password"}
            </button>
          </form>
        )}

        {/* Message Display */}
        {message && (
          <div
            style={
              message.includes("success") || message.includes("successful")
                ? { ...styles.message, ...styles.successMessage }
                : { ...styles.message, ...styles.errorMessage }
            }
          >
            {message}
          </div>
        )}

            {/* Footer Links */}
            <div style={styles.footer}>
              {!forgotPassword ? (
                <p style={styles.footerText}>
                  Forgot password?{" "}
                  <button
                    type="button"
                    style={styles.footerButton}
                    onClick={(e) => {
                      e.preventDefault();
                      setForgotPassword(true);
                      setResetStep(1);
                      setMessage("");
                    }}
                  >
                    Reset here
                  </button>
                </p>
              ) : resetStep === 1 ? (
                <p style={styles.footerText}>
                  Remember password?{" "}
                  <button
                    type="button"
                    style={styles.footerButton}
                    onClick={(e) => {
                      e.preventDefault();
                      setForgotPassword(false);
                      setMessage("");
                    }}
                  >
                    Return to login
                  </button>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Section */}
      <footer style={styles.landingFooter}>
        <div style={styles.footerContent}>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Schoolemy Admin Platform</h4>
            <h4 style={styles.footerTitle}>GKVK - Gurukula Vidyalaya Kendra</h4>
            <p style={styles.footerText}>
              Transforming education through innovative technology solutions and traditional wisdom.
            </p>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Quick Links</h4>
            <ul style={styles.footerList}>
              <li style={styles.footerListItem}>About Us</li>
              <li style={styles.footerListItem}>Support</li>
              <li style={styles.footerListItem}>Documentation</li>
            </ul>
          </div>
          <div style={styles.footerSection}>
            <h4 style={styles.footerTitle}>Contact</h4>
            <p style={styles.footerText}>schoolemygkvk@gmail.com</p>
            <p style={styles.footerText}>+1 (555) 123-4567</p>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.footerCopyright}>
            © {new Date().getFullYear()} Schoolemy Education Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

// Modern Landing Page CSS styles
const styles = {
  landingPage: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#ffffff",
    position: "relative",
    overflow: "hidden",
  },
  heroSection: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    position: "relative",
    padding: "20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  heroBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)
    `,
    zIndex: 1,
  },
  heroContent: {
    display: "flex",
    maxWidth: "1200px",
    margin: "0 auto",
    width: "100%",
    alignItems: "center",
    gap: "60px",
    zIndex: 2,
    position: "relative",
  },
  heroText: {
    flex: 1,
    maxWidth: "600px",
  },
logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
    marginBottom: "20px",
    /* increase horizontal space (breadth) while keeping logo height unchanged */
    /* let container grow with the (now larger) logo; keep layout flexible */
    minWidth: "480px",
    width: "auto",
    justifyContent: "flex-start",
  },
  heroLogo: {
    /* larger logo: keep height fixed, let width scale automatically */
    height: "110px",
    width: "auto",
    maxWidth: "420px",
    borderRadius: "12px",
    objectFit: "contain",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
    border: "3px solid rgba(255, 255, 255, 0.2)",
  },
  logoText: {
    fontSize: "2.5rem",
    fontWeight: "700",
    color: "#ffffff",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
    letterSpacing: "2px",
  },
  heroTitle: {
    fontSize: "3.5rem",
    fontWeight: "700",
    background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "20px",
    lineHeight: "1.1",
  },
  heroSubtitle: {
    fontSize: "1.25rem",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: "40px",
    lineHeight: "1.6",
  },
  heroFeatures: {
    display: "flex",
    gap: "30px",
    flexWrap: "wrap",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "15px 20px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    fontSize: "14px",
    fontWeight: "500",
  },
  featureIcon: {
    fontSize: "20px",
  },
  heroStats: {
    display: "flex",
    gap: "40px",
    marginTop: "40px",
    flexWrap: "wrap",
  },
  statItem: {
    textAlign: "center",
  },
  statNumber: {
    display: "block",
    fontSize: "2rem",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "5px",
  },
  statLabel: {
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  loginCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.2)",
    width: "100%",
    maxWidth: "420px",
    padding: "40px",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    color: "#1a202c",
  },
  cardHeader: {
    textAlign: "center",
    marginBottom: "30px",
  },
  cardHeaderIcon: {
    fontSize: "2.5rem",
    marginBottom: "15px",
    opacity: "0.8",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1a202c",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
  },
  form: {
    marginTop: "20px",
  },
  formGroup: {
    marginBottom: "20px",
    position: "relative",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "12px 15px",
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    transition: "all 0.3s",
    boxSizing: "border-box",
    backgroundColor: "#f8fafc",
    color: "#1a202c",
    outline: "none",
  },
  passwordInputContainer: {
    position: "relative",
    width: "100%",
  },
  togglePasswordButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    padding: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
  },
  button: {
    width: "100%",
    padding: "16px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 10px 20px rgba(102, 126, 234, 0.3)",
    position: "relative",
    overflow: "hidden",
  },
  buttonLoading: {
    background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  buttonText: {
    color: "white",
  },
  otpHelpText: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "5px",
  },
  passwordHint: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "5px",
  },
  message: {
    padding: "12px 16px",
    borderRadius: "8px",
    marginTop: "20px",
    fontSize: "14px",
    textAlign: "center",
    fontWeight: "500",
  },
  successMessage: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
  },
  errorMessage: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    border: "1px solid #fecaca",
  },
  footer: {
    marginTop: "30px",
    textAlign: "center",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#667eea",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginBottom: "15px",
    padding: 0,
    fontSize: "14px",
    fontWeight: "500",
  },
  footerButton: {
    background: "none",
    border: "none",
    padding: 0,
    font: "inherit",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline",
    color: "#667eea",
    fontWeight: "600",
  },
  // Landing page footer styles
  landingFooter: {
    backgroundColor: "#0f172a",
    padding: "60px 20px 20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  footerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "40px",
    marginBottom: "40px",
  },
  footerSection: {
    color: "#e2e8f0",
  },
  footerTitle: {
    fontSize: "18px",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#ffffff",
  },
  footerText: {
    fontSize: "14px",
    color: "#94a3b8",
    lineHeight: "1.6",
    margin: "0 0 10px 0",
  },
  footerList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  footerListItem: {
    padding: "5px 0",
    color: "#94a3b8",
    fontSize: "14px",
    cursor: "pointer",
    transition: "color 0.3s",
  },
  footerBottom: {
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    paddingTop: "20px",
    textAlign: "center",
  },
  footerCopyright: {
    fontSize: "14px",
    color: "#64748b",
    margin: 0,
  },
  // Responsive styles
  '@media (max-width: 768px)': {
    heroContent: {
      flexDirection: "column",
      textAlign: "center",
      gap: "40px",
    },
    heroTitle: {
      fontSize: "2.5rem",
    },
    heroFeatures: {
      justifyContent: "center",
    },
    loginCard: {
      margin: "20px",
      padding: "30px",
    },
    footerContent: {
      gridTemplateColumns: "1fr",
      gap: "30px",
    },
  },
};

export default AdminLogin;
