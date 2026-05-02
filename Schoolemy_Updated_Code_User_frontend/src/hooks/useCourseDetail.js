import { useState, useEffect, useCallback, useRef } from "react";
import api from "../service/api";
import { getTutorCourseById } from "../service/courseApi";

/**
 * Custom hook for fetching course detail data
 * Consolidates multiple API calls into a single fetch operation
 * Implements caching to prevent duplicate fetches
 * Dependencies: courseId, isLoggedIn, isTutorCourse
 */
export const useCourseDetail = (courseId, isLoggedIn, isTutorCourse = false) => {
  const [course, setCourse] = useState(null);
  const [access, setAccess] = useState("limited");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cache references to prevent multiple fetches within 5 minutes
  const cacheRef = useRef({});
  const cacheTimerRef = useRef({});

  // Helper: check if cached data is still fresh (5 minutes)
  const isCacheFresh = useCallback((key) => {
    const timestamp = cacheTimerRef.current[key];
    if (!timestamp) return false;
    const age = Date.now() - timestamp;
    return age < 5 * 60 * 1000; // 5 minutes
  }, []);

  // Helper: update access based on user authorization
  const updateAccessLevel = useCallback((data) => {
    if (!data) {
      setAccess("limited");
      return;
    }

    // Extract access level from different response structures
    const accessLevel =
      data.access ||
      data.data?.userAccess ||
      data.data?.access ||
      data.accessStatus ||
      "limited";

    setAccess(accessLevel);
  }, []);

  // Helper: check tutor course payment status
  const updateAccessFromTutorPaymentStatus = useCallback(
    async (id) => {
      if (!isTutorCourse || !isLoggedIn) return;

      try {
        const statusRes = await api.get(`/api/v1/payments/user/payment/tutor-course/${id}`);
        const statusData = statusRes.data;

        if (statusData?.success && statusData.data) {
          const paymentInfo = statusData.data;

          if (paymentInfo.hasCompletedPayment) {
            setAccess("full");
          } else if (paymentInfo.hasPayment) {
            setAccess("purchased");
          }
        }
      } catch (err) {
        // Fail silently - don't block the flow
        console.warn("Tutor course payment status check failed:", err);
      }
    },
    [isTutorCourse, isLoggedIn]
  );

  // Main fetch function: consolidates all API calls
  const fetchCourseDetail = useCallback(
    async (id) => {
      // Skip if no ID
      if (!id) {
        setLoading(false);
        return;
      }

      // Check cache first (v2: payload includes merged `access` from API envelope)
      const cacheKey = `course-${id}-${isLoggedIn}-v2`;
      if (cacheRef.current[cacheKey] && isCacheFresh(cacheKey)) {
        const cachedData = cacheRef.current[cacheKey];
        setCourse(cachedData);
        updateAccessLevel(cachedData);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Single API call based on course type
        let coursePayload;
        if (isTutorCourse) {
          const res = await getTutorCourseById(id);
          coursePayload = res?.data;
          if (
            coursePayload &&
            typeof coursePayload === "object" &&
            coursePayload.success === true &&
            coursePayload.data &&
            typeof coursePayload.data === "object"
          ) {
            coursePayload = coursePayload.data;
          }
        } else {
          const res = await api.get(`/api/v1/courses/${id}`);
          const raw = res.data || res;
          coursePayload =
            raw &&
            typeof raw === "object" &&
            raw.success === true &&
            raw.data != null &&
            typeof raw.data === "object" &&
            !Array.isArray(raw.data)
              ? raw.data
              : raw;
          // Backend puts user access on the envelope (access: "full" | "limited"), not inside data
          if (
            coursePayload &&
            typeof coursePayload === "object" &&
            raw &&
            typeof raw === "object" &&
            raw.success === true &&
            raw.access
          ) {
            coursePayload = { ...coursePayload, access: raw.access };
          }
        }

        // Validate response
        if (!coursePayload) {
          throw new Error("Invalid course data received");
        }

        // Update course data
        setCourse(coursePayload);
        updateAccessLevel(coursePayload);

        // Cache the data
        cacheRef.current[cacheKey] = coursePayload;
        cacheTimerRef.current[cacheKey] = Date.now();

        // For tutor courses, also check payment status
        if (isTutorCourse) {
          await updateAccessFromTutorPaymentStatus(id);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching course detail:", err);
        setError(err.response?.data?.message || err.message || "Failed to load course");
        setCourse(null);
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn, isTutorCourse, isCacheFresh, updateAccessLevel, updateAccessFromTutorPaymentStatus]
  );

  // Refetch function: bypasses cache
  const refetch = useCallback(
    async (id = courseId) => {
      const cacheKey = `course-${id}-${isLoggedIn}-v2`;
      // Clear cache to force fresh fetch
      delete cacheRef.current[cacheKey];
      delete cacheTimerRef.current[cacheKey];
      await fetchCourseDetail(id);
    },
    [courseId, isLoggedIn, fetchCourseDetail]
  );

  // Effect: Fetch course detail when courseId or login status changes
  useEffect(() => {
    fetchCourseDetail(courseId);
  }, [courseId, isLoggedIn, isTutorCourse, fetchCourseDetail]);

  return {
    course,
    access,
    loading,
    error,
    refetch,
  };
};

export default useCourseDetail;
