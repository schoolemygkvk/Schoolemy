import React from 'react';
import { Grid, Box, Paper, useMediaQuery, useTheme, Typography, Link as MuiLink } from '@mui/material';
import { useNavigate } from 'react-router-dom';


import LoginForm from '../auth/LoginForm'; 

const LoginPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      
      {/* 1. LEFT COLUMN: The Yoga Illustration */}
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
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
                               radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)`,
              pointerEvents: 'none',
              zIndex: 1
            }
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
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.8)',
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
                fontSize: {
                  md: '2.5rem',
                  lg: '3rem'
                },
                letterSpacing: '-0.02em'
              }}
            >
              Welcome to Your Journey
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
              Find balance, strength, and peace through yoga
            </Typography>
          </Box>
        </Grid>
      )}

      {/* 2. RIGHT COLUMN: The Login Form */}
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
          padding: {
            xs: '16px',
            sm: '24px',
            md: '32px'
          }
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: {
              xs: '100%',
              sm: '400px',
              md: '400px'
            },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            py: {
              xs: 2,
              sm: 4,
              md: 6
            },
            px: {
              xs: 1,
              sm: 2,
              md: 0
            }
          }}
        >
          {/* Mobile Header */}
          {isMobile && (
            <Box 
              sx={{ 
                textAlign: 'center', 
                mb: 5,
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
                  fontSize: {
                    xs: '1.75rem',
                    sm: '2rem'
                  },
                  letterSpacing: '-0.02em'
                }}
              >
                Welcome Back
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#64748b',
                  fontSize: {
                    xs: '0.9rem',
                    sm: '1rem'
                  },
                  fontWeight: '400'
                }}
              >
                Sign in to continue your yoga journey
              </Typography>
            </Box>
          )}

          {/* Login Form Container */}
          <Box
            sx={{
              width: '100%',
              backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
              borderRadius: {
                xs: '24px',
                sm: '28px',
                md: 0
              },
              padding: {
                xs: '32px 20px',
                sm: '40px 32px',
                md: 0
              },
              boxShadow: isMobile 
                ? '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                : 'none',
              backdropFilter: isMobile ? 'blur(16px)' : 'none',
              border: isMobile ? '1px solid rgba(226, 232, 240, 0.8)' : 'none'
            }}
          >
            <LoginForm />
          </Box>

          {/* Sign Up Link */}
          <Typography 
            variant="body2" 
            align="center" 
            sx={{ 
              mt: {
                xs: 4,
                sm: 5,
                md: 5
              }, 
              color: '#64748b',
              fontSize: {
                xs: '0.9rem',
                sm: '1rem'
              },
              fontWeight: '400'
            }}
          >
            Don't have an account?{' '}
            <MuiLink 
              component="button" 
              variant="body2" 
              onClick={() => navigate('/signup')} 
              sx={{ 
                fontWeight: '600',
                color: '#3b82f6',
                textDecorationColor: '#3b82f6',
                fontSize: {
                  xs: '0.9rem',
                  sm: '1rem'
                },
                '&:hover': {
                  color: '#2563eb',
                  textDecorationColor: '#2563eb',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              Sign Up
            </MuiLink>
          </Typography>

          {/* Mobile Footer */}
          {isSmallMobile && (
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: 20, 
                left: 0, 
                right: 0,
                textAlign: 'center'
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  fontWeight: '400'
                }}
              >
                © 2025 Yoga App. All rights reserved.
              </Typography>
            </Box>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default LoginPage;
