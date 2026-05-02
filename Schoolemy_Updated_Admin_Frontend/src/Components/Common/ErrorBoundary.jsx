import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === "development";
      return (
        <Paper
          sx={{
            p: 4,
            m: 2,
            backgroundColor: "#fee",
            border: "2px solid #f33",
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <ErrorOutline sx={{ color: "#f33", mr: 2, fontSize: 32 }} />
            <Typography variant="h6" sx={{ color: "#f33" }}>
              Something went wrong
            </Typography>
          </Box>

          <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Typography>

          {isDev && this.state.errorInfo && (
            <Box
              component="pre"
              sx={{
                backgroundColor: "#f9f9f9",
                p: 2,
                borderRadius: 1,
                overflow: "auto",
                fontSize: "12px",
                mb: 2,
                color: "#333",
              }}
            >
              {this.state.errorInfo.componentStack}
            </Box>
          )}

          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Reload Page
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
