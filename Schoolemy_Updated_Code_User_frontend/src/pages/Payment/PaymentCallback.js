import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api, { setCsrfToken } from "../../service/api";

/**
 * SECURITY FIX 3.31.1: Payment Status Race Condition
 *
 * CRITICAL: Server is the ONLY source of truth for payment status
 * - No fallback logic that contradicts server decision
 * - No nested response checks that override server verdict
 * - Single verification point from backend
 *
 * Why this matters:
 * - Multiple success checks = conflicting signals
 * - Fallback logic grants access when server says "failed"
 * - Race conditions between payment gateway and database
 * - Result: Free courses due to incorrect success detection
 */
const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Processing your payment...");

  // Ensure CSRF token is available before payment verification
  const ensureCsrfToken = async () => {
    try {
      const res = await api.get("/csrf-token");
      if (res.data?.csrfToken) {
        setCsrfToken(res.data.csrfToken);
      }
    } catch (err) {
      console.warn("Failed to fetch CSRF token for payment verification:", err.message);
      // Continue anyway - token might still be available from previous session
    }
  };

  useEffect(() => {
    const verifyPayment = async () => {
      // Initialize outer scope variables to prevent shadowing issues
      let courseId = undefined;
      let isTutorCourse = false;
      try {
        const orderId = searchParams.get("order_id");
        
        console.log(" Payment Callback Page Loaded");
        console.log(" URL Parameters:", { orderId });
        
        if (!orderId) {
          console.error(" Order ID missing from URL");
          setStatus("error");
          setMessage("Invalid payment callback: Order ID missing");
          setLoading(false);
          return;
        }

        console.log(" Order ID extracted:", orderId);

        // Get payment details from localStorage (set during payment creation)
        const paymentDetailsStr = localStorage.getItem("currentPaymentDetails");
        
        console.log(" Payment details from localStorage:", paymentDetailsStr);
        
        if (!paymentDetailsStr) {
          console.error(" No payment details found in localStorage");
          setStatus("error");
          setMessage("Payment session data not found. Please try again.");
          setLoading(false);
          return;
        }

        let paymentDetails;
        try {
          paymentDetails = JSON.parse(paymentDetailsStr);
        } catch (parseError) {
          console.error(" Failed to parse payment details:", parseError);
          setStatus("error");
          setMessage("Invalid payment session data. Please try again.");
          setLoading(false);
          return;
        }

        // FIX: Assign to outer variables, don't shadow with const
        const { paymentId } = paymentDetails;
        courseId = paymentDetails.courseId;
        isTutorCourse = paymentDetails.isTutorCourse;

        console.log(" Payment Details Extracted:", {
          orderId,
          paymentId,
          courseId,
          isTutorCourse,
          paymentIdValid: paymentId && paymentId.length > 0,
          paymentIdLength: paymentId?.length,
          paymentIdType: typeof paymentId,
        });

        if (!paymentId) {
          console.error(" Payment ID missing from stored details");
          console.error("Full payment details object:", paymentDetails);
          setStatus("error");
          setMessage("Payment ID not found. Please try again.");
          setLoading(false);
          return;
        }

        // Ensure paymentId is a string (MongoDB ObjectId format)
        const paymentIdString = String(paymentId);
        const orderIdString = String(orderId);

        console.log(" Preparing verify request with:", { 
          orderId: orderIdString, 
          paymentId: paymentIdString,
          originalTypes: {
            orderId: typeof orderId,
            paymentId: typeof paymentId
          }
        });

        const verifyPayload = {
          orderId: orderIdString,
          paymentId: paymentIdString,
        };

        console.log(" Sending verify request to backend:", verifyPayload);
        console.log(" Payload stringified:", JSON.stringify(verifyPayload, null, 2));

        // Ensure CSRF token is available for this POST request
        await ensureCsrfToken();

        const verifyResponse = await api.post(
          "/api/v1/payments/user/payment/verify",
          verifyPayload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log(" Payment verification response:", verifyResponse.data);

        // SECURITY FIX 3.31.1: Single source of truth - trust only server response
        if (verifyResponse.data.success) {
          const invoiceNumber = verifyResponse.data.invoice?.invoiceNumber;
          setStatus("success");
          setMessage(
            ` Payment Successful! ${invoiceNumber ? `Invoice: ${invoiceNumber}` : ''} Redirecting to your course...`
          );

          // Store invoice number for later display
          if (invoiceNumber) {
            localStorage.setItem('lastInvoiceNumber', invoiceNumber);
          }

          console.log(" Payment verified successfully! Course ID:", courseId, "isTutorCourse:", isTutorCourse, "Invoice:", invoiceNumber);

          // Clear payment details from localStorage
          localStorage.removeItem("currentPaymentDetails");

          // Redirect to course content page after 2 seconds
          setTimeout(() => {
            if (courseId) {
              // Redirect to tutor course or regular course content based on flag
              const contentPath = isTutorCourse
                ? `/tutor-course/${courseId}/content`
                : `/course/${courseId}/content`;
              console.log(" Redirecting to course content:", contentPath);
              navigate(contentPath, {
                replace: true,
                state: {
                  paymentCompleted: true,
                  accessUnlocked: true,
                  timestamp: Date.now()
                }
              });
            } else {
              console.log(" No courseId, redirecting to Dashboard");
              navigate("/Dashboard", { replace: true });
            }
          }, 2000);
        } else {
          // SECURITY FIX 3.31.1: Server verdict is final - no fallback logic
          // If server says payment failed, trust that decision completely
          // Don't check nested responses that might contradict server
          console.warn(" Payment verification returned false:", verifyResponse.data);

          // SECURITY FIX 3.31.1: REMOVED fallback check on cashfreeResponse
          // Why: Multiple success checks = race conditions
          // The nested cashfreeResponse check could override server decision
          // Example race condition:
          // - Cashfree says payment succeeded
          // - But payment verification in database failed
          // - Fallback logic would grant access incorrectly
          // Solution: Trust ONLY the server's verified response

          setStatus("failed");
          setMessage(
            verifyResponse.data.message || " Payment verification failed"
          );
          setLoading(false);
        }
      } catch (error) {
        console.error(" Payment callback error:", error);
        console.error("Error Details:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });

        // SECURITY FIX 3.31.1: REMOVED fallback check on error response details
        // Why: Error response = payment verification failed
        // Should NOT grant access based on nested Cashfree response
        // Race condition example:
        // - Server verification fails (error response)
        // - But Cashfree gateway included SUCCESS in error details
        // - Old code would grant access incorrectly
        // Solution: If verification fails (error/exception), deny access
        // Only grant access on successful verification response

        // Log the exact backend error response for debugging
        if (error.response?.data) {
          console.error(" Backend Error Response:", JSON.stringify(error.response.data, null, 2));

          // If backend sent validation details, log them
          if (error.response.data.received) {
            console.error(" Backend received:", error.response.data.received);
          }
          if (error.response.data.details) {
            console.error(" Backend validation details:", error.response.data.details);
          }
        }

        setStatus("error");
        setMessage(
          error.response?.data?.message ||
          error.message ||
          " An error occurred while processing your payment. Please check the console for details."
        );
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {loading && status === "processing" && (
          <>
            <div style={styles.spinner}></div>
            <h2 style={styles.heading}>{message}</h2>
            <p style={styles.subtext}>Please wait while we verify your payment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={styles.successIcon}></div>
            <h2 style={styles.headingSuccess}>{message}</h2>
            <p style={styles.subtext}>You will be redirected shortly...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div style={styles.errorIcon}></div>
            <h2 style={styles.headingError}>{message}</h2>
            <button 
              onClick={() => navigate(-1)}
              style={styles.button}
            >
              Go Back to Payment
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={styles.errorIcon}></div>
            <h2 style={styles.headingError}>{message}</h2>
            <div style={styles.buttonGroup}>
              <button 
                onClick={() => navigate("/Dashboard")}
                style={styles.button}
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => navigate(-1)}
                style={{...styles.button, backgroundColor: "#6c757d"}}
              >
                Go Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "40px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
  },
  spinner: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    animation: "spin 1s linear infinite",
    margin: "0 auto 20px",
  },
  heading: {
    fontSize: "24px",
    color: "#333",
    marginBottom: "10px",
    fontWeight: "600",
  },
  headingSuccess: {
    fontSize: "24px",
    color: "#28a745",
    marginBottom: "10px",
    fontWeight: "600",
  },
  headingError: {
    fontSize: "24px",
    color: "#dc3545",
    marginBottom: "10px",
    fontWeight: "600",
  },
  subtext: {
    fontSize: "14px",
    color: "#666",
    marginTop: "10px",
  },
  successIcon: {
    fontSize: "60px",
    marginBottom: "20px",
  },
  errorIcon: {
    fontSize: "60px",
    marginBottom: "20px",
  },
  button: {
    marginTop: "20px",
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "600",
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: "20px",
  },
};

// Add animation styles
const style = document.createElement("style");
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.querySelector('style[data-payment-callback]')) {
  style.setAttribute('data-payment-callback', 'true');
  document.head.appendChild(style);
}

export default PaymentCallback;
