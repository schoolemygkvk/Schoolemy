import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import EMIService from "../../service/emiService";
import MonthlyEmiPayment from "../../components/EMI/MonthlyEmiPayment";
import api from "../../service/api";
import { getTutorCourseById } from "../../service/courseApi";

const PaymentPage = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Detect if this is a tutor course payment based on the route path
  const isTutorCourse = location.pathname.includes('/user/payment/tutor-course/');
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState("full");
  const [emiDueDay, setEmiDueDay] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [emiDetails, setEmiDetails] = useState(null);
  const [error, setError] = useState("");
  const [modal, setModal] = useState({
    show: false,
    message: "",
    isSuccess: false,
  });

  // New state for existing user detection
  const [userPaymentStatus, setUserPaymentStatus] = useState(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [monthlyDueData, setMonthlyDueData] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        console.log("Fetching course data for courseId:", courseId);
        console.log("Token exists:", !!token);

        // Load Cashfree SDK early (Migrated from Razorpay)

        try {
          await loadCashfreeScript();
          console.log("✅ Payment gateway loaded successfully");
        } catch (sdkError) {
          console.warn("⚠️ Payment SDK loading warning (non-critical):", sdkError.message);
          // Don't fail page load if SDK fails initially - it will retry on payment
        }

        // First fetch course details from appropriate API
        console.log("Fetching course from:", isTutorCourse ? `/tutor-courses/${courseId}` : `/courses/${courseId}`);
        let courseRes;
        if (isTutorCourse) {
          // getTutorCourseById returns response.data directly
          courseRes = await getTutorCourseById(courseId);
        } else {
          // Regular API call returns full response object
          courseRes = await api.get(`/courses/${courseId}`);
        }

        console.log("Course response:", courseRes);

        // Handle different response structures
        // For tutor courses: courseRes is already response.data = { success, data, message }
        // For regular courses: courseRes is { data: { success, data, message }, status }
        let courseData;
        if (isTutorCourse) {
          // courseRes is already the parsed response.data
          courseData = courseRes;
        } else {
          // courseRes is the axios response object
          courseData = courseRes.data || courseRes;
        }

        console.log("Course data:", courseData);
        console.log("Has success:", courseData?.success);
        console.log("Has data field:", !!courseData?.data);

        if (courseData.success) {
          // The backend returns course data in 'data' field, not 'course' field
          let course = courseData.data || courseData.course;
          console.log("Course data received:", course);
          console.log("Course EMI data from backend:", course?.emi);
          
          if (!course) {
            console.error("Course object is null or undefined");
            setError("Course data is missing from response");
            return;
          }

          // Normalize course field names for tutor courses
          // Tutor courses might use 'title' instead of 'coursename'
          if (isTutorCourse) {
            if (!course.coursename && course.title) {
              course.coursename = course.title;
            }
            // Ensure price structure exists
            if (!course.price && course.finalPrice) {
              course.price = {
                finalPrice: course.finalPrice,
                originalPrice: course.originalPrice || course.finalPrice
              };
            }
          }
          
          // Calculate price breakdown if not present or if values are 0
          if (course?.price && (!course.price.breakdown || !course.price.breakdown.courseValue)) {
            const mrp = course.price.amount || course.price.finalPrice;
            const discountPercent = course.price.discount || 0;

            // Step 1: Course value after discount
            const courseValue = Math.round(mrp * (1 - discountPercent / 100));

            // Step 2: 18% GST on course value (added on top)
            const cgst = Math.round(courseValue * 0.09);
            const sgst = Math.round(courseValue * 0.09);
            const gstAmount = cgst + sgst;

            // Step 3: Transaction fee (2%) on (course value + GST)
            const transactionFee = Math.round((courseValue + gstAmount) * 0.02);

            // Step 4: Final price = course value + GST + transaction fee
            course.price.finalPrice = courseValue + gstAmount + transactionFee;

            course.price.breakdown = {
              courseValue: courseValue,
              gst: {
                cgst: cgst,
                sgst: sgst,
                total: gstAmount
              },
              transactionFee: transactionFee
            };

            console.log("Calculated price breakdown:", course.price.breakdown);
          }
          
          setCourse(course);

          // Calculate EMI details for new purchases
          if (course?.price?.finalPrice) {
            try {
              console.log("🔍 Starting EMI calculation for course:", {
                courseId: course._id,
                price: course.price.finalPrice,
                emiSettings: course.emi,
              });

              // Use the new calculateEMI method with course EMI settings
              const emiData = EMIService.calculateEMI(
                course.price.finalPrice,
                course.emi
              );

              console.log("📊 EMI Calculation Result:", emiData);

              setEmiDetails(emiData);
            } catch (emiErr) {
              console.error("❌ EMI calculation failed:", emiErr);
              setEmiDetails({
                eligible: false,
                reason: "EMI calculation failed",
              });
            }
          } else {
            console.warn("⚠️ Course price not available for EMI calculation");
            setEmiDetails({
              eligible: false,
              reason: "Price information unavailable",
            });
          }
        } else {
          console.error("Course fetch failed:", {
            courseData,
            message: courseData?.message,
            success: courseData?.success,
            hasData: !!courseData?.data
          });
          setError(courseData?.message || "Failed to load course details");
          return; // Don't continue if course fetch failed
        }

        // Then check payment status (only if user is logged in)
        if (token) {
          try {
            const paymentStatusEndpoint = isTutorCourse 
              ? `/user/payment/tutor-course/${courseId}`
              : `/user/payment/status/${courseId}`;
            console.log(
              "Fetching payment status from:",
              paymentStatusEndpoint
            );
            
            let paymentStatusRes;
            try {
              paymentStatusRes = await api.get(paymentStatusEndpoint);
            } catch (statusErr) {
              // If tutor course status endpoint returns 404, treat as new user
              if (isTutorCourse && statusErr?.response?.status === 404) {
                console.warn("Tutor course payment status endpoint not found (404). Treating as new user.");
                setIsExistingUser(false);
                return; // Exit early, no need to process payment status
              }
              throw statusErr; // Re-throw if it's not a 404 for tutor courses
            }

            console.log(
              "Payment status response:",
              paymentStatusRes
            );

            const paymentStatusData = paymentStatusRes.data;
            console.log("Payment status data received:", paymentStatusData);

            // Check if user already has payment/EMI status for this course
            if (paymentStatusData.success && paymentStatusData.data) {
              console.log("User has payment data:", paymentStatusData.data);
              
              // Handle tutor course payment status structure (different from regular courses)
              if (isTutorCourse) {
                const tutorPaymentData = paymentStatusData.data;
                console.log("Tutor course payment status:", {
                  hasPayment: tutorPaymentData.hasPayment,
                  hasCompletedPayment: tutorPaymentData.hasCompletedPayment
                });

                // Tutor courses use hasPayment and hasCompletedPayment fields
                if (tutorPaymentData.hasCompletedPayment) {
                  // User has completed payment - existing user with full access
                  console.log("Tutor course: User has completed payment");
                  setIsExistingUser(true);
                  setUserPaymentStatus({
                    type: "full",
                    hasPayment: true,
                    hasCompletedPayment: true,
                    ...tutorPaymentData
                  });
                } else if (tutorPaymentData.hasPayment) {
                  // User has payment but not completed - might be pending
                  console.log("Tutor course: User has payment but not completed");
                  setIsExistingUser(true);
                  setUserPaymentStatus({
                    type: "pending",
                    hasPayment: true,
                    hasCompletedPayment: false,
                    ...tutorPaymentData
                  });
                } else {
                  // User has no payment - new user
                  console.log("Tutor course: User has no payment - treating as new user");
                  setIsExistingUser(false);
                }
              } else {
                // Regular course payment status structure
                console.log("Payment type:", paymentStatusData.data.type);
                setUserPaymentStatus(paymentStatusData.data);

                // If payment type is "none", treat as new user
                if (paymentStatusData.data.type === "none") {
                  console.log(
                    "User has no payment (type: none) - treating as new user"
                  );
                  setIsExistingUser(false);
                } else {
                  // User has actual payment (full/emi/other)
                  setIsExistingUser(true);
                }

                // If user has EMI, fetch monthly due data
                if (paymentStatusData.data.type === "emi") {
                  console.log("User has EMI plan, fetching monthly due data...");
                  try {
                    const monthlyDueRes = await api.get(
                      `/user/emi/monthly-due/${courseId}`
                    );
                    console.log(
                      "Monthly due response:",
                      monthlyDueRes
                    );

                    const monthlyDueData = monthlyDueRes.data;
                    console.log("Monthly due data:", monthlyDueData);

                    if (monthlyDueData.success) {
                      setMonthlyDueData(monthlyDueData.data);
                    }
                  } catch (monthlyErr) {
                    console.error("Error fetching monthly due data:", monthlyErr);
                  }
                } else {
                  console.log(
                    "User payment type is not EMI, it's:",
                    paymentStatusData.data.type
                  );
                }
              }
            } else if (paymentStatusData.success && !paymentStatusData.data) {
              // User has no existing payment - new user
              console.log(
                "User has no existing payment - treating as new user"
              );
              setIsExistingUser(false);
            } else {
              console.log(
                "Payment status API returned unsuccessful response:",
                paymentStatusData
              );
              setIsExistingUser(false);
            }
          } catch (paymentErr) {
            console.warn("Payment status check error:", paymentErr);
            setIsExistingUser(false); // Default to new user if payment check fails
          }
        } else {
          // No token - user is not logged in, treat as new user
          console.log("No authentication token - treating as new user");
          setIsExistingUser(false);
        }
      } catch (err) {
        console.error("Error fetching course data:", {
          error: err,
          message: err?.message,
          response: err?.response?.data,
          isTutorCourse,
          courseId
        });
        setError(`Failed to load course details: ${err?.message || err?.response?.data?.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, token, isTutorCourse]);

  // Force full payment for tutor courses (no EMI support)
  useEffect(() => {
    if (isTutorCourse && paymentType !== "full") {
      setPaymentType("full");
    }
  }, [isTutorCourse, paymentType]);

  const loadCashfreeScript = () => {
    // Migrated from Razorpay to Cashfree - Load Cashfree Drop-in SDK
    return new Promise((resolve, reject) => {
      if (window.Cashfree) {
        console.log("✅ Cashfree SDK already loaded");
        return resolve(true);
      }

      // Try primary CDN first, then fallback
      const primaryUrl = "https://sdk.cashfree.com/js/v3/cashfree.js";
      const fallbackUrl = "https://cdn.jsdelivr.net/npm/cashfree-pg-sdk-javascript@2.0.4/dist/cashfree.min.js";
      
      const urls = [primaryUrl, fallbackUrl];
      
      const attemptLoad = (urlIndex) => {
        if (urlIndex >= urls.length) {
          reject(new Error("Failed to load Cashfree SDK from all available sources. Please check your internet connection."));
          return;
        }

        const script = document.createElement("script");
        script.type = "text/javascript";
        script.async = true;
        script.defer = false;
        
        const currentUrl = urls[urlIndex];
        script.src = currentUrl;
        
        console.log(`📥 Loading Cashfree SDK from: ${currentUrl}`);
        console.log(`📍 Environment: ${process.env.REACT_APP_CASHFREE_ENV || "SANDBOX"}`);
        
        let timeoutId;
        
        const cleanup = () => {
          clearTimeout(timeoutId);
          script.onload = null;
          script.onerror = null;
          script.removeEventListener('error', onNetworkError);
        };
        
        // Add a timeout as fallback
        timeoutId = setTimeout(() => {
          cleanup();
          console.warn(`⏱️ Timeout loading from ${currentUrl}, trying next source...`);
          document.head.removeChild(script);
          attemptLoad(urlIndex + 1);
        }, 8000); // 8 seconds timeout per source
        
        script.onload = () => {
          cleanup();
          console.log("✅ Cashfree SDK loaded successfully");
          // Verify SDK is available globally
          if (typeof window.Cashfree === "function") {
            resolve(true);
          } else {
            console.warn("SDK loaded but Cashfree not in window, trying next source...");
            document.head.removeChild(script);
            attemptLoad(urlIndex + 1);
          }
        };
        
        const onScriptError = (error) => {
          cleanup();
          console.error(`❌ Failed to load from ${currentUrl}:`, error);
          document.head.removeChild(script);
          attemptLoad(urlIndex + 1);
        };
        
        const onNetworkError = () => {
          cleanup();
          console.error(`❌ Network error from ${currentUrl}`);
          document.head.removeChild(script);
          attemptLoad(urlIndex + 1);
        };
        
        script.onerror = onScriptError;
        script.addEventListener('error', onNetworkError);
        
        document.head.appendChild(script);
      };
      
      attemptLoad(0);
    });
  };

  // Helper function to detect payment method (Not needed for Cashfree as webhook provides it)
  // Cashfree automatically provides payment method in webhook/verification response

  const handlePayment = async () => {
    setError("");

    // Validation
    if (!agreedToTerms)
      return setError("Please agree to the terms and conditions.");

    // Tutor courses only support one-time payment (no EMI)
    if (isTutorCourse && paymentType === "emi") {
      setModal({
        show: true,
        message: "EMI is not available for tutor courses. Only one-time full payment is supported.",
        isSuccess: false,
      });
      return;
    }

    if (paymentType === "emi") {
      // Validate EMI eligibility
      if (!emiDetails?.eligible) {
        setModal({
          show: true,
          message: emiDetails?.reason || "EMI is not available for this course",
          isSuccess: false,
        });
        return;
      }

      // Double-check with validation method
      const validation = EMIService.validateCourseForEMI(course);
      if (!validation.valid) {
        setModal({
          show: true,
          message: validation.reason,
          isSuccess: false,
        });
        return;
      }

      if (!emiDueDay) return setError("Please select an EMI due date.");
      if (!emiDetails?.monthlyAmount || !emiDetails?.totalAmount)
        return setError("EMI configuration is incomplete.");
    }

    setLoading(true);

    try {
      // Migrated from Razorpay to Cashfree: Load Cashfree SDK
      let scriptLoaded = false;
      try {
        scriptLoaded = await loadCashfreeScript();
      } catch (sdkError) {
        console.error("SDK load error:", sdkError);
        throw new Error("Payment gateway failed to load. Please check your internet connection and try again.");
      }

      if (!scriptLoaded || !window.Cashfree) {
        throw new Error("Payment gateway is not available. Please refresh the page and try again.");
      }

      // Tutor courses only support one-time payment (no EMI)
      if (isTutorCourse && paymentType === "emi") {
        throw new Error("EMI is not available for tutor courses. Only one-time full payment is supported.");
      }

      // Get mobile and ensure it's a string
      const userMobile = localStorage.getItem("userMobile") || "";
      const mobileString = String(userMobile || "");

      // Build payment data - use tutorCourseId for tutor courses, courseId for regular courses
      const paymentData = isTutorCourse
        ? {
            // Tutor course payment data
            tutorCourseId: courseId, // Use tutorCourseId field for tutor courses
            amount: course?.price?.finalPrice || 0,
            paymentMethod: "UPI", // Default payment method
            paymentType: "one-time", // Tutor courses always use one-time payment
            mobile: mobileString,
          }
        : {
            // Regular course payment data
            courseId,
            paymentType,
            paymentMethod: "CARD", // Default, Cashfree will capture actual method
            emiDueDay: paymentType === "emi" ? Number(emiDueDay) : undefined,
            amount:
              paymentType === "emi"
                ? emiDetails?.monthlyAmount || 0
                : course?.price?.finalPrice || 0,
            mobile: mobileString,
          };

      console.log("💳 Creating payment session with Cashfree:", paymentData);

      // Use regular payment endpoint for both tutor and regular courses
      // Backend differentiates based on tutorCourseId vs courseId field
      const paymentEndpoint = "/user/payment/create";
      
      console.log("📡 Payment endpoint:", paymentEndpoint);
      const createResponse = await api.post(paymentEndpoint, paymentData);

      const responseData = createResponse.data;

      if (!responseData.success)
        throw new Error(responseData.message || "Error creating payment session");

      // Cashfree returns payment_session_id instead of order object
      const { payment_session_id, order_id, paymentId } = responseData;

      console.log("📥 Backend response data:", {
        payment_session_id: payment_session_id ? "✓ present" : "✗ missing",
        order_id: order_id ? "✓ present" : "✗ missing",
        paymentId: paymentId ? "✓ present" : "✗ missing",
        paymentIdValue: paymentId,
        paymentIdType: typeof paymentId,
        paymentIdLength: paymentId?.length
      });

      if (!payment_session_id) {
        throw new Error("Invalid payment session received from server");
      }

      if (!paymentId) {
        console.error("❌ PaymentId missing in backend response!");
        throw new Error("Payment ID not received from server");
      }

      // Ensure all IDs are strings for consistency
      const paymentIdString = String(paymentId);
      const orderIdString = String(order_id);

      // Store payment details in localStorage for use in callback
      const paymentDetailsToStore = {
        orderId: orderIdString,
        paymentId: paymentIdString,
        courseId: String(courseId),
        paymentType: paymentType,
        amount: paymentData.amount,
        isTutorCourse: isTutorCourse, // Store tutor course flag for callback
      };
      
      console.log("💾 Payment details to store in localStorage:", paymentDetailsToStore);
      
      localStorage.setItem("currentPaymentDetails", JSON.stringify(paymentDetailsToStore));
      
      // Verify what was actually stored
      const verifyStored = localStorage.getItem("currentPaymentDetails");
      console.log("✅ Verified stored data:", verifyStored);
      
      // Parse and verify
      try {
        const parsed = JSON.parse(verifyStored);
        console.log("✅ Parsed stored data:", parsed);
        if (!parsed.paymentId || !parsed.orderId) {
          console.error("❌ Critical: Stored data missing required fields!");
        }
      } catch (e) {
        console.error("❌ Failed to parse stored data:", e);
      }

      console.log("✅ Payment session created:", {
        payment_session_id,
        order_id,
        paymentId,
      });

      // Initialize Cashfree Drop-in checkout (Migrated from Razorpay)
      if (typeof window.Cashfree !== "function") {
        throw new Error("Cashfree SDK is not properly initialized. Please refresh the page.");
      }

      let cashfree;
      try {
        cashfree = await window.Cashfree({
          mode: process.env.REACT_APP_CASHFREE_ENV === "PRODUCTION" ? "production" : "sandbox",
        });
      } catch (cashfreeInitError) {
        console.error("Cashfree initialization error:", cashfreeInitError);
        throw new Error("Failed to initialize payment gateway. Please try again.");
      }

      // Cashfree Drop-in options
      const checkoutOptions = {
        paymentSessionId: payment_session_id,
        returnUrl: `${window.location.origin}/payment/callback?order_id=${order_id}`,
        // Optional: Customize UI
        theme: {
          backgroundColor: "#ffffff",
          color: "#667eea",
          fontSize: "14px",
        },
      };

      // Open Cashfree Drop-in checkout
      console.log("🚀 Opening Cashfree checkout...");
      
      try {
        cashfree.checkout(checkoutOptions).then((result) => {
          if (result.error) {
            // Payment failed or user closed the checkout
            console.error("❌ Cashfree checkout error:", result.error);
            setError(result.error.message || "Payment failed");
            setLoading(false);
            setModal({
              show: true,
              message: `Payment failed: ${result.error.message}`,
              isSuccess: false,
            });
          } else if (result.paymentDetails) {
            // Payment successful - result contains payment details
            console.log("🎉 Cashfree payment successful:", result.paymentDetails);
            handlePaymentSuccess(order_id, paymentId);
          } else {
            // User might have closed the checkout without completing
            console.log("ℹ️ Checkout closed or cancelled by user");
            setLoading(false);
          }
        }).catch((checkoutError) => {
          console.error("❌ Checkout error:", checkoutError);
          setError("An error occurred during checkout. Please try again.");
          setLoading(false);
          setModal({
            show: true,
            message: `Checkout error: ${checkoutError.message || "Unknown error"}`,
            isSuccess: false,
          });
        });
      } catch (checkoutInitError) {
        console.error("❌ Checkout initialization error:", checkoutInitError);
        throw new Error("Failed to open payment checkout. Please try again.");
      }

    } catch (err) {
      console.error("❌ Payment initiation error:", err);
      setError(err.message);
      setLoading(false);
      setPaymentProcessing(false);
      setModal({
        show: true,
        message: `Payment failed: ${err.message}`,
        isSuccess: false,
      });
    }
  };

  // Handle payment success callback (Migrated from Razorpay handler)
  const handlePaymentSuccess = async (orderId, paymentId) => {
    try {
      console.log("🎉 Processing payment success for order:", orderId);

      // START PAYMENT PROCESSING LOADING
      setPaymentProcessing(true);
      setLoading(false);

      const verifyPayload = {
        orderId, // Cashfree order_id
        paymentId, // Our internal payment record ID
        paymentType,
      };

      console.log("🔍 Verifying payment with payload:", verifyPayload);

      // Use regular verification endpoint for both tutor and regular courses
      // Backend handles tutor courses based on payment record
      const verifyEndpoint = "/user/payment/verify";
      
      console.log("📡 Verification endpoint:", verifyEndpoint);
      const verifyResponse = await api.post(verifyEndpoint, verifyPayload);

      const verifyData = verifyResponse.data;

      console.log("✅ Payment verification response:", verifyData);

      if (verifyData.success) {
        console.log("🎊 Payment verified successfully!");
        console.log(
          "💳 Payment method used:",
          verifyData.paymentMethodUsed
        );

        // Show success modal
        setModal({
          show: true,
          message: `Payment successful! Redirecting to course...`,
          isSuccess: true,
        });

        // Navigate after delay to appropriate content route
        setTimeout(() => {
          navigate(isTutorCourse ? `/tutor-course/${courseId}/content` : `/course/${courseId}/content`);
        }, 1500);
      } else if (verifyData.details?.cashfreeResponse?.[0]?.payment_status === "SUCCESS") {
        // Fallback: Cashfree reported success inside details even if top-level success=false
        console.log("🔁 Fallback: Cashfree payment success found inside verify response details", verifyData.details.cashfreeResponse[0]);

        setModal({
          show: true,
          message: `Payment successful! Redirecting to course...`,
          isSuccess: true,
        });

        setTimeout(() => {
          navigate(isTutorCourse ? `/tutor-course/${courseId}/content` : `/course/${courseId}/content`);
        }, 1500);
      } else {
        throw new Error(
          verifyData.message || "Payment verification failed"
        );
      }
    } catch (err) {
      console.error("❌ Verification error:", err, err.response?.data);
      setPaymentProcessing(false);
      const serverMsg = err.response?.data?.message || err.message;
      setError(`Payment verification failed: ${serverMsg}`);
      setModal({
        show: true,
        message: `Verification failed: ${serverMsg}`,
        isSuccess: false,
      });
    }
  };

  const closeModal = () => {
    setModal({ show: false, message: "", isSuccess: false });
    if (modal.isSuccess) navigate(isTutorCourse ? `/tutor-course/${courseId}/content` : `/course/${courseId}/content`);
  };

  if (!course && !loading && !error) {
    return (
      <div className="payment-loading-container">
        <div className="payment-loading-card">
          <div className="payment-loading-spinner"></div>
          <p>Initializing payment page...</p>
          <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "10px" }}>
            {isTutorCourse ? "Loading tutor course details..." : "Loading course details..."}
          </p>
        </div>
      </div>
    );
  }

  if (!course && loading) {
    return (
      <div className="payment-loading-container">
        <div className="payment-loading-card">
          <div className="payment-loading-spinner"></div>
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course && error) {
    return (
      <div className="payment-loading-container">
        <div className="payment-loading-card">
          <div style={{ color: "#e53e3e", marginBottom: "20px" }}>
            ⚠️ Error loading course
          </div>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              background: "#3182ce",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              marginTop: "15px",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-layout">
        <div className="payment-main-content">
          {/* Existing User with Full Payment - Already Enrolled */}
          {isExistingUser && userPaymentStatus?.type === "full" && (
            <div className="existing-user-enrolled-section">
              <div className="payment-header">
                <div className="success-icon-large">✓</div>
                <h1>Payment Complete!</h1>
                <p>
                  You have successfully purchased{" "}
                  <strong>{course.coursename || course.title || "Course"}</strong>
                </p>
              </div>

              <div className="payment-course-card">
                <img
                  src={course.thumbnail}
                  alt={course.coursename || course.title || "Course"}
                  className="course-thumbnail"
                />
                <div className="course-info">
                  <h3>{course.coursename || course.title || "Course"}</h3>
                  <p>Duration: {course.courseduration}</p>
                  <div className="course-meta">
                    <span className="status-badge complete">✓ Payment Complete</span>
                    <span>•</span>
                    <span>Full Access Granted</span>
                  </div>
                </div>
              </div>

              <div className="payment-status-card">
                <div className="status-header">
                  <h3>Payment Status</h3>
                  <span className="status-indicator complete">Complete</span>
                </div>
                <div className="status-details">
                  <div className="status-item">
                    <span className="status-label">Payment Method:</span>
                    <span className="status-value">{userPaymentStatus?.paymentMethod || "N/A"}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Payment Date:</span>
                    <span className="status-value">
                      {userPaymentStatus?.paymentDate
                        ? new Date(userPaymentStatus.paymentDate).toLocaleDateString('en-IN')
                        : "N/A"}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Amount Paid:</span>
                    <span className="status-value">
                      ₹{userPaymentStatus?.amount?.toLocaleString("en-IN") || "N/A"}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Access Status:</span>
                    <span className="status-value access-granted">Full Access</span>
                  </div>
                </div>
              </div>

              <div className="enrolled-message">
                <div className="enrolled-icon">🎉</div>
                <div className="enrolled-text">
                  <h3>Welcome back!</h3>
                  <p>
                    Your payment is complete and you have full access to this course. Start learning now!
                  </p>
                </div>
              </div>

              <div className="existing-user-actions">
                <button
                  className="primary-button"
                  onClick={() => navigate(isTutorCourse ? `/tutor-course/${courseId}/content` : `/course/${courseId}/content`)}
                >
                  Go to Course Content
                </button>
                <button
                  className="secondary-button"
                  onClick={() => navigate("/payment")}
                >
                  View Payment History
                </button>
              </div>
            </div>
          )}

          {/* Existing User with EMI Plan */}
          {isExistingUser && userPaymentStatus?.emiPlan && (
            <div className="existing-user-emi-section">
              <div className="payment-header">
                <h1>EMI Payment Status</h1>
                <p>
                  Track your EMI payments for <strong>{course.coursename}</strong>
                </p>
              </div>

              <div className="payment-course-card">
                <img
                  src={course.thumbnail}
                  alt={course.coursename || course.title || "Course"}
                  className="course-thumbnail"
                />
                <div className="course-info">
                  <h3>{course.coursename || course.title || "Course"}</h3>
                  <p>Duration: {course.courseduration}</p>
                  <div className="course-meta">
                    <span className="status-badge emi">EMI Plan Active</span>
                    <span>•</span>
                    <span>Monthly Payments</span>
                  </div>
                </div>
              </div>

              <div className="payment-status-card">
                <div className="status-header">
                  <h3>EMI Plan Status</h3>
                  <span className="status-indicator emi-active">Active</span>
                </div>
                <div className="status-details">
                  <div className="status-item">
                    <span className="status-label">Total EMIs:</span>
                    <span className="status-value">{userPaymentStatus?.emiPlan?.emis?.length || 0}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Completed EMIs:</span>
                    <span className="status-value complete">
                      {userPaymentStatus?.emiPlan?.emis?.filter(emi => emi.status === 'paid')?.length || 0}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Pending EMIs:</span>
                    <span className="status-value pending">
                      {userPaymentStatus?.emiPlan?.emis?.filter(emi => emi.status === 'pending')?.length || 0}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Overdue EMIs:</span>
                    <span className="status-value overdue">
                      {userPaymentStatus?.emiPlan?.emis?.filter(emi => emi.status === 'overdue')?.length || 0}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Monthly Amount:</span>
                    <span className="status-value">
                      ₹{userPaymentStatus?.emiPlan?.monthlyAmount?.toLocaleString("en-IN") || "N/A"}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Next Due Date:</span>
                    <span className="status-value">
                      {monthlyDueData?.nextDueDate
                        ? new Date(monthlyDueData.nextDueDate).toLocaleDateString('en-IN')
                        : "N/A"}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Access Status:</span>
                    <span className="status-value access-granted">Full Access</span>
                  </div>
                </div>
              </div>

              {/* EMI Payment Breakdown */}
              <div className="emi-breakdown-card">
                <div className="emi-breakdown-header">
                  <h3>EMI Payment History</h3>
                  <div className="emi-progress-summary">
                    <div className="progress-text">
                      {userPaymentStatus?.emiPlan?.emis?.filter(emi => emi.status === 'paid')?.length || 0} of {userPaymentStatus?.emiPlan?.emis?.length || 0} EMIs Completed
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{
                          width: `${((userPaymentStatus?.emiPlan?.emis?.filter(emi => emi.status === 'paid')?.length || 0) / (userPaymentStatus?.emiPlan?.emis?.length || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="emi-list">
                  {userPaymentStatus?.emiPlan?.emis?.map((emi, index) => (
                    <div key={emi._id || index} className={`emi-item ${emi.status}`}>
                      <div className="emi-main-info">
                        <div className="emi-info">
                          <span className="emi-number">EMI {index + 1}</span>
                          <span className="emi-amount">₹{emi.amount?.toLocaleString("en-IN") || "N/A"}</span>
                        </div>
                        <div className="emi-status-section">
                          <span className={`status-badge ${emi.status}`}>
                            {emi.status === 'paid' ? '✓ Paid' :
                             emi.status === 'pending' ? '⏳ Pending' :
                             emi.status === 'overdue' ? '⚠️ Overdue' : emi.status}
                          </span>
                          {emi.dueDate && (
                            <span className="emi-date">
                              Due: {new Date(emi.dueDate).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                      {emi.status === 'paid' && emi.paidDate && (
                        <div className="emi-payment-details">
                          <span className="payment-date">
                            Paid on: {new Date(emi.paidDate).toLocaleDateString('en-IN')}
                          </span>
                          {emi.transactionId && (
                            <span className="transaction-id">Txn: {emi.transactionId}</span>
                          )}
                        </div>
                      )}
                      {emi.status === 'overdue' && (
                        <div className="emi-overdue-notice">
                          <span className="overdue-text">Payment is overdue</span>
                          <span className="overdue-amount">₹{emi.amount?.toLocaleString("en-IN") || "N/A"}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <MonthlyEmiPayment
                courseId={courseId}
                monthlyDueData={monthlyDueData}
                emiPlan={userPaymentStatus?.emiPlan}
                onPaymentSuccess={() => {
                  setModal({
                    show: true,
                    message: "Monthly EMI payment successful!",
                    isSuccess: true,
                  });
                }}
                onPaymentError={(error) => {
                  setError(
                    `EMI payment failed: ${error.message || "Please try again"}`
                  );
                }}
              />

              <div className="existing-user-actions">
                <button
                  className="primary-button"
                  onClick={() => navigate(isTutorCourse ? `/tutor-course/${courseId}/content` : `/course/${courseId}/content`)}
                >
                  Go to Course Content
                </button>
                <button
                  className="secondary-button"
                  onClick={() => navigate("/payment")}
                >
                  View Payment History
                </button>
              </div>
            </div>
          )}

          {/* New User Purchase Interface */}
          {!isExistingUser && course && (
            <div className="new-user-purchase-section">
              <div className="payment-header">
                <h1>Complete Your Purchase</h1>
                <p>
                  You're one step away from enrolling in{" "}
                  <strong>{course.coursename || course.title || "Course"}</strong>
                </p>
              </div>

              <div className="payment-course-card">
                <img
                  src={course.thumbnail || "/default-course.jpg"}
                  alt={course.coursename || course.title || "Course"}
                  className="course-thumbnail"
                />
                <div className="course-info">
                  <h3>{course.coursename || course.title || "Course"}</h3>
                  <p>{course.courseduration || "Duration varies"}</p>
                  {course.price?.finalPrice ? (
                    <div className="course-price">
                      <span className="final-price">
                        ₹{(course.price.finalPrice || 0).toLocaleString("en-IN")}
                      </span>
                      {course.price?.originalPrice && course.price.originalPrice > course.price.finalPrice && (
                        <span className="original-price">
                          ₹{course.price.originalPrice.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="course-price">
                      <span className="final-price" style={{ color: "#e53e3e" }}>
                        Price information unavailable
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="payment-options">
                <h3>Choose Payment Option</h3>
                <div className="payment-option-group">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentType"
                      value="full"
                      checked={paymentType === "full"}
                      onChange={(e) => setPaymentType(e.target.value)}
                    />
                    <div className="payment-option-content">
                      <div className="payment-option-header">
                        <span className="payment-label">💳 Full Payment</span>
                        <span className="payment-amount">
                          ₹{(course.price?.finalPrice || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="payment-description">
                        Pay the complete amount and get instant access to all
                        course materials
                      </p>
                      <div className="payment-benefits">
                        <span className="benefit-badge">✓ Instant Access</span>
                        <span className="benefit-badge">
                          ✓ No Processing Fee
                        </span>
                        <span className="benefit-badge">
                          ✓ One-time Payment
                        </span>
                      </div>
                    </div>
                  </label>

                  {/* Only show EMI option if eligible AND not a tutor course */}
                  {emiDetails?.eligible && !isTutorCourse && (
                    <label className="payment-option">
                      <input
                        type="radio"
                        name="paymentType"
                        value="emi"
                        checked={paymentType === "emi"}
                        onChange={(e) => setPaymentType(e.target.value)}
                      />
                      <div className="payment-option-content">
                        <div className="payment-option-header">
                          <span className="payment-label">📅 EMI Payment</span>
                          <span className="payment-amount">
                            ₹{emiDetails.monthlyAmount.toLocaleString("en-IN")}
                            /month
                          </span>
                        </div>
                        <p className="payment-description">
                          Pay in {emiDetails.tenure} easy monthly installments
                        </p>
                        <div className="emi-breakdown">
                          <div className="emi-detail">
                            <span className="emi-label">Monthly Amount:</span>
                            <span className="emi-value">
                              ₹
                              {emiDetails.monthlyAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="emi-detail">
                            <span className="emi-label">Duration:</span>
                            <span className="emi-value">
                              {emiDetails.tenure} months
                            </span>
                          </div>
                          <div className="emi-detail">
                            <span className="emi-label">Total Amount:</span>
                            <span className="emi-value">
                              ₹{emiDetails.totalAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                          {emiDetails.processingFee > 0 && (
                            <div className="emi-detail">
                              <span className="emi-label">Processing Fee:</span>
                              <span className="emi-value">
                                ₹
                                {emiDetails.processingFee.toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        {emiDetails.notes && (
                          <div className="emi-notes">
                            <span className="notes-icon">📌</span>
                            <span className="notes-text">
                              {emiDetails.notes}
                            </span>
                          </div>
                        )}
                        <div className="payment-benefits">
                          <span className="benefit-badge">
                            ✓ Easy Installments
                          </span>
                          <span className="benefit-badge">
                            ✓ Flexible Payments
                          </span>
                          {emiDetails.savings > 0 && (
                            <span className="benefit-badge savings">
                              ✓ Save ₹
                              {emiDetails.savings.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  )}
                </div>

                {paymentType === "emi" && emiDetails?.eligible && (
                  <div className="emi-due-date-selector">
                    <label>Select EMI Due Date</label>
                    <div className="due-date-options">
                      {[1,3,5,7,9,10].map((day) => (
                        <button
                          key={day}
                          className={`due-date-option ${
                            emiDueDay === day ? "selected" : ""
                          }`}
                          onClick={() => setEmiDueDay(day)}
                        >
                          <span className="day-number">{day}</span>
                          <span className="day-suffix">
                            {day === 1
                              ? "st"
                              : day === 2
                              ? "nd"
                              : day === 3
                              ? "rd"
                              : "th"}
                          </span>
                          <span className="day-text">of every month</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* {paymentType === "emi" && emiDetails?.eligible && (
                  <div className="emi-schedule-preview">
                    <h3>EMI Payment Schedule Preview</h3>
                    <div className="emi-schedule-header">
                      <div className="schedule-summary">
                        <div className="schedule-item">
                          <span className="schedule-label">First Payment:</span>
                          <span className="schedule-value">₹{emiDetails.monthlyAmount.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="schedule-item">
                          <span className="schedule-label">Total EMIs:</span>
                          <span className="schedule-value">{emiDetails.tenure}</span>
                        </div>
                        <div className="schedule-item">
                          <span className="schedule-label">Total Amount:</span>
                          <span className="schedule-value">₹{emiDetails.totalAmount.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="emi-schedule-list">
                      {Array.from({ length: Math.min(emiDetails.tenure, 6) }, (_, index) => {
                        const emiNumber = index + 1;
                        const isFirstPayment = emiNumber === 1;
                        const dueDate = new Date();
                        dueDate.setMonth(dueDate.getMonth() + index);
                        dueDate.setDate(emiDueDay);

                        return (
                          <div key={emiNumber} className={`emi-schedule-item ${isFirstPayment ? 'first-payment' : ''}`}>
                            <div className="emi-schedule-info">
                              <span className="emi-schedule-number">EMI {emiNumber}</span>
                              <span className="emi-schedule-amount">₹{emiDetails.monthlyAmount.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="emi-schedule-details">
                              <span className={`emi-schedule-status ${isFirstPayment ? 'due-soon' : 'upcoming'}`}>
                                {isFirstPayment ? 'Due on Payment' : 'Upcoming'}
                              </span>
                              <span className="emi-schedule-date">
                                {dueDate.toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {emiDetails.tenure > 6 && (
                        <div className="emi-schedule-more">
                          <span>+{emiDetails.tenure - 6} more EMIs</span>
                        </div>
                      )}
                    </div>
                    <div className="emi-schedule-note">
                      <span className="note-icon">ℹ️</span>
                      <span className="note-text">
                        This is a preview of your EMI schedule. Actual dates may vary based on payment processing.
                      </span>
                    </div>
                  </div>
                )} */}
              </div>

              <div className="payment-terms">
                <label className="terms-checkbox">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span>
                    I agree to the terms and conditions, including the{" "}
                    <span style={{ color: "red" }}>no-refund policy</span>.
                  </span>
                </label>
              </div>

              {error && (
                <div className="payment-error">
                  <span>{error}</span>
                  <button onClick={() => setError("")}>×</button>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={loading || !agreedToTerms}
                className={`payment-button ${
                  loading || !agreedToTerms ? "disabled" : ""
                }`}
              >
                {loading ? (
                  <div className="payment-button-loading">
                    <div className="payment-spinner"></div>
                    Processing...
                  </div>
                ) : paymentType === "emi" ? (
                  `Pay ₹${emiDetails?.monthlyAmount.toLocaleString(
                    "en-IN"
                  )} (First EMI)`
                ) : (
                  `Pay ₹${(course.price?.finalPrice || 0).toLocaleString("en-IN")}`
                )}
              </button>

              <p className="payment-security">
                Secured by <strong>Cashfree</strong>
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Summary - Only for new users */}
        {!isExistingUser && (
          <div className="payment-summary">
            <div className="summary-card">
              <h2>Order Summary</h2>
              <div className="summary-item">
                <span>{course.coursename}</span>
              </div>

              {/* ====== FULL PAYMENT BREAKDOWN ====== */}
              {paymentType !== "emi" && (
                <div className="price-breakdown-section">
                  <div className="breakdown-header">Price Breakdown</div>
                  {course.price?.amount && (
                    <div className="summary-row">
                      <span>MRP</span>
                      <span>
                        ₹{course.price.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  {course.price?.discount > 0 && (
                    <div className="summary-row" style={{ color: "#38a169" }}>
                      <span>Discount ({course.price.discount}%)</span>
                      <span>
                        - ₹
                        {Math.round(
                          course.price.amount * (course.price.discount / 100)
                        ).toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div className="summary-row" style={{ fontWeight: "600" }}>
                    <span>Course Value</span>
                    <span>
                      ₹
                      {(course.price.breakdown?.courseValue || course.price.finalPrice)?.toLocaleString("en-IN") || 0}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>CGST (9%)</span>
                    <span>
                      ₹
                      {course.price.breakdown?.gst?.cgst?.toLocaleString("en-IN") || 0}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>SGST (9%)</span>
                    <span>
                      ₹
                      {course.price.breakdown?.gst?.sgst?.toLocaleString("en-IN") || 0}
                    </span>
                  </div>
                  <div className="summary-row gst-total">
                    <span>Total GST (18%)</span>
                    <span>
                      ₹
                      {course.price.breakdown?.gst?.total?.toLocaleString("en-IN") || 0}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Transaction Fee (2%)</span>
                    <span>
                      ₹
                      {course.price.breakdown?.transactionFee?.toLocaleString("en-IN") || 0}
                    </span>
                  </div>
                  <hr />
                  <div className="total-amount">
                    <span>Total Payable</span>
                    <span>₹{(course.price?.finalPrice || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              {/* ====== EMI PAYMENT BREAKDOWN ====== */}
              {paymentType === "emi" && emiDetails && (() => {
                const bd = emiDetails.breakdown || {};
                const monthlyBase = bd.courseValue || emiDetails.monthlyBase || 0;
                const cgst = bd.cgst || Math.round(monthlyBase * 0.09);
                const sgst = bd.sgst || Math.round(monthlyBase * 0.09);
                const gst = bd.gstTotal || (cgst + sgst);
                const txnFee = bd.transactionFee || Math.round((monthlyBase + gst) * 0.02);
                const monthlyEmi = emiDetails.monthlyAmount || (monthlyBase + gst + txnFee);
                return (
                  <div className="price-breakdown-section">
                    <div className="breakdown-header">EMI Plan</div>
                    <div className="summary-row">
                      <span>Course Amount</span>
                      <span>₹{emiDetails.baseTotalAmount?.toLocaleString("en-IN") || (monthlyBase * emiDetails.tenure).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="summary-row">
                      <span>Tenure</span>
                      <span>{emiDetails.tenure} months</span>
                    </div>

                    <div className="breakdown-header" style={{ marginTop: "14px", fontSize: "0.85rem" }}>
                      Monthly Breakdown
                    </div>
                    <div className="summary-row">
                      <span>Course Value</span>
                      <span>₹{monthlyBase.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="summary-row">
                      <span>CGST (9%)</span>
                      <span>₹{cgst.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="summary-row">
                      <span>SGST (9%)</span>
                      <span>₹{sgst.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="summary-row gst-total">
                      <span>Total GST (18%)</span>
                      <span>₹{gst.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="summary-row">
                      <span>Transaction Fee (2%)</span>
                      <span>₹{txnFee.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="summary-row" style={{ fontWeight: "700", borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "6px" }}>
                      <span>Monthly EMI</span>
                      <span>₹{monthlyEmi.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="summary-row" style={{ fontWeight: "600", color: "#4f46e5", marginTop: "4px" }}>
                      <span>Total EMI ({emiDetails.tenure} months)</span>
                      <span>₹{emiDetails.totalAmount?.toLocaleString("en-IN")}</span>
                    </div>
                    <hr />
                    <div className="total-amount">
                      <span>Total Payable (1st EMI)</span>
                      <span>₹{monthlyEmi.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Payment Processing Overlay */}
      {paymentProcessing && (
        <div className="payment-processing-overlay">
          <div className="payment-processing-card">
            <div className="payment-processing-spinner"></div>
            <h3>Processing Payment...</h3>
            <p>Verifying your transaction. Please wait.</p>
            <p className="payment-method-info">
              Payment method will be confirmed shortly
            </p>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal.show && (
        <div className="payment-modal-overlay">
          <div className="payment-modal modern-modal">
            <div
              className={`modal-icon ${modal.isSuccess ? "success" : "error"}`}
            >
              {modal.isSuccess ? (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="#10B981" />
                  <path
                    d="m16 24 6 6 12-12"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" fill="#EF4444" />
                  <path
                    d="m18 18 12 12M30 18l-12 12"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <h3>{modal.isSuccess ? "Success!" : "Error"}</h3>
            <p>{modal.message}</p>
            <button onClick={closeModal} className="modal-button">
              {modal.isSuccess ? "Continue to Course" : "Close"}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .payment-container {
          min-height: 100vh;
          background: transparent; /* removed page gradient background */
          padding: 20px;
        }

        .payment-layout {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 30px;
          align-items: start;
        }

        .payment-main-content {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .payment-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .payment-header h1 {
          color: #1a202c;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .payment-header p {
          color: #4a5568;
          font-size: 16px;
        }

        .payment-course-card {
          display: flex;
          gap: 20px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 30px;
        }

        .course-thumbnail {
          width: 120px;
          height: 80px;
          object-fit: cover;
          border-radius: 8px;
        }

        .course-info h3 {
          color: #1a202c;
          font-size: 18px;
          margin-bottom: 8px;
        }

        .course-info p {
          color: #4a5568;
          margin-bottom: 10px;
        }

        .course-price {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .final-price {
          font-size: 20px;
          font-weight: 700;
          color: #2d3748;
        }

        .original-price {
          font-size: 16px;
          color: #a0aec0;
          text-decoration: line-through;
        }

        .course-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          color: #4a5568;
          font-size: 14px;
        }

        .payment-options h3 {
          color: #1a202c;
          margin-bottom: 20px;
        }

        .payment-option-group {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 20px;
        }

        .payment-option {
          display: block;
          padding: 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .payment-option:hover {
          border-color: #3182ce;
        }

        .payment-option input[type="radio"] {
          margin-right: 15px;
        }

        .payment-option input[type="radio"]:checked + .payment-option-content {
          background: #f7fafc;
        }

        .payment-option-content {
          flex: 1;
        }

        .payment-option-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .payment-option-header span:first-child {
          font-weight: 600;
          color: #1a202c;
        }

        .payment-amount {
          font-weight: 700;
          color: #3182ce;
          font-size: 18px;
        }

        .emi-due-date-selector {
          margin-top: 30px;
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .emi-due-date-selector label {
          display: block;
          margin-bottom: 16px;
          font-weight: 700;
          color: #2d3748;
          font-size: 16px;
          letter-spacing: 0.5px;
        }

        .due-date-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .due-date-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          font-size: 14px;
          color: #4a5568;
        }

        .due-date-option:hover {
          border-color: #3182ce;
          background: #f7fafc;
        }

        .due-date-option.selected {
          border-color: #3182ce;
          background: #ebf8ff;
          color: #2d3748;
        }

        .day-number {
          font-size: 24px;
          font-weight: 700;
          color: #2d3748;
        }

        .day-suffix {
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
        }

        .day-text {
          font-size: 12px;
          color: #a0aec0;
        }

        .due-date-option.selected .day-number {
          color: #3182ce;
        }

        .due-date-option.selected .day-suffix,
        .due-date-option.selected .day-text {
          color: #2c5282;
        }

        .emi-schedule-preview {
          margin-top: 30px;
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .emi-schedule-preview h3 {
          color: #1a202c;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 20px;
          text-align: center;
        }

        .emi-schedule-header {
          margin-bottom: 20px;
        }

        .schedule-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .schedule-item {
          text-align: center;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .schedule-label {
          display: block;
          font-size: 12px;
          color: #718096;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .schedule-value {
          display: block;
          font-size: 16px;
          font-weight: 700;
          color: #1a202c;
        }

        .emi-schedule-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 15px;
        }

        .emi-schedule-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .emi-schedule-item:hover {
          border-color: #3182ce;
          box-shadow: 0 2px 4px rgba(49, 130, 206, 0.1);
        }

        .emi-schedule-item.first-payment {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-color: #10b981;
        }

        .emi-schedule-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .emi-schedule-number {
          font-weight: 600;
          color: #1a202c;
          font-size: 14px;
        }

        .emi-schedule-amount {
          font-size: 16px;
          font-weight: 700;
          color: #3182ce;
        }

        .emi-schedule-details {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .emi-schedule-status {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .emi-schedule-status.due-soon {
          background: #fef3c7;
          color: #92400e;
        }

        .emi-schedule-status.upcoming {
          background: #f3f4f6;
          color: #6b7280;
        }

        .emi-schedule-date {
          font-size: 12px;
          color: #718096;
        }

        .emi-schedule-more {
          text-align: center;
          padding: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          color: #4a5568;
          font-weight: 600;
        }

        .emi-schedule-note {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          padding: 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
        }

        .note-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .note-text {
          color: #1e40af;
          font-size: 13px;
          line-height: 1.5;
        }

        .payment-terms {
          margin: 30px 0;
        }

        .terms-checkbox {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
        }

        .terms-checkbox input[type="checkbox"] {
          margin-top: 4px;
        }

        .payment-error {
          background: #fed7d7;
          color: #c53030;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .payment-error button {
          background: none;
          border: none;
          color: #c53030;
          font-size: 18px;
          cursor: pointer;
        }

        .payment-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 15px;
        }

        .payment-button:hover:not(.disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .payment-button.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .payment-button-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .payment-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #ffffff40;
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .payment-security {
          text-align: center;
          color: #4a5568;
          font-size: 14px;
        }

        .payment-summary {
          background: white;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          height: fit-content;
          position: sticky;
          top: 20px;
        }

        .summary-card h2 {
          margin-bottom: 20px;
          color: #1a202c;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
        }

        .emi-summary {
          margin: 15px 0;
        }

        .price-breakdown-section {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          margin: 15px 0;
        }

        .breakdown-header {
          font-weight: 700;
          font-size: 14px;
          color: #1e293b;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
          color: #4a5568;
        }

        .summary-row.gst-total {
          font-weight: 600;
          color: #2d3748;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
        }

        .total-amount {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 18px;
          color: #1a202c;
          margin-top: 15px;
        }

        .existing-user-actions {
          display: flex;
          gap: 15px;
          margin-top: 30px;
        }

        .primary-button {
          flex: 1;
          padding: 14px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .secondary-button {
          flex: 1;
          padding: 12px 20px;
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .secondary-button:hover {
          background: #edf2f7;
          border-color: #cbd5e0;
        }

        .enrolled-badge {
          background: #d1fae5;
          color: #065f46;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
        }

        .status-badge.complete {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.emi {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-badge.paid {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.overdue {
          background: #fee2e2;
          color: #dc2626;
        }

        .payment-status-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .status-header h3 {
          color: #1a202c;
          margin: 0;
        }

        .status-indicator {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-indicator.complete {
          background: #d1fae5;
          color: #065f46;
        }

        .status-indicator.emi-active {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-details {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .status-item:last-child {
          border-bottom: none;
        }

        .status-label {
          color: #4a5568;
          font-size: 14px;
        }

        .status-value {
          color: #1a202c;
          font-weight: 600;
          font-size: 14px;
        }

        .status-value.complete {
          color: #065f46;
        }

        .status-value.pending {
          color: #92400e;
        }

        .status-value.overdue {
          color: #dc2626;
        }

        .status-value.access-granted {
          color: #065f46;
        }

        .emi-breakdown-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }

        .emi-breakdown-header {
          margin-bottom: 20px;
        }

        .emi-breakdown-card h3 {
          color: #1a202c;
          margin-bottom: 15px;
          font-size: 18px;
          font-weight: 700;
        }

        .emi-progress-summary {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .progress-text {
          font-size: 14px;
          font-weight: 600;
          color: #1a202c;
          margin-bottom: 8px;
          text-align: center;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981 0%, #06d6a0 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .emi-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .emi-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          transition: all 0.2s ease;
        }

        .emi-item:hover {
          border-color: #cbd5e0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .emi-item.paid {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .emi-item.pending {
          background: #fefce8;
          border-color: #fde047;
        }

        .emi-item.overdue {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .emi-main-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
        }

        .emi-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .emi-number {
          font-weight: 600;
          color: #1a202c;
          font-size: 14px;
        }

        .emi-amount {
          font-size: 16px;
          font-weight: 700;
          color: #3182ce;
        }

        .emi-status-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .emi-date {
          font-size: 12px;
          color: #718096;
        }

        .emi-payment-details {
          padding: 8px 16px 12px;
          border-top: 1px solid #e2e8f0;
          background: rgba(16, 185, 129, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .payment-date {
          font-size: 12px;
          color: #065f46;
          font-weight: 600;
        }

        .transaction-id {
          font-size: 11px;
          color: #047857;
          font-family: monospace;
        }

        .emi-overdue-notice {
          padding: 8px 16px 12px;
          border-top: 1px solid #fecaca;
          background: rgba(220, 38, 38, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .overdue-text {
          font-size: 12px;
          color: #dc2626;
          font-weight: 600;
        }

        .overdue-amount {
          font-size: 14px;
          color: #dc2626;
          font-weight: 700;
        }

        /* EMI Schedule Preview Styles */
        .emi-schedule-preview {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }

        .emi-schedule-header {
          margin-bottom: 20px;
        }

        .emi-schedule-preview h3 {
          color: #1a202c;
          margin-bottom: 15px;
          font-size: 18px;
          font-weight: 700;
        }

        .schedule-summary {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
        }

        .summary-item {
          text-align: center;
        }

        .summary-label {
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .summary-value {
          font-size: 16px;
          font-weight: 700;
          color: #1a202c;
        }

        .schedule-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .timeline-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
          transition: all 0.2s ease;
        }

        .timeline-item:hover {
          border-color: #cbd5e0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .timeline-item.upcoming {
          background: #fefce8;
          border-color: #fde047;
        }

        .timeline-item.current {
          background: #ecfdf5;
          border-color: #10b981;
          border-width: 2px;
        }

        .timeline-marker {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .timeline-marker.upcoming {
          background: #f59e0b;
        }

        .timeline-marker.current {
          background: #10b981;
        }

        .timeline-marker.completed {
          background: #6b7280;
        }

        .timeline-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .timeline-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .timeline-month {
          font-weight: 600;
          color: #1a202c;
          font-size: 14px;
        }

        .timeline-date {
          font-size: 12px;
          color: #718096;
        }

        .timeline-amount {
          font-size: 16px;
          font-weight: 700;
          color: #3182ce;
        }

        /* EMI Status Cards */
        .emi-status-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin: 20px 0;
        }

        .status-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: all 0.2s ease;
        }

        .status-card:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }

        .status-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          font-size: 20px;
        }

        .status-icon.completed {
          background: #dcfce7;
          color: #166534;
        }

        .status-icon.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-icon.overdue {
          background: #fee2e2;
          color: #dc2626;
        }

        .status-number {
          font-size: 32px;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 4px;
        }

        .status-label {
          font-size: 14px;
          color: #718096;
          font-weight: 500;
        }

        /* EMI Details Modal */
        .emi-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .emi-modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .emi-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .emi-modal-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
        }

        .emi-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #718096;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .emi-modal-close:hover {
          background: #f7fafc;
          color: #1a202c;
        }

        .emi-modal-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .emi-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .emi-detail-row:last-child {
          border-bottom: none;
        }

        .emi-detail-label {
          font-weight: 500;
          color: #4a5568;
        }

        .emi-detail-value {
          font-weight: 600;
          color: #1a202c;
        }

        .emi-modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .emi-modal-button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .emi-modal-button.primary {
          background: #3182ce;
          color: white;
        }

        .emi-modal-button.primary:hover {
          background: #2c5282;
        }

        .emi-modal-button.secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .emi-modal-button.secondary:hover {
          background: #cbd5e0;
        }

        /* EMI Plan Selection */
        .emi-plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin: 20px 0;
        }

        .emi-plan-card {
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .emi-plan-card:hover {
          border-color: #3182ce;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .emi-plan-card.selected {
          border-color: #3182ce;
          background: #ebf8ff;
        }

        .emi-plan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .emi-plan-duration {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
        }

        .emi-plan-discount {
          background: #dcfce7;
          color: #166534;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .emi-plan-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .emi-plan-amount {
          font-size: 20px;
          font-weight: 700;
          color: #3182ce;
        }

        .emi-plan-description {
          font-size: 14px;
          color: #718096;
        }

        .emi-plan-benefits {
          margin-top: 12px;
        }

        .emi-plan-benefits ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .emi-plan-benefits li {
          font-size: 13px;
          color: #4a5568;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
        }

        .emi-plan-benefits li:before {
          content: '✓';
          color: #10b981;
          font-weight: bold;
          margin-right: 8px;
        }

        /* Payment Summary */
        .payment-summary {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }

        .payment-summary h3 {
          color: #1a202c;
          margin-bottom: 20px;
          font-size: 18px;
          font-weight: 700;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .summary-row:last-child {
          border-bottom: none;
          border-top: 2px solid #e2e8f0;
          margin-top: 12px;
          padding-top: 16px;
        }

        .summary-row.total {
          font-size: 18px;
          font-weight: 700;
          color: #1a202c;
        }

        .summary-label {
          color: #4a5568;
          font-weight: 500;
        }

        .summary-value {
          color: #1a202c;
          font-weight: 600;
        }

        .summary-value.discount {
          color: #dc2626;
        }

        .summary-value.total {
          color: #3182ce;
        }

        /* Payment Buttons */
        .payment-buttons {
          display: flex;
          gap: 12px;
          margin: 20px 0;
        }

        .payment-button {
          flex: 1;
          padding: 16px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .payment-button.primary {
          background: #3182ce;
          color: white;
        }

        .payment-button.primary:hover {
          background: #2c5282;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(49, 130, 206, 0.3);
        }

        .payment-button.secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .payment-button.secondary:hover {
          background: #cbd5e0;
        }

        .payment-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .payment-button:disabled:hover {
          background: #3182ce;
        }

        /* Loading and Error States */
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid #e2e8f0;
          border-radius: 50%;
          border-top-color: #3182ce;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px;
          margin: 10px 0;
          color: #dc2626;
          font-size: 14px;
        }

        .success-message {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 12px;
          margin: 10px 0;
          color: #166534;
          font-size: 14px;
        }

        .retry-button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          transition: background 0.2s ease;
        }

        .retry-button:hover {
          background: #b91c1c;
        }

        .success-icon-large {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          color: white;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        }

        .enrolled-message {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 24px;
          margin: 30px 0;
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .enrolled-icon {
          font-size: 48px;
          flex-shrink: 0;
        }

        .enrolled-text h3 {
          color: #065f46;
          margin-bottom: 8px;
          font-size: 20px;
        }

        .enrolled-text p {
          color: #047857;
          line-height: 1.6;
          margin: 0;
        }

        .payment-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .payment-modal {
          background: white;
          padding: 40px;
          border-radius: 16px;
          text-align: center;
          max-width: 400px;
          width: 90%;
        }

        .modal-icon {
          margin: 0 auto 20px;
          width: 48px;
          height: 48px;
        }

        .payment-modal h3 {
          margin-bottom: 15px;
          color: #1a202c;
        }

        .payment-modal p {
          margin-bottom: 30px;
          color: #4a5568;
        }

        .modal-button {
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .payment-loading-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent; /* removed loading gradient background */
        }

        .payment-loading-card {
          background: white;
          padding: 40px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .payment-loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        /* Enhanced Payment Option Styles */
        .payment-label {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
        }

        .payment-description {
          color: #64748b;
          font-size: 14px;
          margin: 8px 0 12px 0;
          line-height: 1.6;
        }

        .payment-benefits {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .benefit-badge {
          background: #eff6ff;
          color: #3b82f6;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .benefit-badge.savings {
          background: #dcfce7;
          color: #16a34a;
        }

        /* EMI Breakdown Styles */
        .emi-breakdown {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          margin: 12px 0;
        }

        .emi-detail {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .emi-detail:last-child {
          border-bottom: none;
        }

        .emi-label {
          color: #64748b;
          font-size: 13px;
        }

        .emi-value {
          color: #1e293b;
          font-weight: 600;
          font-size: 13px;
        }

        .emi-notes {
          background: #fef3c7;
          padding: 10px 12px;
          border-radius: 6px;
          margin-top: 10px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .notes-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .notes-text {
          color: #92400e;
          font-size: 12px;
          line-height: 1.5;
        }

        /* Disabled Option Styles */
        .payment-option-disabled {
          padding: 20px;
          border: 2px dashed #cbd5e0;
          border-radius: 12px;
          background: #f8f9fa;
          opacity: 0.7;
        }

        .payment-badge-disabled {
          background: #e2e8f0;
          color: #64748b;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        }

        .payment-description.disabled {
          color: #94a3b8;
        }

        .payment-info {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 10px;
          padding: 10px;
          background: #e0f2fe;
          border-radius: 6px;
        }

        .info-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .info-text {
          color: #0369a1;
          font-size: 12px;
        }

        /* Payment Processing Overlay */
        .payment-processing-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .payment-processing-card {
          background: white;
          border-radius: 16px;
          padding: 50px 40px;
          text-align: center;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .payment-processing-spinner {
          width: 60px;
          height: 60px;
          margin: 0 auto 25px;
          border: 5px solid #f3f4f6;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .payment-processing-card h3 {
          color: #1a202c;
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .payment-processing-card p {
          color: #6b7280;
          font-size: 15px;
          margin: 0;
        }

        .payment-method-info {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 8px;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .payment-layout {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .payment-course-card {
            flex-direction: column;
            gap: 15px;
          }

          .course-thumbnail {
            width: 100%;
            height: 200px;
          }

          .existing-user-actions {
            flex-direction: column;
          }

          .primary-button,
          .secondary-button {
            width: 100%;
          }

          .enrolled-message {
            flex-direction: column;
            text-align: center;
          }

          .success-icon-large {
            width: 64px;
            height: 64px;
            font-size: 36px;
          }

          .due-date-options {
            grid-template-columns: repeat(3, 1fr);
          }

          .payment-label {
            font-size: 14px;
          }

          .emi-breakdown {
            padding: 10px;
          }

          .payment-processing-card {
            padding: 40px 30px;
          }

          .payment-processing-card h3 {
            font-size: 20px;
          }

          .status-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .status-value {
            font-size: 13px;
          }

          .emi-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .emi-status {
            align-items: flex-start;
            width: 100%;
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .emi-status-cards {
            grid-template-columns: 1fr;
          }

          .emi-plans-grid {
            grid-template-columns: 1fr;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .payment-buttons {
            flex-direction: column;
          }

          .emi-modal-content {
            width: 95%;
            padding: 16px;
          }

          .emi-main-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .emi-status-section {
            align-items: flex-start;
          }

          .timeline-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .timeline-amount {
            align-self: flex-end;
          }
        }

        @media (max-width: 480px) {
          .emi-breakdown-card,
          .emi-schedule-preview,
          .payment-summary {
            padding: 16px;
          }

          .status-card {
            padding: 16px;
          }

          .emi-plan-card {
            padding: 16px;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;
