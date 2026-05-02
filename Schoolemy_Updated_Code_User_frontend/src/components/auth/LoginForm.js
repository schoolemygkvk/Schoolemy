import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Link as MuiLink,
  useTheme,
  useMediaQuery,
  IconButton,
  InputAdornment,
} from "@mui/material";
// Icons are no longer needed for the Avatar, but still for the text fields
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import authService from "../services/authService";
import { toast } from "react-toastify";
import { useAuth } from "../../Context/AuthContext";

const THEME_COLOR = "#6D28D9";

const LoginForm = ({ onLoginSuccess, onSwitchToForgotPassword }) => {
  const [formData, setFormData] = useState({
    emailOrMobile: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // SECURITY FIX 3.32.3: Updated login flow for cookie-based authentication
  // Token is NO LONGER in response body - it's in httpOnly cookie
  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); // Prevent default form submission
    setLoading(true);
    try {
      const { emailOrMobile, password } = formData;
      const payload = { password };
      if (emailOrMobile.includes("@")) {
        payload.email = emailOrMobile;
      } else {
        payload.mobile = emailOrMobile;
      }

      const response = await authService.login(payload);

      // SECURITY FIX 3.32.3: Token is NOT in response body anymore
      // Token is in httpOnly cookie set by backend (automatic with withCredentials: true)
      // Response only contains user info
      if (response.success && response.data?.user) {
        // Call login with ONLY userId - no token needed
        // Token is in cookie, automatically sent with API requests
        login(response.data.user.id);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      } else {
        toast.error("Login failed: Invalid response from server.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Login failed. Please check credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Desktop Title - Hidden on mobile as it's shown in LoginPage */}
      {!isMobile && (
        <Typography
          component="h1"
          variant="h4"
          sx={{
            mb: 4,
            fontWeight: "bold",
            color: "#1a1a1a",
            textAlign: "center",
            fontSize: {
              xs: "1.5rem",
              sm: "1.75rem",
              md: "2rem",
            },
          }}
        >
          Welcome Back
        </Typography>
      )}

      {!isMobile && (
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: "#666",
            textAlign: "center",
            fontSize: {
              xs: "0.875rem",
              sm: "1rem",
            },
          }}
        >
          Sign in to continue to your account
        </Typography>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          mt: 1,
          width: "100%",
          "& .MuiTextField-root": {
            mb: {
              xs: 2,
              sm: 2.5,
            },
          },
        }}
      >
        <TextField
          margin="normal"
          required
          fullWidth
          placeholder=" Enter your Email "
          name="emailOrMobile"
          value={formData.emailOrMobile}
          onChange={handleChange}
          variant="outlined"
          autoComplete="username"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutlinedIcon
                  sx={{
                    color: "#888",
                    fontSize: {
                      xs: "1.2rem",
                      sm: "1.4rem",
                      md: "1.5rem",
                    },
                  }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: "#f8f9fa",
              fontSize: {
                xs: "0.875rem",
                sm: "1rem",
              },
              height: {
                xs: "48px",
                sm: "52px",
                md: "56px",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "1px solid #e0e0e0",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#0D6EFD",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#0D6EFD",
                borderWidth: "2px",
              },
              transition: "all 0.3s ease",
            },
            "& .MuiInputBase-input": {
              padding: {
                xs: "12px 14px",
                sm: "14px 14px",
                md: "16px 14px",
              },
            },
          }}
        />

        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          placeholder="Password"
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={handleChange}
          variant="outlined"
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon
                  sx={{
                    color: "#888",
                    fontSize: {
                      xs: "1.2rem",
                      sm: "1.4rem",
                      md: "1.5rem",
                    },
                  }}
                />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleTogglePassword}
                  edge="end"
                  sx={{
                    color: "#888",
                    minWidth: {
                      xs: "44px",
                      sm: "48px",
                    },
                    minHeight: {
                      xs: "44px",
                      sm: "48px",
                    },
                    "&:hover": {
                      color: "#0D6EFD",
                    },
                    transition: "color 0.2s ease",
                  }}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              backgroundColor: "#f8f9fa",
              fontSize: {
                xs: "0.875rem",
                sm: "1rem",
              },
              height: {
                xs: "48px",
                sm: "52px",
                md: "56px",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "1px solid #e0e0e0",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#0D6EFD",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#0D6EFD",
                borderWidth: "2px",
              },
              transition: "all 0.3s ease",
            },
            "& .MuiInputBase-input": {
              padding: {
                xs: "12px 14px",
                sm: "14px 14px",
                md: "16px 14px",
              },
            },
          }}
        />

        {/* Forgot Password Link */}
        <Box
          sx={{
            width: "100%",
            textAlign: "right",
            mt: 1,
            mb: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          <MuiLink
            component="button"
            type="button"
            onClick={onSwitchToForgotPassword}
            variant="body2"
            sx={{
              fontWeight: "500",
              color: "#0D6EFD",
              textDecorationColor: "#0D6EFD",
              fontSize: {
                xs: "0.875rem",
                sm: "1rem",
              },
              "&:hover": {
                color: "#0952c9",
                textDecorationColor: "#0952c9",
              },
              transition: "color 0.2s ease",
            }}
          >
            Forgot Password?
          </MuiLink>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            borderRadius: "12px",
            padding: {
              xs: "12px 0",
              sm: "14px 0",
              md: "16px 0",
            },
            fontWeight: "bold",
            fontSize: {
              xs: "0.875rem",
              sm: "1rem",
            },
            background: "linear-gradient(135deg, #0D6EFD 0%, #0952c9 100%)",
            color: "white",
            textTransform: "none",
            boxShadow: "0 4px 12px rgba(13, 110, 253, 0.3)",
            minHeight: {
              xs: "48px",
              sm: "52px",
              md: "56px",
            },
            "&:hover": {
              background: "linear-gradient(135deg, #0952c9 0%, #073fa6 100%)",
              boxShadow: "0 6px 16px rgba(13, 110, 253, 0.4)",
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
            "&:disabled": {
              background: "#cccccc",
              boxShadow: "none",
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          {loading ? (
            <CircularProgress size={isSmallMobile ? 20 : 24} color="inherit" />
          ) : (
            "Sign In"
          )}
        </Button>

        {/* Additional spacing for mobile */}
        {isMobile && <Box sx={{ height: "20px" }} />}
      </Box>
    </Box>
  );
};

export default LoginForm;
