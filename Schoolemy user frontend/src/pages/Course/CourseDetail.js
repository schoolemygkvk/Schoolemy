import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import api from "../../service/api"; // Use centralized API instance
import { getTutorCourseById } from "../../service/courseApi";
import EMIService from "../../service/emiService";
import {
  FaStar,
  FaRegClock,
  FaUserGraduate,
  FaLock,
  FaVideo,
  FaUnlockAlt,
  FaCertificate,
  FaCheckCircle,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { IoClose } from "react-icons/io5";

// Material UI Components for Login Modal
import {
  Dialog,
  IconButton,
  Box,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Toast Notifications
import { toast } from "react-toastify";

// Auth Components
import LoginForm from "../../components/auth/LoginForm";
import RegisterForm from "../../components/auth/RegisterForm";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
import VerifyOtpForm from "../../components/auth/VerifyOtpForm";
import CreatePasswordForm from "../../components/auth/CreatePasswordForm";
import NewProfileForm from "../../components/auth/NewProfileForm";
import StepperComponent from "../../components/auth/common/StepperComponent";

// Auth Context and Services
import { useAuth } from "../../Context/AuthContext";
import authService from "../../components/services/authService";

// Format course description with paragraphs and bullet points
const formatCourseDescription = (content) => {
  if (!content || typeof content !== "string") return "";
  const trimmed = content.trim();
  if (!trimmed) return "";
  if (trimmed.includes("<") && trimmed.includes(">")) return trimmed;
  const paragraphs = trimmed.split(/\n\n+/);
  return paragraphs
    .map((block) => {
      const lines = block
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const isBulletList = lines.every(
        (l) => /^[-*•]\s/.test(l) || /^\d+[.)]\s/.test(l)
      );
      if (isBulletList && lines.length > 0) {
        const items = lines
          .map((l) => {
            const m =
              l.match(/^[-*•]\s+(.*)$/) || l.match(/^(\d+)[.)]\s+(.*)$/);
            return m ? `<li>${m[1] || m[2]}</li>` : `<li>${l}</li>`;
          })
          .join("");
        return `<ul>${items}</ul>`;
      }
      return `<p>${lines.join("<br/>")}</p>`;
    })
    .join("");
};

const CoursePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  // Detect if this is a tutor course based on the route path
  const isTutorCourse = location.pathname.includes('/tutor-course/');

  const [course, setCourse] = useState(null);
  const [access, setAccess] = useState("limited");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState("");
  const [currentVideoTitle, setCurrentVideoTitle] = useState("");
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [currentAudioUrl] = useState("");
  const [currentAudioTitle] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Login Modal States
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // Store action to perform after login

  // Signup Stepper States
  const [activeStep, setActiveStep] = useState(0);
  const [registrationData, setRegistrationData] = useState({ email: "", mobile: "", password: "" });
  const [otpFromBackend, setOtpFromBackend] = useState("");
  const steps = ["Account Setup", "Verify OTP", "Set Password", "Profile Details"];

  // Helper: for tutor courses, derive user access from dedicated payment status endpoint
  const updateAccessFromTutorPaymentStatus = async (courseId) => {
    try {
      if (!isTutorCourse) return;

      const token = localStorage.getItem("token");
      if (!token) return; // Only check for logged-in users

      const statusRes = await api.get(`/user/payment/tutor-course/${courseId}`);
      const statusData = statusRes.data;

      console.log("Tutor course payment status for access:", statusData);

      if (statusData?.success && statusData.data) {
        const paymentInfo = statusData.data;

        // If user has completed payment, treat as full access
        if (paymentInfo.hasCompletedPayment) {
          setAccess("full");
          console.log("Tutor course: hasCompletedPayment=true → access set to 'full'");
        } else if (paymentInfo.hasPayment) {
          // Payment exists but not completed – treat as purchased/enrolled
          setAccess("purchased");
          console.log("Tutor course: hasPayment=true → access set to 'purchased'");
        }
      }
    } catch (err) {
      // If endpoint doesn't exist or fails, don't block the rest of the flow
      console.warn("Tutor course payment status check failed:", err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check for payment completion and refetch data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get("payment_success");

    if (paymentSuccess === "true" && isLoggedIn) {
      // Payment was successful, refetch course data
      setTimeout(async () => {
        await refetchCourseData();
        toast.success(
          "Payment successful! You now have full access to the course."
        );

        // Force re-render by updating access status
        try {
          let res;
          if (isTutorCourse) {
            res = await getTutorCourseById(id);
          } else {
            res = await api.get(`/courses/${id}`);
          }
          
          // Handle different response structures
          const data = isTutorCourse ? res : (res.data || res);
          if (data.success) {
            const userAccess =
              data.access ||
              data.data?.userAccess ||
              data.data?.access ||
              data.accessStatus ||
              "full";
            setAccess(userAccess);
            console.log("Payment success - Updated access to:", userAccess);
            }
        } catch (error) {
          console.error("Error updating access after payment:", error);
        }
      }, 500);

      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from appropriate API based on course type
        let res;
        if (isTutorCourse) {
          // getTutorCourseById returns response.data directly
          res = await getTutorCourseById(id);
        } else {
          // Regular API call returns full response object
          res = await api.get(`/courses/${id}`);
        }

        // Handle different response structures
        // For tutor courses: res is already response.data = { success, data, message }
        // For regular courses: res is { data: { success, data, message }, status }
        let responseData;
        let status;
        
        if (isTutorCourse) {
          // res is already the parsed response.data
          responseData = res;
          status = responseData.success ? 200 : 400;
        } else {
          // res is the axios response object
          responseData = res.data;
          status = res.status || (responseData.success ? 200 : 400);
        }
        
        console.log("Course fetch response:", {
          isTutorCourse,
          status,
          responseData,
          hasSuccess: responseData?.success,
          hasData: !!responseData?.data
        });
        
        if (status !== 200) {
          if (status === 401 && !isLoggedIn) {
            console.log("User not logged in - providing limited course preview");

            // Create a limited course preview object for non-authenticated users
            const limitedCourseData = {
              _id: id,
              coursename: "Course Preview",
              category: "General",
              courseduration: "Duration varies",
              thumbnail: "/default-course.jpg",
              price: {
                amount: 0,
                finalPrice: 0,
                discount: 0,
              },
              rating: 0,
              level: "All Levels",
              language: "Multi-language",
              studentEnrollmentCount: 0,
              instructor: "Expert Instructor",
              description:
                "Please log in to view complete course details and enroll in this course.",
              whatYoullLearn: [
                "Please log in to see detailed learning outcomes",
                "Full course content available after enrollment",
                "Interactive lessons and assessments included",
              ],
              contentduration: {
                hours: 0,
                minutes: 0,
              },
              certificates: "yes",
              previewvedio: null,
            };

            setCourse(limitedCourseData);
            setAccess("limited");
            setLoading(false);
            return;
          }
          
          // For other errors, show generic error
          throw new Error(`Error loading course`);
        }

        const data = responseData;

        if (data.success) {
          // Extract course data - could be in data.data or data itself
          const courseData = data.data || data;
          setCourse(courseData);
          // Ensure access is properly set based on backend response - check multiple possible fields
          const userAccess =
            data.access ||
            courseData?.userAccess ||
            courseData?.access ||
            data.accessStatus ||
            "limited";
          setAccess(userAccess);
          console.log(
            "Course loaded - Access status:",
            userAccess,
            "User logged in:",
            isLoggedIn,
            "Is Tutor Course:",
            isTutorCourse,
            "Course data:",
            courseData
          ); // Debug log

          // For tutor courses, also cross-check payment status to update access
          if (isTutorCourse && isLoggedIn) {
            await updateAccessFromTutorPaymentStatus(id);
          }
        } else {
          throw new Error(data.message || "Failed to load course.");
        }
      } catch (err) {
        console.error("Error fetching course:", err);

        // If user is not logged in and we get an error, provide limited preview
        if (
          !isLoggedIn &&
          (err.message.includes("401") || err.message.includes("Unauthorized"))
        ) {
          console.log(
            "Handling auth error for non-logged-in user - providing course preview"
          );

          const limitedCourseData = {
            _id: id,
            coursename: "Course Available - Login to View",
            category: "Various Categories",
            courseduration: "Multiple Duration Options",
            thumbnail: "/default-course.jpg",
            price: {
              amount: 0,
              finalPrice: 0,
              discount: 0,
            },
            rating: 4.5,
            level: "All Levels",
            language: "english",
            studentEnrollmentCount: 0,
            instructor: "Expert Instructors",
            description:
              "This course is available for enrollment. Please log in to view complete details, pricing, and course content. Create an account to access full course information and start your learning journey.",
            whatYoullLearn: [
              "Complete course details available after login",
              "Expert-designed curriculum and content",
              "Interactive learning experience",
              "Certificate upon successful completion",
            ],
            contentduration: {
              hours: 0,
              minutes: 0,
            },
            certificates: "yes",
            previewvedio: null,
          };

          setCourse(limitedCourseData);
          setAccess("limited");
        } else {
          setError(err.message || "Failed to load course. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, isLoggedIn, isTutorCourse]); // Add isLoggedIn and isTutorCourse as dependencies

  // Additional effect to handle login status changes and ensure proper access updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isLoggedIn && course) {
      // User just logged in and we have course data, refetch to get updated access
      const updateAccessOnLogin = async () => {
        try {
          let res;
          if (isTutorCourse) {
            res = await getTutorCourseById(id);
          } else {
            res = await api.get(`/courses/${id}`);
          }
          
          // Handle different response structures
          const data = isTutorCourse ? res : (res.data || res);
          if (data.success) {
              const userAccess =
                data.access ||
                data.data?.userAccess ||
                data.data?.access ||
                data.accessStatus ||
                "limited";
              setAccess(userAccess);
              console.log(
                "Login status changed - Updated access to:",
                userAccess
              );

              // Additional check: if user has purchased/enrolled, ensure they can access content
              if (
                userAccess === "full" ||
                userAccess === "purchased" ||
                userAccess === "enrolled" ||
                userAccess === "completed"
              ) {
                console.log("User has full access - enrollment confirmed");
              }
            }

            // For tutor courses, also sync access with payment status
            if (isTutorCourse) {
              await updateAccessFromTutorPaymentStatus(id);
            }
        } catch (error) {
          console.error("Error updating access on login status change:", error);
        }
      };

      updateAccessOnLogin();
    }
  }, [isLoggedIn, course?.coursename, isTutorCourse, id]); // Trigger when login status changes and we have course data

  // Login Modal Handlers
  const handleOpenLogin = () => setLoginModalOpen(true);
  const handleCloseLogin = () => {
    setLoginModalOpen(false);
    setPendingAction(null);
  };
  const handleOpenSignup = () => setSignupModalOpen(true);
  const handleCloseSignup = () => {
    setSignupModalOpen(false);
    setPendingAction(null);
  };
  const resetSignupModal = () => {
    setActiveStep(0);
    setRegistrationData({ email: "", mobile: "", password: "" });
    setOtpFromBackend("");
    setSignupModalOpen(false);
    setPendingAction(null);
  };
  const handleOpenForgotPassword = () => setForgotPasswordModalOpen(true);
  const handleCloseForgotPassword = () => {
    setForgotPasswordModalOpen(false);
    setPendingAction(null);
  };

  const switchToSignup = () => {
    handleCloseLogin();
    handleCloseForgotPassword();
    handleOpenSignup();
  };
  const switchToLogin = () => {
    resetSignupModal();
    handleCloseForgotPassword();
    handleOpenLogin();
  };
  const switchToForgotPassword = () => {
    handleCloseLogin();
    handleOpenForgotPassword();
  };

  // Signup Step Handlers
  const handleNextStep = () => setActiveStep((prev) => prev + 1);

  const handleRegister = async (data) => {
    try {
      const response = await authService.register(data);
      setRegistrationData((prev) => ({ ...prev, ...data }));
      setOtpFromBackend(response.data.otp_for_verification);
      toast.success(response.data.message || "OTP Sent!");
      handleNextStep();
    } catch (error) {
        const status = error.response?.status;
        if (status === 409) {
          toast.error(error.response?.data?.message || 'An account already exists with this email/mobile. Please login or use Forgot Password.');
        } else {
          toast.error(error.response?.data?.message || "Registration failed.");
        }
        throw error;
    }
  };

  const handleVerifyOtp = (data) => {
    if (data.otp === otpFromBackend) {
      toast.success("OTP Verified Successfully!");
      handleNextStep();
    } else {
      toast.error("Invalid OTP. Please try again.");
    }
  };

  const handleResendOtp = async (userIdentifier) => {
    try {
      const response = await authService.resendOtp(userIdentifier);
      setOtpFromBackend(response.data.otp_for_verification);
      toast.success(response.data.message || "New OTP sent!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP.");
    }
  };

  const handleCreatePassword = (data) => {
    setRegistrationData((prev) => ({ ...prev, password: data.password }));
    toast.success("Password noted. Continue to profile.");
    handleNextStep();
  };

  const handleSaveProfile = async (profileFormDataPayload) => {
    try {
      profileFormDataPayload.append("password", registrationData.password);
      if (registrationData.email) profileFormDataPayload.append("email", registrationData.email);
      if (registrationData.mobile) profileFormDataPayload.append("mobile", registrationData.mobile);
      await authService.completeRegistration(profileFormDataPayload);
      resetSignupModal();
      handleSignupSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save profile.");
    }
  };

  const handleSignupSuccess = () => {
    toast.success("Registration successful! Please log in to continue.");
    setTimeout(() => {
      handleOpenLogin();
    }, 500);
  };

  // Function to refetch course data (useful after payment or login)
  const refetchCourseData = async () => {
    try {
      let res;
      if (isTutorCourse) {
        res = await getTutorCourseById(id);
      } else {
        res = await api.get(`/courses/${id}`);
      }

      // Handle different response structures
      let responseData;
      let status;
      
      if (isTutorCourse) {
        // res is already response.data
        responseData = res;
        status = responseData.success ? 200 : 400;
      } else {
        // res is axios response object
        responseData = res.data || res;
        status = res.status || (responseData.success ? 200 : 400);
      }

      if (status === 200) {
        const data = responseData;
        if (data.success) {
          setCourse(data.data || data);
          const userAccess =
            data.access ||
            data.data?.userAccess ||
            data.data?.access ||
            data.accessStatus ||
            "limited";
          setAccess(userAccess);
          console.log("Course data refetched, new access:", userAccess);
        }
      }
    } catch (err) {
      console.error("Error refetching course data:", err);
    }
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    handleCloseLogin();
    handleCloseSignup();
    toast.success("Login successful!");

    // Refetch course data to get updated access status
    setTimeout(async () => {
      await refetchCourseData();

      // For tutor courses, also ensure access is in sync with payment status
      if (isTutorCourse) {
        await updateAccessFromTutorPaymentStatus(id);
      }

      // Check if user already has access after login
      const token = localStorage.getItem("token");
      if (token) {
        try {
          let res;
          if (isTutorCourse) {
            res = await getTutorCourseById(id);
          } else {
            res = await api.get(`/courses/${id}`);
          }
          
          // Handle different response structures
          const data = isTutorCourse ? res : (res.data || res);
          if (data.success) {
            const userAccess =
              data.access ||
              data.data?.userAccess ||
              data.data?.access ||
              data.accessStatus ||
              "limited";
            if (
              userAccess === "full" ||
              userAccess === "purchased" ||
              userAccess === "enrolled" ||
              userAccess === "completed"
            ) {
              // User already has access, navigate to content
              if (pendingAction === "enroll" || pendingAction === "continue") {
                navigate(isTutorCourse ? `/tutor-course/${id}/content` : `/course/${id}/content`);
              }
            } else {
              // User needs to purchase
              if (pendingAction === "enroll") {
                navigate(isTutorCourse ? `/user/payment/tutor-course/${id}` : `/course/${id}/payment`);
              }
            }

            // Handle preview action
            if (pendingAction === "preview") {
              const courseData = data.data || data;
              if (courseData?.previewvedio) {
                setCurrentVideoUrl(courseData.previewvedio);
                setCurrentVideoTitle(`Preview: ${courseData.coursename}`);
                setShowVideoModal(true);
              } else {
                toast.info("Preview video is not available for this course.");
              }
            }
          }
        } catch (error) {
          console.error("Error checking course access after login:", error);
          // Fallback to original pending action logic
          if (pendingAction === "enroll") {
            navigate(isTutorCourse ? `/user/payment/tutor-course/${id}` : `/course/${id}/payment`);
          } else if (pendingAction === "continue") {
            navigate(isTutorCourse ? `/tutor-course/${id}/content` : `/course/${id}/content`);
          } else if (pendingAction === "preview") {
            toast.info("Please try previewing the course again.");
          }
        }
      }
      setPendingAction(null);
    }, 1000);
  };

  // Check authentication before enrollment
  const handleEnrollClick = () => {
    if (!isLoggedIn) {
      setPendingAction("enroll");
      handleOpenLogin();
      return;
    }
    navigate(isTutorCourse ? `/user/payment/tutor-course/${id}` : `/course/${id}/payment`);
  };

  // Check authentication before continuing
  const handleContinueLearning = async () => {
    if (!isLoggedIn) {
      setPendingAction("continue");
      handleOpenLogin();
      return;
    }

    // Log access status for debugging
    console.log("Continue Learning - Access Check:", {
      access,
      hasFullAccess,
      isEnrolled,
      courseId: id
    });

    // Double check access before navigating
    if (!hasFullAccess) {
      console.log("User doesn't have full access, redirecting to payment");
      toast.warning("Please complete payment to access the course");
      navigate(isTutorCourse ? `/user/payment/tutor-course/${id}` : `/course/${id}/payment`);
      return;
    }

    // ✅ CHECK EMI STATUS BEFORE NAVIGATION (only for regular courses, not tutor courses)
    if (!isTutorCourse) {
      try {
        // Extract user info from localStorage for logging
        const token = localStorage.getItem("token");
        const userInfo = localStorage.getItem("user");
        console.log("🔍 Checking EMI status before allowing course access...");
        console.log("👤 Token present:", !!token);
        console.log("👤 User info:", userInfo ? JSON.parse(userInfo) : "No user info");
        console.log("📚 Course ID:", id);
        setLoading(true);
        
        const emiResponse = await EMIService.getEMIStatus(id);
        console.log("📊 EMI Status Check Response:", emiResponse);

        if (emiResponse.success && emiResponse.data) {
          const emiData = emiResponse.data;
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Check for overdue payments using multiple conditions
          const hasOverduePayments = emiData.emis?.some(emi => {
            if (emi.status === "pending" || emi.status === "late") {
              const dueDate = new Date(emi.dueDate);
              const gracePeriodEnd = new Date(emi.gracePeriodEnd || emi.dueDate);
              return gracePeriodEnd < today;
            }
            return false;
          }) || false;

          const overdueCount = emiData.overdueCount || 0;
          const isLocked = emiData.isAccessLocked || emiData.planStatus === "locked" || emiData.hasOverduePayments || hasOverduePayments || overdueCount > 0;

          console.log("🚪 EMI Lock Decision:", {
            isAccessLocked: emiData.isAccessLocked,
            planStatus: emiData.planStatus,
            hasOverduePayments,
            overdueCount,
            isLocked
          });

          if (isLocked) {
            console.log("🔒 Course is LOCKED due to overdue EMI payments");
            toast.error("⚠️ EMI Payment Overdue! Please complete your payment to access the course.", {
              autoClose: 5000
            });
            navigate(`/user-payment`, { state: { highlightOverdue: true } });
            return;
          }

          console.log("✅ EMI status clear - navigating to course content");
        } else {
          // 404 or no EMI plan = full payment user, allow access
          console.log("ℹ️ No EMI plan found - assuming full payment user");
        }

        // Navigate to course content
        console.log("Navigating to course content for course:", id);
        navigate(`/course/${id}/content`);

      } catch (error) {
        console.error("❌ Error checking EMI status:", error);
        
        // If 404, user doesn't have EMI plan (full payment) - allow access
        if (error.response?.status === 404) {
          console.log("✅ No EMI plan (404) - allowing access for full payment user");
          navigate(`/course/${id}/content`);
        } else {
          // For other errors, deny access for security (fail-closed)
          console.error("⚠️ EMI check failed - blocking access for security");
          toast.error("Unable to verify payment status. Please try again or contact support.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // For tutor courses, navigate directly without EMI check
      console.log("Navigating to tutor course content for course:", id);
      navigate(`/tutor-course/${id}/content`);
    }
  };

  const handlePreviewVideo = () => {
    if (!isLoggedIn) {
      // For non-authenticated users, prompt them to login
      setPendingAction("preview");
      handleOpenLogin();
      return;
    }

    if (course.previewvedio) {
      setCurrentVideoUrl(course.previewvedio);
      setCurrentVideoTitle(`Preview: ${course.coursename}`);
      setShowVideoModal(true);
    } else {
      toast.info("Preview video will be available after login and enrollment.");
    }
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading course content...</p>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <h2>Error Loading Course</h2>
        <p>{error}</p>
        <Link to="/" className="primary-button">
          Back to Home
        </Link>
      </div>
    );

  if (!course)
    return (
      <div className="not-found-container">
        <h2>Course Not Found</h2>
        <p>
          The course you're looking for doesn't exist or may have been removed.
        </p>
        <Link to="/" className="primary-button">
          Browse Courses
        </Link>
      </div>
    );

  // More robust access checking - includes multiple possible access states
  const hasFullAccess =
    access === "full" ||
    access === "purchased" ||
    access === "enrolled" ||
    access === "completed";
  const isEnrolled = hasFullAccess; // User is considered enrolled if they have full access

  // Helper function to determine button state
  const getAccessStatus = () => {
    console.log("Access status check:", {
      isLoggedIn,
      access,
      hasFullAccess,
      isEnrolled,
    }); // Debug log

    // If user is not logged in, show login prompt
    if (!isLoggedIn) {
      return {
        canAccess: false,
        buttonText: "Login to Enroll",
        buttonAction: handleEnrollClick,
        showPreview: true,
      };
    }

    // If user has full access (enrolled/purchased), show continue learning
    if (hasFullAccess || isEnrolled) {
      return {
        canAccess: true,
        buttonText: "Continue Learning",
        buttonAction: handleContinueLearning,
        showPreview: false,
      };
    }

    // Default: user needs to enroll
    return {
      canAccess: false,
      buttonText: "Enroll Now",
      buttonAction: handleEnrollClick,
      showPreview: true,
    };
  };

  const accessStatus = getAccessStatus();

  // Safely handle instructor data
  const instructor =
    typeof course.instructor === "object"
      ? course.instructor.name || "Expert Instructor"
      : course.instructor || "Expert Instructor";

  const instructorTitle =
    typeof course.instructor === "object"
      ? course.instructor.role || "Professional Educator"
      : "Professional Educator";

  return (
    <div className="course-page-container">
      {/* Hero Section */}
      <div className="course-hero">
        <div className="course-hero-content">
          <div className="breadcrumb">
            <Link to="/">Home</Link> / <Link to="/course">Courses</Link> /{" "}
            <span>{course.coursename}</span>
          </div>
          <h1>{course.coursename}</h1>
          <p className="course-subtitle">
            {course.shortDescription ||
              "Master this skill with our comprehensive course"}
          </p>

          <div className="course-meta">
            <div className="meta-item">
              <FaChalkboardTeacher className="meta-icon" />
              <span>{instructor}</span>
            </div>
            {!isMobile && (
              <>
                <div className="meta-item">
                  <FaUserGraduate className="meta-icon" />
                  <span>{course.studentEnrollmentCount || 0}+ students</span>
                </div>
                <div className="meta-item">
                  <FaStar className="meta-icon" />
                  <span>
                    {course.rating?.toFixed(1) || "4.5"} (
                    {course.reviewsCount || 0} reviews)
                  </span>
                </div>
              </>
            )}
            <div className="meta-item">
              <FaRegClock className="meta-icon" />
              <span>
                {(() => {
                  const hours = course.contentduration?.hours || 0;
                  const minutes = course.contentduration?.minutes || 0;
                  if (hours > 0 || minutes > 0) {
                    return `${hours}h ${minutes}m`;
                  }
                  return course.courseduration || 'Duration not specified';
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="course-main-container">
        {/* Left Content */}
        <div className="course-content">
          {/* Course Preview */}
          <div className="course-preview-card">
            {/* Login prompt for non-authenticated users */}
            {!isLoggedIn && (
              <div
                style={{
                  border: "1px solid #0ea5e9",
                  borderRadius: "8px",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "#0369a1",
                    fontSize: "0.95rem",
                    margin: 0,
                    fontWeight: "500",
                  }}
                >
                  📚 <strong>Login to view complete course details</strong> -
                  Full course information, pricing, and enrollment options
                  available after signing in.
                </p>
              </div>
            )}

            <div className="preview-content">
              <h3>What you'll learn</h3>
              <ul className="learning-outcomes">
                {course.learningOutcomes?.map((outcome, index) => (
                  <li key={index}>
                    <FaCheckCircle className="check-icon" />
                    <span>{outcome}</span>
                  </li>
                )) ||
                  course.whatYoullLearn?.map((outcome, index) => (
                    <li key={index}>
                      <FaCheckCircle className="check-icon" />
                      <span>{outcome}</span>
                    </li>
                  )) || (
                    <>
                      <li>
                        <FaCheckCircle className="check-icon" /> Master key
                        concepts
                      </li>
                      <li>
                        <FaCheckCircle className="check-icon" /> Build practical
                        skills
                      </li>
                      <li>
                        <FaCheckCircle className="check-icon" /> Complete
                        real-world projects
                      </li>
                      <li>
                        <FaCheckCircle className="check-icon" /> Earn a
                        certificate
                      </li>
                    </>
                  )}
              </ul>
            </div>
          </div>

          {/* Course Description */}
          <div className="course-description-section">
            <h2>Course Description</h2>
            <div
              className="description-content"
              dangerouslySetInnerHTML={{
                __html: formatCourseDescription(
                  course.description ||
                    "This comprehensive course will take you from beginner to advanced level. You'll learn essential skills and concepts through hands-on projects and real-world examples."
                ),
              }}
            />

            <div className="description-details">
              <h3>Course Details</h3>
              <ul>
                <li>
                  <strong>Category:</strong> 
                  <span>{course.category || "General"}</span>
                </li>
                <li>
                  <strong>Skill Level:</strong> 
                  <span>{course.level || "All Levels"}</span>
                </li>
                <li>
                  <strong>Language:</strong> 
                  <span>{course.language?.charAt(0).toUpperCase() + course.language?.slice(1) || "English"}</span>
                </li>
                <li>
                  <strong>Duration:</strong> 
                  <span>
                    {(() => {
                      const hours = course.contentduration?.hours || 0;
                      const minutes = course.contentduration?.minutes || 0;
                      if (hours > 0 || minutes > 0) {
                        return `${hours} hours ${minutes} minutes`;
                      }
                      return course.courseduration || 'Duration not specified';
                    })()}
                  </span>
                </li>
                <li>
                  <strong>Students Enrolled:</strong> 
                  <span>{course.studentEnrollmentCount || 0}+ learners</span>
                </li>
                <li>
                  <strong>Certificate:</strong> 
                  <span>{course.certificates === "yes" ? "Certificate of completion included" : "Not Included"}</span>
                </li>
                <li>
                  <strong>Last Updated:</strong> 
                  <span>{course.lastUpdated || "Recently updated"}</span>
                </li>
                <li>
                  <strong>Access:</strong> 
                  <span>{hasFullAccess ? "Full Lifetime Access" : isLoggedIn ? "Limited Preview Access" : "Login to Access"}</span>
                </li>
              </ul>
            </div>

            {course.requirements && course.requirements.length > 0 && (
              <div className="description-details" style={{ marginTop: '1.5rem' }}>
                <h3>Requirements</h3>
                <ul className="requirements-list">
                  {course.requirements.map((requirement, index) => (
                    <li key={index}>
                      <FaCheckCircle className="check-icon" style={{ color: '#64748b' }} />
                      <span>{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.targetAudience && course.targetAudience.length > 0 && (
              <div className="description-details" style={{ marginTop: '1.5rem' }}>
                <h3>Who This Course Is For</h3>
                <ul className="requirements-list">
                  {course.targetAudience.map((audience, index) => (
                    <li key={index}>
                      <FaUserGraduate className="check-icon" style={{ color: '#2563eb' }} />
                      <span>{audience}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Instructor Section */}
          <div className="instructor-section">
            <h2>About the Instructor</h2>
            <div className="instructor-card">
              <div className="instructor-details">
                <h3>{instructor}</h3>
                <p className="instructor-title">{instructorTitle}</p>
                <div className="instructor-stats">
                  <div className="stat-item">
                    <FaStar className="stat-icon" />
                    <span>
                      {course.instructorRating || "4.8"} Instructor Rating
                    </span>
                  </div>
                  <div className="stat-item">
                    <FaUserGraduate className="stat-icon" />
                    <span>
                      {course.instructorStudents || "10,000"}+ Students
                    </span>
                  </div>
                  {!isMobile && (
                    <div className="stat-item">
                      <FaVideo className="stat-icon" />
                      <span>{course.instructorCourses || "15"} Courses</span>
                    </div>
                  )}
                </div>
                <p className="instructor-bio">
                  {typeof course.instructor === "object" &&
                  course.instructor.bio
                    ? course.instructor.bio
                    : "Our instructor has years of experience in this field and has helped thousands of students master these skills."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="course-sidebar">
          <div className="sidebar-card pricing-card">
            {/* Enrollment Status Indicator */}
            {isLoggedIn && hasFullAccess && (
              <div className="enrollment-status">
                <FaCheckCircle className="status-icon enrolled" />
                <span className="status-text">
                  You are enrolled in this course
                </span>
              </div>
            )}

            {course.price?.discount > 0 && isLoggedIn && (
              <div className="price-original">
                <span className="original-price">
                  ₹{course.price.amount?.toFixed(2) || "0.00"}
                </span>
                <span className="discount-badge">
                  {course.price.discount || 0}% OFF
                </span>
              </div>
            )}
            <div className="price-final">
              {!isLoggedIn ? (
                <span style={{ color: "#64748b", fontSize: "1.2rem" }}>
                  Login to View Price
                </span>
              ) : (
                `₹${(course.price?.finalPrice || 0).toFixed(2)}`
              )}
            </div>

            {/* EMI Information */}
            {isLoggedIn &&
              course.emi?.isAvailable === true &&
              course.emi?.monthlyAmount > 0 &&
              course.emi?.totalAmount > 0 &&
              course.emi?.emiDurationMonths > 0 && (
                <div className="emi-info-card">
                  <div className="emi-header">
                    <h4>EMI Available</h4>
                    <span className="emi-badge">No Cost EMI</span>
                  </div>
                  <div className="emi-details">
                    <div className="emi-amount">
                      ₹{(course.emi.monthlyAmount || 0).toLocaleString("en-IN")}{" "}
                      / month
                    </div>
                    <div className="emi-duration">
                      for {course.emi.emiDurationMonths || 0} months
                    </div>
                    {course.emi.notes && (
                      <div className="emi-notes">
                        <small>{course.emi.notes}</small>
                      </div>
                    )}
                  </div>
                </div>
              )}

            <button
              onClick={accessStatus.buttonAction}
              className="primary-button full-width"
              disabled={loading}
            >
              {loading ? "Loading..." : accessStatus.buttonText}
            </button>

            {course.previewvedio && accessStatus.showPreview && (
              <button
                onClick={handlePreviewVideo}
                className="secondary-button full-width"
              >
                Preview Course
              </button>
            )}

            <div className="includes-list">
              <h4>This course includes:</h4>
              <ul>
                <li>
                  <FaVideo className="include-icon" />
                  <span>
                    {isLoggedIn
                      ? `${(() => {
                          const hours = course.contentduration?.hours || 0;
                          const minutes = course.contentduration?.minutes || 0;
                          if (hours > 0 || minutes > 0) {
                            return `${hours}h ${minutes}m`;
                          }
                          return 'Duration not specified';
                        })()} on-demand video`
                      : "Full video content (details available after login)"}
                  </span>
                </li>
                <li>
                  {hasFullAccess ? (
                    <FaUnlockAlt className="include-icon" />
                  ) : (
                    <FaLock className="include-icon" />
                  )}
                  <span>
                    {hasFullAccess
                      ? "Full lifetime access"
                      : isLoggedIn
                      ? "Limited preview access"
                      : "Access details available after login"}
                  </span>
                </li>
                {course.certificates === "yes" && (
                  <li>
                    <FaCertificate className="include-icon" />
                    <span>Certificate of completion</span>
                  </li>
                )}
                {course.resourcesCount > 0 && (
                  <li>
                    <FiDownload className="include-icon" />
                    <span>{course.resourcesCount} downloadable resources</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="modal-overlay">
          <div className="video-modal">
            <div className="modal-header">
              <h4>{currentVideoTitle}</h4>
              <button
                onClick={() => setShowVideoModal(false)}
                className="close-button"
              >
                <IoClose />
              </button>
            </div>
            <div className="modal-content">
              <video
                src={currentVideoUrl}
                controls
                autoPlay
                className="video-player"
              />
            </div>
          </div>
        </div>
      )}

      {/* Audio Modal */}
      {showAudioModal && (
        <div className="modal-overlay">
          <div className="audio-modal">
            <div className="modal-header">
              <h4>{currentAudioTitle}</h4>
              <button
                onClick={() => setShowAudioModal(false)}
                className="close-button"
              >
                <IoClose />
              </button>
            </div>
            <div className="modal-content">
              <audio
                src={currentAudioUrl}
                controls
                autoPlay
                className="audio-player"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating CTA */}
      {isMobile && (
        <div className="mobile-floating-cta">
          <div className="price-container">
            {course.price?.discount > 0 && isLoggedIn && (
              <span className="original-price">
                ₹{course.price.amount?.toFixed(2)}
              </span>
            )}
            <span className="final-price">
              {!isLoggedIn
                ? "Login to View Price"
                : `₹${(course.price?.finalPrice || 0).toFixed(2)}`}
            </span>
          </div>
          <button
            onClick={accessStatus.buttonAction}
            className="primary-button"
            disabled={loading}
          >
            {loading ? "Loading..." : accessStatus.buttonText}
          </button>
        </div>
      )}

      {/* Login Modal */}
      <Dialog
        open={loginModalOpen}
        onClose={handleCloseLogin}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px", m: 2, maxWidth: "900px" } }}
      >
        <IconButton
          onClick={handleCloseLogin}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            zIndex: 10,
            color: "grey.500",
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", sm: "50%" },
              p: { xs: 3, sm: 4 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onSwitchToForgotPassword={switchToForgotPassword}
            />

            <Typography variant="body2" align="center" sx={{ mt: 3 }}>
              Don't have an account?{" "}
              <MuiLink
                component="button"
                variant="body2"
                onClick={switchToSignup}
                sx={{ fontWeight: "bold", fontSize: "1rem" }}
              >
                Sign Up
              </MuiLink>
            </Typography>
          </Box>

          <Box
            sx={{
              width: { xs: "100%", sm: "50%" },
              height: { xs: "250px", sm: "auto" },
            }}
          >
            <Box
              component="img"
              src="/yoga2.jpg"
              alt="Course Learning"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderTopLeftRadius: { xs: "12px", sm: 0 },
                borderTopRightRadius: { xs: "12px", sm: 0 },
              }}
            />
          </Box>
        </Box>
      </Dialog>

      {/* Signup Modal */}
      <Dialog
        open={signupModalOpen}
        onClose={resetSignupModal}
        disableEscapeKeyDown={false}
        maxWidth={activeStep === 3 ? "sm" : "md"}
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px",
            m: 2,
            maxWidth: activeStep === 3 ? "700px" : "900px",
            transition: "max-width 0.4s ease-in-out",
          },
        }}
      >
        <IconButton
          onClick={resetSignupModal}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            zIndex: 10,
            color: "grey.500",
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", sm: activeStep === 3 ? "100%" : "50%" },
              p: { xs: 3, sm: 4 },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              transition: "width 0.4s ease-in-out",
            }}
          >
            {activeStep !== 3 && (
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "700",
                  textAlign: "center",
                  color: "#007BFF",
                  mb: 2,
                }}
              >
                Create Account
              </Typography>
            )}

            <StepperComponent activeStep={activeStep} steps={steps} />

            <Box sx={{ mt: 3, mb: 1, minHeight: "250px" }}>
              {(() => {
                const userIdentifier = registrationData.email
                  ? { email: registrationData.email }
                  : { mobile: registrationData.mobile };

                switch (activeStep) {
                  case 0:
                    return (
                      <RegisterForm
                        onRegisterSuccess={handleRegister}
                        onError={(msg) => toast.error(msg)}
                      />
                    );
                  case 1:
                    return (
                      <VerifyOtpForm
                        onOtpVerified={handleVerifyOtp}
                        onError={(msg) => toast.error(msg)}
                        userIdentifier={userIdentifier}
                        onResendOtp={handleResendOtp}
                      />
                    );
                  case 2:
                    return (
                      <CreatePasswordForm
                        onPasswordCreated={handleCreatePassword}
                        onError={(msg) => toast.error(msg)}
                      />
                    );
                  case 3:
                    return (
                      <NewProfileForm
                        onProfileSaved={handleSaveProfile}
                        onError={(msg) => toast.error(msg)}
                        userIdentifier={userIdentifier}
                      />
                    );
                  default:
                    return "Unknown step";
                }
              })()}
            </Box>

            <Typography variant="body2" align="center" sx={{ mt: 3 }}>
              Already have an account?{" "}
              <MuiLink
                component="button"
                variant="body2"
                onClick={() => {
                  resetSignupModal();
                  handleOpenLogin();
                }}
                sx={{ fontWeight: "bold", color: "#007BFF" }}
              >
                Login
              </MuiLink>
            </Typography>
          </Box>

          <Box
            sx={{
              display: { xs: activeStep === 3 ? "none" : "block", sm: activeStep === 3 ? "none" : "block" },
              width: { xs: "100%", sm: "50%" },
              height: { xs: "250px", sm: "auto" },
            }}
          >
            <Box
              component="img"
              src="/yoga2.jpg"
              alt="Join Learning"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderTopLeftRadius: "12px",
                borderTopRightRadius: "12px",
                borderBottomLeftRadius: { xs: "0px", sm: 0 },
                borderBottomRightRadius: { xs: "0px", sm: "12px" },
              }}
            />
          </Box>
        </Box>
      </Dialog>

      {/* Forgot Password Modal */}
      <Dialog
        open={forgotPasswordModalOpen}
        onClose={handleCloseForgotPassword}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "12px", m: 2, maxWidth: "900px" } }}
      >
        <IconButton
          onClick={handleCloseForgotPassword}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            zIndex: 10,
            color: "grey.500",
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ p: 4 }}>
          <ForgotPasswordForm onSwitchToLogin={switchToLogin} />
        </Box>
      </Dialog>
    </div>
  );
};

export default CoursePage;

// CSS Styles (should be in a separate file or CSS-in-JS)
const styles = `
  /* Modern CSS Variables - Clean Design */
  :root {
    --primary-color: #2563eb;
    --primary-hover: #1d4ed8;
    --primary-light: #93c5fd;
    --accent-color: #10b981;
    --text-color: #1e293b;
    --text-light: #64748b;
    --text-muted: #94a3b8;
    --border-color: #e2e8f0;
    --success-color: #10b981;
    --danger-color: #ef4444;
    --white: #ffffff;
    --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --transition-base: all 0.2s ease;
    --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  }

  /* Global Reset & Base Styles */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
    font-size: 16px;
  }

  body {
    font-family: var(--font-body);
    color: var(--text-color);
    line-height: 1.6;
    background-color: #ffffff;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Enhanced Button Styles */
  .primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: var(--primary-color);
    color: var(--white);
    padding: 0.875rem 2rem;
    border-radius: var(--radius-lg);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    text-align: center;
    transition: var(--transition-base);
    border: none;
    cursor: pointer;
    box-shadow: none;
  }

  .primary-button:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .primary-button:active {
    transform: translateY(0);
  }

  .primary-button:disabled {
    background: var(--text-muted);
    cursor: not-allowed;
    transform: none;
  }

  .secondary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background-color: transparent;
    color: var(--primary-color);
    padding: 0.875rem 2rem;
    border-radius: var(--radius-lg);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    text-align: center;
    transition: var(--transition-base);
    border: 2px solid var(--primary-color);
    cursor: pointer;
  }

  .secondary-button:hover {
    background-color: var(--primary-color);
    color: var(--white);
  }

  .full-width {
    width: 100%;
    display: block;
    margin: 0.5rem 0;
  }

  /* Enhanced Loading State */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 3rem;
    text-align: center;
  }

  .loading-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid var(--gray-200);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
    margin-bottom: 1.5rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-container p {
    color: var(--text-light);
    font-weight: 500;
    font-size: 1.1rem;
  }

  /* Enhanced Error State */
  .error-container, .not-found-container {
    max-width: 600px;
    margin: 3rem auto;
    padding: 3rem 2rem;
    background: var(--white);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-lg);
    text-align: center;
    border-top: 4px solid var(--danger-color);
  }

  .error-container h2, .not-found-container h2 {
    color: var(--danger-color);
    margin-bottom: 1rem;
    font-size: 1.75rem;
    font-weight: 700;
  }

  .error-container p, .not-found-container p {
    color: var(--text-light);
    margin-bottom: 2rem;
    font-size: 1.1rem;
  }

  /* Course Page Layout */
  .course-page-container {
    max-width: 100%;
    overflow-x: hidden;
    padding-bottom: 100px;
    background: #ffffff;
  }

  /* Clean Hero Section - No Background Color */
  .course-hero {
    background: #ffffff;
    color: var(--text-color);
    padding: 3rem 2rem 2rem;
    border-bottom: 1px solid var(--border-color);
  }

  .course-hero-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .breadcrumb {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
    color: var(--text-light);
    font-weight: 500;
  }

  .breadcrumb a {
    color: var(--text-light);
    text-decoration: none;
    transition: var(--transition-base);
  }

  .breadcrumb a:hover {
    color: var(--primary-color);
    text-decoration: underline;
  }

  .breadcrumb span {
    color: var(--text-color);
    font-weight: 600;
  }

  .course-hero h1 {
    font-size: clamp(2rem, 5vw, 2.5rem);
    font-weight: 700;
    margin-bottom: 1rem;
    line-height: 1.2;
    color: var(--text-color);
  }

  .course-subtitle {
    font-size: clamp(1rem, 3vw, 1.125rem);
    max-width: 800px;
    margin-bottom: 1.5rem;
    line-height: 1.5;
    color: var(--text-light);
  }

  .course-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    color: var(--text-light);
  }

  .meta-icon {
    font-size: 1rem;
    color: var(--primary-color);
  }

  /* Clean Main Content Layout */
  .course-main-container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 2rem;
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 2rem;
  }

  /* Course Content - Clean White Design */
  .course-content {
    background: #ffffff;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
  }

  /* Clean Preview Card */
  .course-preview-card {
    padding: 2rem;
    border-bottom: 1px solid var(--border-color);
  }

  .preview-content h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-color);
  }

  .learning-outcomes {
    list-style: none;
    display: grid;
    gap: 0.75rem;
  }

  .learning-outcomes li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }

  .check-icon {
    color: var(--success-color);
    flex-shrink: 0;
    margin-top: 0.125rem;
    font-size: 1rem;
  }

  .learning-outcomes span {
    font-weight: 400;
    line-height: 1.5;
    color: var(--text-light);
  }

  /* Clean Course Description */
  .course-description-section {
    padding: 2rem;
    border-bottom: 1px solid var(--border-color);
  }

  .course-description-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-color);
  }

  .description-content {
    margin-bottom: 2rem;
  }

  .description-content p {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--text-light);
    margin-bottom: 1rem;
  }

  .description-content p:last-child {
    margin-bottom: 0;
  }

  .description-content ul {
    margin: 0.75rem 0 1rem 0;
    padding-left: 1.5rem;
  }

  .description-content li {
    margin-bottom: 0.5rem;
    line-height: 1.6;
    color: var(--text-light);
  }

  .description-details {
    margin-top: 2rem;
    padding: 1.5rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
  }

  .description-details h3 {
    margin-bottom: 1rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .description-details ul {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .description-details li {
    display: flex;
    gap: 0.5rem;
    color: var(--text-light);
    padding: 0.5rem 0;
  }

  .description-details strong {
    font-weight: 600;
    color: var(--text-color);
    min-width: 140px;
    flex-shrink: 0;
  }

  .description-details span {
    color: var(--text-light);
  }

  .requirements-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.75rem !important;
  }

  .requirements-list li {
    display: flex !important;
    align-items: flex-start !important;
    gap: 0.75rem !important;
    padding: 0.5rem 0 !important;
  }

  .requirements-list .check-icon {
    flex-shrink: 0;
    margin-top: 0.25rem;
    font-size: 1rem;
  }

  .requirements-list span {
    line-height: 1.6;
  }

  /* Curriculum */
  .course-curriculum-section {
    padding: 2rem;
  }

  .course-curriculum-section h2 {
    font-size: 1.75rem;
    margin-bottom: 1.5rem;
  }

  .curriculum-stats {
    display: flex;
    justify-content: space-between;
    color: var(--text-light);
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .chapter-list {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .chapter-item {
    border-bottom: 1px solid var(--border-color);
  }

  .chapter-item:last-child {
    border-bottom: none;
  }

  .chapter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    background: var(--secondary-color);
    cursor: pointer;
    transition: var(--transition);
  }

  .chapter-header:hover {
    background: #e2e8f0;
  }

  .chapter-title {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .chapter-number {
    font-weight: 600;
    color: var(--text-light);
  }

  .chapter-title h4 {
    font-weight: 600;
    font-size: 1.1rem;
  }

  .chapter-meta {
    color: var(--text-light);
    font-size: 0.9rem;
    margin-left: 1rem;
  }

  .toggle-icon {
    color: var(--text-light);
  }

  .lesson-list {
    background: var(--white);
  }

  .lesson-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .lesson-item:last-child {
    border-bottom: none;
  }

  .lesson-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-grow: 1;
  }

  .lesson-number {
    color: var(--text-light);
    font-size: 0.9rem;
    min-width: 30px;
  }

  .lesson-content {
    flex-grow: 1;
  }

  .lesson-content h5 {
    font-weight: 500;
    margin-bottom: 0.25rem;
  }

  .lesson-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: var(--text-light);
  }

  .preview-badge {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
    padding: 0.2rem 0.5rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .lesson-actions {
    display: flex;
    gap: 0.5rem;
  }

  .play-button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--primary-color);
    color: var(--white);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition);
    position: relative;
  }

  .play-button:hover {
    background: var(--primary-hover);
    transform: scale(1.1);
  }

  .play-button.locked {
    background: var(--text-light);
    cursor: not-allowed;
  }

  .lock-icon {
    position: absolute;
    font-size: 0.7rem;
    bottom: -2px;
    right: -2px;
    background: var(--white);
    color: var(--text-light);
    border-radius: 50%;
    padding: 2px;
  }

  .resource-button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--secondary-color);
    color: var(--text-light);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition);
  }

  .resource-button:hover {
    background: #e2e8f0;
    color: var(--primary-color);
  }

  .empty-curriculum {
    padding: 2rem;
    text-align: center;
    color: var(--text-light);
  }

  /* Clean Instructor Section */
  .instructor-section {
    padding: 2rem;
    background: #ffffff;
  }

  .instructor-section h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: var(--text-color);
  }

  .instructor-card {
    padding: 1.5rem;
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
  }

  .instructor-details {
    flex-grow: 1;
  }

  .instructor-details h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
    color: var(--text-color);
  }

  .instructor-title {
    color: var(--text-light);
    margin-bottom: 1rem;
    font-size: 0.95rem;
  }

  .instructor-stats {
    display: flex;
    gap: 1.5rem;
    margin: 1rem 0;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--text-light);
  }

  .stat-icon {
    color: var(--primary-color);
    font-size: 1rem;
  }

  .instructor-bio {
    margin-top: 1rem;
    line-height: 1.6;
    color: var(--text-light);
    font-size: 0.95rem;
  }

  /* Clean Sidebar */
  .course-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .sidebar-card {
    background: #ffffff;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    padding: 1.5rem;
    transition: var(--transition-base);
  }

  .sidebar-card:hover {
    box-shadow: var(--shadow-md);
  }

  .pricing-card {
    position: sticky;
    top: 2rem;
  }

  .enrollment-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: var(--radius-md);
    margin-bottom: 1rem;
  }

  .status-icon.enrolled {
    color: var(--success-color);
    font-size: 1.25rem;
  }

  .status-text {
    font-weight: 600;
    color: var(--success-color);
    font-size: 0.95rem;
  }

  .price-original {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .original-price {
    text-decoration: line-through;
    color: var(--text-muted);
    font-size: 1.125rem;
    font-weight: 500;
  }

  .discount-badge {
    background: var(--danger-color);
    color: var(--white);
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-md);
    font-weight: 700;
  }

  .price-final {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  .emi-info-card {
    background: #ffffff;
    border: 1px solid #2196f3;
    border-radius: var(--radius-md);
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .emi-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .emi-header h4 {
    color: #1976d2;
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .emi-badge {
    background: #4caf50;
    color: white;
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 600;
  }

  .emi-details {
    text-align: left;
  }

  .emi-amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1976d2;
    margin-bottom: 0.25rem;
  }

  .emi-duration {
    color: var(--text-light);
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .emi-notes {
    background: rgba(33, 150, 243, 0.05);
    padding: 0.5rem;
    border-radius: var(--radius-md);
    border-left: 3px solid #2196f3;
  }

  .emi-notes small {
    color: var(--text-light);
    font-size: 0.75rem;
    font-style: italic;
  }

  .includes-list {
    margin-top: 1.5rem;
  }

  .includes-list h4 {
    margin-bottom: 1rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .includes-list ul {
    list-style: none;
    display: grid;
    gap: 0.75rem;
  }

  .includes-list li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    padding: 0.5rem 0;
    color: var(--text-light);
  }

  .include-icon {
    color: var(--primary-color);
    flex-shrink: 0;
    font-size: 1.125rem;
  }

  /* Clean Gift Card */
  .gifting-card {
    background: #ffffff;
    border: 1px solid var(--primary-color);
  }

  .gifting-card h4 {
    margin-bottom: 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .gifting-card p {
    color: var(--text-light);
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .gift-button {
    width: 100%;
    padding: 0.875rem;
    background: var(--primary-color);
    border: none;
    color: #ffffff;
    border-radius: var(--radius-md);
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: var(--transition-base);
  }

  .gift-button:hover {
    background: var(--primary-hover);
  }

  /* Clean Modals */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .video-modal, .audio-modal {
    background: var(--white);
    border-radius: var(--radius-lg);
    width: 100%;
    max-width: 1000px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }

  .audio-modal {
    max-width: 600px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h4 {
    font-weight: 600;
    font-size: 1.125rem;
    margin-right: 1rem;
    color: var(--text-color);
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--text-light);
    cursor: pointer;
    transition: var(--transition-base);
    padding: 0.5rem;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--danger-color);
  }

  .modal-content {
    padding: 1.5rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  .video-player {
    width: 100%;
    aspect-ratio: 16/9;
    background: #000000;
    border-radius: var(--radius-md);
  }

  .audio-player {
    width: 100%;
    border-radius: var(--radius-md);
  }

  /* Mobile Floating CTA */
  .mobile-floating-cta {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--white);
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 100;
    border-top: 1px solid var(--border-color);
  }

  .mobile-floating-cta .price-container {
    display: flex;
    flex-direction: column;
  }

  .mobile-floating-cta .original-price {
    text-decoration: line-through;
    color: var(--text-light);
    font-size: 0.85rem;
  }

  .mobile-floating-cta .final-price {
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--text-color);
  }

  .mobile-floating-cta .primary-button {
    padding: 0.75rem 1.5rem;
    font-size: 0.95rem;
    flex-shrink: 0;
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .course-main-container {
      grid-template-columns: 1fr;
    }
    
    .course-sidebar {
      grid-row: 1;
    }
  }

  @media (max-width: 768px) {
    .course-hero {
      padding: 3rem 1.5rem 2rem;
    }
    
    .course-hero h1 {
      font-size: 2rem;
    }
    
    .course-subtitle {
      font-size: 1.1rem;
    }
    
    .course-meta {
      gap: 1rem;
    }
    
    .course-main-container {
      padding: 0 1rem;
      margin: 1rem auto;
    }
    
    .course-preview-card {
      padding: 1.5rem;
    }
    
    .description-details ul {
      grid-template-columns: 1fr;
    }
    
    .instructor-card {
      padding: 1.5rem;
    }
    
    .instructor-stats {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .sidebar-card {
      padding: 1.25rem;
    }
    
    .price-final {
      font-size: 1.75rem;
    }
    
    .includes-list li {
      font-size: 0.9rem;
    }
  }

  @media (max-width: 480px) {
    .course-hero {
      padding: 2.5rem 1rem 1.5rem;
    }
    
    .course-hero h1 {
      font-size: 1.75rem;
    }
    
    .course-subtitle {
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .course-meta {
      gap: 0.75rem;
    }
    
    .meta-item {
      font-size: 0.85rem;
    }
    
    .course-description-section,
    .instructor-section {
      padding: 1.5rem 1rem;
    }
    
    .course-description-section h2,
    .instructor-section h2 {
      font-size: 1.5rem;
    }
    
    .description-details {
      padding: 1rem;
    }
    
    .instructor-details h3 {
      font-size: 1.3rem;
    }
    
    .instructor-bio {
      font-size: 0.95rem;
    }
    
    .mobile-floating-cta {
      padding: 0.75rem 1rem;
    }
    
    .mobile-floating-cta .final-price {
      font-size: 1.1rem;
    }
    
    .mobile-floating-cta .primary-button {
      padding: 0.6rem 1.2rem;
      font-size: 0.95rem;
    }
  }
`;

// Inject styles
const styleElement = document.createElement("style");
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);
