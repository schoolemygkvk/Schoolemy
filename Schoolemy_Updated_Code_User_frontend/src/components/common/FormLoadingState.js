import React from 'react';
import { CircularProgress, Box, Alert } from '@mui/material';

/**
 * FormLoadingState - SECURITY FIX 3.41.1
 * Reusable component for displaying form submission loading states
 *
 * SECURITY FIX 3.41.1: Prevent Duplicate Form Submissions
 * - Shows loading spinner while request is processing
 * - Displays "Processing..." feedback
 * - Prevents user interaction during submission
 * - Shows error messages if submission fails
 * - Prevents double-click attacks
 */

/**
 * FormLoadingOverlay Component
 *
 * Semi-transparent overlay that appears during form submission
 * Disables user interaction while request is processing
 *
 * Usage:
 * {isLoading && <FormLoadingOverlay message="Processing..." />}
 */
export const FormLoadingOverlay = ({ message = 'Processing...', show = true }) => {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <CircularProgress size={48} />
        <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
          {message}
        </span>
      </Box>
    </Box>
  );
};

/**
 * FormSubmitButton Component
 *
 * Reusable submit button with automatic loading state handling
 *
 * Features:
 * - Disabled while loading
 * - Shows spinner while loading
 * - Shows "Processing..." text
 * - Prevents multiple clicks
 *
 * Usage:
 * <FormSubmitButton
 *   isLoading={isLoading}
 *   onClick={handleSubmit}
 *   children="Submit"
 * />
 */
export const FormSubmitButton = ({
  isLoading = false,
  disabled = false,
  onClick,
  children,
  className = '',
  style = {},
  size = 'medium',
  variant = 'contained',
  ...props
}) => {
  // Combine loading state with explicit disabled prop
  const isDisabled = isLoading || disabled;

  // Calculate spinner size based on button size
  const spinnerSize = size === 'small' ? 16 : size === 'large' ? 28 : 20;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`form-submit-button ${className} ${isDisabled ? 'disabled' : ''}`}
      style={{
        opacity: isDisabled ? 0.6 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: `${spinnerSize}px`,
              height: `${spinnerSize}px`,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

/**
 * FormErrorAlert Component
 *
 * Displays submission errors with dismiss button
 *
 * Usage:
 * {error && (
 *   <FormErrorAlert
 *     message={error}
 *     onDismiss={resetError}
 *   />
 * )}
 */
export const FormErrorAlert = ({ message, onDismiss, severity = 'error' }) => {
  if (!message) return null;

  return (
    <Alert
      severity={severity}
      onClose={onDismiss}
      sx={{
        marginBottom: '16px',
        borderRadius: '8px',
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      {message}
    </Alert>
  );
};

/**
 * FormSuccessAlert Component
 *
 * Displays success message after submission
 *
 * Usage:
 * {success && (
 *   <FormSuccessAlert
 *     message="Form submitted successfully!"
 *     onDismiss={resetSuccess}
 *   />
 * )}
 */
export const FormSuccessAlert = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <Alert
      severity="success"
      onClose={onDismiss}
      sx={{
        marginBottom: '16px',
        borderRadius: '8px',
      }}
    >
      {message}
    </Alert>
  );
};

/**
 * FormLoadingStateWrapper Component
 *
 * Complete wrapper component that handles all loading state UI
 * Combines overlay, button state, and error/success alerts
 *
 * Usage:
 * <FormLoadingStateWrapper
 *   isLoading={isLoading}
 *   error={error}
 *   success={success}
 *   onDismissError={resetError}
 *   onDismissSuccess={resetSuccess}
 * >
 *   <form>
 *     {children}
 *   </form>
 * </FormLoadingStateWrapper>
 */
export const FormLoadingStateWrapper = ({
  isLoading = false,
  error = null,
  success = false,
  onDismissError,
  onDismissSuccess,
  showOverlay = true,
  overlayMessage = 'Processing...',
  children,
  className = '',
  style = {},
}) => {
  return (
    <div className={`form-loading-wrapper ${className}`} style={style}>
      {showOverlay && isLoading && (
        <FormLoadingOverlay message={overlayMessage} show={isLoading} />
      )}

      {error && <FormErrorAlert message={error} onDismiss={onDismissError} />}

      {success && (
        <FormSuccessAlert
          message={typeof success === 'string' ? success : 'Success!'}
          onDismiss={onDismissSuccess}
        />
      )}

      <div style={{ opacity: isLoading && showOverlay ? 0.5 : 1 }}>
        {children}
      </div>
    </div>
  );
};

/**
 * CSS Animations for loading spinner
 * Add this to your global CSS or component stylesheet
 */
export const loadingStateStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .form-submit-button {
    transition: all 0.2s ease;
  }

  .form-submit-button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .form-submit-button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .form-loading-wrapper {
    position: relative;
  }
`;

export default FormLoadingStateWrapper;
