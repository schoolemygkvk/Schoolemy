import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllCourses, getCourseById, getCoursesByCategory } from "../service/courseApi";

/**
 * Hook to fetch all courses with caching
 * - First request: fetches from server
 * - Subsequent requests (within 5 min): returns from cache
 * - Background refetch every 10 min
 */
export const useAllCourses = (options = {}) => {
  return useQuery({
    queryKey: ["courses", "all"],
    queryFn: getAllCourses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes (keep in cache)
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 min
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Retry failed requests twice
    ...options,
  });
};

/**
 * Hook to fetch a single course by ID
 */
export const useCourseById = (courseId, options = {}) => {
  return useQuery({
    queryKey: ["courses", courseId],
    queryFn: () => getCourseById(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 min
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!courseId, // Only fetch if courseId is provided
    ...options,
  });
};

/**
 * Hook to fetch courses by category
 */
export const useCoursesByCategory = (categoryName, options = {}) => {
  return useQuery({
    queryKey: ["courses", "category", categoryName],
    queryFn: () => getCoursesByCategory(categoryName),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 min
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !!categoryName, // Only fetch if category is provided
    ...options,
  });
};

/**
 * Hook to manually invalidate course caches
 * Use this after user enrolls or course data changes
 */
export const useInvalidateCourses = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
    invalidateCourse: (courseId) =>
      queryClient.invalidateQueries({ queryKey: ["courses", courseId] }),
    invalidateCategory: (categoryName) =>
      queryClient.invalidateQueries({ queryKey: ["courses", "category", categoryName] }),
  };
};

/**
 * Hook for stale-while-revalidate pattern
 * - Returns cached data immediately (even if stale)
 * - Refetches in background
 * - Updates UI when new data arrives
 */
export const useCoursesStaleWhileRevalidate = (options = {}) => {
  return useQuery({
    queryKey: ["courses", "all"],
    queryFn: getAllCourses,
    staleTime: 1, // Immediately becomes stale, but not removed
    cacheTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    refetchOnWindowFocus: true, // Refetch when tab regains focus
    refetchOnReconnect: true, // Refetch when internet reconnects
    retry: 3, // More aggressive retries for slow networks
    ...options,
  });
};
