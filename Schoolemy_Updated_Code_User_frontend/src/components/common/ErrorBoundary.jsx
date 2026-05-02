/**
 * ErrorBoundary.jsx - FIX 2.10.4 + SECURITY FIX 3.34.1
 * React Error Boundary component for graceful error handling
 *
 * SECURITY FIX 3.34.1: Prevent cascading failures
 * - Catches component rendering errors
 * - Prevents white screen of death
 * - Shows user-friendly error UI
 * - Logs errors for monitoring
 * - Allows graceful recovery
 *
 * Catches:
 * - Component rendering errors
 * - Lifecycle method errors
 * - Constructor errors
 * - Unhandled promise rejections in effects
 *
 * Does NOT catch:
 * - Event handlers (use try/catch)
 * - Async code (use try/catch)
 * - Server rendering
 * - Error boundary itself
 *
 * USAGE:
 * <ErrorBoundary fallback={<CustomError />}>
 *   <CriticalComponent />
 * </ErrorBoundary>
 */

import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import api from '../../service/api';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // FIX 2.10.4: Log error details for debugging
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to error tracking service (e.g., Sentry, LogRocket)
    // This helps monitor production errors
    this.logErrorToService(error, errorInfo);
  }

  // FIX 2.10.4: Send error to monitoring service
  logErrorToService = (error, errorInfo) => {
    try {
      // Example: Send to Sentry
      // Sentry.captureException(error, { extra: errorInfo });

      // Example: Send to custom API
      api.post('/api/errors/log', {
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      }).catch(err => {
        console.error('Failed to log error:', err);
      });
    } catch (err) {
      console.error('Error logging service failed:', err);
    }
  };

  // FIX 2.10.4: Reset error state
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  // FIX 2.10.4: Refresh page
  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            padding: 2
          }}
        >
          <Card
            sx={{
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <CardContent sx={{ padding: 4 }}>
              {/* Error Icon */}
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <ErrorOutlineIcon
                  sx={{
                    fontSize: 64,
                    color: '#f44336',
                    mb: 2
                  }}
                />
              </Box>

              {/* Error Title */}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: '#333',
                  textAlign: 'center',
                  mb: 1
                }}
              >
                Something Went Wrong
              </Typography>

              {/* Error Description */}
              <Typography
                variant="body2"
                sx={{
                  color: '#666',
                  textAlign: 'center',
                  mb: 3
                }}
              >
                An unexpected error occurred. Our team has been notified.
                {this.state.errorCount > 1 && (
                  <>
                    <br />
                    <span style={{ color: '#f44336' }}>
                      (This is error #{this.state.errorCount})
                    </span>
                  </>
                )}
              </Typography>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box
                  sx={{
                    backgroundColor: '#f5f5f5',
                    padding: 2,
                    borderRadius: 1,
                    mb: 3,
                    maxHeight: 200,
                    overflowY: 'auto',
                    border: '1px solid #ddd'
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', color: '#d32f2f' }}
                  >
                    <strong>Error:</strong> {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: 'monospace',
                        color: '#666',
                        display: 'block',
                        mt: 1,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexDirection: 'column'
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={this.handleReset}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 1
                  }}
                >
                  Try Again
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={this.handleRefresh}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 1
                  }}
                >
                  Refresh Page
                </Button>

                <Button
                  variant="text"
                  color="primary"
                  fullWidth
                  href="/"
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    borderRadius: 1
                  }}
                >
                  Go to Home
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Footer Message */}
          <Typography
            variant="caption"
            sx={{
              color: '#999',
              marginTop: 3,
              textAlign: 'center'
            }}
          >
            If the problem persists, please contact support
          </Typography>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
