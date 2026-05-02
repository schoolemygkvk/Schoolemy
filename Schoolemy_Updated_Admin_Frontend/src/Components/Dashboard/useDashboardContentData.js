import { useState, useEffect, useCallback, useRef } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import api from "../../Utils/api";
import { secureStorage } from "../../Utils/security";
import { useToken } from "../../Hooks/useToken";
import {
  getCachedData,
  setCachedData,
  CACHE_KEYS,
  setupAutoRefresh,
  clearAutoRefresh,
} from "../../Utils/dashboardCache";
import { ANALYTICS_CACHE_KEYS, POLLING_CONFIG } from "./dashboardConstants";

export function useDashboardContentData(completionRate) {
  const navigate = useNavigate();
  const { isAuthenticated } = useToken();
  const [displayedTestimonials, setDisplayedTestimonials] = useState([]);
  const [emiData, setEmiData] = useState([]);
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [completionRateState, setCompletionRateState] = useState(
    completionRate || 0
  );
  const [totalTutors, setTotalTutors] = useState(0);
  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [chartError, setChartError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const checkIsSuperAdmin = useCallback(() => {
    try {
      const roleFromSecure = secureStorage.getItem("role");
      if (roleFromSecure) {
        return roleFromSecure.toLowerCase() === "superadmin";
      }

      const roleFromLocal = localStorage.getItem("role");
      if (roleFromLocal) {
        return roleFromLocal.toLowerCase() === "superadmin";
      }

      return false;
    } catch (error) {
      console.error("Error checking role:", error);
      return false;
    }
  }, []);

  const handleInstructorCardClick = useCallback(() => {
    if (checkIsSuperAdmin()) {
      navigate("/schoolemy/instructors-management");
    } else {
      message.warning("Only Super Admin can access Instructor Management");
    }
  }, [checkIsSuperAdmin, navigate]);

  const fetchEmiStats = useCallback(
    async (useCache = true) => {
      try {
        if (useCache) {
          const cached = getCachedData(ANALYTICS_CACHE_KEYS.EMI_STATS);
          if (cached && Array.isArray(cached) && cached.length > 0) {
            setEmiData(cached);
            return cached;
          }
        }

        const response = await api.get("/api/dashboard/emi-monthly-stats", {
          params: { months: 6 }
        });

        const chartData =
          response.data?.data && Array.isArray(response.data.data)
            ? response.data.data
            : Array.isArray(response.data)
              ? response.data
              : [];

        if (chartData.length > 0) {
          setEmiData(chartData);
          setCachedData(
            ANALYTICS_CACHE_KEYS.EMI_STATS,
            chartData,
            POLLING_CONFIG.REFRESH_INTERVAL
          );
          return chartData;
        }
        return null;
      } catch (error) {
        console.error("Failed to fetch EMI stats:", error);
        const cached = getCachedData(ANALYTICS_CACHE_KEYS.EMI_STATS);
        if (cached && Array.isArray(cached)) {
          setEmiData(cached);
        }
        return null;
      }
    },
    []
  );

  const fetchEnrollmentStats = useCallback(
    async (useCache = true) => {
      try {
        if (useCache) {
          const cached = getCachedData(ANALYTICS_CACHE_KEYS.ENROLLMENT_STATS);
          if (cached && Array.isArray(cached) && cached.length > 0) {
            setEnrollmentData(cached);
            return cached;
          }
        }

        const response = await api.get("/api/dashboard/enrollment-monthly-stats", {
          params: { months: 6 }
        });

        const chartData =
          response.data?.data && Array.isArray(response.data.data)
            ? response.data.data
            : Array.isArray(response.data)
              ? response.data
              : [];

        if (chartData.length > 0) {
          setEnrollmentData(chartData);
          setCachedData(
            ANALYTICS_CACHE_KEYS.ENROLLMENT_STATS,
            chartData,
            POLLING_CONFIG.REFRESH_INTERVAL
          );
          return chartData;
        }
        return null;
      } catch (error) {
        console.error("Failed to fetch enrollment stats:", error);
        const cached = getCachedData(ANALYTICS_CACHE_KEYS.ENROLLMENT_STATS);
        if (cached && Array.isArray(cached)) {
          setEnrollmentData(cached);
        }
        return null;
      }
    },
    []
  );

  const fetchCompletionRate = useCallback(
    async (useCache = true) => {
      try {
        if (useCache) {
          const cached = getCachedData(ANALYTICS_CACHE_KEYS.COMPLETION_RATE);
          if (cached !== null && typeof cached === "number") {
            setCompletionRateState(cached);
            return cached;
          }
        }

        const response = await api.get("/api/dashboard/completion-rate");
        const rate = response.data?.completionRate || response.data?.rate || 0;
        setCompletionRateState(rate);
        setCachedData(
          ANALYTICS_CACHE_KEYS.COMPLETION_RATE,
          rate,
          POLLING_CONFIG.REFRESH_INTERVAL
        );
        return rate;
      } catch (error) {
        console.error("Failed to fetch completion rate:", error);
        const cached = getCachedData(ANALYTICS_CACHE_KEYS.COMPLETION_RATE);
        if (cached !== null) {
          setCompletionRateState(cached);
        }
        return null;
      }
    },
    []
  );

  const fetchTestimonials = useCallback(async () => {
    try {
      const response = await api.get("/api/testimonials", {
        params: { limit: 4 }
      });
      const data = response.data?.data && Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data)
          ? response.data
          : [];
      setDisplayedTestimonials(data.slice(0, 4));
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
    }
  }, []);

  const fetchAllChartData = useCallback(
    async (useCache = true) => {
      setIsLoadingCharts(true);
      setChartError(null);

      try {
        const results = await Promise.allSettled([
          fetchEmiStats(useCache),
          fetchEnrollmentStats(useCache),
          fetchCompletionRate(useCache),
          fetchTestimonials(),
        ]);

        const failures = results.filter(
          (r) => r.status === "rejected" || r.value == null
        );
        if (failures.length === results.length) {
          setChartError(
            "Unable to load analytics data. Using cached data if available."
          );
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setChartError("Failed to load analytics data.");
      } finally {
        setIsLoadingCharts(false);
      }
    },
    [
      fetchEmiStats,
      fetchEnrollmentStats,
      fetchCompletionRate,
      fetchTestimonials,
    ]
  );

  const fetchAllChartDataRef = useRef(fetchAllChartData);
  fetchAllChartDataRef.current = fetchAllChartData;

  useEffect(() => {
    fetchAllChartData(true);

    const pollInterval = setInterval(() => {
      fetchAllChartDataRef.current(false);
    }, POLLING_CONFIG.REFRESH_INTERVAL);

    return () => {
      clearInterval(pollInterval);
    };
  }, [fetchAllChartData]);

  useEffect(() => {
    if (chartError && retryCount < POLLING_CONFIG.MAX_RETRIES) {
      const retryTimeout = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        fetchAllChartDataRef.current(false);
      }, POLLING_CONFIG.ERROR_RETRY_DELAY);

      return () => clearTimeout(retryTimeout);
    }
  }, [chartError, retryCount]);

  useEffect(() => {
    const cachedTutors = getCachedData(CACHE_KEYS.TUTORS);
    if (cachedTutors !== null) {
      setTotalTutors(cachedTutors);
    }

    const fetchTutorCount = async () => {
      try {
        if (!isAuthenticated) {
          if (cachedTutors !== null) {
            return;
          }
          return;
        }

        // Token is in httpOnly cookie, sent automatically by api client
        const response = await api.get("/all-tutors", {
          params: {
            page: 1,
            limit: 1,
          },
        });

        if (response.data?.success && response.data.data?.pagination) {
          const tutorCount = response.data.data.pagination.totalTutors || 0;
          setTotalTutors(tutorCount);
          setCachedData(CACHE_KEYS.TUTORS, tutorCount);
        }
      } catch (err) {
        console.error("Error fetching tutor count:", err);
        const cached = getCachedData(CACHE_KEYS.TUTORS);
        if (cached !== null) {
          setTotalTutors(cached);
        }
      }
    };

    fetchTutorCount();

    setupAutoRefresh(CACHE_KEYS.TUTORS, fetchTutorCount);

    return () => {
      clearAutoRefresh(CACHE_KEYS.TUTORS);
    };
    // Legacy: run once on mount (token read from initial closure; matches pre-refactor behavior)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cachedInstructors = getCachedData(CACHE_KEYS.INSTRUCTORS);
    if (cachedInstructors !== null && Array.isArray(cachedInstructors) && cachedInstructors.length > 0) {
      console.log("Using cached instructors:", cachedInstructors.length);
      setInstructors(cachedInstructors);
    }

    const fetchInstructors = async () => {
      try {
        setLoadingInstructors(true);
        if (!isAuthenticated) {
          console.log("No token available");
          if (cachedInstructors !== null && Array.isArray(cachedInstructors)) {
            setInstructors(cachedInstructors);
          }
          setLoadingInstructors(false);
          return;
        }

        // Token is in httpOnly cookie, sent automatically by api client
        console.log("Fetching instructors from API...");
        const response = await api.get("/get-instructors-all", {
          params: { page: 1, limit: 100 }
        });

        console.log("Instructors API response:", response);
        console.log("Response data:", response.data);
        console.log("Success flag:", response.data?.success);
        console.log("Instructors array:", response.data?.instructors);

        let instructorsData = [];

        if (response.data?.success && response.data.instructors && Array.isArray(response.data.instructors)) {
          console.log("✓ Found instructors via success & instructors:", response.data.instructors.length, "items");
          instructorsData = response.data.instructors
            .map((instructor) => ({
              ...instructor,
              image: instructor.imageUrl || instructor.image || "",
            }))
            .sort((a, b) => {
              const orderA =
                a.order !== undefined && a.order !== null
                  ? a.order
                  : Number.MAX_SAFE_INTEGER;
              const orderB =
                b.order !== undefined && b.order !== null
                  ? b.order
                  : Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
            });
        } else if (response.data?.success && response.data.data) {
          instructorsData = (
            Array.isArray(response.data.data)
              ? response.data.data
              : response.data.data.instructors || []
          )
            .map((instructor) => ({
              ...instructor,
              image: instructor.imageUrl || instructor.image || "",
            }))
            .sort((a, b) => {
              const orderA =
                a.order !== undefined && a.order !== null
                  ? a.order
                  : Number.MAX_SAFE_INTEGER;
              const orderB =
                b.order !== undefined && b.order !== null
                  ? b.order
                  : Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
            });
        } else if (Array.isArray(response.data)) {
          instructorsData = response.data
            .map((instructor) => ({
              ...instructor,
              image: instructor.imageUrl || instructor.image || "",
            }))
            .sort((a, b) => {
              const orderA =
                a.order !== undefined && a.order !== null
                  ? a.order
                  : Number.MAX_SAFE_INTEGER;
              const orderB =
                b.order !== undefined && b.order !== null
                  ? b.order
                  : Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
            });
        }

        console.log("Final instructorsData:", instructorsData);
        setInstructors(instructorsData);
        if (instructorsData.length > 0) {
          setCachedData(CACHE_KEYS.INSTRUCTORS, instructorsData);
        }
      } catch (err) {
        console.error("Error fetching instructors:", err);
        console.error("Error details:", err.response?.data || err.message);
        const cached = getCachedData(CACHE_KEYS.INSTRUCTORS);
        if (cached !== null && Array.isArray(cached)) {
          setInstructors(cached);
        } else {
          setInstructors([]);
        }
      } finally {
        setLoadingInstructors(false);
      }
    };

    fetchInstructors();

    setupAutoRefresh(CACHE_KEYS.INSTRUCTORS, fetchInstructors);

    return () => {
      clearAutoRefresh(CACHE_KEYS.INSTRUCTORS);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    checkIsSuperAdmin,
    handleInstructorCardClick,
    displayedTestimonials,
    emiData,
    enrollmentData,
    completionRateState,
    totalTutors,
    instructors,
    loadingInstructors,
    isLoadingCharts,
    chartError,
    retryCount,
  };
}
