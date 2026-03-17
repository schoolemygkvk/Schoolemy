import React, { useState, useEffect, useCallback } from "react";
import DashboardContent from "./DashboardContent";
import { Spin } from "antd";
import axios from "../../Utils/api";
import {
  getCachedData,
  setCachedData,
  CACHE_KEYS,
  setupAutoRefresh,
  clearAutoRefresh,
} from "../../Utils/dashboardCache";

/**
 * DashboardWithData - A wrapper component that fetches dashboard data and passes it as props to DashboardContent
 * This component handles all the API calls and data processing, keeping DashboardContent as a pure presentation component
 * 
 * APIs used:
 * - /getallusers - Fetches total user count (no auth required)
 * - /getcoursesname - Fetches course list to count total courses (requires Bearer token)
 */
const DashboardWithData = () => {
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 1520,
    totalCourses: 0,
    activeSubscriptions: 1245,
    completionRate: 86,
    loading: false
  });

  // Fetch users data with cache fallback
  const fetchUsersData = useCallback(async () => {
    try {
      const usersResponse = await axios.get("/getallusers");
      const totalUsers = usersResponse.data.data?.length || 1520;
      
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
    const token = localStorage.getItem("token");
    if (!token) {
      // Try cache if no token
      const cachedCourses = getCachedData(CACHE_KEYS.COURSES);
      if (cachedCourses !== null) {
        setDashboardData(prev => ({
          ...prev,
          totalCourses: cachedCourses,
        }));
      }
      return;
    }

    try {
      const coursesResponse = await axios.get("/api/courses/getcoursesname", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const fetchDashboardData = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, loading: true }));
    
    // Fetch both users and courses in parallel
    await Promise.all([
      fetchUsersData(),
      fetchCoursesData(),
    ]);

    // You can add more API calls here for other metrics
    // const subscriptionsResponse = await axios.get("/api/subscriptions");
    
    setDashboardData(prev => ({
      ...prev,
      activeSubscriptions: 1245, // Replace with actual API call when available
      completionRate: 86, // Replace with actual API call when available
      loading: false
    }));
  }, [fetchUsersData, fetchCoursesData]);

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
  }, [fetchDashboardData, fetchUsersData, fetchCoursesData]);

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
