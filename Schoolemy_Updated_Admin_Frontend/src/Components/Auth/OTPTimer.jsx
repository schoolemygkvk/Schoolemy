import React, { useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { useOTPTimer } from '../../hooks/useOTPTimer';


const OTPTimer = ({ initialSeconds = 120, onExpire, onTimeChange }) => {
  const { seconds, isExpired, formattedTime, timePercentage } = useOTPTimer(initialSeconds);

  useEffect(() => {
    if (onTimeChange) {
      onTimeChange(seconds);
    }
  }, [seconds, onTimeChange]);

  useEffect(() => {
    if (isExpired && onExpire) {
      onExpire();
    }
  }, [isExpired, onExpire]);

  const getColor = () => {
    if (isExpired) return '#d32f2f';
    if (seconds < 30) return '#d32f2f';
    if (seconds < 60) return '#f57c00';
    return '#388e3c';
  };

  const getWarningMessage = () => {
    if (isExpired) return 'Request a new OTP to continue';
    if (seconds < 30) return 'OTP expiring soon';
    if (seconds < 60) return 'OTP expiring';
    return null;
  };

  const color = getColor();
  const warningMessage = getWarningMessage();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: 2,
        backgroundColor: isExpired ? '#ffebee' : '#f5f5f5',
        borderRadius: 1,
        borderLeft: `4px solid ${color}`,
      }}
    >
      <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
        {isExpired ? 'OTP Expired' : 'OTP Expires In'}
      </Typography>

      <Typography
        variant="h4"
        sx={{
          color,
          fontWeight: 'bold',
          fontFamily: 'monospace',
          letterSpacing: 2,
        }}
      >
        {isExpired ? '00:00' : formattedTime}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={timePercentage}
        sx={{
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
          },
        }}
      />

      {warningMessage && (
        <Typography
          variant="caption"
          sx={{
            color,
            fontWeight: 500,
            marginTop: 1,
          }}
        >
          ⚠️ {warningMessage}
        </Typography>
      )}
    </Box>
  );
};

export default OTPTimer;
