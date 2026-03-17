import React from 'react';
import { Container, Box, useTheme, useMediaQuery } from '@mui/material';

const AuthLayout = ({ children, title }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: isMobile 
          ? '#f5f5f5'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        py: { xs: 2, sm: 4 }
      }}
    >
      {children}
    </Box>
  );
};

export default AuthLayout;