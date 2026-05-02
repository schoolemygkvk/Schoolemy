import React, { useState, useEffect, useCallback } from "react";
import DashboardContent from "./DashboardContent";
import { Spin } from "antd";
import api from "../../Utils/api";
import {
  getCachedData,
  setCachedData,
  CACHE_KEYS,
  setupAutoRefresh,
  clearAutoRefresh,
} from "../../Utils/dashboardCache";


const DashboardWithData = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalCourses: 0,
    activeSubscriptions: 0,
    completionRate: 0,
    loading: false
  });

  // Fetch users data with cache fallback
  const fetchUsersData = useCallback(async () => {
    try {
      // Fetch with limit=1 to get pagination metadata without loading all users
      const usersResponse = await api.get("/getallusers", {
        params: { page: 1, limit: 1 }
      });
      const paginationData = usersResponse.data?.pagination || {};
      const totalUsers = paginationData.total || 0;

      // Update cache
      setCachedData(CACHE_KEYS.USERS, totalUsers);

      // Update state
      setDashboardData(prev => ({
        ...prev,
        totalUsers,
      }));
    } catch (error) {
      console.error("Error fetching users data:", error);
      // Fallback to cache if available
      const cachedUsers = getCachedData(CACHE_KEYS.USERS);
      if (cachedUsers !== null) {
        setDashboardData(prev => ({
          ...prev,
          totalUsers: cachedUsers,
        }));
      }
    }
  }, []);

  // Fetch courses data with cache fallback
  const fetchCoursesData = useCallback(async () => {
    try {
      // Token is in httpOnly cookie, sent automatically by api client
      const coursesResponse = await api.get("/api/courses/getcoursesname");
      const totalCourses = coursesResponse.data?.length || 0;

      // Update cache
      setCachedData(CACHE_KEYS.COURSES, totalCourses);

      // Update state
      setDashboardData(prev => ({
        ...prev,
        totalCourses,
      }));
    } catch (courseError) {
      console.warn("Failed to fetch courses, trying cache:", courseError);
      // Fallback to cache if available
      const cachedCourses = getCachedData(CACHE_KEYS.COURSES);
      if (cachedCourses !== null) {
        setDashboardData(prev => ({
          ...prev,
          totalCourses: cachedCourses,
        }));
      }
    }
  }, []);

  // Fetch active subscriptions count
  const fetchActiveSubscriptions = useCallback(async () => {
    try {
      // Token is in httpOnly cookie, sent automatically by api client
      const response = await api.get("/api/subscriptions/active-count");
      if (response?.data) {
        const count = response.data.count || response.data.activeSubscriptions || 0;
        setDashboardData(prev => ({
          ...prev,
          activeSubscriptions: count,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch active subscriptions:", error);
      // Keep previous value on error
    }
  }, []);

  // Fetch completion rate
  const fetchCompletionRateData = useCallback(async () => {
    try {
      // Token is in httpOnly cookie, sent automatically by api client
      const response = await api.get("/api/dashboard/completion-rate");
      if (response?.data) {
        const rate = response.data.completionRate || response.data.rate || 0;
        setDashboardData(prev => ({
          ...prev,
          completionRate: rate,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch completion rate:", error);
      // Keep previous value on error
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, loading: true }));

    // Fetch all dashboard data in parallel
    await Promise.all([
      fetchUsersData(),
      fetchCoursesData(),
      fetchActiveSubscriptions(),
      fetchCompletionRateData(),
    ]);

    setDashboardData(prev => ({
      ...prev,
      loading: false
    }));
  }, [fetchUsersData, fetchCoursesData, fetchActiveSubscriptions, fetchCompletionRateData]);

  // Load cached data on mount
  useEffect(() => {
    // Try to load from cache first for instant display
    const cachedUsers = getCachedData(CACHE_KEYS.USERS);
    const cachedCourses = getCachedData(CACHE_KEYS.COURSES);

    if (cachedUsers !== null) {
      setDashboardData(prev => ({
        ...prev,
        totalUsers: cachedUsers,
      }));
    }

    if (cachedCourses !== null) {
      setDashboardData(prev => ({
        ...prev,
        totalCourses: cachedCourses,
      }));
    }

    // Fetch fresh data
    fetchDashboardData();

    // Setup auto-refresh
    setupAutoRefresh(CACHE_KEYS.USERS, fetchUsersData);
    setupAutoRefresh(CACHE_KEYS.COURSES, fetchCoursesData);

    // Cleanup on unmount
    return () => {
      clearAutoRefresh(CACHE_KEYS.USERS);
      clearAutoRefresh(CACHE_KEYS.COURSES);
    };
  }, [fetchDashboardData, fetchUsersData, fetchCoursesData, fetchActiveSubscriptions, fetchCompletionRateData]);

  if (dashboardData.loading) {
  return (
      <div style={styles.loadingContainer}>
        <Spin size="large" tip="Loading proposals..." />
      </div>
    );
  }


  return (
    <DashboardContent
      totalUsers={dashboardData.totalUsers}
      totalCourses={dashboardData.totalCourses}
      activeSubscriptions={dashboardData.activeSubscriptions}
      completionRate={dashboardData.completionRate}
    />
  );
};

const styles = {
    loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
}
export default DashboardWithData;
